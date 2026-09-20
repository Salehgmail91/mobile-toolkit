/**
 * Mobile Toolkit
 * محصول Krypton Studio
 * نسخه ۱.۲.۰
 */

const App = {
  currentPage: 'home',
  theme: localStorage.getItem('mt-theme') || 'dark',

  

  /** وضعیت کامل لایسنس */
  

  formatLicenseDate(ts) {
    if (!ts) return '—';
    try { return new Date(ts).toLocaleDateString('fa-IR'); } catch (e) { return '—'; }
  },

  requirePro(featureName) {
    if (this.isPro()) return true;
    const info = this.getLicenseInfo();
    if (info.expired) this.toast('لایسنس منقضی شده — تمدید کنید');
    else this.toast((featureName || 'این قابلیت') + ' مخصوص Pro است');
    this.navigate('premium');
    return false;
  },

  /* موتور لایسنس — کد فقط بعد از پرداخت توسط شرکت صادر می‌شود */
  _licenseSecret: 'KryptonStudio-MT-Pro-2026-SecKey',
  _adminPass: 'KryptonAdmin',

  
  

  /**
   * تولید کد یکتا بعد از تأیید پرداخت
   * months: مدت اعتبار (۱، ۳، ۶، ۱۲)
   * فرمت: KT-XXXX-XXXX-MM-SSSS
   */
  
  /** اعتبارسنجی کد — خروجی: false | 'used' | { months, code } */
  
  /** فعال‌سازی یا تمدید لایسنس با کد */
  

  



  init() {
  this.applyTheme();
  this.bindEvents();
  this.renderPage('home');
  this.hideSplash();
  this.updateDeviceInfo();
  setTimeout(() => this.checkLicenseExpiryWarning(), 500);
  this.setupInstallPrompt();
  this.setupServiceWorkerUpdate();
  this.setupNetworkListeners();
  this.setupKeyboard();
  console.log('%c Mobile Toolkit v1.2.1 ', 'background:#38bdf8;color:#0f172a;font-weight:bold;padding:3px 8px;border-radius:4px', 'Krypton Studio');
},

  checkLicenseExpiryWarning() {
    const info = this.getLicenseInfo();
    if (!info.active) {
      if (info.expired) {
        setTimeout(() => this.toast('لایسنس Pro منقضی شده — برای تمدید اقدام کنید'), 1800);
      }
      return;
    }
    if (info.daysLeft <= 7) {
      setTimeout(() => this.toast('لایسنس تا ' + info.daysLeft + ' روز دیگر منقضی می‌شود'), 1800);
    } else if (info.daysLeft <= 30) {
      setTimeout(() => this.toast('کمتر از ۳۰ روز تا انقضای لایسنس باقی مانده'), 1800);
    }
  },

  hideSplash() {
    setTimeout(() => {
      document.getElementById('splash').classList.add('hide');
      document.getElementById('app').classList.remove('hidden');
    }, 1200);
  },

  applyTheme() {
    document.documentElement.setAttribute('data-theme', this.theme === 'light' ? 'light' : '');
  },

  toggleTheme() {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('mt-theme', this.theme);
    this.applyTheme();
    this.toast(this.theme === 'dark' ? 'تم تاریک فعال شد' : 'تم روشن فعال شد');
  },

  bindEvents() {
    // Menu
    document.getElementById('menuBtn').addEventListener('click', () => this.openMenu());
    document.getElementById('closeMenu').addEventListener('click', () => this.closeMenu());
    document.getElementById('menuOverlay').addEventListener('click', () => this.closeMenu());
    document.getElementById('themeBtn').addEventListener('click', () => this.toggleTheme());
    document.getElementById('searchBtn')?.addEventListener('click', () => this.openSearch());
    document.getElementById('searchClose')?.addEventListener('click', () => this.closeSearch());
    document.getElementById('searchInput')?.addEventListener('input', (e) => this.doSearch(e.target.value));

    // Side menu items
    document.querySelectorAll('.menu-list li').forEach(li => {
      li.addEventListener('click', () => {
        const page = li.dataset.page;
        this.navigate(page);
        this.closeMenu();
      });
    });

    // Bottom nav
    document.querySelectorAll('.bottom-nav .nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const page = btn.dataset.page;
        this.navigate(page);
      });
    });
  },
  // ========== PWA Install ==========
  setupInstallPrompt() {
  this._deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    this._deferredPrompt = e;
    this.showInstallBanner(false);
  });
  window.addEventListener('appinstalled', () => {
    this._deferredPrompt = null;
    this.hideInstallBanner();
    this.toast('اپ نصب شد ✅');
  });
  document.getElementById('installBtn')?.addEventListener('click', () => this.doInstall());
  document.getElementById('installDismiss')?.addEventListener('click', () => {
    this.hideInstallBanner();
    localStorage.setItem('mt-install-dismissed', '1');
  });
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;
  if (isIOS && !isStandalone && !localStorage.getItem('mt-install-dismissed')) {
    setTimeout(() => this.showInstallBanner(true), 5000);
  }
},
  showInstallBanner(isIOS) {
  if (localStorage.getItem('mt-install-dismissed')) return;
  const banner = document.getElementById('installBanner');
  if (!banner) return;
  if (isIOS) {
    const span = banner.querySelector('.install-text span');
    if (span) span.textContent = 'در Safari دکمه اشتراک‌گذاری را بزنید و «افزودن به صفحه اصلی» را انتخاب کنید';
    const btn = document.getElementById('installBtn');
    if (btn) btn.style.display = 'none';
  }
  banner.classList.remove('hidden');
},
  hideInstallBanner() {
  document.getElementById('installBanner')?.classList.add('hidden');
},
  async doInstall() {
  if (!this._deferredPrompt) {
    this.toast('از منوی مرورگر «افزودن به صفحه اصلی» را انتخاب کنید');
    return;
  }
  this._deferredPrompt.prompt();
  const { outcome } = await this._deferredPrompt.userChoice;
  if (outcome === 'accepted') this.toast('در حال نصب...');
  this._deferredPrompt = null;
  this.hideInstallBanner();
},

// ========== SW Update ==========
  setupServiceWorkerUpdate() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.ready.then((reg) => {
    setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);
    reg.addEventListener('updatefound', () => {
      const nw = reg.installing;
      if (!nw) return;
      nw.addEventListener('statechange', () => {
        if (nw.state === 'installed' && navigator.serviceWorker.controller) {
          this.showUpdateToast(reg);
        }
      });
    });
  });
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
},
  showUpdateToast(reg) {
  const t = document.getElementById('updateToast');
  if (!t) return;
  t.classList.remove('hidden');
  t.innerHTML =
    '<span>🔄 نسخه جدید موجود است</span>' +
    '<button class="btn btn-sm" id="updateBtn">به‌روزرسانی</button>' +
    '<button class="icon-btn" id="updateDismiss" aria-label="بستن">✕</button>';
  t.querySelector('#updateBtn')?.addEventListener('click', () => {
    reg.waiting?.postMessage({ type: 'SKIP_WAITING' });
    t.classList.add('hidden');
  });
  t.querySelector('#updateDismiss')?.addEventListener('click', () => {
    t.classList.add('hidden');
  });
},

// ========== Network Listeners ==========
  setupNetworkListeners() {
  window.addEventListener('online', () => {
    this.toast('اتصال اینترنت برقرار شد ✅');
    if (this.currentPage === 'home') this.updateQuickStatus();
    if (this.currentPage === 'network') this.updateNetworkInfo();
  });
  window.addEventListener('offline', () => {
    this.toast('اتصال اینترنت قطع شد ⚠️');
    if (this.currentPage === 'home') this.updateQuickStatus();
    if (this.currentPage === 'network') this.updateNetworkInfo();
  });
},

