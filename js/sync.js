// Mobile Toolkit — Sync Engine
// همگام‌سازی داده‌های لوکال با سرور

(function (global) {
  'use strict';

  // کلیدهای localStorage که Sync می‌شن
  var SYNC_KEYS = [
    'mt-notes',
    'mt-subs',
    'mt-finance',
    'mt-todos',
    'mt-habits',
    'mt-worldclocks',
    'mt-md-doc',
    'mt-clip-history',
    'mt-theme',
    'mt-pro',
    'mt-pro-expires',
    'mt-pro-code',
    'mt-pro-activated'
  ];

  var DEBOUNCE_MS = 3000; // ۳ ثانیه صبر بعد از آخرین تغییر
  var _pushTimer = null;
  var _isSyncing = false;
  var _autoStarted = false;
  var _originalSetItem = null;

  // ═══════════════════════════════════════════
  //   جمع‌آوری داده‌های لوکال
  // ═══════════════════════════════════════════
  function collectLocal() {
    var items = {};
    for (var i = 0; i < SYNC_KEYS.length; i++) {
      var key = SYNC_KEYS[i];
      try {
        var v = localStorage.getItem(key);
        if (v !== null && v !== undefined) {
          items[key] = v;
        }
      } catch (e) {}
    }
    return items;
  }

  // ═══════════════════════════════════════════
  //   اعمال داده‌های سرور روی لوکال
  // ═══════════════════════════════════════════
  function applyServer(items) {
    if (!items) return 0;
    var count = 0;
    var keys = Object.keys(items);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (SYNC_KEYS.indexOf(key) === -1) continue; // فقط کلیدهای مجاز
      try {
        // از setItem اصلی استفاده کن که trigger نشه
        if (_originalSetItem) {
          _originalSetItem.call(localStorage, key, items[key]);
        } else {
          localStorage.setItem(key, items[key]);
        }
        count++;
      } catch (e) {}
    }
    return count;
  }

  // ═══════════════════════════════════════════
  //   Push — آپلود به سرور
  // ═══════════════════════════════════════════
  function pushAll() {
    if (!API.isLoggedIn()) return Promise.resolve(false);

    var items = collectLocal();
    return API.syncPush(items).then(function (res) {
      if (res.data && res.data.ok) {
        var t = new Date().toLocaleTimeString('fa-IR');
        try { localStorage.setItem('mt-last-sync', String(Date.now())); } catch (e) {}
        console.log('[Sync] ✓ Push موفق — ' + t + ' — ' + (res.data.count || 0) + ' مورد');
        return true;
      }
      console.warn('[Sync] Push خطا:', res.data && res.data.error);
      return false;
    });
  }

  // ═══════════════════════════════════════════
  //   Pull — دانلود از سرور
  // ═══════════════════════════════════════════
  function pullAll() {
    if (!API.isLoggedIn()) return Promise.resolve(false);

    return API.syncPull().then(function (res) {
      if (res.data && res.data.ok) {
        var count = applyServer(res.data.items || {});
        try { localStorage.setItem('mt-last-sync', String(Date.now())); } catch (e) {}
        console.log('[Sync] ✓ Pull موفق — ' + count + ' مورد اعمال شد');
        return true;
      }
      console.warn('[Sync] Pull خطا:', res.data && res.data.error);
      return false;
    });
  }

  // ═══════════════════════════════════════════
  //   Push با تأخیر (Debounce)
  // ═══════════════════════════════════════════
  function pushDebounced() {
    if (!API.isLoggedIn()) return;
    if (_pushTimer) clearTimeout(_pushTimer);
    _pushTimer = setTimeout(function () {
      _pushTimer = null;
      if (_isSyncing) return;
      _isSyncing = true;
      pushAll().then(function () {
        _isSyncing = false;
      });
    }, DEBOUNCE_MS);
  }

  // ═══════════════════════════════════════════
  //   رهگیری تغییرات localStorage
  // ═══════════════════════════════════════════
  function hookLocalStorage() {
    if (_originalSetItem) return; // قبلاً hook شده

    _originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      _originalSetItem.call(this, key, value);
      // فقط اگه کلید مهمه، push کن
      if (SYNC_KEYS.indexOf(key) !== -1 && API.isLoggedIn()) {
        pushDebounced();
      }
    };

    // حذف هم رهگیری کنیم
    var origRemove = Storage.prototype.removeItem;
    Storage.prototype.removeItem = function (key) {
      origRemove.call(this, key);
      if (SYNC_KEYS.indexOf(key) !== -1 && API.isLoggedIn()) {
        pushDebounced();
      }
    };
  }

  // ═══════════════════════════════════════════
  //   Auto Sync
  // ═══════════════════════════════════════════
  function startAuto() {
    if (_autoStarted) return;
    if (!API.isLoggedIn()) return;
    _autoStarted = true;
    hookLocalStorage();

    // Pull اولیه در شروع
    pullAll().then(function () {
      console.log('[Sync] Auto sync فعال شد');
    });
  }

  function stopAuto() {
    _autoStarted = false;
    if (_pushTimer) { clearTimeout(_pushTimer); _pushTimer = null; }
  }

  // ═══════════════════════════════════════════
  //   Merge — ادغام هوشمند (آخری برنده)
  // ═══════════════════════════════════════════
  function smartMerge() {
    if (!API.isLoggedIn()) return Promise.resolve(false);

    return API.syncPull().then(function (res) {
      if (!(res.data && res.data.ok)) return false;
      var serverItems = res.data.items || {};
      var localItems = collectLocal();
      var serverUpdated = res.data.lastUpdated || 0;

      var localLastSync = 0;
      try { localLastSync = parseInt(localStorage.getItem('mt-last-sync') || '0', 10) || 0; } catch (e) {}

      // اگه سرور جدیدتر از آخرین sync لوکال هست، pull کن
      if (serverUpdated > localLastSync) {
        var count = applyServer(serverItems);
        console.log('[Sync] Merge: ' + count + ' مورد از سرور گرفته شد');
      } else {
        // وگرنه، لوکال رو push کن
        console.log('[Sync] Merge: لوکال جدیدتره، push می‌کنم');
        return pushAll();
      }
      return true;
    });
  }

  // ═══════════════════════════════════════════
  //   Export
  // ═══════════════════════════════════════════
  global.Sync = {
    pushAll: pushAll,
    pullAll: pullAll,
    pushDebounced: pushDebounced,
    startAuto: startAuto,
    stopAuto: stopAuto,
    smartMerge: smartMerge,
    getLastSync: function () {
      try {
        var v = localStorage.getItem('mt-last-sync');
        return v ? parseInt(v, 10) : 0;
      } catch (e) { return 0; }
    },
    SYNC_KEYS: SYNC_KEYS
  };
})(window);