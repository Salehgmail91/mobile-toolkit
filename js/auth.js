// Mobile Toolkit — Auth UI
// صفحه ورود، ثبت‌نام، پروفایل

(function (global) {
  'use strict';

  var AuthUI = {
    // ─── نمایش صفحه auth (modal) ───
    showLogin: function (App) {
      this._render(App, 'login');
    },

    showRegister: function (App) {
      this._render(App, 'register');
    },

    showForgot: function (App) {
      this._render(App, 'forgot');
    },

    showProfile: function (App) {
      this._render(App, 'profile');
    },

    // ─── رندر اصلی ───
    _render: function (App, mode) {
      var self = this;
      var user = API.getUser();
      var isLoggedIn = API.isLoggedIn();

      // اگه profile خواست ولی لاگین نیست
      if (mode === 'profile' && !isLoggedIn) mode = 'login';

      var body = '';

      // ═══════ ورود ═══════
      if (mode === 'login') {
        body =
          '<div class="auth-form">' +
            '<div class="auth-icon">🔐</div>' +
            '<h3 style="text-align:center;margin-bottom:6px">ورود به حساب</h3>' +
            '<p style="text-align:center;color:var(--text-secondary);font-size:0.85rem;margin-bottom:20px">' +
              'برای همگام‌سازی داده‌ها بین دستگاه‌ها' +
            '</p>' +
            '<div class="input-group">' +
              '<label>ایمیل</label>' +
              '<input type="email" class="input" id="authEmail" placeholder="you@example.com" style="direction:ltr" autocomplete="email" />' +
            '</div>' +
            '<div class="input-group">' +
              '<label>رمز عبور</label>' +
              '<input type="password" class="input" id="authPassword" placeholder="••••••••" style="direction:ltr" autocomplete="current-password" />' +
            '</div>' +
            '<div class="auth-msg" id="authMsg"></div>' +
            '<button type="button" class="btn" id="authSubmit">ورود</button>' +
            '<div style="text-align:center;margin-top:14px;font-size:0.85rem">' +
              '<a href="#" data-auth="register" style="color:var(--accent);text-decoration:none">حساب نداری؟ ثبت‌نام کن</a>' +
              '<br><br>' +
              '<a href="#" data-auth="forgot" style="color:var(--text-secondary);text-decoration:none;font-size:0.8rem">رمز عبور را فراموش کردی؟</a>' +
            '</div>' +
          '</div>';
      }

      // ═══════ ثبت‌نام ═══════
      else if (mode === 'register') {
        body =
          '<div class="auth-form">' +
            '<div class="auth-icon">✨</div>' +
            '<h3 style="text-align:center;margin-bottom:6px">ثبت‌نام</h3>' +
            '<p style="text-align:center;color:var(--text-secondary);font-size:0.85rem;margin-bottom:20px">' +
              'یه حساب بساز تا داده‌هات همیشه در دسترس باشن' +
            '</p>' +
            '<div class="input-group">' +
              '<label>نام نمایشی (اختیاری)</label>' +
              '<input type="text" class="input" id="authName" placeholder="مثلاً: علی" />' +
            '</div>' +
            '<div class="input-group">' +
              '<label>ایمیل</label>' +
              '<input type="email" class="input" id="authEmail" placeholder="you@example.com" style="direction:ltr" autocomplete="email" />' +
            '</div>' +
            '<div class="input-group">' +
              '<label>رمز عبور (حداقل ۶ کاراکتر)</label>' +
              '<input type="password" class="input" id="authPassword" placeholder="••••••••" style="direction:ltr" autocomplete="new-password" />' +
            '</div>' +
            '<div class="auth-msg" id="authMsg"></div>' +
            '<button type="button" class="btn" id="authSubmit">ثبت‌نام</button>' +
            '<div style="text-align:center;margin-top:14px;font-size:0.85rem">' +
              '<a href="#" data-auth="login" style="color:var(--accent);text-decoration:none">حساب داری؟ وارد شو</a>' +
            '</div>' +
          '</div>';
      }

      // ═══════ بازیابی رمز ═══════
      else if (mode === 'forgot') {
        body =
          '<div class="auth-form">' +
            '<div class="auth-icon">📧</div>' +
            '<h3 style="text-align:center;margin-bottom:6px">بازیابی رمز عبور</h3>' +
            '<p style="text-align:center;color:var(--text-secondary);font-size:0.85rem;margin-bottom:20px">' +
              'ایمیلت رو وارد کن، لینک بازیابی برات می‌فرستیم' +
            '</p>' +
            '<div class="input-group">' +
              '<label>ایمیل</label>' +
              '<input type="email" class="input" id="authEmail" placeholder="you@example.com" style="direction:ltr" autocomplete="email" />' +
            '</div>' +
            '<div class="auth-msg" id="authMsg"></div>' +
            '<button type="button" class="btn" id="authSubmit">ارسال لینک بازیابی</button>' +
            '<div style="text-align:center;margin-top:14px;font-size:0.85rem">' +
              '<a href="#" data-auth="login" style="color:var(--text-secondary);text-decoration:none">بازگشت به ورود</a>' +
            '</div>' +
          '</div>';
      }

      // ═══════ پروفایل ═══════
      else if (mode === 'profile') {
        var name = (user && user.displayName) || 'کاربر';
        var email = (user && user.email) || '';
        var initial = name.charAt(0).toUpperCase();

        body =
          '<div class="auth-form">' +
            '<div class="profile-header">' +
              '<div class="profile-avatar">' + self._escape(initial) + '</div>' +
              '<h3>' + self._escape(name) + '</h3>' +
              '<p style="color:var(--text-secondary);font-size:0.85rem;direction:ltr">' + self._escape(email) + '</p>' +
              (user && user.verified ?
                '<span class="badge badge-success" style="margin-top:8px">✓ تأیید شده</span>' :
                '<span class="badge badge-warning" style="margin-top:8px">⏳ ایمیل تأیید نشده</span>') +
            '</div>' +
            '<div class="section-title">همگام‌سازی دستی</div>' +
            '<div class="grid-2">' +
              '<button type="button" class="btn btn-outline btn-sm" id="authSyncPush">⬆️ آپلود</button>' +
              '<button type="button" class="btn btn-outline btn-sm" id="authSyncPull">⬇️ دانلود</button>' +
            '</div>' +
            '<p style="font-size:0.75rem;color:var(--text-secondary);text-align:center;margin-top:8px">' +
              'آپلود = داده‌های این دستگاه به سرور<br>دانلود = داده‌های سرور به این دستگاه' +
            '</p>' +
            '<div class="auth-msg" id="authMsg"></div>' +
            '<div class="section-title" style="margin-top:20px">مدیریت حساب</div>' +
            '<button type="button" class="btn btn-outline btn-sm" id="authLogout" style="color:var(--danger);border-color:var(--danger)">🚪 خروج از حساب</button>' +
          '</div>';
      }

      // نمایش modal
      App.showModal('حساب کاربری', body);

      // ═══════ Event Listeners ═══════
      setTimeout(function () {
        var msgEl = document.getElementById('authMsg');
        var submitBtn = document.getElementById('authSubmit');

        function showMsg(text, type) {
          if (!msgEl) return;
          msgEl.textContent = text;
          msgEl.className = 'auth-msg ' + (type || '');
        }

        // ورود / ثبت‌نام / بازیابی
        if (submitBtn) {
          submitBtn.addEventListener('click', function () {
            var email = (document.getElementById('authEmail') || {}).value || '';
            email = email.trim().toLowerCase();
            var pw = (document.getElementById('authPassword') || {}).value || '';

            if (!email || !email.includes('@')) {
              showMsg('ایمیل معتبر وارد کن', 'error');
              return;
            }

            if (mode === 'forgot') {
              submitBtn.disabled = true;
              submitBtn.textContent = 'در حال ارسال...';
              showMsg('در حال ارسال ایمیل...', '');
              API.forgot(email).then(function (res) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'ارسال لینک بازیابی';
                if (res.data && res.data.ok) {
                  showMsg('اگه ایمیلت ثبت شده باشه، لینک برات میاد ✉️', 'success');
                } else {
                  showMsg((res.data && res.data.error) || 'خطا در ارسال', 'error');
                }
              });
              return;
            }

            if (!pw || pw.length < 6) {
              showMsg('رمز عبور باید حداقل ۶ کاراکتر باشه', 'error');
              return;
            }

            submitBtn.disabled = true;
            submitBtn.textContent = 'صبر کن...';

            if (mode === 'login') {
              API.login(email, pw).then(function (res) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'ورود';
                if (res.data && res.data.ok) {
                  showMsg('✓ ورود موفق', 'success');
                  if (App.toast) App.toast('خوش اومدی 🌹');
                  setTimeout(function () {
                    document.querySelector('.modal-overlay') && document.querySelector('.modal-overlay').remove();
                    if (App.navigate) App.navigate('home');
                    if (global.Sync) Sync.startAuto();
                  }, 800);
                } else {
                  showMsg((res.data && res.data.error) || 'خطا در ورود', 'error');
                }
              });
            } else if (mode === 'register') {
              var name = (document.getElementById('authName') || {}).value || '';
              API.register(email, pw, name.trim()).then(function (res) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'ثبت‌نام';
                if (res.data && res.data.ok) {
                  showMsg('✓ ثبت‌نام شد! ایمیلت رو چک کن و تأیید کن', 'success');
                  if (App.toast) App.toast('ایمیل تأیید فرستاده شد 📧');
                  // بعد از ثبت‌نام، خودکار واردش می‌کنیم
                  setTimeout(function () {
                    API.login(email, pw).then(function (loginRes) {
                      if (loginRes.data && loginRes.data.ok) {
                        document.querySelector('.modal-overlay') && document.querySelector('.modal-overlay').remove();
                        if (App.navigate) App.navigate('home');
                        if (global.Sync) Sync.startAuto();
                      }
                    });
                  }, 2000);
                } else {
                  showMsg((res.data && res.data.error) || 'خطا در ثبت‌نام', 'error');
                }
              });
            }
          });
        }

        // لینک‌های تغییر حالت
        document.querySelectorAll('[data-auth]').forEach(function (el) {
          el.addEventListener('click', function (e) {
            e.preventDefault();
            var target = el.getAttribute('data-auth');
            document.querySelector('.modal-overlay') && document.querySelector('.modal-overlay').remove();
            setTimeout(function () {
              if (target === 'register') self.showRegister(App);
              else if (target === 'forgot') self.showForgot(App);
              else self.showLogin(App);
            }, 100);
          });
        });

        // دکمه‌های پروفایل
        var pushBtn = document.getElementById('authSyncPush');
        if (pushBtn && global.Sync) {
          pushBtn.addEventListener('click', function () {
            pushBtn.disabled = true;
            pushBtn.textContent = '⏳ در حال آپلود...';
            Sync.pushAll().then(function (ok) {
              pushBtn.disabled = false;
              pushBtn.textContent = '⬆️ آپلود';
              showMsg(ok ? '✓ آپلود موفق' : '✗ خطا در آپلود', ok ? 'success' : 'error');
            });
          });
        }

        var pullBtn = document.getElementById('authSyncPull');
        if (pullBtn && global.Sync) {
          pullBtn.addEventListener('click', function () {
            pullBtn.disabled = true;
            pullBtn.textContent = '⏳ در حال دانلود...';
            Sync.pullAll().then(function (ok) {
              pullBtn.disabled = false;
              pullBtn.textContent = '⬇️ دانلود';
              showMsg(ok ? '✓ دانلود موفق — صفحه رفرش می‌شه' : '✗ خطا در دانلود', ok ? 'success' : 'error');
              if (ok) setTimeout(function () { location.reload(); }, 1500);
            });
          });
        }

        var logoutBtn = document.getElementById('authLogout');
        if (logoutBtn) {
          logoutBtn.addEventListener('click', function () {
            if (!confirm('از حساب خارج می‌شی؟ داده‌های این دستگاه پاک نمی‌شن.')) return;
            API.logout();
            if (global.Sync) Sync.stopAuto();
            document.querySelector('.modal-overlay') && document.querySelector('.modal-overlay').remove();
            if (App.toast) App.toast('خارج شدی 👋');
            if (App.navigate) App.navigate('settings');
          });
        }
      }, 100);
    },

    _escape: function (s) {
      return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
  };

  global.AuthUI = AuthUI;
})(window);