// ========== Keyboard ==========
  setupKeyboard() {
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const modal = document.querySelector('.modal-overlay.show');
    if (modal) { modal.remove(); return; }
    const searchOv = document.getElementById('searchOverlay');
    if (searchOv && !searchOv.classList.contains('hidden')) { this.closeSearch(); return; }
    const menu = document.getElementById('sideMenu');
    if (menu && menu.classList.contains('open')) { this.closeMenu(); }
  });
},

  openSearch() {
    document.getElementById('searchBar')?.classList.remove('hidden');
    document.getElementById('searchOverlay')?.classList.remove('hidden');
    document.getElementById('searchInput')?.focus();
    this.doSearch('');
  },
  closeSearch() {
    document.getElementById('searchBar')?.classList.add('hidden');
    document.getElementById('searchOverlay')?.classList.add('hidden');
    const inp = document.getElementById('searchInput');
    if (inp) inp.value = '';
  },
  doSearch(q) {
    const results = document.getElementById('searchResults');
    if (!results) return;
    const tools = [
      {name:'بودجه',page:'finance',icon:'💰'},
      {name:'کارها',page:'todo',icon:'✅'},
      {name:'عادت',page:'habit',icon:'🔥'},
      {name:'ساعت جهانی',page:'worldclock',icon:'🌍'},
      {name:'محاسبه تاریخ',page:'dateCalc',icon:'📅'},
      {name:'گفتار',page:'speech',icon:'🎙️'},
      {name:'موقعیت',page:'location',icon:'📍'},
      {name:'چراغ‌قوه',page:'flashlight',icon:'🔦'},
      {name:'دستگاه',page:'device',icon:'📱'},{name:'شبکه',page:'network',icon:'🌐'},
      {name:'سنسور',page:'sensors',icon:'📡'},{name:'ابزار',page:'utilities',icon:'🛠️'},
      {name:'یادداشت',page:'text',icon:'📝'},{name:'پومودورو',page:'health',icon:'🍅'},{name:'اشتراک',page:'subs',icon:'💳'},
      {name:'امنیت',page:'security',icon:'🔐'},{name:'امضای دیجیتال',page:'security',icon:'✍️'},{name:'رسانه',page:'media',icon:'🎨'},
      {name:'نسخه حرفه‌ای',page:'premium',icon:'⭐'},{name:'تنظیمات',page:'settings',icon:'⚙️'},{name:'درباره',page:'about',icon:'ℹ️'}
    ];
    const query = (q||'').trim().toLowerCase();
    const filtered = query ? tools.filter(t => t.name.includes(query) || t.page.includes(query)) : tools;
    results.innerHTML = filtered.length ? filtered.map(t =>
      `<div class="search-item" data-page="${t.page}"><span class="s-icon">${t.icon}</span><div class="s-info"><strong>${t.name}</strong></div></div>`
    ).join('') : '<div class="search-empty">یافت نشد</div>';
    results.querySelectorAll('.search-item').forEach(el => {
      el.addEventListener('click', () => { this.closeSearch(); this.navigate(el.dataset.page); });
    });
  },

  openMenu() {
    document.getElementById('sideMenu').classList.add('open');
    document.getElementById('menuOverlay').classList.add('show');
  },

  closeMenu() {
    document.getElementById('sideMenu').classList.remove('open');
    document.getElementById('menuOverlay').classList.remove('show');
  },

  navigate(page) {
    this.currentPage = page;
    this.renderPage(page);

    // Update active states
    document.querySelectorAll('.menu-list li').forEach(li => {
      li.classList.toggle('active', li.dataset.page === page);
    });
    document.querySelectorAll('.bottom-nav .nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.page === page);
    });

    const titles = {
      finance: 'بودجه و هزینه',
      todo: 'کارها',
      habit: 'عادت‌ها',
      worldclock: 'ساعت جهانی',
      dateCalc: 'محاسبه تاریخ',
      speech: 'گفتار و صدا',
      location: 'موقعیت مکانی',
      flashlight: 'چراغ‌قوه',
      home: 'خانه',
      device: 'ابزار دستگاه',
      network: 'شبکه و اینترنت',
      sensors: 'سنسورها',
      utilities: 'ابزار کاربردی',
      text: 'متن و یادداشت',
      health: 'زمان و تمرکز',
      subs: 'اشتراک‌ها',
      security: 'امنیت و رمز',
      media: 'رسانه و تصویر',
      settings: 'تنظیمات',
      about: 'درباره'
    };
    document.getElementById('pageTitle').textContent = titles[page] || 'Mobile Toolkit';
  },

  renderPage(page) {
    const main = document.getElementById('mainContent');
    main.innerHTML = '';
    const pageEl = document.createElement('div');
    pageEl.className = 'page active';
    pageEl.id = `page-${page}`;

    const pages = {
      finance: this.pageFinance,
      todo: this.pageTodo,
      habit: this.pageHabit,
      worldclock: this.pageWorldClock,
      dateCalc: this.pageDateCalc,
      speech: this.pageSpeech,
      location: this.pageLocation,
      flashlight: this.pageFlashlight,
      home: this.pageHome,
      device: this.pageDevice,
      network: this.pageNetwork,
      sensors: this.pageSensors,
      utilities: this.pageUtilities,
      text: this.pageText,
      health: this.pageHealth,
      subs: this.pageSubs,
      security: this.pageSecurity,
      media: this.pageMedia,
      premium: this.pagePremium,
      settings: this.pageSettings,
      about: this.pageAbout
    };

    pageEl.innerHTML = (pages[page] || this.pageHome).call(this);
    main.appendChild(pageEl);
    this.bindPageEvents(page);
  },

  // ========== PAGES ==========

  pageHome() {
    const pro = this.isPro();
    return `
      <div class="card welcome-card">
        <h2>👋 خوش آمدید</h2>
        <p>به Mobile Toolkit خوش آمدید — جعبه ابزار کامل موبایل</p>
        <p style="margin-top:8px">${pro
          ? '<span class="badge badge-success">⭐ Pro فعال</span>'
          : '<span class="badge badge-info" style="cursor:pointer" data-goto="premium">ارتقا به Pro</span>'
        }</p>
        <div class="quick-tools">
          <div class="quick-tool" data-goto="device">
            <span class="q-icon">📱</span>
            <span class="q-label">دستگاه</span>
          </div>
          <div class="quick-tool" data-goto="network">
            <span class="q-icon">🌐</span>
            <span class="q-label">شبکه</span>
          </div>
          <div class="quick-tool" data-goto="sensors">
            <span class="q-icon">📡</span>
            <span class="q-label">سنسور</span>
          </div>
          <div class="quick-tool" data-goto="utilities">
            <span class="q-icon">🧮</span>
            <span class="q-label">ماشین‌حساب</span>
          </div>
          <div class="quick-tool" data-goto="security">
            <span class="q-icon">🔐</span>
            <span class="q-label">رمزساز</span>
          </div>
          <div class="quick-tool" data-goto="media">
            <span class="q-icon">🎨</span>
            <span class="q-label">رنگ</span>
          </div>
        </div>
      </div>

      <div class="section-title">ابزارهای محبوب</div>
      <div class="grid-2">
        <button class="tool-btn" data-tool="deviceInfo">
          <span class="icon">ℹ️</span>
          <span class="label">اطلاعات دستگاه</span>
        </button>
        <button class="tool-btn" data-tool="battery">
          <span class="icon">🔋</span>
          <span class="label">وضعیت باتری</span>
        </button>
        <button class="tool-btn" data-tool="vibrate">
          <span class="icon">📳</span>
          <span class="label">لرزش</span>
        </button>
        <button class="tool-btn" data-tool="networkInfo">
          <span class="icon">📶</span>
          <span class="label">وضعیت شبکه</span>
        </button>
        <button class="tool-btn" data-tool="clipboard">
          <span class="icon">📋</span>
          <span class="label">کلیپ‌بورد</span>
        </button>
        <button class="tool-btn" data-tool="password">
          <span class="icon">🔑</span>
          <span class="label">تولید رمز</span>
        </button>
      </div>

      <div class="section-title">وضعیت سریع</div>
      <div class="card" id="quickStatus">
        <div class="info-row">
          <span class="label">اتصال اینترنت</span>
          <span class="value" id="qsOnline">—</span>
        </div>
        <div class="info-row">
          <span class="label">باتری</span>
          <span class="value" id="qsBattery">—</span>
        </div>
        <div class="info-row">
          <span class="label">وضوح صفحه</span>
          <span class="value" id="qsScreen">—</span>
        </div>
        <div class="info-row">
          <span class="label">زبان سیستم</span>
          <span class="value" id="qsLang">—</span>
        </div>
      </div>
    `;
  },

  pageDevice() {
    return `
      <div class="section-title">اطلاعات سخت‌افزاری</div>
      <div class="card" id="deviceInfoCard">
        <div class="info-row"><span class="label">سیستم عامل</span><span class="value" id="diOS">—</span></div>
        <div class="info-row"><span class="label">مرورگر</span><span class="value" id="diBrowser">—</span></div>
        <div class="info-row"><span class="label">پلتفرم</span><span class="value" id="diPlatform">—</span></div>
        <div class="info-row"><span class="label">هسته‌های پردازنده</span><span class="value" id="diCores">—</span></div>
        <div class="info-row"><span class="label">حافظه دستگاه</span><span class="value" id="diMemory">—</span></div>
        <div class="info-row"><span class="label">زبان</span><span class="value" id="diLang">—</span></div>
        <div class="info-row"><span class="label">منطقه زمانی</span><span class="value" id="diTimezone">—</span></div>
        <div class="info-row"><span class="label">لمس</span><span class="value" id="diTouch">—</span></div>
      </div>

      <div class="section-title">صفحه نمایش</div>
      <div class="card">
        <div class="info-row"><span class="label">عرض</span><span class="value" id="diWidth">—</span></div>
        <div class="info-row"><span class="label">ارتفاع</span><span class="value" id="diHeight">—</span></div>
        <div class="info-row"><span class="label">نسبت پیکسل</span><span class="value" id="diDPR">—</span></div>
        <div class="info-row"><span class="label">جهت</span><span class="value" id="diOrient">—</span></div>
        <div class="info-row"><span class="label">عمق رنگ</span><span class="value" id="diColor">—</span></div>
      </div>

      <div class="section-title">باتری</div>
      <div class="card" id="batteryCard">
        <div class="info-row"><span class="label">سطح شارژ</span><span class="value" id="batLevel">—</span></div>
        <div class="progress-bar"><div class="progress-fill" id="batBar" style="width:0%"></div></div>
        <div class="info-row" style="margin-top:12px"><span class="label">وضعیت شارژ</span><span class="value" id="batCharging">—</span></div>
        <div class="info-row"><span class="label">زمان باقی‌مانده</span><span class="value" id="batTime">—</span></div>
      </div>

      <div class="section-title">ابزارهای تعاملی</div>
      <div class="grid-2">
        <button class="tool-btn" data-tool="vibrate">
          <span class="icon">📳</span>
          <span class="label">تست لرزش</span>
        </button>
        <button class="tool-btn" data-tool="fullscreen">
          <span class="icon">⛶</span>
          <span class="label">تمام‌صفحه</span>
        </button>
        <button class="tool-btn" data-tool="wakeLock">
          <span class="icon">💡</span>
          <span class="label">روشن نگه داشتن</span>
        </button>
        <button class="tool-btn" data-tool="share">
          <span class="icon">📤</span>
          <span class="label">اشتراک‌گذاری</span>
        </button>
      </div>
    `;
  },

  pageNetwork() {
    return `
      <div class="section-title">وضعیت اتصال</div>
      <div class="card">
        <div class="info-row"><span class="label">وضعیت</span><span class="value" id="netStatus">—</span></div>
        <div class="info-row"><span class="label">نوع اتصال</span><span class="value" id="netType">—</span></div>
        <div class="info-row"><span class="label">سرعت موثر</span><span class="value" id="netSpeed">—</span></div>
        <div class="info-row"><span class="label">RTT تقریبی</span><span class="value" id="netRtt">—</span></div>
        <div class="info-row"><span class="label">ذخیره داده</span><span class="value" id="netSave">—</span></div>
      </div>

      <div class="section-title">ابزارهای شبکه</div>
      <div class="grid-2">
        <button class="tool-btn" data-tool="ipLookup">
          <span class="icon">🌍</span>
          <span class="label">آدرس IP من</span>
        </button>
        <button class="tool-btn" data-tool="pingTest">
          <span class="icon">📡</span>
          <span class="label">تست پینگ</span>
        </button>
        <button class="tool-btn" data-tool="dnsLookup">
          <span class="icon">🔍</span>
          <span class="label">جستجوی DNS</span>
        </button>
        <button class="tool-btn" data-tool="userAgent">
          <span class="icon">🕵️</span>
          <span class="label">User Agent</span>
        </button>
      </div>

      <div class="section-title">نتیجه</div>
      <div class="card" id="netResult">
        <p style="color:var(--text-secondary);font-size:0.85rem;text-align:center">ابزاری را انتخاب کنید</p>
      </div>
    `;
  },

  pageSensors() {
    return `
      <div class="section-title">قطب‌نما</div>
      <div class="card">
        <div class="compass-container">
          <div class="compass-dial" id="compassDial">
            <span class="compass-label n">N</span>
            <span class="compass-label s">S</span>
            <span class="compass-label e">E</span>
            <span class="compass-label w">W</span>
            <div class="compass-needle" id="compassNeedle"></div>
            <div class="compass-center"></div>
          </div>
        </div>
        <div style="text-align:center;margin-top:8px">
          <span id="compassDeg" style="font-size:1.4rem;font-weight:700">—°</span>
          <p style="color:var(--text-secondary);font-size:0.8rem;margin-top:4px" id="compassStatus">برای فعال‌سازی روی دکمه زیر بزنید</p>
        </div>
        <button class="btn" id="startCompass" style="margin-top:12px">فعال‌سازی قطب‌نما</button>
      </div>

      <div class="section-title">شتاب‌سنج</div>
      <div class="card">
        <div class="info-row"><span class="label">محور X</span><span class="value" id="accX">—</span></div>
        <div class="info-row"><span class="label">محور Y</span><span class="value" id="accY">—</span></div>
        <div class="info-row"><span class="label">محور Z</span><span class="value" id="accZ">—</span></div>
        <button class="btn btn-outline" id="startAcc" style="margin-top:12px">فعال‌سازی شتاب‌سنج</button>
      </div>

      <div class="section-title">ژیروسکوپ / جهت‌گیری</div>
      <div class="card">
        <div class="info-row"><span class="label">آلفا (Z)</span><span class="value" id="oriAlpha">—</span></div>
        <div class="info-row"><span class="label">بتا (X)</span><span class="value" id="oriBeta">—</span></div>
        <div class="info-row"><span class="label">گاما (Y)</span><span class="value" id="oriGamma">—</span></div>
        <button class="btn btn-outline" id="startOri" style="margin-top:12px">فعال‌سازی جهت‌گیری</button>
      </div>
    `;
  },

  pageUtilities() {
    return `
      <div class="section-title">ماشین‌حساب</div>
      <div class="card">
        <div class="calc-display" id="calcDisplay">0</div>
        <div class="calc-grid">
          <button class="calc-btn" data-val="C">C</button>
          <button class="calc-btn" data-val="±">±</button>
          <button class="calc-btn" data-val="%">%</button>
          <button class="calc-btn op" data-val="/">÷</button>
          <button class="calc-btn" data-val="7">7</button>
          <button class="calc-btn" data-val="8">8</button>
          <button class="calc-btn" data-val="9">9</button>
          <button class="calc-btn op" data-val="*">×</button>
          <button class="calc-btn" data-val="4">4</button>
          <button class="calc-btn" data-val="5">5</button>
          <button class="calc-btn" data-val="6">6</button>
          <button class="calc-btn op" data-val="-">−</button>
          <button class="calc-btn" data-val="1">1</button>
          <button class="calc-btn" data-val="2">2</button>
          <button class="calc-btn" data-val="3">3</button>
          <button class="calc-btn op" data-val="+">+</button>
          <button class="calc-btn zero" data-val="0">0</button>
          <button class="calc-btn" data-val=".">.</button>
          <button class="calc-btn eq" data-val="=">=</button>
        </div>
      </div>

      <div class="section-title">تبدیل واحد</div>
      <div class="card">
        <div class="input-group">
          <label>نوع تبدیل</label>
          <select class="select" id="unitType">
            <option value="length">طول</option>
            <option value="weight">وزن</option>
            <option value="temp">دما</option>
            <option value="data">داده</option>
          </select>
        </div>
        <div class="input-group">
          <label>مقدار</label>
          <input type="number" class="input" id="unitInput" value="1" />
        </div>
        <div class="grid-2">
          <div class="input-group">
            <label>از</label>
            <select class="select" id="unitFrom"></select>
          </div>
          <div class="input-group">
            <label>به</label>
            <select class="select" id="unitTo"></select>
          </div>
        </div>
        <div class="card" style="background:var(--bg-primary);text-align:center;margin-top:8px">
          <div style="font-size:1.5rem;font-weight:700;color:var(--accent)" id="unitResult">—</div>
        </div>
      </div>

      <div class="section-title">کرونومتر و تایمر</div>
      <div class="card">
        <div style="text-align:center;font-size:2.2rem;font-weight:700;direction:ltr;margin-bottom:16px" id="stopwatch">00:00:00</div>
        <div class="grid-3">
          <button class="btn btn-sm" id="swStart">شروع</button>
          <button class="btn btn-sm btn-outline" id="swPause">توقف</button>
          <button class="btn btn-sm btn-outline" id="swReset">ریست</button>
        </div>
      </div>

      <div class="section-title">سایر ابزارها</div>
      <div class="grid-2">
        <button class="tool-btn" data-tool="base64">
          <span class="icon">🔤</span>
          <span class="label">Base64</span>
        </button>
        <button class="tool-btn" data-tool="jsonFormat">
          <span class="icon">{ }</span>
          <span class="label">فرمت JSON</span>
        </button>
        <button class="tool-btn" data-tool="urlEncode">
          <span class="icon">🔗</span>
          <span class="label">URL Encode</span>
        </button>
        <button class="tool-btn" data-tool="hash">
          <span class="icon">#️⃣</span>
          <span class="label">هش متن</span>
        </button>
        <button class="tool-btn" data-tool="random">
          <span class="icon">🎲</span>
          <span class="label">عدد تصادفی</span>
        </button>
        <button class="tool-btn" data-tool="clipboard">
          <span class="icon">📋</span>
          <span class="label">کلیپ‌بورد</span>
        </button>
      </div>
    `;
  },

  pageSecurity() {
    return `
      <div class="section-title">تولید رمز عبور</div>
      <div class="card">
        <div class="input-group">
          <label>طول رمز: <span id="pwLenVal">16</span></label>
          <input type="range" class="range" id="pwLength" min="6" max="64" value="16" data-free-max="16" />
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:12px;margin-bottom:12px;font-size:0.85rem">
          <label><input type="checkbox" id="pwUpper" checked /> حروف بزرگ</label>
          <label><input type="checkbox" id="pwLower" checked /> حروف کوچک</label>
          <label><input type="checkbox" id="pwNum" checked /> اعداد</label>
          <label><input type="checkbox" id="pwSym" checked /> نمادها</label>
        </div>
        <div class="card" style="background:var(--bg-primary);direction:ltr;text-align:center;font-family:monospace;font-size:1.1rem;word-break:break-all;min-height:48px;display:flex;align-items:center;justify-content:center" id="pwResult">
          رمز اینجا نمایش داده می‌شود
        </div>
        <div class="grid-2" style="margin-top:12px">
          <button class="btn" id="genPassword">تولید رمز</button>
          <button class="btn btn-outline" id="copyPassword">کپی</button>
        </div>
      </div>

      <div class="section-title">قدرت رمز</div>
      <div class="card">
        <div class="input-group">
          <label>رمز را وارد کنید</label>
          <input type="text" class="input" id="pwCheck" placeholder="رمز عبور..." style="direction:ltr" />
        </div>
        <div class="progress-bar"><div class="progress-fill" id="pwStrengthBar" style="width:0%"></div></div>
        <p style="margin-top:8px;font-size:0.85rem" id="pwStrengthText">—</p>
      </div>

      <div class="section-title">ابزارهای امنیتی</div>
      <div class="grid-2">
        <button class="tool-btn" data-tool="uuid">
          <span class="icon">🆔</span>
          <span class="label">تولید UUID</span>
        </button>
        <button class="tool-btn" data-tool="otp">
          <span class="icon">🔢</span>
          <span class="label">کد OTP</span>
        </button>
        <button class="tool-btn" data-tool="hash">
          <span class="icon">#️⃣</span>
          <span class="label">هش SHA-256</span>
        </button>
        <button class="tool-btn" data-tool="randomBytes">
          <span class="icon">🎲</span>
          <span class="label">بایت تصادفی</span>
        </button>
      </div>

      <div class="section-title">نتیجه</div>
      <div class="card" id="secResult">
        <p style="color:var(--text-secondary);font-size:0.85rem;text-align:center">ابزاری را انتخاب کنید</p>
      </div>
    `;
  },

  pageMedia() {
    return `
      <div class="section-title">انتخاب‌گر رنگ</div>
      <div class="card">
        <div class="color-preview" id="colorPreview" style="background:#38bdf8"></div>
        <div class="input-group">
          <label>رنگ</label>
          <input type="color" id="colorPicker" value="#38bdf8" style="width:100%;height:48px;border:none;border-radius:10px;cursor:pointer" />
        </div>
        <div class="info-row"><span class="label">HEX</span><span class="value" id="colorHex">#38bdf8</span></div>
        <div class="info-row"><span class="label">RGB</span><span class="value" id="colorRgb">56, 189, 248</span></div>
        <div class="info-row"><span class="label">HSL</span><span class="value" id="colorHsl">—</span></div>
        <button class="btn btn-outline" id="copyColor" style="margin-top:8px">کپی HEX</button>
      </div>

      <div class="section-title">تولید QR Code</div>
      <div class="card">
        <div class="input-group">
          <label>متن یا لینک</label>
          <textarea class="textarea" id="qrText" placeholder="متن خود را وارد کنید..."></textarea>
        </div>
        <button class="btn" id="genQR">تولید QR</button>
        <div id="qrResult" style="text-align:center;margin-top:16px"></div>
      </div>

      <div class="section-title">ابزارهای تصویری</div>
      <div class="grid-2">
        <button class="tool-btn" data-tool="screenshot">
          <span class="icon">📸</span>
          <span class="label">اطلاعات تصویر</span>
        </button>
        <button class="tool-btn" data-tool="palette">
          <span class="icon">🎨</span>
          <span class="label">پالت رنگ</span>
        </button>
      </div>
    `;
  },


  pageText() {
    return `
      <div class="section-title">یادداشت‌ها</div>
      <div class="card">
        <button class="btn" id="newNoteBtn">+ یادداشت جدید</button>
        <button class="btn btn-outline" id="exportNotesBtn" style="margin-top:8px">📤 خروجی JSON (Pro)</button>
        <div id="notesList" style="margin-top:12px"></div>
      </div>
      <div class="section-title">شمارش متن</div>
      <div class="card">
        <textarea class="textarea" id="textCountInput" placeholder="متن خود را بنویسید..."></textarea>
        <div class="grid-2" style="margin-top:12px">
          <div class="stat-item"><div class="num" id="tcChars">0</div><div class="txt">کاراکتر</div></div>
          <div class="stat-item"><div class="num" id="tcWords">0</div><div class="txt">کلمه</div></div>
          <div class="stat-item"><div class="num" id="tcLines">0</div><div class="txt">خط</div></div>
          <div class="stat-item"><div class="num" id="tcSpaces">0</div><div class="txt">فاصله</div></div>
        </div>
      </div>
      <div class="section-title">تبدیل حروف</div>
      <div class="card">
        <textarea class="textarea" id="caseInput" placeholder="متن..." style="direction:ltr"></textarea>
        <div class="grid-2" style="margin-top:10px">
          <button class="btn btn-sm" id="toUpper">UPPERCASE</button>
          <button class="btn btn-sm" id="toLower">lowercase</button>
          <button class="btn btn-sm btn-outline" id="toTitle">Title Case</button>
          <button class="btn btn-sm btn-outline" id="toInvert">iNVERT</button>
        </div>
        <textarea class="textarea" id="caseOutput" readonly style="margin-top:10px;direction:ltr" placeholder="نتیجه..."></textarea>
      </div>
    `;
  },

  pageHealth() {
    return `
      <div class="section-title">پومودورو</div>
      <div class="card">
        <div class="timer-mode" id="pomoMode">تمرکز</div>
        <div class="timer-display" id="pomoDisplay">25:00</div>
        <div class="grid-3">
          <button class="btn btn-sm" id="pomoStart">شروع</button>
          <button class="btn btn-sm btn-outline" id="pomoPause">توقف</button>
          <button class="btn btn-sm btn-outline" id="pomoReset">ریست</button>
        </div>
        <div class="grid-2" style="margin-top:12px">
          <button class="btn btn-sm btn-outline" id="pomoFocus">۲۵ دقیقه تمرکز</button>
          <button class="btn btn-sm btn-outline" id="pomoBreak">۵ دقیقه استراحت</button>
        </div>
        <div class="grid-2" style="margin-top:8px;align-items:center">
          <input type="number" class="input" id="pomoCustomMins" placeholder="دقیقه" min="1" max="180" value="45" />
          <button class="btn btn-sm btn-outline" id="pomoCustom">⏱️ Pro</button>
        </div>
      </div>
      <div class="section-title">محاسبه BMI</div>
      <div class="card">
        <div class="input-group"><label>قد (سانتی‌متر)</label><input type="number" class="input" id="bmiHeight" placeholder="170" /></div>
        <div class="input-group"><label>وزن (کیلوگرم)</label><input type="number" class="input" id="bmiWeight" placeholder="70" /></div>
        <button class="btn" id="bmiCalc">محاسبه</button>
        <div class="bmi-result" id="bmiResult" style="display:none">
          <div class="bmi-num" id="bmiNum">—</div>
          <div class="bmi-label" id="bmiLabel">—</div>
        </div>
      </div>
    `;
  },

  pageSettings() {
    return `
      <div class="section-title">ظاهر</div>
      <div class="card">
        <div class="info-row">
          <span class="label">تم</span>
          <button class="btn btn-sm btn-outline" id="setThemeToggle">تغییر تم</button>
        </div>
      </div>
      <div class="section-title">داده</div>
      <div class="card">
        <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:12px">یادداشت‌ها در حافظه مرورگر ذخیره می‌شوند.</p>
        <button class="btn btn-outline" id="clearNotes">پاک کردن یادداشت‌ها</button>
        <button class="btn btn-outline" id="clearAllData" style="margin-top:8px">پاک کردن تمام داده‌ها</button>
      </div>
      <div class="section-title">نسخه</div>
      <div class="card">
        <div class="info-row"><span class="label">نسخه</span><span class="value">۱.۲.۰</span></div>
        <div class="info-row"><span class="label">شرکت</span><span class="value">Krypton Studio</span></div>
      </div>
    `;
  },



  pageSubs() {
    return `
      <div class="card" style="background:linear-gradient(135deg,#0f766e,#1e3a5f);border-color:#14b8a6;text-align:center;padding:20px 16px">
        <div style="font-size:2rem;margin-bottom:6px">💳</div>
        <h2 style="font-size:1.15rem">مدیریت اشتراک‌ها</h2>
        <p style="color:var(--text-secondary);font-size:0.8rem;margin-top:4px">نرم‌افزار، سرویس و اشتراک‌های دوره‌ای</p>
      </div>

      <div class="section-title">خلاصه هزینه</div>
      <div class="stat-grid" id="subsSummary">
        <div class="stat-item"><div class="num" id="subsMonthly">۰</div><div class="txt">ماهانه (تومان)</div></div>
        <div class="stat-item"><div class="num" id="subsYearly">۰</div><div class="txt">سالانه (تومان)</div></div>
        <div class="stat-item"><div class="num" id="subsCount">۰</div><div class="txt">تعداد اشتراک</div></div>
        <div class="stat-item"><div class="num" id="subsSoon">۰</div><div class="txt">تمدید نزدیک</div></div>
      </div>

      <div class="section-title">افزودن اشتراک</div>
      <div class="card">
        <div class="input-group"><label>نام سرویس / نرم‌افزار</label>
          <input type="text" class="input" id="subName" placeholder="مثلاً Spotify، Adobe، ChatGPT" />
        </div>
        <div class="grid-2">
          <div class="input-group"><label>مبلغ (تومان)</label>
            <input type="number" class="input" id="subPrice" placeholder="150000" />
          </div>
          <div class="input-group"><label>دوره</label>
            <select class="select" id="subCycle">
              <option value="monthly">ماهانه</option>
              <option value="yearly">سالانه</option>
              <option value="weekly">هفتگی</option>
            </select>
          </div>
        </div>
        <div class="input-group"><label>تاریخ تمدید بعدی</label>
          <input type="date" class="input" id="subRenew" style="direction:ltr" />
        </div>
        <div class="input-group"><label>یادداشت (اختیاری)</label>
          <input type="text" class="input" id="subNote" placeholder="ایمیل حساب، پلن و ..." />
        </div>
        <button class="btn" id="subAddBtn">+ افزودن اشتراک</button>
      </div>

      <div class="section-title">لیست اشتراک‌ها</div>
      <div id="subsList"></div>

      <div class="grid-2" style="margin-top:8px">
        <button class="btn btn-outline btn-sm" id="subExportBtn">📤 خروجی</button>
        <button class="btn btn-outline btn-sm" id="subClearBtn" style="color:var(--danger);border-color:var(--danger)">پاک‌سازی</button>
      </div>
    `;
  },

  pagePremium() {
    const info = this.getLicenseInfo();
    const pro = info.active;

    let badgeClass = 'badge-warning';
    let badgeText = 'فعال نشده';
    if (info.active && info.status === 'active') { badgeClass = 'badge-success'; badgeText = '✓ Pro فعال'; }
    else if (info.active && info.status === 'warning') { badgeClass = 'badge-warning'; badgeText = '⚠ انقضای نزدیک'; }
    else if (info.active && info.status === 'critical') { badgeClass = 'badge-danger'; badgeText = '⚠ کمتر از ۷ روز'; }
    else if (info.expired) { badgeClass = 'badge-danger'; badgeText = 'منقضی شده'; }

    let statusBlock = '<div style="margin-top:14px"><span class="badge ' + badgeClass + '" style="font-size:0.9rem;padding:6px 14px">' + badgeText + '</span></div>';
    if (info.expiresAt) {
      statusBlock += '<p style="margin-top:8px;font-size:0.8rem;color:var(--text-secondary)">اعتبار تا: ' + this.formatLicenseDate(info.expiresAt);
      if (info.active) statusBlock += ' · ' + info.daysLeft + ' روز مانده';
      statusBlock += '</p>';
    }

    const features = [
      ['📝 یادداشت نامحدود', pro ? '✓ فعال' : 'قفل'],
      ['📤 خروجی یادداشت‌ها', pro ? '✓ فعال' : 'قفل'],
      ['🔑 رمز تا ۶۴ کاراکتر', pro ? '✓ فعال' : 'قفل (حداکثر ۱۶)'],
      ['🍅 پومودورو سفارشی', pro ? '✓ فعال' : 'قفل'],
      ['💳 اشتراک نامحدود', pro ? '✓ فعال' : 'قفل (حداکثر ۵)'],
    ].map(function(row) {
      return '<div class="info-row"><span class="label">' + row[0] + '</span><span class="value">' + row[1] + '</span></div>';
    }).join('');

    let bodyExtra = '';
    let licenseCard = '';
    if (info.active || info.expired) {
      const barColor = info.status === 'critical' || info.expired ? 'var(--danger)' : (info.status === 'warning' ? 'var(--warning)' : 'var(--success)');
      licenseCard =
        '<div class="section-title">مدیریت انقضای لایسنس</div>' +
        '<div class="card">' +
        '<div class="info-row"><span class="label">وضعیت</span><span class="value">' + info.statusLabel + '</span></div>' +
        '<div class="info-row"><span class="label">تاریخ فعال‌سازی</span><span class="value">' + this.formatLicenseDate(info.activatedAt) + '</span></div>' +
        '<div class="info-row"><span class="label">تاریخ انقضا</span><span class="value">' + this.formatLicenseDate(info.expiresAt) + '</span></div>' +
        '<div class="info-row"><span class="label">روز باقی‌مانده</span><span class="value">' + (info.active ? (info.daysLeft + ' روز') : '۰') + '</span></div>' +
        (info.code ? '<div class="info-row"><span class="label">کد استفاده‌شده</span><span class="value" style="direction:ltr;font-size:0.75rem">' + info.code + '</span></div>' : '') +
        '<div style="margin-top:12px"><div style="font-size:0.75rem;color:var(--text-secondary);margin-bottom:6px">باقی‌مانده اعتبار</div>' +
        '<div class="progress-bar"><div class="progress-fill" style="width:' + info.percentLeft + '%;background:' + barColor + '"></div></div></div>' +
        '</div>' +
        '<div class="section-title">تمدید لایسنس</div>' +
        '<div class="card">' +
        '<p style="font-size:0.85rem;color:var(--text-secondary);line-height:1.6;margin-bottom:10px">با وارد کردن کد جدید، اعتبار از تاریخ انقضای فعلی تمدید می‌شود.</p>' +
        '<div class="input-group"><label>کد تمدید / فعال‌سازی</label>' +
        '<input type="text" class="input" id="proCodeInput" placeholder="KT-XXXX-XXXX-MM-XXXX" autocomplete="off" style="direction:ltr;text-align:center;letter-spacing:1px" /></div>' +
        '<button type="button" class="btn" id="activateProBtn">اعمال کد</button>' +
        '</div>';
    }

    if (pro) {
      bodyExtra =
        licenseCard +
        '<div class="section-title">میانبر Pro</div>' +
        '<div class="grid-2">' +
        '<button type="button" class="tool-btn" data-goto="text"><span class="icon">📝</span><span class="label">یادداشت‌ها</span></button>' +
        '<button type="button" class="tool-btn" data-goto="health"><span class="icon">🍅</span><span class="label">پومودورو</span></button>' +
        '<button type="button" class="tool-btn" data-goto="security"><span class="icon">🔑</span><span class="label">رمزساز</span></button>' +
        '<button type="button" class="tool-btn" data-goto="subs"><span class="icon">💳</span><span class="label">اشتراک‌ها</span></button>' +
        '</div>' +
        '<div class="section-title">مدیریت</div>' +
        '<div class="card">' +
        '<button type="button" class="btn btn-outline" id="exportNotesPro">📤 خروجی یادداشت‌ها</button>' +
        '<button type="button" class="btn btn-outline" id="deactivateProBtn" style="margin-top:8px;color:var(--danger);border-color:var(--danger)">لغو Pro روی این دستگاه</button>' +
        '</div>';
    } else if (info.expired) {
      bodyExtra = licenseCard +
        '<div class="section-title">پرداخت برای تمدید</div>' +
        '<div class="card">' +
        '<p style="font-size:0.9rem;line-height:1.8;color:var(--text-secondary);margin-bottom:12px">لایسنس منقضی شده. پس از واریز، کد جدید دریافت و وارد کنید.</p>' +
        '<div style="background:var(--bg-primary);border-radius:12px;padding:16px;text-align:center;margin-bottom:12px;border:1px dashed var(--accent)">' +
        '<div style="font-size:0.75rem;color:var(--text-secondary);margin-bottom:6px">شماره کارت (موقت)</div>' +
        '<div style="font-size:1.15rem;font-weight:700;letter-spacing:1px;direction:ltr;font-family:monospace">5894-6311-2934-2159</div>' +
        '<div style="font-size:0.8rem;color:var(--text-secondary);margin-top:8px">به نام Krypton Studio</div></div>' +
        '<button type="button" class="btn btn-outline" id="copyCardBtn">کپی شماره کارت</button></div>';
    } else {
      bodyExtra =
        '<div class="section-title">قیمت</div>' +
        '<div class="card">' +
        '<div class="info-row"><span class="label">نسخه پایه</span><span class="value">محدود</span></div>' +
        '<div class="info-row"><span class="label">نسخه Pro — یک‌ساله</span><span class="value" style="color:var(--accent);font-weight:700">۱۴۹٬۰۰۰ تومان</span></div>' +
        '</div>' +
        '<div class="section-title">پرداخت</div>' +
        '<div class="card">' +
        '<p style="font-size:0.9rem;line-height:1.8;color:var(--text-secondary);margin-bottom:12px">' +
        'پس از واریز ۱۴۹٬۰۰۰ تومان، کد فعال‌سازی یکتا از طرف Krypton Studio برای شما صادر می‌شود. همان کد را اینجا وارد کنید.' +
        '</p>' +
        '<div style="background:var(--bg-primary);border-radius:12px;padding:16px;text-align:center;margin-bottom:12px;border:1px dashed var(--accent)">' +
        '<div style="font-size:0.75rem;color:var(--text-secondary);margin-bottom:6px">شماره کارت (موقت)</div>' +
        '<div style="font-size:1.15rem;font-weight:700;letter-spacing:1px;direction:ltr;font-family:monospace">5894-6311-2934-2159</div>' +
        '<div style="font-size:0.8rem;color:var(--text-secondary);margin-top:8px">به نام Krypton Studio</div>' +
        '</div>' +
        '<button type="button" class="btn btn-outline" id="copyCardBtn">کپی شماره کارت</button>' +
        '</div>' +
        '<div class="section-title">فعال‌سازی</div>' +
        '<div class="card">' +
        '<div class="input-group"><label>کد فعال‌سازی</label>' +
        '<input type="text" class="input" id="proCodeInput" placeholder="KT-XXXX-XXXX-XXXX" autocomplete="off" style="direction:ltr;text-align:center;letter-spacing:1px" /></div>' +
        '<button type="button" class="btn" id="activateProBtn">فعال‌سازی Pro یک‌ساله</button>' +
        '</div>';
    }

    const isAdmin = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('mt-admin') === '1');
    let adminBlock = '<div class="section-title">پنل شرکت (صدور کد پس از پرداخت)</div><div class="card">';
    if (!isAdmin) {
      adminBlock += '<p style="font-size:0.8rem;color:var(--text-secondary);margin-bottom:10px;line-height:1.6">پس از تأیید واریز مشتری، وارد شوید و کد یکتا بسازید.</p>';
      adminBlock += '<div class="input-group"><label>رمز ادمین</label><input type="password" class="input" id="adminPassInput" placeholder="رمز مدیریت" autocomplete="off" /></div>';
      adminBlock += '<button type="button" class="btn btn-outline" id="adminLoginBtn">ورود به صدور کد</button>';
    } else {
      adminBlock += '<p style="font-size:0.8rem;color:var(--success);margin-bottom:10px">آماده صدور کد</p>';
      adminBlock += '<div class="input-group"><label>مدت اعتبار کد</label><select class="select" id="licenseMonths">';
      adminBlock += '<option value="1">۱ ماه</option><option value="3">۳ ماه</option><option value="6">۶ ماه</option><option value="12" selected>۱۲ ماه (یک‌ساله)</option>';
      adminBlock += '</select></div>';
      adminBlock += '<button type="button" class="btn" id="genLicenseBtn">تولید کد فعال‌سازی</button>';
      adminBlock += '<div id="genLicenseOut" style="background:var(--bg-primary);margin-top:12px;padding:14px;border-radius:10px;text-align:center;direction:ltr;font-family:monospace;font-size:1.05rem;font-weight:700;letter-spacing:1px;border:1px solid var(--border)">—</div>';
      adminBlock += '<p style="font-size:0.75rem;color:var(--text-secondary);margin-top:8px">کد را فقط بعد از پرداخت برای خریدار بفرستید. مدت داخل خود کد ثبت می‌شود.</p>';
      adminBlock += '<button type="button" class="btn btn-outline" id="adminLogoutBtn" style="margin-top:10px">خروج ادمین</button>';
    }
    adminBlock += '</div>';

    return (
      '<div class="card" style="background:linear-gradient(135deg,#1e3a5f,#312e81);border-color:#6366f1;text-align:center;padding:24px 16px">' +
      '<div style="font-size:2.5rem;margin-bottom:8px">' + (pro ? '👑' : '⭐') + '</div>' +
      '<h2 style="font-size:1.25rem;margin-bottom:6px">Mobile Toolkit Pro</h2>' +
      '<p style="color:var(--text-secondary);font-size:0.85rem;line-height:1.6">' +
      (pro
        ? 'نسخه حرفه‌ای شما فعال است. از تمام امکانات بدون محدودیت استفاده کنید.'
        : 'نسخه حرفه‌ای با امکانات پیشرفته و بدون محدودیت') +
      '</p>' + statusBlock + '</div>' +
      '<div class="section-title">وضعیت امکانات</div>' +
      '<div class="card">' + features + '</div>' +
      bodyExtra +
      adminBlock +
      '<div class="card" style="text-align:center;margin-top:8px">' +
      '<p style="font-size:0.75rem;color:var(--text-secondary)">Krypton Studio · Mobile Toolkit Pro</p></div>'
    );
  },

  pageAbout() {
    return `
      <div class="about-logo">
        <div class="logo-circle">KT</div>
        <h2 style="font-size:1.3rem">Mobile Toolkit</h2>
        <p style="color:var(--text-secondary);font-size:0.9rem">جعبه ابزار کامل موبایل</p>
      </div>

      <div class="card">
        <div class="card-title">🏢 درباره شرکت</div>
        <p style="font-size:0.9rem;line-height:1.7;color:var(--text-secondary)">
          <strong style="color:var(--text-primary)">Krypton Studio</strong> یک استودیوی نرم‌افزاری مستقل است که با تمرکز بر ساخت ابزارهای کاربردی و باکیفیت برای کاربران موبایل فعالیت می‌کند.
        </p>
        <p style="font-size:0.9rem;line-height:1.7;color:var(--text-secondary);margin-top:10px">
          این محصول، <strong style="color:var(--accent)">اولین محصول رسمی</strong> این شرکت محسوب می‌شود. در حال حاضر محصول دیگری در دسترس نیست و سایت رسمی نیز هنوز راه‌اندازی نشده است.
        </p>
      </div>

      <div class="card">
        <div class="card-title">📦 درباره این اپ</div>
        <div class="info-row"><span class="label">نام</span><span class="value">Mobile Toolkit</span></div>
        <div class="info-row"><span class="label">نسخه</span><span class="value">۱.۲.۰</span></div>
        <div class="info-row"><span class="label">شرکت</span><span class="value">Krypton Studio</span></div>
        <div class="info-row"><span class="label">پلتفرم</span><span class="value">وب / PWA</span></div>
        <div class="info-row"><span class="label">زبان</span><span class="value">JavaScript</span></div>
      </div>

      <div class="stat-grid">
        <div class="stat-item">
          <div class="num">۳۰+</div>
          <div class="txt">ابزار</div>
        </div>
        <div class="stat-item">
          <div class="num">Pro</div>
          <div class="txt">نسخه حرفه‌ای</div>
        </div>
        <div class="stat-item">
          <div class="num">PWA</div>
          <div class="txt">قابل نصب</div>
        </div>
        <div class="stat-item">
          <div class="num">KT</div>
          <div class="txt">Krypton Studio</div>
        </div>
      </div>

      <div class="card" style="margin-top:16px;text-align:center">
        <p style="font-size:0.8rem;color:var(--text-secondary)">ساخته شده با ❤️ توسط Krypton Studio</p>
        <p style="font-size:0.75rem;color:var(--text-secondary);margin-top:4px">© ۲۰۲۶ — تمامی حقوق محفوظ است</p>
      </div>
    `;
  },

  // ========== BIND PAGE EVENTS ==========

  bindPageEvents(page) {
    if (page === 'finance') this.bindFinance();
if (page === 'todo') this.bindTodo();
if (page === 'habit') this.bindHabit();
if (page === 'worldclock') this.bindWorldClock();
if (page === 'dateCalc') this.bindDateCalc();
if (page === 'speech') this.bindSpeech();
if (page === 'location') this.bindLocation();
if (page === 'flashlight') this.bindFlashlight();
    // Quick tools navigation
    document.querySelectorAll('[data-goto]').forEach(el => {
      el.addEventListener('click', () => this.navigate(el.dataset.goto));
    });

    // Tool buttons
    document.querySelectorAll('[data-tool]').forEach(btn => {
      btn.addEventListener('click', () => this.runTool(btn.dataset.tool));
    });

    if (page === 'home') this.updateQuickStatus();
    if (page === 'device') this.updateDeviceInfo();
    if (page === 'network') this.updateNetworkInfo();
    if (page === 'sensors') this.bindSensors();
    if (page === 'utilities') this.bindUtilities();
    if (page === 'security') this.bindSecurity();
    if (page === 'media') this.bindMedia();
    if (page === 'text') this.bindText();
    if (page === 'health') this.bindHealth();
    if (page === 'subs') this.bindSubs();
    if (page === 'settings') this.bindSettings();
    if (page === 'premium') this.bindPremium();
  },

  // ========== TOOLS ==========

  runTool(name) {
    const tools = {
      deviceInfo: () => { this.navigate('device'); },
      battery: () => { this.navigate('device'); },
      vibrate: () => this.doVibrate(),
      networkInfo: () => { this.navigate('network'); },
      clipboard: () => this.doClipboard(),
      password: () => { this.navigate('security'); },
      fullscreen: () => this.toggleFullscreen(),
      wakeLock: () => this.doWakeLock(),
      share: () => this.doShare(),
      ipLookup: () => this.doIpLookup(),
      pingTest: () => this.doPingTest(),
      dnsLookup: () => this.doDnsLookup(),
      userAgent: () => this.showResult('netResult', navigator.userAgent),
      base64: () => this.doBase64(),
      jsonFormat: () => this.doJsonFormat(),
      urlEncode: () => this.doUrlEncode(),
      hash: () => this.doHash(),
      random: () => this.doRandom(),
      uuid: () => this.doUuid(),
      otp: () => this.doOtp(),
      randomBytes: () => this.doRandomBytes(),
      screenshot: () => this.toast('از ابزار Screenshot سیستم استفاده کنید'),
      palette: () => this.doPalette()
    };
    if (tools[name]) tools[name]();
  },

  // Device tools
  doVibrate() {
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100, 50, 200]);
      this.toast('لرزش فعال شد');
    } else {
      this.toast('لرزش در این دستگاه پشتیبانی نمی‌شود');
    }
  },

  async doWakeLock() {
    try {
      if ('wakeLock' in navigator) {
        this._wakeLock = await navigator.wakeLock.request('screen');
        this.toast('صفحه روشن می‌ماند');
        this._wakeLock.addEventListener('release', () => this.toast('قفل صفحه آزاد شد'));
      } else {
        this.toast('این قابلیت پشتیبانی نمی‌شود');
      }
    } catch (e) {
      this.toast('خطا در فعال‌سازی');
    }
  },

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.() || document.documentElement.webkitRequestFullscreen?.();
      this.toast('حالت تمام‌صفحه');
    } else {
      document.exitFullscreen?.() || document.webkitExitFullscreen?.();
    }
  },

  async doShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Mobile Toolkit',
          text: 'جعبه ابزار کامل موبایل از Krypton Studio',
          url: location.href
        });
      } catch (e) {}
    } else {
      this.toast('اشتراک‌گذاری پشتیبانی نمی‌شود');
    }
  },

  async doClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      this.showModal('کلیپ‌بورد', `
        <div class="input-group">
          <label>محتوای فعلی</label>
          <textarea class="textarea" id="clipContent" style="direction:ltr">${this.escapeHtml(text || '(خالی)')}</textarea>
        </div>
        <button class="btn" id="clipCopy">کپی متن بالا</button>
        <button class="btn btn-outline" id="clipClear" style="margin-top:8px">پاک کردن کلیپ‌بورد</button>
      `);
      setTimeout(() => {
        document.getElementById('clipCopy')?.addEventListener('click', () => {
          navigator.clipboard.writeText(document.getElementById('clipContent').value);
          this.toast('کپی شد');
        });
        document.getElementById('clipClear')?.addEventListener('click', () => {
          navigator.clipboard.writeText('');
          this.toast('پاک شد');
        });
      }, 100);
    } catch (e) {
      this.toast('دسترسی به کلیپ‌بورد ممکن نیست');
    }
  },

  // Network tools
  async doIpLookup() {
    this.showResult('netResult', 'در حال دریافت...');
    try {
      const res = await fetch('https://api.ipify.org?format=json');
      const data = await res.json();
      this.showResult('netResult', `
        <div class="info-row"><span class="label">آدرس IP عمومی</span><span class="value" style="direction:ltr">${data.ip}</span></div>
      `);
    } catch (e) {
      this.showResult('netResult', 'خطا در دریافت IP. اتصال اینترنت را بررسی کنید.');
    }
  },

  async doPingTest() {
    this.showResult('netResult', 'در حال تست...');
    const start = performance.now();
    try {
      await fetch('https://www.google.com/generate_204', { mode: 'no-cors', cache: 'no-store' });
      const ms = Math.round(performance.now() - start);
      this.showResult('netResult', `
        <div class="info-row"><span class="label">زمان پاسخ</span><span class="value">${ms} ms</span></div>
        <div class="info-row"><span class="label">وضعیت</span><span class="value"><span class="badge badge-success">آنلاین</span></span></div>
      `);
    } catch (e) {
      this.showResult('netResult', 'خطا در اتصال');
    }
  },

  doDnsLookup() {
    this.showModal('جستجوی DNS', `
      <div class="input-group">
        <label>دامنه</label>
        <input type="text" class="input" id="dnsInput" placeholder="example.com" style="direction:ltr" />
      </div>
      <button class="btn" id="dnsBtn">جستجو</button>
      <div id="dnsOut" style="margin-top:12px;font-size:0.85rem;direction:ltr"></div>
    `);
    setTimeout(() => {
      document.getElementById('dnsBtn')?.addEventListener('click', async () => {
        const domain = document.getElementById('dnsInput').value.trim();
        if (!domain) return;
        document.getElementById('dnsOut').textContent = 'در حال جستجو...';
        try {
          const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=A`);
          const data = await res.json();
          if (data.Answer) {
            document.getElementById('dnsOut').innerHTML = data.Answer.map(a => `<div>${a.data}</div>`).join('');
          } else {
            document.getElementById('dnsOut').textContent = 'یافت نشد';
          }
        } catch (e) {
          document.getElementById('dnsOut').textContent = 'خطا';
        }
      });
    }, 100);
  },

  // Utility tools
  doBase64() {
    this.showModal('Base64', `
      <div class="input-group">
        <label>متن</label>
        <textarea class="textarea" id="b64Input" style="direction:ltr"></textarea>
      </div>
      <div class="grid-2">
        <button class="btn" id="b64Enc">رمزگذاری</button>
        <button class="btn btn-outline" id="b64Dec">رمزگشایی</button>
      </div>
      <div class="input-group" style="margin-top:12px">
        <label>نتیجه</label>
        <textarea class="textarea" id="b64Out" style="direction:ltr" readonly></textarea>
      </div>
    `);
    setTimeout(() => {
      document.getElementById('b64Enc')?.addEventListener('click', () => {
        try {
          document.getElementById('b64Out').value = btoa(unescape(encodeURIComponent(document.getElementById('b64Input').value)));
        } catch (e) { this.toast('خطا'); }
      });
      document.getElementById('b64Dec')?.addEventListener('click', () => {
        try {
          document.getElementById('b64Out').value = decodeURIComponent(escape(atob(document.getElementById('b64Input').value)));
        } catch (e) { this.toast('متن نامعتبر'); }
      });
    }, 100);
  },

  doJsonFormat() {
    this.showModal('فرمت JSON', `
      <div class="input-group">
        <label>JSON خام</label>
        <textarea class="textarea" id="jsonIn" style="direction:ltr;min-height:120px"></textarea>
      </div>
      <button class="btn" id="jsonBtn">فرمت کن</button>
      <div class="input-group" style="margin-top:12px">
        <label>نتیجه</label>
        <textarea class="textarea" id="jsonOut" style="direction:ltr;min-height:120px" readonly></textarea>
      </div>
    `);
    setTimeout(() => {
      document.getElementById('jsonBtn')?.addEventListener('click', () => {
        try {
          const obj = JSON.parse(document.getElementById('jsonIn').value);
          document.getElementById('jsonOut').value = JSON.stringify(obj, null, 2);
        } catch (e) {
          this.toast('JSON نامعتبر است');
        }
      });
    }, 100);
  },

  doUrlEncode() {
    this.showModal('URL Encode / Decode', `
      <div class="input-group">
        <label>متن</label>
        <textarea class="textarea" id="urlIn" style="direction:ltr"></textarea>
      </div>
      <div class="grid-2">
        <button class="btn" id="urlEnc">Encode</button>
        <button class="btn btn-outline" id="urlDec">Decode</button>
      </div>
      <div class="input-group" style="margin-top:12px">
        <label>نتیجه</label>
        <textarea class="textarea" id="urlOut" style="direction:ltr" readonly></textarea>
      </div>
    `);
    setTimeout(() => {
      document.getElementById('urlEnc')?.addEventListener('click', () => {
        document.getElementById('urlOut').value = encodeURIComponent(document.getElementById('urlIn').value);
      });
      document.getElementById('urlDec')?.addEventListener('click', () => {
        try {
          document.getElementById('urlOut').value = decodeURIComponent(document.getElementById('urlIn').value);
        } catch (e) { this.toast('خطا'); }
      });
    }, 100);
  },

  async doHash() {
    this.showModal('هش SHA-256', `
      <div class="input-group">
        <label>متن</label>
        <textarea class="textarea" id="hashIn" style="direction:ltr"></textarea>
      </div>
      <button class="btn" id="hashBtn">محاسبه هش</button>
      <div class="input-group" style="margin-top:12px">
        <label>SHA-256</label>
        <textarea class="textarea" id="hashOut" style="direction:ltr;font-family:monospace;font-size:0.8rem" readonly></textarea>
      </div>
    `);
    setTimeout(() => {
      document.getElementById('hashBtn')?.addEventListener('click', async () => {
        const text = document.getElementById('hashIn').value;
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        document.getElementById('hashOut').value = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      });
    }, 100);
  },

  doRandom() {
    this.showModal('عدد تصادفی', `
      <div class="grid-2">
        <div class="input-group">
          <label>حداقل</label>
          <input type="number" class="input" id="rndMin" value="1" />
        </div>
        <div class="input-group">
          <label>حداکثر</label>
          <input type="number" class="input" id="rndMax" value="100" />
        </div>
      </div>
      <button class="btn" id="rndBtn">تولید</button>
      <div style="text-align:center;font-size:2rem;font-weight:700;margin-top:16px;color:var(--accent)" id="rndOut">—</div>
    `);
    setTimeout(() => {
      document.getElementById('rndBtn')?.addEventListener('click', () => {
        const min = parseInt(document.getElementById('rndMin').value) || 0;
        const max = parseInt(document.getElementById('rndMax').value) || 100;
        document.getElementById('rndOut').textContent = Math.floor(Math.random() * (max - min + 1)) + min;
      });
    }, 100);
  },

  doUuid() {
  const uuid = crypto.randomUUID();
  this.showResult('secResult',
    '<div style="direction:ltr;font-family:monospace;font-size:0.9rem;word-break:break-all;text-align:center" id="uuidVal">' + uuid + '</div>' +
    '<button class="btn btn-sm" style="margin-top:12px;width:100%" id="uuidCopy">کپی</button>'
  );
  setTimeout(() => {
    document.getElementById('uuidCopy')?.addEventListener('click', () => {
      navigator.clipboard.writeText(uuid)
        .then(() => this.toast('کپی شد'))
        .catch(() => this.toast(uuid));
    });
  }, 50);
},

  doOtp() {
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    this.showResult('secResult', `
      <div style="font-size:2rem;font-weight:700;text-align:center;letter-spacing:8px;direction:ltr">${otp}</div>
      <p style="text-align:center;color:var(--text-secondary);font-size:0.8rem;margin-top:8px">کد ۶ رقمی تصادفی</p>
    `);
  },

  doRandomBytes() {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    const hex = Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
    this.showResult('secResult', `
      <div style="direction:ltr;font-family:monospace;font-size:0.85rem;word-break:break-all;text-align:center">${hex}</div>
    `);
  },

  doPalette() {
    const colors = ['#38bdf8','#818cf8','#34d399','#fbbf24','#f87171','#a78bfa','#fb7185','#2dd4bf'];
    this.showModal('پالت رنگ', `
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">
        ${colors.map(c => `<div style="height:60px;border-radius:10px;background:${c};cursor:pointer" data-c="${c}"></div>`).join('')}
      </div>
      <p style="text-align:center;margin-top:12px;font-size:0.85rem;color:var(--text-secondary)">روی رنگ بزنید تا کپی شود</p>
    `);
    setTimeout(() => {
      document.querySelectorAll('[data-c]').forEach(el => {
        el.addEventListener('click', () => {
          navigator.clipboard.writeText(el.dataset.c);
          this.toast(`${el.dataset.c} کپی شد`);
        });
      });
    }, 100);
  },

  // ========== PAGE BINDERS ==========

  updateQuickStatus() {
    const online = navigator.onLine;
    const el = document.getElementById('qsOnline');
    if (el) {
      el.innerHTML = online
        ? '<span class="badge badge-success">آنلاین</span>'
        : '<span class="badge badge-danger">آفلاین</span>';
    }
    document.getElementById('qsScreen').textContent = `${screen.width}×${screen.height}`;
    document.getElementById('qsLang').textContent = navigator.language || '—';

    if (navigator.getBattery) {
      navigator.getBattery().then(bat => {
        const pct = Math.round(bat.level * 100);
        document.getElementById('qsBattery').textContent = `${pct}% ${bat.charging ? '⚡' : ''}`;
      }).catch(() => {});
    }
  },

  updateDeviceInfo() {
    const ua = navigator.userAgent;
    let os = 'نامشخص';
    if (/android/i.test(ua)) os = 'Android';
    else if (/iPad|iPhone|iPod/.test(ua)) os = 'iOS';
    else if (/Windows/.test(ua)) os = 'Windows';
    else if (/Mac/.test(ua)) os = 'macOS';
    else if (/Linux/.test(ua)) os = 'Linux';

    let browser = 'نامشخص';
    if (/Chrome/.test(ua) && !/Edg/.test(ua)) browser = 'Chrome';
    else if (/Safari/.test(ua) && !/Chrome/.test(ua)) browser = 'Safari';
    else if (/Firefox/.test(ua)) browser = 'Firefox';
    else if (/Edg/.test(ua)) browser = 'Edge';

    const set = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };

    set('diOS', os);
    set('diBrowser', browser);
    set('diPlatform', navigator.platform || '—');
    set('diCores', navigator.hardwareConcurrency || '—');
    set('diMemory', navigator.deviceMemory ? `${navigator.deviceMemory} GB` : '—');
    set('diLang', navigator.language || '—');
    set('diTimezone', Intl.DateTimeFormat().resolvedOptions().timeZone || '—');
    set('diTouch', navigator.maxTouchPoints > 0 ? `بله (${navigator.maxTouchPoints})` : 'خیر');
    set('diWidth', `${screen.width} px`);
    set('diHeight', `${screen.height} px`);
    set('diDPR', window.devicePixelRatio || '—');
    set('diOrient', screen.orientation ? screen.orientation.type : (window.innerWidth > window.innerHeight ? 'افقی' : 'عمودی'));
    set('diColor', screen.colorDepth ? `${screen.colorDepth} bit` : '—');

    // Battery
    if (navigator.getBattery) {
      navigator.getBattery().then(bat => {
        const updateBat = () => {
          const pct = Math.round(bat.level * 100);
          set('batLevel', `${pct}%`);
          const bar = document.getElementById('batBar');
          if (bar) bar.style.width = `${pct}%`;
          set('batCharging', bat.charging ? 'در حال شارژ ⚡' : 'در حال تخلیه');
          if (bat.charging && bat.chargingTime !== Infinity) {
            set('batTime', `${Math.round(bat.chargingTime / 60)} دقیقه تا پر شدن`);
          } else if (!bat.charging && bat.dischargingTime !== Infinity) {
            set('batTime', `${Math.round(bat.dischargingTime / 60)} دقیقه باقی‌مانده`);
          } else {
            set('batTime', 'نامشخص');
          }
        };
        updateBat();
        bat.addEventListener('levelchange', updateBat);
        bat.addEventListener('chargingchange', updateBat);
      }).catch(() => {});
    }
  },

  updateNetworkInfo() {
    const set = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
    set('netStatus', navigator.onLine
      ? 'آنلاین ✅'
      : 'آفلاین ❌');

    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn) {
      set('netType', conn.effectiveType || conn.type || '—');
      set('netSpeed', conn.downlink ? `${conn.downlink} Mbps` : '—');
      set('netRtt', conn.rtt ? `${conn.rtt} ms` : '—');
      set('netSave', conn.saveData ? 'فعال' : 'غیرفعال');
    } else {
      set('netType', 'پشتیبانی نمی‌شود');
      set('netSpeed', '—');
      set('netRtt', '—');
      set('netSave', '—');
    }
  },

  bindSensors() {
    document.getElementById('startCompass')?.addEventListener('click', () => {
      if (this._compassActive) {
        this.toast('قطب‌نما از قبل فعال است');
        return;
      }
      if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission().then(res => {
          if (res === 'granted') this.startCompass();
          else this.toast('دسترسی رد شد');
        }).catch(() => this.toast('خطا در درخواست دسترسی'));
      } else {
        this.startCompass();
      }
    });

    document.getElementById('startAcc')?.addEventListener('click', () => {
      if (this._accActive) {
        this.toast('شتاب‌سنج از قبل فعال است');
        return;
      }
      if (window.DeviceMotionEvent) {
        this._accActive = true;
        window.addEventListener('devicemotion', (e) => {
          const a = e.accelerationIncludingGravity || e.acceleration;
          if (a) {
            const elX = document.getElementById('accX');
            const elY = document.getElementById('accY');
            const elZ = document.getElementById('accZ');
            if (elX) elX.textContent = a.x?.toFixed(2) ?? '—';
            if (elY) elY.textContent = a.y?.toFixed(2) ?? '—';
            if (elZ) elZ.textContent = a.z?.toFixed(2) ?? '—';
          }
        });
        this.toast('شتاب‌سنج فعال شد');
      } else {
        this.toast('پشتیبانی نمی‌شود');
      }
    });

    document.getElementById('startOri')?.addEventListener('click', () => {
      if (this._oriActive) {
        this.toast('جهت‌گیری از قبل فعال است');
        return;
      }
      this._oriActive = true;
      window.addEventListener('deviceorientation', (e) => {
        const elA = document.getElementById('oriAlpha');
        const elB = document.getElementById('oriBeta');
        const elG = document.getElementById('oriGamma');
        if (elA) elA.textContent = e.alpha?.toFixed(1) ?? '—';
        if (elB) elB.textContent = e.beta?.toFixed(1) ?? '—';
        if (elG) elG.textContent = e.gamma?.toFixed(1) ?? '—';
      });
      this.toast('جهت‌گیری فعال شد');
    });
  },

  startCompass() {
    if (this._compassActive) return;
    this._compassActive = true;
    window.addEventListener('deviceorientation', (e) => {
      let heading = e.webkitCompassHeading ?? e.alpha;
      if (heading === null || heading === undefined) return;
      if (!e.webkitCompassHeading) {
        heading = 360 - heading; // Android
      }
      const dial = document.getElementById('compassDial');
      const deg = document.getElementById('compassDeg');
      const status = document.getElementById('compassStatus');
      if (dial) dial.style.transform = `rotate(${heading}deg)`;
      if (deg) deg.textContent = `${Math.round(heading)}°`;
      if (status) status.textContent = 'قطب‌نما فعال است';
    }, true);
    this.toast('قطب‌نما فعال شد — دستگاه را بچرخانید');
  },

  bindUtilities() {
    // Calculator
    let calcValue = '0';
    let calcPrev = null;
    let calcOp = null;
    let calcReset = false;

    const display = document.getElementById('calcDisplay');
    document.querySelectorAll('.calc-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const v = btn.dataset.val;
        if (v === 'C') {
          calcValue = '0'; calcPrev = null; calcOp = null;
        } else if (v === '±') {
          calcValue = String(parseFloat(calcValue) * -1);
        } else if (v === '%') {
          calcValue = String(parseFloat(calcValue) / 100);
        } else if (['+', '-', '*', '/'].includes(v)) {
          calcPrev = parseFloat(calcValue);
          calcOp = v;
          calcReset = true;
        } else if (v === '=') {
          if (calcOp && calcPrev !== null) {
            const cur = parseFloat(calcValue);
            let res = 0;
            if (calcOp === '+') res = calcPrev + cur;
            else if (calcOp === '-') res = calcPrev - cur;
            else if (calcOp === '*') res = calcPrev * cur;
            else if (calcOp === '/') res = cur !== 0 ? calcPrev / cur : 'خطا';
            calcValue = String(res);
            calcOp = null; calcPrev = null;
          }
        } else if (v === '.') {
          if (!calcValue.includes('.')) calcValue += '.';
        } else {
          if (calcReset || calcValue === '0') {
            calcValue = v;
            calcReset = false;
          } else {
            calcValue += v;
          }
        }
        display.textContent = calcValue;
      });
    });

    // Unit converter
    const units = {
      length: { m: 1, km: 0.001, cm: 100, mm: 1000, mi: 0.000621371, ft: 3.28084, in: 39.3701 },
      weight: { kg: 1, g: 1000, mg: 1000000, lb: 2.20462, oz: 35.274 },
      temp: { c: 'c', f: 'f', k: 'k' },
      data: { B: 1, KB: 1/1024, MB: 1/1048576, GB: 1/1073741824, TB: 1/1099511627776 }
    };

    const labels = {
      length: { m: 'متر', km: 'کیلومتر', cm: 'سانتی‌متر', mm: 'میلی‌متر', mi: 'مایل', ft: 'فوت', in: 'اینچ' },
      weight: { kg: 'کیلوگرم', g: 'گرم', mg: 'میلی‌گرم', lb: 'پوند', oz: 'اونس' },
      temp: { c: 'سلسیوس', f: 'فارنهایت', k: 'کلوین' },
      data: { B: 'بایت', KB: 'کیلوبایت', MB: 'مگابایت', GB: 'گیگابایت', TB: 'ترابایت' }
    };

    const fillUnits = () => {
      const type = document.getElementById('unitType').value;
      const from = document.getElementById('unitFrom');
      const to = document.getElementById('unitTo');
      from.innerHTML = ''; to.innerHTML = '';
      Object.keys(units[type]).forEach(k => {
        from.innerHTML += `<option value="${k}">${labels[type][k]}</option>`;
        to.innerHTML += `<option value="${k}">${labels[type][k]}</option>`;
      });
      to.selectedIndex = 1;
      convertUnit();
    };

    const convertUnit = () => {
      const type = document.getElementById('unitType').value;
      const val = parseFloat(document.getElementById('unitInput').value) || 0;
      const from = document.getElementById('unitFrom').value;
      const to = document.getElementById('unitTo').value;
      let result = 0;

      if (type === 'temp') {
        let celsius = val;
        if (from === 'f') celsius = (val - 32) * 5/9;
        else if (from === 'k') celsius = val - 273.15;
        if (to === 'c') result = celsius;
        else if (to === 'f') result = celsius * 9/5 + 32;
        else result = celsius + 273.15;
      } else {
        const base = val / units[type][from];
        result = base * units[type][to];
      }
      document.getElementById('unitResult').textContent = Number(result.toPrecision(8));
    };

    document.getElementById('unitType')?.addEventListener('change', fillUnits);
    document.getElementById('unitInput')?.addEventListener('input', convertUnit);
    document.getElementById('unitFrom')?.addEventListener('change', convertUnit);
    document.getElementById('unitTo')?.addEventListener('change', convertUnit);
    fillUnits();

    // Stopwatch
    let swInterval = null;
    let swMs = 0;
    let swRunning = false;

    const updateSW = () => {
      const h = String(Math.floor(swMs / 3600000)).padStart(2, '0');
      const m = String(Math.floor((swMs % 3600000) / 60000)).padStart(2, '0');
      const s = String(Math.floor((swMs % 60000) / 1000)).padStart(2, '0');
      document.getElementById('stopwatch').textContent = `${h}:${m}:${s}`;
    };

    document.getElementById('swStart')?.addEventListener('click', () => {
      if (swRunning) return;
      swRunning = true;
      const start = Date.now() - swMs;
      swInterval = setInterval(() => {
        swMs = Date.now() - start;
        updateSW();
      }, 100);
    });

    document.getElementById('swPause')?.addEventListener('click', () => {
      swRunning = false;
      clearInterval(swInterval);
    });

    document.getElementById('swReset')?.addEventListener('click', () => {
      swRunning = false;
      clearInterval(swInterval);
      swMs = 0;
      updateSW();
    });
  },

  bindSecurity() {
    const pwLen = document.getElementById('pwLength');
    const pwLenVal = document.getElementById('pwLenVal');
    if (pwLen) {
      if (!this.isPro()) {
        pwLen.max = 16;
        if (parseInt(pwLen.value, 10) > 16) pwLen.value = 16;
        if (pwLenVal) pwLenVal.textContent = pwLen.value;
      } else {
        pwLen.max = 64;
      }
      pwLen.addEventListener('input', (e) => {
        let v = parseInt(e.target.value, 10) || 6;
        if (!this.isPro() && v > 16) {
          v = 16;
          e.target.value = 16;
          this.toast('بیش از ۱۶ کاراکتر مخصوص Pro است');
        }
        if (pwLenVal) pwLenVal.textContent = v;
      });
    }

    document.getElementById('genPassword')?.addEventListener('click', () => {
      let len = parseInt(document.getElementById('pwLength').value);
      if (!this.isPro() && len > 16) {
        this.toast('رمز بالای ۱۶ کاراکتر مخصوص Pro است');
        this.navigate('premium');
        return;
      }
      let chars = '';
      if (document.getElementById('pwUpper').checked) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      if (document.getElementById('pwLower').checked) chars += 'abcdefghijklmnopqrstuvwxyz';
      if (document.getElementById('pwNum').checked) chars += '0123456789';
      if (document.getElementById('pwSym').checked) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
      if (!chars) { this.toast('حداقل یک گزینه را انتخاب کنید'); return; }
      let pw = '';
      const arr = new Uint32Array(len);
      crypto.getRandomValues(arr);
      for (let i = 0; i < len; i++) pw += chars[arr[i] % chars.length];
      document.getElementById('pwResult').textContent = pw;
    });

    document.getElementById('copyPassword')?.addEventListener('click', () => {
      const pw = document.getElementById('pwResult').textContent;
      if (pw && pw !== 'رمز اینجا نمایش داده می‌شود') {
        navigator.clipboard.writeText(pw);
        this.toast('رمز کپی شد');
      }
    });

    document.getElementById('pwCheck')?.addEventListener('input', (e) => {
      const pw = e.target.value;
      let score = 0;
      if (pw.length >= 8) score += 20;
      if (pw.length >= 12) score += 15;
      if (pw.length >= 16) score += 15;
      if (/[a-z]/.test(pw)) score += 15;
      if (/[A-Z]/.test(pw)) score += 15;
      if (/[0-9]/.test(pw)) score += 10;
      if (/[^a-zA-Z0-9]/.test(pw)) score += 10;
      score = Math.min(100, score);
      document.getElementById('pwStrengthBar').style.width = `${score}%`;
      let text = 'ضعیف', color = 'var(--danger)';
      if (score >= 80) { text = 'عالی'; color = 'var(--success)'; }
      else if (score >= 60) { text = 'خوب'; color = 'var(--accent)'; }
      else if (score >= 40) { text = 'متوسط'; color = 'var(--warning)'; }
      document.getElementById('pwStrengthText').textContent = text;
      document.getElementById('pwStrengthText').style.color = color;
      document.getElementById('pwStrengthBar').style.background = color;
    });
    this.bindDigitalSignature();
  },

  // ——— امضای دیجیتال (ECDSA P-256) ———
  _dsKeys: null,
  _dsVerifyKey: null,

  async _dsEnsureCrypto() {
    if (!window.crypto || !window.crypto.subtle) {
      this.toast('Web Crypto در این مرورگر پشتیبانی نمی‌شود');
      return false;
    }
    return true;
  },

  async _dsBufToB64(buf) {
    const bytes = new Uint8Array(buf);
    let s = '';
    for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return btoa(s);
  },

  _dsB64ToBuf(b64) {
    const s = atob(b64.replace(/\s+/g, ''));
    const bytes = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i);
    return bytes.buffer;
  },

  async _dsExportPublic(key) {
    const spki = await crypto.subtle.exportKey('spki', key);
    return this._dsBufToB64(spki);
  },

  async _dsImportPublic(b64) {
    const buf = this._dsB64ToBuf(b64.trim());
    return crypto.subtle.importKey(
      'spki',
      buf,
      { name: 'ECDSA', namedCurve: 'P-256' },
      true,
      ['verify']
    );
  },

  _dsUpdateKeyStatus() {
    const el = document.getElementById('dsKeyStatus');
    if (!el) return;
    if (this._dsKeys) el.innerHTML = '<span class="badge badge-success">آماده</span>';
    else el.innerHTML = '<span class="badge badge-warning">ندارد</span>';
  },

  bindDigitalSignature() {
    const self = this;
    this._dsUpdateKeyStatus();

    document.getElementById('dsGenKeys')?.addEventListener('click', async () => {
      if (!(await self._dsEnsureCrypto())) return;
      try {
        self._dsKeys = await crypto.subtle.generateKey(
          { name: 'ECDSA', namedCurve: 'P-256' },
          true,
          ['sign', 'verify']
        );
        const pub = await self._dsExportPublic(self._dsKeys.publicKey);
        const pubEl = document.getElementById('dsPublicKey');
        if (pubEl) pubEl.value = pub;
        self._dsVerifyKey = self._dsKeys.publicKey;
        self._dsUpdateKeyStatus();
        self.toast('جفت‌کلید ساخته شد');
      } catch (e) {
        self.toast('خطا در تولید کلید');
      }
    });

    document.getElementById('dsClearKeys')?.addEventListener('click', () => {
      self._dsKeys = null;
      self._dsVerifyKey = null;
      const a = document.getElementById('dsPublicKey');
      const b = document.getElementById('dsSignature');
      const c = document.getElementById('dsVerifyResult');
      if (a) a.value = '';
      if (b) b.value = '';
      if (c) c.textContent = '';
      self._dsUpdateKeyStatus();
      self.toast('کلیدها پاک شد');
    });

    document.getElementById('dsSignBtn')?.addEventListener('click', async () => {
      if (!(await self._dsEnsureCrypto())) return;
      if (!self._dsKeys || !self._dsKeys.privateKey) {
        self.toast('ابتدا جفت‌کلید بسازید');
        return;
      }
      const msg = document.getElementById('dsMessage')?.value || '';
      if (!msg.trim()) { self.toast('متن را وارد کنید'); return; }
      try {
        const data = new TextEncoder().encode(msg);
        const sig = await crypto.subtle.sign(
          { name: 'ECDSA', hash: 'SHA-256' },
          self._dsKeys.privateKey,
          data
        );
        const b64 = await self._dsBufToB64(sig);
        const el = document.getElementById('dsSignature');
        if (el) el.value = b64;
        const res = document.getElementById('dsVerifyResult');
        if (res) { res.textContent = 'امضا ساخته شد'; res.style.color = 'var(--success)'; }
        self.toast('امضا ساخته شد');
      } catch (e) {
        self.toast('خطا در امضا');
      }
    });

    document.getElementById('dsVerifyBtn')?.addEventListener('click', async () => {
      if (!(await self._dsEnsureCrypto())) return;
      const msg = document.getElementById('dsMessage')?.value || '';
      const sigB64 = (document.getElementById('dsSignature')?.value || '').trim();
      const resEl = document.getElementById('dsVerifyResult');
      if (!msg.trim() || !sigB64) {
        self.toast('متن و امضا لازم است');
        return;
      }
      let key = self._dsVerifyKey;
      if (!key && self._dsKeys) key = self._dsKeys.publicKey;
      if (!key) {
        self.toast('کلید عمومی برای بررسی وجود ندارد');
        return;
      }
      try {
        const data = new TextEncoder().encode(msg);
        const sigBuf = self._dsB64ToBuf(sigB64);
        const ok = await crypto.subtle.verify(
          { name: 'ECDSA', hash: 'SHA-256' },
          key,
          sigBuf,
          data
        );
        if (resEl) {
          resEl.textContent = ok ? '✓ امضا معتبر است' : '✗ امضا نامعتبر است';
          resEl.style.color = ok ? 'var(--success)' : 'var(--danger)';
        }
        self.toast(ok ? 'امضا معتبر' : 'امضا نامعتبر');
      } catch (e) {
        if (resEl) {
          resEl.textContent = '✗ خطا در بررسی (فرمت امضا یا کلید)';
          resEl.style.color = 'var(--danger)';
        }
        self.toast('خطا در بررسی امضا');
      }
    });

    document.getElementById('dsCopyPub')?.addEventListener('click', () => {
      const v = document.getElementById('dsPublicKey')?.value || '';
      if (!v) { self.toast('کلید عمومی خالی است'); return; }
      navigator.clipboard.writeText(v).then(() => self.toast('کلید عمومی کپی شد')).catch(() => self.toast(v.slice(0, 40) + '...'));
    });

    document.getElementById('dsUseImportPub')?.addEventListener('click', async () => {
      if (!(await self._dsEnsureCrypto())) return;
      const b64 = (document.getElementById('dsImportPub')?.value || '').trim();
      if (!b64) { self.toast('کلید عمومی را وارد کنید'); return; }
      try {
        self._dsVerifyKey = await self._dsImportPublic(b64);
        self.toast('کلید عمومی برای بررسی تنظیم شد');
        const st = document.getElementById('dsKeyStatus');
        if (st && !self._dsKeys) st.innerHTML = '<span class="badge badge-info">فقط بررسی</span>';
      } catch (e) {
        self.toast('کلید عمومی نامعتبر است');
      }
    });
  },

  bindMedia() {
    const picker = document.getElementById('colorPicker');
    const updateColor = () => {
      const hex = picker.value;
      document.getElementById('colorPreview').style.background = hex;
      document.getElementById('colorHex').textContent = hex;
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      document.getElementById('colorRgb').textContent = `${r}, ${g}, ${b}`;
      // HSL
      const r1 = r/255, g1 = g/255, b1 = b/255;
      const max = Math.max(r1,g1,b1), min = Math.min(r1,g1,b1);
      let h, s, l = (max+min)/2;
      if (max === min) { h = s = 0; }
      else {
        const d = max - min;
        s = l > 0.5 ? d/(2-max-min) : d/(max+min);
        switch(max) {
          case r1: h = ((g1-b1)/d + (g1<b1 ? 6:0))/6; break;
          case g1: h = ((b1-r1)/d + 2)/6; break;
          case b1: h = ((r1-g1)/d + 4)/6; break;
        }
      }
      document.getElementById('colorHsl').textContent = `${Math.round(h*360)}, ${Math.round(s*100)}%, ${Math.round(l*100)}%`;
    };
    picker?.addEventListener('input', updateColor);
    updateColor();

    document.getElementById('copyColor')?.addEventListener('click', () => {
      navigator.clipboard.writeText(picker.value);
      this.toast('رنگ کپی شد');
    });

    document.getElementById('genQR')?.addEventListener('click', () => {
      const text = document.getElementById('qrText').value.trim();
      if (!text) { this.toast('متنی وارد کنید'); return; }
      // Simple QR using Google Charts API (works offline? no, but simple)
      const url = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`;
      document.getElementById('qrResult').innerHTML = `
        <img src="${url}" alt="QR Code" style="border-radius:12px;max-width:200px" />
        <p style="font-size:0.8rem;color:var(--text-secondary);margin-top:8px">QR Code تولید شد</p>
      `;
    });
  },

  // ========== HELPERS ==========


  bindText() {
    this.renderNotes();
    document.getElementById('newNoteBtn')?.addEventListener('click', () => this.editNote(null));
    document.getElementById('exportNotesBtn')?.addEventListener('click', () => {
      if (!this.requirePro('خروجی یادداشت')) return;
      const notes = this.getNotes();
      const blob = new Blob([JSON.stringify(notes, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'mobile-toolkit-notes.json';
      a.click();
      this.toast('دانلود شد');
    });
    document.getElementById('textCountInput')?.addEventListener('input', (e) => {
      const t = e.target.value;
      document.getElementById('tcChars').textContent = t.length;
      document.getElementById('tcWords').textContent = t.trim() ? t.trim().split(/\s+/).length : 0;
      document.getElementById('tcLines').textContent = t ? t.split('\n').length : 0;
      document.getElementById('tcSpaces').textContent = (t.match(/ /g) || []).length;
    });
    const setCase = (fn) => {
      const v = document.getElementById('caseInput')?.value || '';
      document.getElementById('caseOutput').value = fn(v);
    };
    document.getElementById('toUpper')?.addEventListener('click', () => setCase(s => s.toUpperCase()));
    document.getElementById('toLower')?.addEventListener('click', () => setCase(s => s.toLowerCase()));
    document.getElementById('toTitle')?.addEventListener('click', () => setCase(s => s.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())));
    document.getElementById('toInvert')?.addEventListener('click', () => setCase(s => [...s].map(c => c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()).join('')));
  },

  getNotes() {
    try { return JSON.parse(localStorage.getItem('mt-notes') || '[]'); } catch { return []; }
  },
  saveNotes(notes) { localStorage.setItem('mt-notes', JSON.stringify(notes)); },
  renderNotes() {
    const list = document.getElementById('notesList');
    if (!list) return;
    const notes = this.getNotes();
    if (!notes.length) {
      list.innerHTML = '<p style="text-align:center;color:var(--text-secondary);font-size:0.85rem;padding:16px">یادداشتی نیست</p>';
      return;
    }
    list.innerHTML = notes.map((n, i) => `
      <div class="note-item" data-idx="${i}">
        <div class="note-title">${this.escapeHtml(n.title || 'بدون عنوان')}</div>
        <div class="note-preview">${this.escapeHtml(n.body || '')}</div>
        <div class="note-date">${n.date || ''}</div>
      </div>`).join('');
    list.querySelectorAll('.note-item').forEach(el => {
      el.addEventListener('click', () => this.editNote(parseInt(el.dataset.idx)));
    });
  },
  editNote(idx) {
    const notes = this.getNotes();
    const note = idx !== null ? notes[idx] : { title: '', body: '' };
    this.showModal(idx !== null ? 'ویرایش یادداشت' : 'یادداشت جدید', `
      <input type="text" class="input" id="noteTitle" placeholder="عنوان" value="${this.escapeHtml(note.title || '')}" />
      <textarea class="textarea" id="noteBody" placeholder="متن..." style="margin-top:10px;min-height:140px">${this.escapeHtml(note.body || '')}</textarea>
      <div class="grid-2" style="margin-top:12px">
        <button class="btn" id="noteSave">ذخیره</button>
        ${idx !== null ? '<button class="btn btn-outline" id="noteDelete" style="color:var(--danger);border-color:var(--danger)">حذف</button>' : '<div></div>'}
      </div>`);
    setTimeout(() => {
      document.getElementById('noteSave')?.addEventListener('click', () => {
        const title = document.getElementById('noteTitle').value.trim();
        const body = document.getElementById('noteBody').value;
        const date = new Date().toLocaleDateString('fa-IR');
        if (idx !== null) notes[idx] = { title, body, date };
        else {
          if (!this.isPro() && notes.length >= 3) {
            this.toast('برای یادداشت بیشتر، نسخه Pro را فعال کنید');
            this.navigate('premium');
            return;
          }
          notes.unshift({ title, body, date });
        }
        this.saveNotes(notes);
        document.querySelector('.modal-overlay')?.remove();
        this.renderNotes();
        this.toast('ذخیره شد');
      });
      document.getElementById('noteDelete')?.addEventListener('click', () => {
        notes.splice(idx, 1);
        this.saveNotes(notes);
        document.querySelector('.modal-overlay')?.remove();
        this.renderNotes();
        this.toast('حذف شد');
      });
    }, 50);
  },

  bindHealth() {
    let pomoMs = 25 * 60 * 1000, pomoLeft = pomoMs, pomoTimer = null, pomoRunning = false;
    const updatePomo = () => {
      const m = String(Math.floor(pomoLeft / 60000)).padStart(2, '0');
      const s = String(Math.floor((pomoLeft % 60000) / 1000)).padStart(2, '0');
      const el = document.getElementById('pomoDisplay');
      if (el) el.textContent = m + ':' + s;
    };
    document.getElementById('pomoStart')?.addEventListener('click', () => {
      if (pomoRunning) return;
      pomoRunning = true;
      const start = Date.now(), initial = pomoLeft;
      pomoTimer = setInterval(() => {
        pomoLeft = Math.max(0, initial - (Date.now() - start));
        updatePomo();
        if (pomoLeft <= 0) { clearInterval(pomoTimer); pomoRunning = false; this.doVibrate(); this.toast('زمان تمام شد!'); }
      }, 200);
    });
    document.getElementById('pomoPause')?.addEventListener('click', () => { pomoRunning = false; clearInterval(pomoTimer); });
    document.getElementById('pomoReset')?.addEventListener('click', () => { pomoRunning = false; clearInterval(pomoTimer); pomoLeft = pomoMs; updatePomo(); });
    document.getElementById('pomoFocus')?.addEventListener('click', () => {
      pomoRunning = false; clearInterval(pomoTimer); pomoMs = 25*60*1000; pomoLeft = pomoMs;
      const m = document.getElementById('pomoMode'); if (m) m.textContent = 'تمرکز'; updatePomo();
    });
    document.getElementById('pomoBreak')?.addEventListener('click', () => {
      pomoRunning = false; clearInterval(pomoTimer); pomoMs = 5*60*1000; pomoLeft = pomoMs;
      const m = document.getElementById('pomoMode'); if (m) m.textContent = 'استراحت'; updatePomo();
    });
    document.getElementById('pomoCustom')?.addEventListener('click', () => {
      if (!this.isPro()) {
        this.toast('پومودورو سفارشی مخصوص Pro است');
        this.navigate('premium');
        return;
      }
      const input = document.getElementById('pomoCustomMins');
      const mins = parseInt(input && input.value, 10);
      if (!mins || mins < 1 || mins > 180) {
        this.toast('عدد بین ۱ تا ۱۸۰ وارد کنید');
        return;
      }
      pomoRunning = false; clearInterval(pomoTimer);
      pomoMs = mins * 60 * 1000; pomoLeft = pomoMs;
      const m = document.getElementById('pomoMode'); if (m) m.textContent = 'سفارشی ' + mins + 'د';
      updatePomo();
    });
    document.getElementById('bmiCalc')?.addEventListener('click', () => {
      const h = parseFloat(document.getElementById('bmiHeight').value) / 100;
      const w = parseFloat(document.getElementById('bmiWeight').value);
      if (!h || !w || h <= 0) { this.toast('مقادیر معتبر وارد کنید'); return; }
      const bmi = w / (h * h);
      let label = '', color = '';
      if (bmi < 18.5) { label = 'کمبود وزن'; color = 'var(--accent)'; }
      else if (bmi < 25) { label = 'طبیعی'; color = 'var(--success)'; }
      else if (bmi < 30) { label = 'اضافه وزن'; color = 'var(--warning)'; }
      else { label = 'چاق'; color = 'var(--danger)'; }
      document.getElementById('bmiResult').style.display = 'block';
      document.getElementById('bmiNum').textContent = bmi.toFixed(1);
      document.getElementById('bmiNum').style.color = color;
      document.getElementById('bmiLabel').textContent = label;
      document.getElementById('bmiLabel').style.color = color;
    });
  },



  getSubs() {
    try { return JSON.parse(localStorage.getItem('mt-subs') || '[]'); } catch { return []; }
  },
  saveSubs(list) {
    localStorage.setItem('mt-subs', JSON.stringify(list));
  },

  bindSubs() {
    this.renderSubs();
    document.getElementById('subAddBtn')?.addEventListener('click', () => this.addSub());
    document.getElementById('subExportBtn')?.addEventListener('click', () => {
      if (!this.isPro() && this.getSubs().length > 0) {
        // export allowed for all small data, or require pro for large - allow all
      }
      const list = this.getSubs();
      const blob = new Blob([JSON.stringify(list, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'subscriptions.json';
      a.click();
      this.toast('خروجی دانلود شد');
    });
    document.getElementById('subClearBtn')?.addEventListener('click', () => {
      if (!confirm('همه اشتراک‌ها پاک شوند؟')) return;
      this.saveSubs([]);
      this.renderSubs();
      this.toast('پاک شد');
    });
  },

  addSub() {
    const name = (document.getElementById('subName')?.value || '').trim();
    const price = parseFloat(document.getElementById('subPrice')?.value) || 0;
    const cycle = document.getElementById('subCycle')?.value || 'monthly';
    const renew = document.getElementById('subRenew')?.value || '';
    const note = (document.getElementById('subNote')?.value || '').trim();
    if (!name) { this.toast('نام سرویس را وارد کنید'); return; }
    if (price <= 0) { this.toast('مبلغ معتبر وارد کنید'); return; }

    const list = this.getSubs();
    // Free: max 5 subscriptions, Pro: unlimited
    if (!this.isPro() && list.length >= 5) {
      this.toast('بیش از ۵ اشتراک نیاز به Pro دارد');
      this.navigate('premium');
      return;
    }

    list.unshift({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name, price, cycle, renew, note,
      created: new Date().toISOString()
    });
    this.saveSubs(list);
    document.getElementById('subName').value = '';
    document.getElementById('subPrice').value = '';
    document.getElementById('subNote').value = '';
    document.getElementById('subRenew').value = '';
    this.renderSubs();
    this.toast('اشتراک اضافه شد');
  },

  deleteSub(id) {
    let list = this.getSubs().filter(s => s.id !== id);
    this.saveSubs(list);
    this.renderSubs();
    this.toast('حذف شد');
  },

  renderSubs() {
    const list = this.getSubs();
    const listEl = document.getElementById('subsList');
    if (!listEl) return;

    // Summary
    let monthly = 0;
    let soon = 0;
    const now = new Date();
    const in7 = new Date(now.getTime() + 7 * 86400000);

    list.forEach(s => {
      if (s.cycle === 'monthly') monthly += s.price;
      else if (s.cycle === 'yearly') monthly += s.price / 12;
      else if (s.cycle === 'weekly') monthly += s.price * 4.33;
      if (s.renew) {
        const d = new Date(s.renew);
        if (d >= now && d <= in7) soon++;
      }
    });
    const yearly = monthly * 12;
    const fmt = (n) => Math.round(n).toLocaleString('fa-IR');

    const elM = document.getElementById('subsMonthly');
    const elY = document.getElementById('subsYearly');
    const elC = document.getElementById('subsCount');
    const elS = document.getElementById('subsSoon');
    if (elM) elM.textContent = fmt(monthly);
    if (elY) elY.textContent = fmt(yearly);
    if (elC) elC.textContent = list.length.toLocaleString('fa-IR');
    if (elS) elS.textContent = soon.toLocaleString('fa-IR');

    if (!list.length) {
      listEl.innerHTML = '<div class="card"><p style="text-align:center;color:var(--text-secondary);font-size:0.85rem;padding:12px">اشتراکی ثبت نشده</p></div>';
      return;
    }

    const cycleLabel = { monthly: 'ماهانه', yearly: 'سالانه', weekly: 'هفتگی' };
    listEl.innerHTML = list.map(s => {
      let renewBadge = '';
      if (s.renew) {
        const d = new Date(s.renew);
        const days = Math.ceil((d - now) / 86400000);
        if (days < 0) renewBadge = '<span class="badge badge-danger">منقضی</span>';
        else if (days <= 7) renewBadge = '<span class="badge badge-warning">' + days + ' روز مانده</span>';
        else renewBadge = '<span class="badge badge-info">' + d.toLocaleDateString('fa-IR') + '</span>';
      }
      return `
        <div class="card" style="margin-bottom:10px">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
            <div style="flex:1">
              <div style="font-weight:600;font-size:0.95rem">${this.escapeHtml(s.name)}</div>
              <div style="font-size:0.8rem;color:var(--text-secondary);margin-top:4px">
                ${fmt(s.price)} تومان · ${cycleLabel[s.cycle] || s.cycle}
              </div>
              ${s.note ? '<div style="font-size:0.75rem;color:var(--text-secondary);margin-top:4px">' + this.escapeHtml(s.note) + '</div>' : ''}
              <div style="margin-top:8px">${renewBadge}</div>
            </div>
            <button class="btn btn-sm btn-outline sub-del" data-id="${s.id}" style="color:var(--danger);border-color:var(--danger);flex-shrink:0">حذف</button>
          </div>
        </div>`;
    }).join('');

    listEl.querySelectorAll('.sub-del').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('این اشتراک حذف شود؟')) this.deleteSub(btn.dataset.id);
      });
    });
  },

  bindPremium() {
    const self = this;

    const copyBtn = document.getElementById('copyCardBtn');
    if (copyBtn) {
      copyBtn.addEventListener('click', function() {
        const num = '5894631129342159';
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(num).then(function() {
            self.toast('شماره کارت کپی شد');
          }).catch(function() {
            self.toast(num);
          });
        } else {
          self.toast(num);
        }
      });
    }

    const actBtn = document.getElementById('activateProBtn');
    if (actBtn) {
      actBtn.addEventListener('click', function() {
        const input = document.getElementById('proCodeInput');
        const code = ((input && input.value) || '').trim();
        if (!code) {
          self.toast('کد را وارد کنید');
          return;
        }
        const res = self.redeemLicenseCode(code);
        self.toast(res.msg + (res.ok ? ' ⭐' : ''));
        if (res.ok) setTimeout(function() { self.navigate('premium'); }, 350);
      });
    }

    // پنل ادمین: تولید کد فقط بعد از پرداخت
    const adminLogin = document.getElementById('adminLoginBtn');
    if (adminLogin) {
      adminLogin.addEventListener('click', function() {
        const pass = (document.getElementById('adminPassInput') && document.getElementById('adminPassInput').value) || '';
        if (pass !== self._adminPass) {
          self.toast('رمز ادمین اشتباه است');
          return;
        }
        sessionStorage.setItem('mt-admin', '1');
        self.toast('ورود ادمین موفق');
        self.navigate('premium');
      });
    }
    const genBtn = document.getElementById('genLicenseBtn');
    if (genBtn) {
      genBtn.addEventListener('click', function() {
        if (sessionStorage.getItem('mt-admin') !== '1') {
          self.toast('ابتدا وارد پنل ادمین شوید');
          return;
        }
        const monthsEl = document.getElementById('licenseMonths');
        const months = monthsEl ? monthsEl.value : 12;
        const code = self.generateLicenseCode(months);
        const out = document.getElementById('genLicenseOut');
        if (out) out.textContent = code;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(code).then(function() {
            self.toast('کد تولید و کپی شد');
          }).catch(function() { self.toast('کد: ' + code); });
        } else {
          self.toast('کد: ' + code);
        }
      });
    }
    const adminLogout = document.getElementById('adminLogoutBtn');
    if (adminLogout) {
      adminLogout.addEventListener('click', function() {
        sessionStorage.removeItem('mt-admin');
        self.toast('خروج از ادمین');
        self.navigate('premium');
      });
    }

    const deact = document.getElementById('deactivateProBtn');
    if (deact) {
      deact.addEventListener('click', function() {
        if (!confirm('Pro روی این دستگاه لغو شود؟')) return;
        self.clearLicense();
        self.toast('Pro لغو شد');
        setTimeout(function() { self.navigate('premium'); }, 300);
      });
    }

    const expNotes = document.getElementById('exportNotesPro');
    if (expNotes) {
      expNotes.addEventListener('click', function() {
        if (!self.isPro()) {
          self.toast('این قابلیت مخصوص Pro است');
          return;
        }
        try {
          const notes = self.getNotes();
          const blob = new Blob([JSON.stringify(notes, null, 2)], { type: 'application/json' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = 'mobile-toolkit-notes.json';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          self.toast('دانلود شد');
        } catch (e) {
          self.toast('خطا در خروجی');
        }
      });
    }

    document.querySelectorAll('#mainContent [data-goto]').forEach(function(el) {
      el.addEventListener('click', function() {
        self.navigate(el.getAttribute('data-goto'));
      });
    });
  },

  bindSettings() {
    document.getElementById('setThemeToggle')?.addEventListener('click', () => this.toggleTheme());
    document.getElementById('clearNotes')?.addEventListener('click', () => {
      if (confirm('همه یادداشت‌ها پاک شوند؟')) { localStorage.removeItem('mt-notes'); this.toast('پاک شد'); }
    });
    document.getElementById('clearAllData')?.addEventListener('click', () => {
      if (confirm('تمام داده‌ها پاک شوند؟')) {
        localStorage.removeItem('mt-notes'); localStorage.removeItem('mt-theme'); localStorage.removeItem('mt-install-dismissed'); localStorage.removeItem('mt-pro'); localStorage.removeItem('mt-pro-expires'); localStorage.removeItem('mt-pro-code'); localStorage.removeItem('mt-pro-activated'); localStorage.removeItem('mt-subs');
        this.toast('پاک شد');
      }
    });
  },
  /* ============================================================
   v1.2.1 — صفحات جدید
   ============================================================ */

// ==================== 💰 FINANCE ====================
pageFinance() {
  return `
    <div class="card" style="background:linear-gradient(135deg,#065f46,#1e3a5f);border-color:#10b981;text-align:center;padding:20px 16px">
      <div style="font-size:2rem;margin-bottom:6px">💰</div>
      <h2 style="font-size:1.15rem">مدیریت بودجه</h2>
      <p style="color:var(--text-secondary);font-size:0.8rem;margin-top:4px">درآمد و هزینه‌های روزانه</p>
    </div>

    <div class="section-title">خلاصه</div>
    <div class="stat-grid">
      <div class="stat-item"><div class="num" style="color:var(--success)" id="finIncome">۰</div><div class="txt">درآمد</div></div>
      <div class="stat-item"><div class="num" style="color:var(--danger)" id="finExpense">۰</div><div class="txt">هزینه</div></div>
      <div class="stat-item"><div class="num" id="finBalance">۰</div><div class="txt">موجودی</div></div>
      <div class="stat-item"><div class="num" id="finCount">۰</div><div class="txt">تراکنش</div></div>
    </div>

    <div class="section-title">افزودن تراکنش</div>
    <div class="card">
      <div class="input-group"><label>عنوان</label>
        <input type="text" class="input" id="finTitle" placeholder="مثلاً حقوق، خرید نان" /></div>
      <div class="grid-2">
        <div class="input-group"><label>مبلغ (تومان)</label>
          <input type="number" class="input" id="finAmount" placeholder="100000" /></div>
        <div class="input-group"><label>نوع</label>
          <select class="select" id="finType">
            <option value="income">درآمد</option>
            <option value="expense" selected>هزینه</option>
          </select></div>
      </div>
      <button class="btn" id="finAddBtn">+ افزودن</button>
    </div>

    <div class="section-title">لیست تراکنش‌ها</div>
    <div id="finList"></div>

    <button class="btn btn-outline" id="finClearBtn" style="margin-top:8px;color:var(--danger);border-color:var(--danger)">پاک کردن همه</button>
  `;
},

getFinance() {
  try { return JSON.parse(localStorage.getItem('mt-finance') || '[]'); } catch { return []; }
},
saveFinance(list) { localStorage.setItem('mt-finance', JSON.stringify(list)); },

bindFinance() {
  this.renderFinance();
  document.getElementById('finAddBtn')?.addEventListener('click', () => {
    const title = (document.getElementById('finTitle')?.value || '').trim();
    const amount = parseFloat(document.getElementById('finAmount')?.value) || 0;
    const type = document.getElementById('finType')?.value || 'expense';
    if (!title) { this.toast('عنوان را وارد کنید'); return; }
    if (amount <= 0) { this.toast('مبلغ معتبر وارد کنید'); return; }
    const list = this.getFinance();
    list.unshift({ id: Date.now().toString(36), title, amount, type, date: new Date().toISOString() });
    this.saveFinance(list);
    document.getElementById('finTitle').value = '';
    document.getElementById('finAmount').value = '';
    this.renderFinance();
    this.toast('ثبت شد');
  });
  document.getElementById('finClearBtn')?.addEventListener('click', () => {
    if (!confirm('همه تراکنش‌ها پاک شوند؟')) return;
    this.saveFinance([]);
    this.renderFinance();
    this.toast('پاک شد');
  });
},

renderFinance() {
  const list = this.getFinance();
  let income = 0, expense = 0;
  list.forEach(t => t.type === 'income' ? income += t.amount : expense += t.amount);
  const fmt = n => Math.round(n).toLocaleString('fa-IR');
  const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
  set('finIncome', fmt(income));
  set('finExpense', fmt(expense));
  set('finBalance', fmt(income - expense));
  set('finCount', list.length.toLocaleString('fa-IR'));

  const listEl = document.getElementById('finList');
  if (!listEl) return;
  if (!list.length) {
    listEl.innerHTML = '<div class="card"><p style="text-align:center;color:var(--text-secondary);font-size:0.85rem;padding:12px">تراکنشی ثبت نشده</p></div>';
    return;
  }
  listEl.innerHTML = list.map(t => {
    const isInc = t.type === 'income';
    const d = new Date(t.date);
    const dateStr = d.toLocaleDateString('fa-IR');
    return `
      <div class="fin-item ${isInc ? 'income' : 'expense'}">
        <div class="fin-icon">${isInc ? '↘' : '↗'}</div>
        <div class="fin-info">
          <div class="fin-title">${this.escapeHtml(t.title)}</div>
          <div class="fin-date">${dateStr}</div>
        </div>
        <div class="fin-amount">${isInc ? '+' : '−'}${fmt(t.amount)}</div>
        <button class="fin-del" data-id="${t.id}">✕</button>
      </div>`;
  }).join('');
  listEl.querySelectorAll('.fin-del').forEach(btn => {
    btn.addEventListener('click', () => {
      const list2 = this.getFinance().filter(x => x.id !== btn.dataset.id);
      this.saveFinance(list2);
      this.renderFinance();
    });
  });
},

// ==================== ✅ TODO ====================
pageTodo() {
  return `
    <div class="card" style="background:linear-gradient(135deg,#1e3a5f,#4c1d95);border-color:#8b5cf6;text-align:center;padding:20px 16px">
      <div style="font-size:2rem;margin-bottom:6px">✅</div>
      <h2 style="font-size:1.15rem">کارهای من</h2>
      <p style="color:var(--text-secondary);font-size:0.8rem;margin-top:4px">لیست کارها و برنامه‌ریزی</p>
    </div>

    <div class="section-title">افزودن کار</div>
    <div class="card">
      <div class="input-group"><label>عنوان</label>
        <input type="text" class="input" id="todoTitle" placeholder="مثلاً: تماس با مشتری" /></div>
      <div class="input-group"><label>اولویت</label>
        <select class="select" id="todoPrio">
          <option value="low">پایین</option>
          <option value="mid" selected>متوسط</option>
          <option value="high">بالا</option>
        </select></div>
      <button class="btn" id="todoAddBtn">+ افزودن</button>
    </div>

    <div class="section-title">لیست</div>
    <div class="todo-filters">
      <button data-filter="all" class="active">همه</button>
      <button data-filter="active">فعال</button>
      <button data-filter="done">انجام‌شده</button>
    </div>
    <div id="todoList"></div>
  `;
},

getTodos() {
  try { return JSON.parse(localStorage.getItem('mt-todos') || '[]'); } catch { return []; }
},
saveTodos(list) { localStorage.setItem('mt-todos', JSON.stringify(list)); },

bindTodo() {
  this._todoFilter = 'all';
  this.renderTodos();
  document.getElementById('todoAddBtn')?.addEventListener('click', () => {
    const title = (document.getElementById('todoTitle')?.value || '').trim();
    const prio = document.getElementById('todoPrio')?.value || 'mid';
    if (!title) { this.toast('عنوان را وارد کنید'); return; }
    const list = this.getTodos();
    list.unshift({ id: Date.now().toString(36), title, prio, done: false, created: Date.now() });
    this.saveTodos(list);
    document.getElementById('todoTitle').value = '';
    this.renderTodos();
    this.toast('اضافه شد');
  });
  document.querySelectorAll('.todo-filters button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.todo-filters button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      this._todoFilter = btn.dataset.filter;
      this.renderTodos();
    });
  });
},

