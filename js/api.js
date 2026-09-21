// Mobile Toolkit — API Client
// ارتباط با بک‌اند Cloudflare Worker

(function (global) {
  'use strict';

  var BASE_URL = 'https://backend.salehmaghsoudi019.workers.dev';

  // ─── ذخیره توکن ───
  function getToken() {
    try { return localStorage.getItem('mt-auth-token'); } catch (e) { return null; }
  }

  function setToken(token) {
    try {
      if (token) localStorage.setItem('mt-auth-token', token);
      else localStorage.removeItem('mt-auth-token');
    } catch (e) {}
  }

  function getUser() {
    try {
      var raw = localStorage.getItem('mt-auth-user');
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function setUser(user) {
    try {
      if (user) localStorage.setItem('mt-auth-user', JSON.stringify(user));
      else localStorage.removeItem('mt-auth-user');
    } catch (e) {}
  }

  // ─── درخواست پایه ───
  function request(path, options) {
    options = options || {};
    var headers = { 'Content-Type': 'application/json' };
    var token = getToken();
    if (token && options.auth !== false) {
      headers['Authorization'] = 'Bearer ' + token;
    }

    return fetch(BASE_URL + path, {
      method: options.method || 'GET',
      headers: headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    })
    .then(function (res) {
      return res.json().then(function (data) {
        return { status: res.status, ok: res.ok, data: data };
      }).catch(function () {
        return { status: res.status, ok: res.ok, data: { ok: false, error: 'پاسخ نامعتبر از سرور' } };
      });
    })
    .catch(function (e) {
      return { status: 0, ok: false, data: { ok: false, error: 'خطا در ارتباط با سرور' } };
    });
  }

  // ─── API Endpoints ───
  var API = {
    baseUrl: BASE_URL,

    // ثبت‌نام
    register: function (email, password, displayName) {
      return request('/api/auth/register', {
        method: 'POST',
        auth: false,
        body: { email: email, password: password, displayName: displayName }
      });
    },

    // ورود
    login: function (email, password) {
      return request('/api/auth/login', {
        method: 'POST',
        auth: false,
        body: { email: email, password: password }
      }).then(function (res) {
        if (res.data && res.data.ok && res.data.token) {
          setToken(res.data.token);
          setUser(res.data.user);
        }
        return res;
      });
    },

    // پروفایل کاربر
    me: function () {
      return request('/api/auth/me').then(function (res) {
        if (res.data && res.data.ok && res.data.user) {
          setUser(res.data.user);
        }
        return res;
      });
    },

    // خروج
    logout: function () {
      setToken(null);
      setUser(null);
    },

    // بازیابی رمز
    forgot: function (email) {
      return request('/api/auth/forgot', {
        method: 'POST',
        auth: false,
        body: { email: email }
      });
    },

    // Sync — آپلود
    syncPush: function (items) {
      return request('/api/sync/push', {
        method: 'POST',
        body: { items: items }
      });
    },

    // Sync — دانلود
    syncPull: function () {
      return request('/api/sync/pull');
    },

    // پاک کردن کلید
    syncRemove: function (key) {
      return request('/api/sync/remove', {
        method: 'POST',
        body: { key: key }
      });
    },

    // پاک کردن همه
    syncRemoveAll: function () {
      return request('/api/sync/remove-all', { method: 'POST' });
    },

    // ─── توکن و کاربر ───
    isLoggedIn: function () { return !!getToken(); },
    getToken: getToken,
    getUser: getUser,
    setUser: setUser,
    setToken: setToken
  };

  global.API = API;
})(window);