/**
 * Krypton Studio — Admin Panel Logic
 */

(function () {
  'use strict';

  const C = window.ProCrypto;
  const LS_PRIV = 'ks-admin-privkey';
  const LS_HISTORY = 'ks-admin-history';

  let _privateKey = null;
  let _publicKeyB64 = null;
  let _adminPassword = null;

  // ─── UI helpers ───
  const $ = (id) => document.getElementById(id);
  function show(el) { el && el.classList.remove('hidden'); }
  function hide(el) { el && el.classList.add('hidden'); }

  function toast(msg) {
    const t = document.createElement('div');
    t.style.cssText = 'position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:#1e293b;color:#f1f5f9;padding:12px 20px;border-radius:30px;font-size:0.85rem;box-shadow:0 4px 20px rgba(0,0,0,0.4);z-index:9999;white-space:nowrap;max-width:90vw;text-align:center;';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2500);
  }

  function download(filename, content) {
    const blob = new Blob([content], { type: 'application/octet-stream' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  // ─── Key generation ───
  async function doGenerateKey() {
    const pw = prompt('🔐 یک رمز قوی برای محافظت از کلید خصوصی وارد کن (حداقل ۸ کاراکتر):');
    if (!pw || pw.length < 8) { toast('رمز باید حداقل ۸ کاراکتر باشد'); return; }
    const pw2 = prompt('🔁 تکرار رمز:');
    if (pw !== pw2) { toast('رمزها یکسان نیستند'); return; }

    try {
      const pair = await C.generateKeyPair();
      const pubB64 = await C.exportPublicKey(pair.publicKey);
      const privB64 = await C.exportPrivateKey(pair.privateKey);

      // Save encrypted private key
      const encrypted = await C.encryptPrivateKey(privB64, pw);
      const backup = {
        app: 'mobile-toolkit-admin',
        version: 1,
        created: new Date().toISOString(),
        publicKey: pubB64,
        encryptedPrivateKey: encrypted
      };

      // Auto-download backup
      download('MT-admin-key-' + Date.now() + '.json', JSON.stringify(backup, null, 2));

      // Set in memory
      _privateKey = pair.privateKey;
      _publicKeyB64 = pubB64;
      _adminPassword = pw;

      // Show UI
      $('pubKeyDisplay').textContent = pubB64;
      $('keyFingerprint').textContent = await C.fingerprint(pubB64);
      hide($('noKeyState'));
      show($('hasKeyState'));

      toast('✅ کلیدها ساخته و بکاپ دانلود شد');
    } catch (e) {
      console.error(e);
      toast('خطا: ' + e.message);
    }
  }

  // ─── Import private key ───
  function doImportClick() { $('importKeyFile').click(); }

  async function doImportFile(file) {
    try {
      const text = await file.text();
      const backup = JSON.parse(text);
      if (!backup.encryptedPrivateKey || !backup.publicKey) {
        toast('فایل نامعتبر است'); return;
      }
      const pw = prompt('🔐 رمز کلید خصوصی را وارد کن:');
      if (!pw) return;
      const privB64 = await C.decryptPrivateKey(backup.encryptedPrivateKey, pw);
      _privateKey = await C.importPrivateKey(privB64);
      _publicKeyB64 = backup.publicKey;
      _adminPassword = pw;

      $('pubKeyDisplay').textContent = _publicKeyB64;
      $('keyFingerprint').textContent = await C.fingerprint(_publicKeyB64);
      hide($('noKeyState'));
      show($('hasKeyState'));
      toast('✅ کلید خصوصی بارگذاری شد');
    } catch (e) {
      toast('رمز اشتباه یا فایل خراب');
    }
  }

  // ─── Unload key ───
  function doUnloadKey() {
    if (!confirm('کلید از حافظه پاک شود؟ (فایل بکاپت محفوظه)')) return;
    _privateKey = null;
    _publicKeyB64 = null;
    _adminPassword = null;
    $('pubKeyDisplay').textContent = '—';
    $('keyFingerprint').textContent = '—';
    show($('noKeyState'));
    hide($('hasKeyState'));
    $('licenseOut').classList.add('hidden');
  }

  // ─── Copy public key ───
  async function copyPubKey() {
    if (!_publicKeyB64) { toast('اول کلید بساز'); return; }
    try {
      await navigator.clipboard.writeText(_publicKeyB64);
      toast('📋 کلید عمومی کپی شد');
    } catch (e) {
      toast('خطا در کپی — دستی انتخاب کن');
    }
  }

  // ─── Generate license ───
  async function generateLicense() {
    if (!_privateKey) { toast('ابتدا کلید خصوصی را بارگذاری کن'); return; }

    const plan = $('licPlan').value;
    const deviceMode = $('licDevice').value;
    const customer = $('licCustomer').value.trim();

    let deviceId = '';
    if (deviceMode === '*') deviceId = '*';
    else if (deviceMode === 'custom') {
      deviceId = $('licDeviceId').value.trim().toUpperCase();
      if (!deviceId) { toast('Device ID را وارد کن'); return; }
    }

    const now = Math.floor(Date.now() / 1000);
    const days = plan === 'life' ? 0 : { '1m': 30, '3m': 91, '6m': 182, '12m': 365 }[plan];

    const payload = {
      v: 1,
      i: generateLicenseId(),
      t: now,
      x: plan === 'life' ? 0 : now + days * 86400,
      p: plan,
      d: deviceId,
      f: 'all'
    };

    try {
      const payloadStr = JSON.stringify(payload);
      const payloadB64 = btoa(payloadStr).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      const sig = await C.sign(_privateKey, payloadStr);
      const code = 'MTK1.' + payloadB64 + '.' + sig;

      $('licenseCode').textContent = code;
      $('licenseOut').classList.remove('hidden');
      $('licenseOut').dataset.code = code;

      // Save to history
      const hist = getHistory();
      hist.unshift({
        id: payload.i,
        plan,
        device: deviceId || 'unbound',
        customer,
        code,
        created: new Date().toISOString()
      });
      saveHistory(hist.slice(0, 20));
      renderHistory();

      toast('✅ لایسنس صادر شد');
    } catch (e) {
      console.error(e);
      toast('خطا در امضا: ' + e.message);
    }
  }

  function generateLicenseId() {
    const bytes = crypto.getRandomValues(new Uint8Array(6));
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  }

  function copyLicense() {
    const code = $('licenseOut').dataset.code;
    if (!code) return;
    navigator.clipboard.writeText(code)
      .then(() => toast('📋 کپی شد'))
      .catch(() => toast('خطا در کپی'));
  }

  function downloadLicense() {
    const code = $('licenseOut').dataset.code;
    if (!code) return;
    const plan = $('licPlan').value;
    const customer = $('licCustomer').value.trim() || 'unknown';
    download('license-' + customer + '-' + plan + '.txt', code);
  }

  // ─── History ───
  function getHistory() {
    try { return JSON.parse(localStorage.getItem(LS_HISTORY) || '[]'); } catch (e) { return []; }
  }
  function saveHistory(h) { localStorage.setItem(LS_HISTORY, JSON.stringify(h)); }

  function renderHistory() {
    const el = $('historyList');
    const list = getHistory();
    if (!list.length) {
      el.innerHTML = '<p style="text-align:center;color:var(--text-secondary);font-size:0.85rem;padding:12px;">تاریخچه‌ای نیست</p>';
      return;
    }
    el.innerHTML = list.map(item => `
      <div class="gen-item">
        <div style="display:flex;justify-content:space-between;gap:8px;">
          <span>${item.customer || 'بدون نام'}</span>
          <span style="color:var(--text-secondary);font-size:0.75rem;">${item.plan}</span>
        </div>
        <div style="color:var(--text-secondary);font-size:0.7rem;margin-top:2px;">
          ${new Date(item.created).toLocaleString('fa-IR')} · ${item.device}
        </div>
        <code>${item.code.substring(0, 60)}...</code>
      </div>
    `).join('');
  }

  // ─── Init ───
  function init() {
    $('genKeyBtn')?.addEventListener('click', doGenerateKey);
    $('importKeyBtn')?.addEventListener('click', doImportClick);
    $('importKeyFile')?.addEventListener('change', (e) => {
      const f = e.target.files[0];
      if (f) doImportFile(f);
      e.target.value = '';
    });
    $('unloadKeyBtn')?.addEventListener('click', doUnloadKey);
    $('copyPubKey')?.addEventListener('click', copyPubKey);
    $('genLicBtn')?.addEventListener('click', generateLicense);
    $('copyLicBtn')?.addEventListener('click', copyLicense);
    $('downloadLicBtn')?.addEventListener('click', downloadLicense);
    $('clearHistoryBtn')?.addEventListener('click', () => {
      if (!confirm('تاریخچه پاک شود؟')) return;
      saveHistory([]);
      renderHistory();
      toast('پاک شد');
    });
    $('licDevice')?.addEventListener('change', (e) => {
      if (e.target.value === 'custom') show($('licDeviceIdWrap'));
      else hide($('licDeviceIdWrap'));
    });

    renderHistory();
  }

  document.addEventListener('DOMContentLoaded', init);
})();