renderTodos() {
  const listEl = document.getElementById('todoList');
  if (!listEl) return;
  const filter = this._todoFilter || 'all';
  let list = this.getTodos();
  if (filter === 'active') list = list.filter(t => !t.done);
  if (filter === 'done') list = list.filter(t => t.done);

  if (!list.length) {
    listEl.innerHTML = '<div class="card"><p style="text-align:center;color:var(--text-secondary);font-size:0.85rem;padding:12px">کاری نیست</p></div>';
    return;
  }
  const prioLabels = { low: 'پایین', mid: 'متوسط', high: 'بالا' };
  listEl.innerHTML = list.map(t => `
    <div class="todo-item ${t.done ? 'done' : ''}">
      <button class="todo-check" data-id="${t.id}" data-act="toggle"></button>
      <div class="todo-body">
        <div class="todo-title">${this.escapeHtml(t.title)}</div>
        <div class="todo-meta">
          <span class="todo-prio prio-${t.prio}">${prioLabels[t.prio]}</span>
        </div>
      </div>
      <button class="todo-del" data-id="${t.id}" data-act="del">✕</button>
    </div>
  `).join('');
  listEl.querySelectorAll('[data-act]').forEach(el => {
    el.addEventListener('click', () => {
      const list2 = this.getTodos();
      const i = list2.findIndex(x => x.id === el.dataset.id);
      if (i === -1) return;
      if (el.dataset.act === 'toggle') list2[i].done = !list2[i].done;
      else if (el.dataset.act === 'del') list2.splice(i, 1);
      this.saveTodos(list2);
      this.renderTodos();
    });
  });
},

