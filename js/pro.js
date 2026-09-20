/**
 * Krypton Studio — Pro License System (Client)
 * نسخه ۱.۰ — امضای دیجیتال ECDSA P-256
 */

(function () {
  'use strict';

  const C = window.ProCrypto;
  const CFG = window.PRO_CONFIG;

  let _pubKey = null;
  let _pubKeyLoading = false;

  // ─── Device ID ───
  function getDeviceId() {
    let id = localStorage.getItem(CFG.DEVICE_ID_KEY);
    if (!id) {
      const bytes = crypto.getRandomValues(new Uint8Array(16));
      id = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
      id = id.match(/.{4}/g).join('-');
      localStorage.setItem(CFG.DEVICE_ID_KEY, id);
    }
    return id;
  }

  // ─── Load public key ───
  async function ensurePublicKey() {
    if (_pubKey) return _pubKey;
    if (_pubKeyLoading) {
      while (_pubKeyLoading) await new Promise(r => setTimeout(r, 50));
      return _pubKey;
    }
    if (!CFG.PUBLIC_KEY) return null;
    _pubKeyLoading = true;
    try {
      _pubKey = await C.importPublicKey(CFG.PUBLIC_KEY);
    } catch (e) {
      console.error('[Pro] public key import failed', e);
      _pubKey = null;
    } finally {
      _pubKeyLoading = false;
    }
    return _pubKey;
  }

  // ─── Parse license code ───
  function parseLicense(code) {
    if (!code || typeof code !== 'string') return null;
    const trimmed = code.trim().replace(/\s+/g, '');
    const parts = trimmed.split('.');
    if (parts.length !== 3) return null;
    if (parts[0] !== CFG.LICENSE_PREFIX) return null;
    try {
      const payloadStr = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
      const payload = JSON.parse(payloadStr);
      return { payload, sig: parts[2], raw: trimmed };
    } catch (e) {
      return null;
    }
  }

  // ─── Verify signature ───
  async function verifyLicense(parsed) {
    const pubKey = await ensurePublicKey();
    if (!pubKey) return false;
    const payloadStr = JSON.stringify(parsed.payload);
    return await C.verify(pubKey, parsed.sig, payloadStr);
  }

  // ─── Get current license ───
  function getStoredLicense() {
    try {
      const raw = localStorage.getItem(CFG.STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function saveStoredLicense(obj) {
    if (obj) localStorage.setItem(CFG.STORAGE_KEY, JSON.stringify(obj));
    else localStorage.removeItem(CFG.STORAGE_KEY);
  }

  // ─── Get full status ───
  async function getInfo() {
    const empty = {
      active: false,
      expired: false,
      configured: !!CFG.PUBLIC_KEY,
      plan: null,
      planLabel: '—',
      expiresAt: null,
      issuedAt: null,
      daysLeft: 0,
      percentLeft: 0,
      deviceId: getDeviceId(),
      boundTo: null,
      customer: null,
      licenseId: null,
      status: 'none',
      statusLabel: 'بدون لایسنس'
    };

    if (!CFG.PUBLIC_KEY) {
      return { ...empty, statusLabel: 'Pro پیکربندی نشده' };
    }

    const stored = getStoredLicense();
    if (!stored || !stored.code) return empty;

    const parsed = parseLicense(stored.code);
    if (!parsed) return { ...empty, statusLabel: 'کد نامعتبر' };

    const valid = await verifyLicense(parsed);
    if (!valid) {
      return { ...empty, statusLabel: 'امضا نامعتبر' };
    }

    const p = parsed.payload;
    const now = Math.floor(Date.now() / 1000);
    const exp = p.x || 0;
    const iat = p.t || 0;
    const isLifetime = exp === 0;
    const expired = !isLifetime && exp < now;

    // Device binding check
    const boundDevice = localStorage.getItem(CFG.BOUND_DEVICE_KEY);
    const deviceId = getDeviceId();
    let deviceOk = true;
    if (p.d === '*') deviceOk = true;
    else if (p.d) deviceOk = (p.d === deviceId);
    else deviceOk = (!boundDevice || boundDevice === deviceId);

    if (expired || !deviceOk) {
      return {
        ...empty,
        expired,
        plan: p.p,
        planLabel: planLabel(p.p),
        expiresAt: isLifetime ? null : exp * 1000,
        issuedAt: iat * 1000,
        customer: stored.customer || null,
        licenseId: p.i,
        boundTo: p.d,
        status: expired ? 'expired' : 'device-mismatch',
        statusLabel: expired ? 'منقضی شده' : 'مخصوص دستگاه دیگر'
      };
    }

    // Calculate remaining
    let daysLeft = 0;
    let percentLeft = 100;
    if (!isLifetime) {
      const total = exp - iat;
      const left = exp - now;
      daysLeft = Math.max(0, Math.ceil(left / 86400));
      percentLeft = Math.max(0, Math.min(100, Math.round((left / total) * 100)));
    }

    let status = 'active';
    let statusLabel = isLifetime ? '∞ Lifetime' : 'فعال';
    if (!isLifetime) {
      if (daysLeft <= 7) { status = 'critical'; statusLabel = 'انقضای نزدیک'; }
      else if (daysLeft <= 30) { status = 'warning'; statusLabel = 'کمتر از ۳۰ روز'; }
    }

    return {
      active: true,
      expired: false,
      configured: true,
      plan: p.p,
      planLabel: planLabel(p.p),
      isLifetime,
      expiresAt: isLifetime ? null : exp * 1000,
      issuedAt: iat * 1000,
      daysLeft,
      percentLeft,
      deviceId,
      boundTo: p.d || 'current',
      customer: stored.customer || null,
      licenseId: p.i,
      status,
      statusLabel
    };
  }

  function planLabel(plan) {
    const map = { '1m': '۱ ماهه', '3m': '۳ ماهه', '6m': '۶ ماهه', '12m': '۱۲ ماهه', 'life': 'Lifetime' };
    return map[plan] || plan || '—';
  }

  function planDuration(plan) {
    const map = { '1m': 30, '3m': 91, '6m': 182, '12m': 365, 'life': 0 };
    return map[plan] || 365;
  }

  // ─── Synchronous cached isActive (for quick checks) ───
  let _cachedActive = false;
  let _cachedInfo = null;

  function isActive() {
    return _cachedActive;
  }

  function getCachedInfo() {
    return _cachedInfo || { active: false, statusLabel: 'در حال بررسی...', deviceId: getDeviceId() };
  }

  async function refresh() {
    _cachedInfo = await getInfo();
    _cachedActive = _cachedInfo.active;
    return _cachedInfo;
  }

  // ─── Redeem ───
  async function redeem(code, customer) {
    if (!CFG.PUBLIC_KEY) {
      return { ok: false, msg: 'Pro پیکربندی نشده — با مدیر تماس بگیرید' };
    }

    const parsed = parseLicense(code);
    if (!parsed) return { ok: false, msg: 'کد نامعتبر است' };

    const valid = await verifyLicense(parsed);
    if (!valid) return { ok: false, msg: 'امضای کد نامعتبر است' };

    const p = parsed.payload;
    const now = Math.floor(Date.now() / 1000);

    // Expired?
    if (p.x !== 0 && p.x < now) {
      return { ok: false, msg: 'این کد منقضی شده' };
    }

    // Device check
    const deviceId = getDeviceId();
    const currentStored = getStoredLicense();

    if (p.d === '*') {
      // universal — no binding
    } else if (p.d) {
      // bound to specific device
      if (p.d !== deviceId) {
        return { ok: false, msg: 'این کد مخصوص دستگاه دیگری است' };
      }
    } else {
      // empty — first-come binding
      const boundDevice = localStorage.getItem(CFG.BOUND_DEVICE_KEY);
      if (boundDevice && boundDevice !== deviceId) {
        return { ok: false, msg: 'این کد قبلاً روی دستگاه دیگری فعال شده' };
      }
      if (!boundDevice) {
        localStorage.setItem(CFG.BOUND_DEVICE_KEY, deviceId);
      }
    }

    // Check for double-redeem
    let activated = [];
    try { activated = JSON.parse(localStorage.getItem(CFG.ACTIVATED_KEY) || '[]'); } catch (e) {}
    if (activated.indexOf(p.i) !== -1 && (!currentStored || currentStored.licenseId !== p.i)) {
      return { ok: false, msg: 'این کد قبلاً استفاده شده' };
    }

    // Extend if existing active license from same person?
    // For now, replace. Simple and predictable.
    saveStoredLicense({
      code: parsed.raw,
      licenseId: p.i,
      customer: customer || null,
      redeemedAt: Date.now()
    });

    // Track activation
    if (activated.indexOf(p.i) === -1) {
      activated.push(p.i);
      localStorage.setItem(CFG.ACTIVATED_KEY, JSON.stringify(activated.slice(-50)));
    }

    await refresh();
    const info = await getInfo();
    const exp = p.x === 0 ? '∞' : new Date(p.x * 1000).toLocaleDateString('fa-IR');
    return { ok: true, msg: 'فعال شد — اعتبار تا ' + exp + ' (' + planLabel(p.p) + ')' };
  }

  function clear() {
    saveStoredLicense(null);
    localStorage.removeItem(CFG.BOUND_DEVICE_KEY);
    _cachedActive = false;
    _cachedInfo = null;
  }

  // ─── requirePro (for feature gating) ───
  function require(featureName, App) {
    if (isActive()) return true;
    const info = getCachedInfo();
    if (info.expired) App.toast('لایسنس منقضی شده — تمدید کنید');
    else if (info.status === 'device-mismatch') App.toast('این لایسنس برای دستگاه دیگری است');
    else App.toast((featureName || 'این قابلیت') + ' مخصوص Pro است');
    App.navigate('premium');
    return false;
  }

  global.Pro = {
    getDeviceId,
    getInfo,
    isActive,
    getCachedInfo,
    refresh,
    redeem,
    clear,
    require,
    planLabel
  };
})();