// ==================== 🔥 HABIT ====================
pageHabit() {
  return `
    <div class="card" style="background:linear-gradient(135deg,#7c2d12,#1e3a5f);border-color:#f97316;text-align:center;padding:20px 16px">
      <div style="font-size:2rem;margin-bottom:6px">🔥</div>
      <h2 style="font-size:1.15rem">ردیاب عادت</h2>
      <p style="color:var(--text-secondary);font-size:0.8rem;margin-top:4px">هر روز کلیک کن، استریک بساز</p>
    </div>

    <div class="section-title">افزودن عادت</div>
    <div class="card">
      <div class="input-group"><label>نام عادت</label>
        <input type="text" class="input" id="habitName" placeholder="مثلاً: ورزش، مطالعه" /></div>
      <button class="btn" id="habitAddBtn">+ افزودن</button>
    </div>

    <div class="section-title">عادت‌ها</div>
    <div id="habitList"></div>
  `;
},

getHabits() {
  try { return JSON.parse(localStorage.getItem('mt-habits') || '[]'); } catch { return []; }
},
saveHabits(list) { localStorage.setItem('mt-habits', JSON.stringify(list)); },

bindHabit() {
  this.renderHabits();
  document.getElementById('habitAddBtn')?.addEventListener('click', () => {
    const name = (document.getElementById('habitName')?.value || '').trim();
    if (!name) { this.toast('نام را وارد کنید'); return; }
    const list = this.getHabits();
    list.unshift({ id: Date.now().toString(36), name, checks: [], created: Date.now() });
    this.saveHabits(list);
    document.getElementById('habitName').value = '';
    this.renderHabits();
    this.toast('اضافه شد');
  });
},

_getLast7Days() {
  const out = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
},

_calcStreak(checks) {
  if (!checks || !checks.length) return 0;
  const set = new Set(checks);
  let streak = 0;
  const d = new Date();
  for (let i = 0; i < 365; i++) {
    const key = d.toISOString().slice(0, 10);
    if (set.has(key)) { streak++; d.setDate(d.getDate() - 1); }
    else break;
  }
  return streak;
},

renderHabits() {
  const listEl = document.getElementById('habitList');
  if (!listEl) return;
  const list = this.getHabits();
  if (!list.length) {
    listEl.innerHTML = '<div class="card"><p style="text-align:center;color:var(--text-secondary);font-size:0.85rem;padding:12px">عادتی ثبت نشده</p></div>';
    return;
  }
  const days = this._getLast7Days();
  const dayNames = ['ی','د','س','چ','پ','ج','ش'];
  const today = new Date().toISOString().slice(0, 10);

  listEl.innerHTML = list.map(h => {
    const streak = this._calcStreak(h.checks || []);
    const dayCells = days.map(d => {
      const dt = new Date(d + 'T12:00:00');
      const label = dayNames[(dt.getDay() + 1) % 7];
      const on = (h.checks || []).includes(d);
      const isToday = d === today;
      return '<div class="habit-day ' + (on ? 'on ' : '') + (isToday ? 'today' : '') + '" data-id="' + h.id + '" data-date="' + d + '">' + label + '</div>';
    }).join('');
    return `
      <div class="habit-item">
        <div class="habit-head">
          <div class="habit-name">${this.escapeHtml(h.name)}</div>
          <div class="habit-streak">🔥 ${streak}</div>
          <button class="todo-del" data-act="delhabit" data-id="${h.id}" style="font-size:1rem">✕</button>
        </div>
        <div class="habit-days">${dayCells}</div>
      </div>`;
  }).join('');

  listEl.querySelectorAll('.habit-day').forEach(el => {
    el.addEventListener('click', () => {
      const hid = el.dataset.id, date = el.dataset.date;
      const list2 = this.getHabits();
      const h = list2.find(x => x.id === hid);
      if (!h) return;
      h.checks = h.checks || [];
      const i = h.checks.indexOf(date);
      if (i === -1) h.checks.push(date);
      else h.checks.splice(i, 1);
      this.saveHabits(list2);
      this.renderHabits();
    });
  });
  listEl.querySelectorAll('[data-act="delhabit"]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!confirm('حذف شود؟')) return;
      this.saveHabits(this.getHabits().filter(x => x.id !== el.dataset.id));
      this.renderHabits();
    });
  });
},

// ==================== 🌍 WORLD CLOCK ====================
pageWorldClock() {
  const cities = [
    { name: 'تهران', tz: 'Asia/Tehran' },
    { name: 'دبی', tz: 'Asia/Dubai' },
    { name: 'استانبول', tz: 'Europe/Istanbul' },
    { name: 'لندن', tz: 'Europe/London' },
    { name: 'پاریس', tz: 'Europe/Paris' },
    { name: 'مسکو', tz: 'Europe/Moscow' },
    { name: 'توکیو', tz: 'Asia/Tokyo' },
    { name: 'شانگهای', tz: 'Asia/Shanghai' },
    { name: 'دهلی', tz: 'Asia/Kolkata' },
    { name: 'نیویورک', tz: 'America/New_York' },
    { name: 'لس‌آنجلس', tz: 'America/Los_Angeles' },
    { name: 'سائوپائولو', tz: 'America/Sao_Paulo' },
    { name: 'سیدنی', tz: 'Australia/Sydney' },
    { name: 'دوحه', tz: 'Asia/Qatar' },
    { name: 'ریاض', tz: 'Asia/Riyadh' }
  ];
  return `
    <div class="card" style="background:linear-gradient(135deg,#0c4a6e,#1e3a5f);border-color:#0ea5e9;text-align:center;padding:20px 16px">
      <div style="font-size:2rem;margin-bottom:6px">🌍</div>
      <h2 style="font-size:1.15rem">ساعت جهانی</h2>
      <p style="color:var(--text-secondary);font-size:0.8rem;margin-top:4px">زمان زنده شهرهای مهم</p>
    </div>

    <div class="section-title">افزودن شهر</div>
    <div class="card">
      <div class="input-group"><label>شهر</label>
        <select class="select" id="wcCitySelect">
          ${cities.map((c, i) => `<option value="${i}">${c.name}</option>`).join('')}
        </select></div>
      <button class="btn" id="wcAddBtn">+ افزودن</button>
    </div>

    <div class="section-title">شهرهای من</div>
    <div id="wcList"></div>
  `;
},

getWorldClocks() {
  try {
    const v = JSON.parse(localStorage.getItem('mt-worldclocks') || 'null');
    if (v && v.length) return v;
  } catch (e) {}
  return [{ name: 'تهران', tz: 'Asia/Tehran' }, { name: 'لندن', tz: 'Europe/London' }];
},
saveWorldClocks(list) { localStorage.setItem('mt-worldclocks', JSON.stringify(list)); },

bindWorldClock() {
  this.renderWorldClocks();
  this._wcTimer && clearInterval(this._wcTimer);
  this._wcTimer = setInterval(() => this._updateWCTimes(), 1000);
  document.getElementById('wcAddBtn')?.addEventListener('click', () => {
    const sel = document.getElementById('wcCitySelect');
    if (!sel) return;
    const cities = [
      { name: 'تهران', tz: 'Asia/Tehran' }, { name: 'دبی', tz: 'Asia/Dubai' },
      { name: 'استانبول', tz: 'Europe/Istanbul' }, { name: 'لندن', tz: 'Europe/London' },
      { name: 'پاریس', tz: 'Europe/Paris' }, { name: 'مسکو', tz: 'Europe/Moscow' },
      { name: 'توکیو', tz: 'Asia/Tokyo' }, { name: 'شانگهای', tz: 'Asia/Shanghai' },
      { name: 'دهلی', tz: 'Asia/Kolkata' }, { name: 'نیویورک', tz: 'America/New_York' },
      { name: 'لس‌آنجلس', tz: 'America/Los_Angeles' }, { name: 'سائوپائولو', tz: 'America/Sao_Paulo' },
      { name: 'سیدنی', tz: 'Australia/Sydney' }, { name: 'دوحه', tz: 'Asia/Qatar' },
      { name: 'ریاض', tz: 'Asia/Riyadh' }
    ];
    const c = cities[parseInt(sel.value)];
    if (!c) return;
    const list = this.getWorldClocks();
    if (list.find(x => x.tz === c.tz)) { this.toast('قبلاً اضافه شده'); return; }
    list.push(c);
    this.saveWorldClocks(list);
    this.renderWorldClocks();
    this.toast('اضافه شد');
  });
},

renderWorldClocks() {
  const listEl = document.getElementById('wcList');
  if (!listEl) return;
  const list = this.getWorldClocks();
  if (!list.length) {
    listEl.innerHTML = '<div class="card"><p style="text-align:center;color:var(--text-secondary);font-size:0.85rem;padding:12px">شهری اضافه نشده</p></div>';
    return;
  }
  listEl.innerHTML = list.map((c, i) => `
    <div class="wc-item">
      <div>
        <div class="wc-city">${this.escapeHtml(c.name)}</div>
        <div class="wc-tz">${c.tz}</div>
      </div>
      <div style="display:flex;align-items:center">
        <div class="wc-time" data-tz="${c.tz}">--:--:--</div>
        <button class="wc-del" data-idx="${i}">✕</button>
      </div>
    </div>`).join('');
  listEl.querySelectorAll('.wc-del').forEach(btn => {
    btn.addEventListener('click', () => {
      const list2 = this.getWorldClocks();
      list2.splice(parseInt(btn.dataset.idx), 1);
      this.saveWorldClocks(list2);
      this.renderWorldClocks();
    });
  });
  this._updateWCTimes();
},

_updateWCTimes() {
  document.querySelectorAll('[data-tz]').forEach(el => {
    const tz = el.dataset.tz;
    try {
      el.textContent = new Date().toLocaleTimeString('en-GB', { timeZone: tz, hour12: false });
    } catch (e) { el.textContent = '--:--:--'; }
  });
},

// ==================== 📅 DATE CALC ====================
pageDateCalc() {
  const today = new Date().toISOString().slice(0, 10);
  return `
    <div class="card" style="background:linear-gradient(135deg,#831843,#1e3a5f);border-color:#ec4899;text-align:center;padding:20px 16px">
      <div style="font-size:2rem;margin-bottom:6px">📅</div>
      <h2 style="font-size:1.15rem">محاسبه‌گر تاریخ</h2>
      <p style="color:var(--text-secondary);font-size:0.8rem;margin-top:4px">اختلاف، سن و افزودن روز</p>
    </div>

    <div class="section-title">اختلاف دو تاریخ</div>
    <div class="card">
      <div class="grid-2">
        <div class="input-group"><label>از</label>
          <input type="date" class="input" id="dcFrom" value="${today}" style="direction:ltr" /></div>
        <div class="input-group"><label>تا</label>
          <input type="date" class="input" id="dcTo" value="${today}" style="direction:ltr" /></div>
      </div>
      <button class="btn" id="dcDiffBtn">محاسبه اختلاف</button>
      <div id="dcDiffOut"></div>
    </div>

    <div class="section-title">محاسبه سن</div>
    <div class="card">
      <div class="input-group"><label>تاریخ تولد</label>
        <input type="date" class="input" id="dcBirth" style="direction:ltr" /></div>
      <button class="btn" id="dcAgeBtn">محاسبه سن</button>
      <div id="dcAgeOut"></div>
    </div>

    <div class="section-title">افزودن / کاهش روز</div>
    <div class="card">
      <div class="input-group"><label>تاریخ مبنا</label>
        <input type="date" class="input" id="dcBase" value="${today}" style="direction:ltr" /></div>
      <div class="grid-2">
        <div class="input-group"><label>تعداد روز</label>
          <input type="number" class="input" id="dcDays" value="30" /></div>
        <div class="input-group"><label>عملیات</label>
          <select class="select" id="dcOp">
            <option value="add">افزودن</option>
            <option value="sub">کاهش</option>
          </select></div>
      </div>
      <button class="btn" id="dcShiftBtn">محاسبه</button>
      <div id="dcShiftOut"></div>
    </div>
  `;
},

bindDateCalc() {
  document.getElementById('dcDiffBtn')?.addEventListener('click', () => {
    const f = document.getElementById('dcFrom')?.value;
    const t = document.getElementById('dcTo')?.value;
    if (!f || !t) { this.toast('هر دو تاریخ را وارد کنید'); return; }
    const d1 = new Date(f), d2 = new Date(t);
    const ms = Math.abs(d2 - d1);
    const days = Math.round(ms / 86400000);
    const weeks = (days / 7).toFixed(2);
    const months = (days / 30.44).toFixed(2);
    const years = (days / 365.25).toFixed(2);
    document.getElementById('dcDiffOut').innerHTML = `
      <div class="date-result">
        <div class="d-num">${days.toLocaleString('fa-IR')}</div>
        <div class="d-lbl">روز</div>
        <div style="margin-top:10px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;font-size:0.8rem">
          <div><strong style="color:var(--accent)">${weeks}</strong><br><span style="color:var(--text-secondary)">هفته</span></div>
          <div><strong style="color:var(--accent)">${months}</strong><br><span style="color:var(--text-secondary)">ماه</span></div>
          <div><strong style="color:var(--accent)">${years}</strong><br><span style="color:var(--text-secondary)">سال</span></div>
        </div>
      </div>`;
  });

  document.getElementById('dcAgeBtn')?.addEventListener('click', () => {
    const b = document.getElementById('dcBirth')?.value;
    if (!b) { this.toast('تاریخ تولد را وارد کنید'); return; }
    const birth = new Date(b);
    const now = new Date();
    let y = now.getFullYear() - birth.getFullYear();
    let m = now.getMonth() - birth.getMonth();
    let d = now.getDate() - birth.getDate();
    if (d < 0) { m--; d += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
    if (m < 0) { y--; m += 12; }
    const totalDays = Math.floor((now - birth) / 86400000);
    document.getElementById('dcAgeOut').innerHTML = `
      <div class="date-result">
        <div class="d-num">${y} <span style="font-size:1rem">سال</span> و ${m} <span style="font-size:1rem">ماه</span></div>
        <div class="d-lbl">سن شما — ${totalDays.toLocaleString('fa-IR')} روز</div>
      </div>`;
  });

  document.getElementById('dcShiftBtn')?.addEventListener('click', () => {
    const base = document.getElementById('dcBase')?.value;
    const n = parseInt(document.getElementById('dcDays')?.value, 10);
    const op = document.getElementById('dcOp')?.value;
    if (!base || !n) { this.toast('مقادیر را وارد کنید'); return; }
    const d = new Date(base);
    d.setDate(d.getDate() + (op === 'add' ? n : -n));
    const fa = d.toLocaleDateString('fa-IR');
    const en = d.toISOString().slice(0, 10);
    document.getElementById('dcShiftOut').innerHTML = `
      <div class="date-result">
        <div class="d-num" style="font-size:1.3rem">${fa}</div>
        <div class="d-lbl" style="direction:ltr">${en}</div>
      </div>`;
  });
},

// ==================== 🎙️ SPEECH ====================
pageSpeech() {
  const ttsSupported = 'speechSynthesis' in window;
  const sttSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  return `
    <div class="card" style="background:linear-gradient(135deg,#4c1d95,#1e3a5f);border-color:#a855f7;text-align:center;padding:20px 16px">
      <div style="font-size:2rem;margin-bottom:6px">🎙️</div>
      <h2 style="font-size:1.15rem">گفتار و صدا</h2>
      <p style="color:var(--text-secondary);font-size:0.8rem;margin-top:4px">تبدیل متن به صدا و برعکس</p>
    </div>

    <div class="section-title">متن به گفتار (TTS)</div>
    <div class="card">
      ${ttsSupported ? `
        <div class="input-group"><label>متن</label>
          <textarea class="textarea" id="ttsText" placeholder="متن خود را بنویسید...">سلام، این یک تست است.</textarea></div>
        <div class="input-group"><label>سرعت (<span id="ttsRateVal">1</span>)</label>
          <input type="range" class="range" id="ttsRate" min="0.5" max="2" step="0.1" value="1" /></div>
        <div class="input-group"><label>زبان</label>
          <select class="select" id="ttsLang">
            <option value="fa-IR">فارسی</option>
            <option value="en-US">English (US)</option>
            <option value="ar-SA">العربية</option>
          </select></div>
        <div class="grid-2">
          <button class="btn" id="ttsPlay">▶ پخش</button>
          <button class="btn btn-outline" id="ttsStop">⏹ توقف</button>
        </div>
      ` : '<p style="text-align:center;color:var(--text-secondary);font-size:0.85rem">مرورگر شما از TTS پشتیبانی نمی‌کند</p>'}
    </div>

    <div class="section-title">گفتار به متن (STT)</div>
    <div class="card">
      ${sttSupported ? `
        <p style="text-align:center;font-size:0.8rem;color:var(--text-secondary);margin-bottom:8px">دکمه را بزنید و صحبت کنید</p>
        <button class="speech-btn" id="sttBtn">🎙️</button>
        <div class="input-group"><label>نتیجه</label>
          <textarea class="textarea" id="sttOut" placeholder="نتیجه اینجا نمایش داده می‌شود..." style="min-height:120px"></textarea></div>
        <div class="grid-2">
          <button class="btn btn-sm" id="sttCopy">کپی</button>
          <button class="btn btn-sm btn-outline" id="sttClear">پاک کردن</button>
        </div>
      ` : '<p style="text-align:center;color:var(--text-secondary);font-size:0.85rem">مرورگر شما از STT پشتیبانی نمی‌کند (در Chrome امتحان کنید)</p>'}
    </div>
  `;
},

bindSpeech() {
  document.getElementById('ttsRate')?.addEventListener('input', (e) => {
    const v = document.getElementById('ttsRateVal');
    if (v) v.textContent = e.target.value;
  });
  document.getElementById('ttsPlay')?.addEventListener('click', () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const text = document.getElementById('ttsText')?.value || '';
    if (!text.trim()) { this.toast('متنی وارد کنید'); return; }
    const u = new SpeechSynthesisUtterance(text);
    u.rate = parseFloat(document.getElementById('ttsRate')?.value || 1);
    u.lang = document.getElementById('ttsLang')?.value || 'fa-IR';
    window.speechSynthesis.speak(u);
    this.toast('در حال پخش...');
  });
  document.getElementById('ttsStop')?.addEventListener('click', () => {
    window.speechSynthesis?.cancel();
    this.toast('متوقف شد');
  });

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return;
  const rec = new SR();
  rec.lang = 'fa-IR';
  rec.continuous = true;
  rec.interimResults = true;

  let finalText = '';
  const btn = document.getElementById('sttBtn');
  const out = document.getElementById('sttOut');

  btn?.addEventListener('click', () => {
    if (this._recording) {
      rec.stop();
      return;
    }
    try {
      finalText = '';
      rec.start();
    } catch (e) { this.toast('خطا در شروع'); }
  });
  rec.onstart = () => {
    this._recording = true;
    btn?.classList.add('recording');
    this.toast('ضبط شروع شد');
  };
  rec.onresult = (e) => {
    let interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) finalText += e.results[i][0].transcript + ' ';
      else interim += e.results[i][0].transcript;
    }
    if (out) out.value = finalText + interim;
  };
  rec.onerror = (e) => {
    this._recording = false;
    btn?.classList.remove('recording');
    this.toast('خطا: ' + (e.error || 'ناشناخته'));
  };
  rec.onend = () => {
    this._recording = false;
    btn?.classList.remove('recording');
  };

  document.getElementById('sttCopy')?.addEventListener('click', () => {
    const v = out?.value || '';
    if (v) navigator.clipboard.writeText(v).then(() => this.toast('کپی شد'));
  });
  document.getElementById('sttClear')?.addEventListener('click', () => {
    finalText = '';
    if (out) out.value = '';
  });
},

// ==================== 📍 LOCATION ====================
pageLocation() {
  return `
    <div class="card" style="background:linear-gradient(135deg,#065f46,#1e3a5f);border-color:#10b981;text-align:center;padding:20px 16px">
      <div style="font-size:2rem;margin-bottom:6px">📍</div>
      <h2 style="font-size:1.15rem">موقعیت مکانی</h2>
      <p style="color:var(--text-secondary);font-size:0.8rem;margin-top:4px">مختصات GPS شما</p>
    </div>

    <div class="card">
      <button class="btn" id="locGetBtn">📍 دریافت موقعیت</button>
      <button class="btn btn-outline" id="locWatchBtn" style="margin-top:8px">👁️ ردیابی زنده</button>
      <div id="locResult"></div>
    </div>

    <div class="card" style="text-align:center;font-size:0.8rem;color:var(--text-secondary)">
      برای دقت بیشتر، GPS گوشی روشن باشد.
    </div>
  `;
},

bindLocation() {
  const render = (pos) => {
    const c = pos.coords;
    const ts = new Date(pos.timestamp).toLocaleTimeString('fa-IR');
    document.getElementById('locResult').innerHTML = `
      <div class="loc-info">
        <div class="loc-stat"><div class="l-val">${c.latitude.toFixed(6)}</div><div class="l-lbl">عرض جغرافیایی</div></div>
        <div class="loc-stat"><div class="l-val">${c.longitude.toFixed(6)}</div><div class="l-lbl">طول جغرافیایی</div></div>
        <div class="loc-stat"><div class="l-val">${c.accuracy.toFixed(0)} m</div><div class="l-lbl">دقت</div></div>
        <div class="loc-stat"><div class="l-val">${c.altitude ? c.altitude.toFixed(1) + ' m' : '—'}</div><div class="l-lbl">ارتفاع</div></div>
        <div class="loc-stat"><div class="l-val">${c.speed ? (c.speed * 3.6).toFixed(1) + ' km/h' : '—'}</div><div class="l-lbl">سرعت</div></div>
        <div class="loc-stat"><div class="l-val">${c.heading ? c.heading.toFixed(0) + '°' : '—'}</div><div class="l-lbl">جهت</div></div>
      </div>
      <div style="text-align:center;margin-top:10px;font-size:0.75rem;color:var(--text-secondary)">آخرین به‌روزرسانی: ${ts}</div>
      <a href="https://www.google.com/maps?q=${c.latitude},${c.longitude}" target="_blank" rel="noopener" class="btn" style="display:block;text-decoration:none;text-align:center;margin-top:12px">🗺️ نمایش روی نقشه</a>
    `;
  };

  document.getElementById('locGetBtn')?.addEventListener('click', () => {
    if (!navigator.geolocation) { this.toast('پشتیبانی نمی‌شود'); return; }
    document.getElementById('locResult').innerHTML = '<p style="text-align:center;color:var(--text-secondary);margin-top:12px">در حال دریافت...</p>';
    navigator.geolocation.getCurrentPosition(render, () => {
      document.getElementById('locResult').innerHTML = '<p style="text-align:center;color:var(--danger);margin-top:12px">دسترسی رد شد یا خطا</p>';
    }, { enableHighAccuracy: true, timeout: 15000 });
  });

  document.getElementById('locWatchBtn')?.addEventListener('click', (e) => {
    if (!navigator.geolocation) return;
    if (this._locWatchId) {
      navigator.geolocation.clearWatch(this._locWatchId);
      this._locWatchId = null;
      e.target.textContent = '👁️ ردیابی زنده';
      this.toast('متوقف شد');
      return;
    }
    e.target.textContent = '⏹ توقف ردیابی';
    this._locWatchId = navigator.geolocation.watchPosition(render,
      () => this.toast('خطا در ردیابی'),
      { enableHighAccuracy: true });
    this.toast('ردیابی شروع شد');
  });
},

// ==================== 🔦 FLASHLIGHT ====================
pageFlashlight() {
  return `
    <div class="card" style="background:linear-gradient(135deg,#78350f,#1e3a5f);border-color:#f59e0b;text-align:center;padding:20px 16px">
      <div style="font-size:2rem;margin-bottom:6px">🔦</div>
      <h2 style="font-size:1.15rem">چراغ‌قوه</h2>
      <p style="color:var(--text-secondary);font-size:0.8rem;margin-top:4px">فلش LED دوربین</p>
    </div>
    <div class="card" style="text-align:center">
      <button class="flash-btn" id="flashBtn">💡</button>
      <p style="font-size:0.85rem;color:var(--text-secondary)" id="flashStatus">دکمه را بزنید تا چراغ روشن شود</p>
      <button class="btn btn-outline" id="flashScreenBtn" style="margin-top:12px">🔆 حالت صفحه‌ی سفید</button>
    </div>
    <div class="card" style="text-align:center;font-size:0.75rem;color:var(--text-secondary)">
      پشتیبانی چراغ LED به مرورگر و گوشی شما بستگی دارد. در صورت عدم پشتیبانی، از حالت صفحه سفید استفاده کنید.
    </div>
  `;
},

bindFlashlight() {
  this._flashStream = null;
  this._flashTrack = null;

  document.getElementById('flashBtn')?.addEventListener('click', async () => {
    const btn = document.getElementById('flashBtn');
    const status = document.getElementById('flashStatus');
    if (this._flashTrack && this._flashTrack.readyState === 'live') {
      try { await this._flashTrack.applyConstraints({ advanced: [{ torch: false }] }); } catch (e) {}
      this._flashStream?.getTracks().forEach(t => t.stop());
      this._flashStream = null;
      this._flashTrack = null;
      btn.classList.remove('on');
      if (status) status.textContent = 'چراغ خاموش شد';
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      const track = stream.getVideoTracks()[0];
      const caps = track.getCapabilities ? track.getCapabilities() : {};
      if (!caps.torch) {
        stream.getTracks().forEach(t => t.stop());
        this.toast('این دستگاه چراغ LED ندارد');
        return;
      }
      await track.applyConstraints({ advanced: [{ torch: true }] });
      this._flashStream = stream;
      this._flashTrack = track;
      btn.classList.add('on');
      if (status) status.textContent = 'چراغ روشن است ✅';
    } catch (e) {
      this.toast('خطا: ' + (e.message || 'دسترسی رد شد'));
    }
  });

  document.getElementById('flashScreenBtn')?.addEventListener('click', () => {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:#fff;z-index:9999;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#333;font-size:0.9rem;font-family:inherit';
    overlay.textContent = 'برای خروج لمس کنید';
    overlay.addEventListener('click', () => overlay.remove());
    document.body.appendChild(overlay);
  });
},
  showResult(id, html) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  },

  showModal(title, body) {
    // Remove existing
    document.querySelector('.modal-overlay')?.remove();
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay show';
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h2>${title}</h2>
          <button class="modal-close">×</button>
        </div>
        ${body}
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('.modal-close').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  },

  toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => t.classList.remove('show'), 2500);
  },

  escapeHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
};
/* ============================================================
   v1.2.1 — Pro System Integration (patch)
   ============================================================ */

App.isPro = function () {
  return window.Pro ? Pro.isActive() : false;
};

App.getLicenseInfo = function () {
  return window.Pro ? Pro.getCachedInfo() : {
    active: false, expired: false, status: 'none',
    statusLabel: 'Pro پیکربندی نشده', deviceId: '—'
  };
};

App.requirePro = function (featureName) {
  if (window.Pro) return Pro.require(featureName, App);
  return false;
};

App.formatLicenseDate = function (ts) {
  if (!ts) return '∞';
  try { return new Date(ts).toLocaleDateString('fa-IR'); } catch (e) { return '—'; }
};

App.checkLicenseExpiryWarning = function () {
  const info = App.getLicenseInfo();
  if (!info.active) {
    if (info.expired) setTimeout(() => App.toast('لایسنس Pro منقضی شده — برای تمدید اقدام کنید'), 1800);
    return;
  }
  if (info.isLifetime) return;
  if (info.daysLeft <= 7) {
    setTimeout(() => App.toast('لایسنس تا ' + info.daysLeft + ' روز دیگر منقضی می‌شود'), 1800);
  } else if (info.daysLeft <= 30) {
    setTimeout(() => App.toast('کمتر از ۳۰ روز تا انقضای لایسنس باقی مانده'), 1800);
  }
};

App.bindPremium = function () {
  const self = this;

  // Copy card number
  const copyBtn = document.getElementById('copyCardBtn');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      const num = '5894631129342159';
      if (navigator.clipboard) {
        navigator.clipboard.writeText(num)
          .then(() => self.toast('شماره کارت کپی شد'))
          .catch(() => self.toast(num));
      } else {
        self.toast(num);
      }
    });
  }

  // Activate
  const actBtn = document.getElementById('activateProBtn');
  if (actBtn) {
    actBtn.addEventListener('click', async function () {
      const input = document.getElementById('proCodeInput');
      const code = ((input && input.value) || '').trim();
      if (!code) { self.toast('کد را وارد کنید'); return; }
      actBtn.disabled = true;
      actBtn.textContent = 'در حال بررسی...';
      try {
        const res = await Pro.redeem(code);
        self.toast(res.msg);
        if (res.ok) {
          setTimeout(() => self.navigate('premium'), 400);
        }
      } catch (e) {
        self.toast('خطا در بررسی کد');
      } finally {
        actBtn.disabled = false;
        actBtn.textContent = 'اعمال کد';
      }
    });
  }

  // Copy device ID
  const copyDev = document.getElementById('copyDeviceId');
  if (copyDev) {
    copyDev.addEventListener('click', function () {
      const dev = Pro.getDeviceId();
      if (navigator.clipboard) {
        navigator.clipboard.writeText(dev)
          .then(() => self.toast('Device ID کپی شد'))
          .catch(() => self.toast(dev));
      } else {
        self.toast(dev);
      }
    });
  }

  // Deactivate
  const deact = document.getElementById('deactivateProBtn');
  if (deact) {
    deact.addEventListener('click', function () {
      if (!confirm('Pro روی این دستگاه لغو شود؟')) return;
      Pro.clear();
      self.toast('Pro لغو شد');
      setTimeout(() => self.navigate('premium'), 300);
    });
  }

  // Export notes
  const expNotes = document.getElementById('exportNotesPro');
  if (expNotes) {
    expNotes.addEventListener('click', function () {
      if (!App.isPro()) { self.toast('این قابلیت مخصوص Pro است'); return; }
      try {
        const notes = self.getNotes();
        const blob = new Blob([JSON.stringify(notes, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'mobile-toolkit-notes.json';
        a.click();
        self.toast('دانلود شد');
      } catch (e) { self.toast('خطا در خروجی'); }
    });
  }
};

App.pagePremium = function () {
  const info = App.getLicenseInfo();
  const pro = info.active;

  // Status badge
  let badgeClass = 'badge-warning';
  let badgeText = 'فعال نشده';
  if (info.active) {
    if (info.isLifetime) { badgeClass = 'badge-success'; badgeText = '∞ Lifetime'; }
    else if (info.status === 'active') { badgeClass = 'badge-success'; badgeText = '✓ Pro فعال'; }
    else if (info.status === 'warning') { badgeClass = 'badge-warning'; badgeText = '⚠ انقضای نزدیک'; }
    else if (info.status === 'critical') { badgeClass = 'badge-danger'; badgeText = '⚠ کمتر از ۷ روز'; }
  } else if (info.expired) { badgeClass = 'badge-danger'; badgeText = 'منقضی شده'; }
  else if (info.status === 'device-mismatch') { badgeClass = 'badge-danger'; badgeText = 'دستگاه نامطابق'; }

  // Status block
  let statusBlock = '<div style="margin-top:14px"><span class="badge ' + badgeClass + '" style="font-size:0.9rem;padding:6px 14px">' + badgeText + '</span></div>';
  if (info.active && info.expiresAt) {
    statusBlock += '<p style="margin-top:8px;font-size:0.8rem;color:var(--text-secondary)">اعتبار تا: ' + App.formatLicenseDate(info.expiresAt) + ' · ' + info.daysLeft + ' روز مانده</p>';
  } else if (info.isLifetime) {
    statusBlock += '<p style="margin-top:8px;font-size:0.8rem;color:var(--text-secondary)">لایسنس همیشگی ∞</p>';
  }

  // Features table
  const features = [
    ['📝 یادداشت نامحدود', pro ? '✓ فعال' : 'قفل'],
    ['📤 خروجی یادداشت‌ها', pro ? '✓ فعال' : 'قفل'],
    ['🔑 رمز تا ۶۴ کاراکتر', pro ? '✓ فعال' : 'قفل (حداکثر ۱۶)'],
    ['🍅 پومودورو سفارشی', pro ? '✓ فعال' : 'قفل'],
    ['💳 اشتراک نامحدود', pro ? '✓ فعال' : 'قفل (حداکثر ۵)']
  ].map(row => '<div class="info-row"><span class="label">' + row[0] + '</span><span class="value">' + row[1] + '</span></div>').join('');

  // License details (if active)
  let licenseCard = '';
  if (pro || info.expired || info.status === 'device-mismatch') {
    const barColor = info.expired || info.status === 'device-mismatch' ? 'var(--danger)' :
                     (info.status === 'critical' ? 'var(--danger)' :
                     (info.status === 'warning' ? 'var(--warning)' : 'var(--success)'));
    licenseCard =
      '<div class="section-title">جزئیات لایسنس</div>' +
      '<div class="card">' +
      '<div class="info-row"><span class="label">وضعیت</span><span class="value">' + info.statusLabel + '</span></div>' +
      '<div class="info-row"><span class="label">پلن</span><span class="value">' + (info.planLabel || '—') + '</span></div>' +
      (info.issuedAt ? '<div class="info-row"><span class="label">تاریخ صدور</span><span class="value">' + App.formatLicenseDate(info.issuedAt) + '</span></div>' : '') +
      '<div class="info-row"><span class="label">تاریخ انقضا</span><span class="value">' + (info.isLifetime ? '∞ همیشگی' : App.formatLicenseDate(info.expiresAt)) + '</span></div>' +
      (info.active && !info.isLifetime ? '<div class="info-row"><span class="label">روز باقی‌مانده</span><span class="value">' + info.daysLeft + ' روز</span></div>' : '') +
      (info.customer ? '<div class="info-row"><span class="label">مشتری</span><span class="value">' + App.escapeHtml(info.customer) + '</span></div>' : '') +
      (info.licenseId ? '<div class="info-row"><span class="label">شناسه لایسنس</span><span class="value" style="direction:ltr;font-size:0.7rem">' + info.licenseId + '</span></div>' : '') +
      (!info.isLifetime && info.active ?
        '<div style="margin-top:12px"><div style="font-size:0.75rem;color:var(--text-secondary);margin-bottom:6px">باقی‌مانده اعتبار</div>' +
        '<div class="progress-bar"><div class="progress-fill" style="width:' + info.percentLeft + '%;background:' + barColor + '"></div></div></div>' : '') +
      '</div>';
  }

  // Device ID card (always shown)
  const deviceCard =
    '<div class="section-title">شناسه این دستگاه</div>' +
    '<div class="card">' +
    '<p style="font-size:0.8rem;color:var(--text-secondary);line-height:1.7;margin-bottom:10px">' +
    'برای صدور لایسنس اختصاصی، این شناسه را برای پشتیبانی بفرست.' +
    '</p>' +
    '<div style="background:var(--bg-primary);border-radius:10px;padding:12px;direction:ltr;font-family:monospace;font-size:0.8rem;text-align:center;word-break:break-all;border:1px dashed var(--accent);color:var(--accent)">' +
    App.escapeHtml(info.deviceId || '—') +
    '</div>' +
    '<button class="btn btn-sm btn-outline" id="copyDeviceId" style="margin-top:10px;width:100%">📋 کپی شناسه دستگاه</button>' +
    '</div>';

  // Action block based on state
  let actionBlock = '';
  if (pro) {
    actionBlock =
      '<div class="section-title">میانبر Pro</div>' +
      '<div class="grid-2">' +
      '<button type="button" class="tool-btn" data-goto="text"><span class="icon">📝</span><span class="label">یادداشت‌ها</span></button>' +
      '<button type="button" class="tool-btn" data-goto="health"><span class="icon">🍅</span><span class="label">پومودورو</span></button>' +
      '<button type="button" class="tool-btn" data-goto="security"><span class="icon">🔑</span><span class="label">رمزساز</span></button>' +
      '<button type="button" class="tool-btn" data-goto="subs"><span class="icon">💳</span><span class="label">اشتراک‌ها</span></button>' +
      '</div>' +
      '<div class="section-title">مدیریت</div>' +
      '<div class="card">' +
      '<button type="button" class="btn btn-outline" id="exportNotesPro">📤 خروجی یادداشت‌ها</button>' +
      '<button type="button" class="btn btn-outline" id="deactivateProBtn" style="margin-top:8px;color:var(--danger);border-color:var(--danger)">لغو Pro روی این دستگاه</button>' +
      '</div>';
  } else {
    // Activation UI (shown to everyone not active)
    actionBlock =
      '<div class="section-title">قیمت‌ها</div>' +
      '<div class="card">' +
      '<div class="info-row"><span class="label">۱ ماهه</span><span class="value">۴۹٬۰۰۰ تومان</span></div>' +
      '<div class="info-row"><span class="label">۳ ماهه</span><span class="value">۱۱۵٬۰۰۰ تومان</span></div>' +
      '<div class="info-row"><span class="label">۶ ماهه</span><span class="value">۱۹۹٬۰۰۰ تومان</span></div>' +
      '<div class="info-row"><span class="label">۱۲ ماهه</span><span class="value" style="color:var(--accent);font-weight:700">۲۹۹٬۰۰۰ تومان ⭐</span></div>' +
      '<div class="info-row"><span class="label">Lifetime ∞</span><span class="value" style="color:var(--warning);font-weight:700">۸۹۹٬۰۰۰ تومان</span></div>' +
      '</div>' +
      '<div class="section-title">پرداخت</div>' +
      '<div class="card">' +
      '<p style="font-size:0.85rem;line-height:1.8;color:var(--text-secondary);margin-bottom:12px">' +
      'پس از واریز مبلغ پلن مورد نظر، <strong style="color:var(--accent)">شناسه دستگاه</strong> بالا را به همراه تصویر رسید به پشتیبانی بفرست تا کد فعال‌سازی برایت صادر شود.' +
      '</p>' +
      '<div style="background:var(--bg-primary);border-radius:12px;padding:16px;text-align:center;margin-bottom:12px;border:1px dashed var(--accent)">' +
      '<div style="font-size:0.75rem;color:var(--text-secondary);margin-bottom:6px">شماره کارت</div>' +
      '<div style="font-size:1.1rem;font-weight:700;letter-spacing:1px;direction:ltr;font-family:monospace">5894-6311-2934-2159</div>' +
      '<div style="font-size:0.8rem;color:var(--text-secondary);margin-top:8px">به نام Krypton Studio</div>' +
      '</div>' +
      '<button type="button" class="btn btn-outline" id="copyCardBtn">📋 کپی شماره کارت</button>' +
      '</div>' +
      '<div class="section-title">فعال‌سازی</div>' +
      '<div class="card">' +
      '<div class="input-group"><label>کد فعال‌سازی</label>' +
      '<input type="text" class="input" id="proCodeInput" placeholder="MTK1.xxx.yyy" autocomplete="off" style="direction:ltr;text-align:center;letter-spacing:1px;font-size:0.75rem" /></div>' +
      '<button type="button" class="btn" id="activateProBtn">فعال‌سازی</button>' +
      '</div>';
  }

  // Card template
  return (
    '<div class="card" style="background:linear-gradient(135deg,#1e3a5f,#312e81);border-color:#6366f1;text-align:center;padding:24px 16px">' +
    '<div style="font-size:2.5rem;margin-bottom:8px">' + (pro ? '👑' : '⭐') + '</div>' +
    '<h2 style="font-size:1.25rem;margin-bottom:6px">Mobile Toolkit Pro</h2>' +
    '<p style="color:var(--text-secondary);font-size:0.85rem;line-height:1.6">' +
    (pro ? 'نسخه حرفه‌ای شما فعال است.' : (info.configured === false ? 'سیستم Pro پیکربندی نشده.' : 'با ارتقا، امکانات کامل را آزاد کن')) +
    '</p>' +
    statusBlock + '</div>' +
    licenseCard +
    '<div class="section-title">وضعیت امکانات</div>' +
    '<div class="card">' + features + '</div>' +
    deviceCard +
    actionBlock +
    '<div class="card" style="text-align:center;margin-top:8px">' +
    '<p style="font-size:0.75rem;color:var(--text-secondary)">Krypton Studio · Mobile Toolkit Pro</p></div>'
  );
};
// Boot
document.addEventListener('DOMContentLoaded', () => App.init());
