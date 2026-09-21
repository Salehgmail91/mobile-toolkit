// مسیرهای احراز هویت: ثبت‌نام، ورود، تأیید ایمیل، بازیابی رمز

import { hashPassword, verifyPassword, createJWT, randomToken, uuid } from '../lib/crypto.js';
import { ok, error } from '../lib/response.js';
import { queueEmail, verifyEmailTemplate, resetPasswordTemplate } from '../lib/email.js';

// ─── ثبت‌نام ───
export async function register(request, env) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return error('فرمت درخواست نامعتبر است');
  }

  const email = (body.email || '').trim().toLowerCase();
  const password = body.password || '';
  const displayName = (body.displayName || '').trim();

  if (!email || !email.includes('@')) return error('ایمیل معتبر وارد کنید');
  if (password.length < 6) return error('رمز عبور باید حداقل ۶ کاراکتر باشد');

  // چک تکراری نبودن ایمیل
  const existing = await env.mtk_db.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
  if (existing) return error('این ایمیل قبلاً ثبت شده');

  // ساخت کاربر
  const userId = uuid();
  const passwordHash = await hashPassword(password);
  const now = Date.now();

  await env.mtk_db.prepare(
    'INSERT INTO users (id, email, password_hash, display_name, verified, created_at, plan) VALUES (?, ?, ?, ?, 0, ?, ?)'
  ).bind(userId, email, passwordHash, displayName || null, now, 'free').run();

  // ساخت توکن تأیید ایمیل
  const verifyToken = randomToken(32);
  const expiresAt = now + 24 * 60 * 60 * 1000; // ۲۴ ساعت

  await env.mtk_db.prepare(
    'INSERT INTO tokens (token, user_id, type, expires_at, created_at, used) VALUES (?, ?, ?, ?, ?, 0)'
  ).bind(verifyToken, userId, 'email_verify', expiresAt, now).run();

  // URL تأیید
  const origin = new URL(request.url).origin;
  const verifyUrl = origin + '/api/auth/verify?token=' + verifyToken;

  // ارسال ایمیل از طریق صف
  const displayForEmail = displayName || email.split('@')[0];
  await queueEmail(env, {
    to: email,
    subject: 'تأیید ایمیل - Mobile Toolkit',
    html: verifyEmailTemplate(displayForEmail, verifyUrl),
  });

  return ok({
    message: 'ثبت‌نام موفق. لطفاً ایمیل خود را تأیید کنید.',
    userId: userId,
  });
}

// ─── ورود ───
export async function login(request, env) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return error('فرمت درخواست نامعتبر است');
  }

  const email = (body.email || '').trim().toLowerCase();
  const password = body.password || '';

  if (!email || !password) return error('ایمیل و رمز عبور الزامی است');

  const user = await env.mtk_db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
  if (!user) return error('ایمیل یا رمز عبور اشتباه است', 401);

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) return error('ایمیل یا رمز عبور اشتباه است', 401);

  // ساخت JWT
  const secret = env.JWT_SECRET || 'default-secret-change-me';
  const token = await createJWT(
    { userId: user.id, email: user.email, plan: user.plan },
    secret
  );

  // ذخیره در KV برای باطل کردن
  await env.SESSIONS.put('session:' + user.id, token, {
    expirationTtl: 30 * 24 * 3600,
  });

  // آخرین ورود
  await env.mtk_db.prepare('UPDATE users SET last_login = ? WHERE id = ?').bind(Date.now(), user.id).run();

  return ok({
    token: token,
    user: {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      verified: user.verified === 1,
      plan: user.plan,
      planExpiresAt: user.plan_expires_at,
    },
  });
}

// ─── تأیید ایمیل ───
export async function verify(request, env) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!token) return error('توکن یافت نشد');

  const row = await env.mtk_db.prepare(
    'SELECT * FROM tokens WHERE token = ? AND type = ? AND used = 0'
  ).bind(token, 'email_verify').first();

  if (!row) return error('توکن نامعتبر یا قبلاً استفاده شده');
  if (row.expires_at < Date.now()) return error('توکن منقضی شده');

  // فعال‌سازی کاربر
  await env.mtk_db.prepare('UPDATE users SET verified = 1 WHERE id = ?').bind(row.user_id).run();
  await env.mtk_db.prepare('UPDATE tokens SET used = 1 WHERE token = ?').bind(token).run();

  // صفحه‌ی موفقیت
  return new Response(
    '<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>تأیید موفق</title>'
    + '<style>body{font-family:Tahoma;background:#0f172a;color:#f1f5f9;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:20px;}'
    + '.box{background:#1e293b;padding:40px;border-radius:16px;text-align:center;max-width:400px;border:1px solid #334155;}'
    + '.icon{font-size:4rem;margin-bottom:16px;}h1{font-size:1.4rem;margin-bottom:8px;}'
    + 'p{color:#94a3b8;line-height:1.7;font-size:0.95rem;}'
    + 'a{display:inline-block;margin-top:20px;background:linear-gradient(135deg,#38bdf8,#818cf8);color:#0f172a;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:bold;}'
    + '</style></head><body><div class="box">'
    + '<div class="icon">✅</div>'
    + '<h1>ایمیل تأیید شد!</h1>'
    + '<p>حساب شما با موفقیت فعال شد.<br>می‌تونی برگردی به اپ و وارد بشی.</p>'
    + '<a href="https://salehgmail91.github.io/mobile-toolkit/">بازگشت به اپ</a>'
    + '</div></body></html>',
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}

// ─── درخواست بازیابی رمز ───
export async function forgotPassword(request, env) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return error('فرمت درخواست نامعتبر است');
  }

  const email = (body.email || '').trim().toLowerCase();
  if (!email) return error('ایمیل الزامی است');

  const user = await env.mtk_db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
  // برای امنیت، همیشه موفق برمی‌گردونیم (تا کسی نفهمه ایمیل هست یا نه)
  if (!user) return ok({ message: 'اگه این ایمیل ثبت شده باشه، لینک بازیابی فرستاده میشه' });

  const resetToken = randomToken(32);
  const now = Date.now();
  const expiresAt = now + 30 * 60 * 1000; // ۳۰ دقیقه

  await env.mtk_db.prepare(
    'INSERT INTO tokens (token, user_id, type, expires_at, created_at, used) VALUES (?, ?, ?, ?, ?, 0)'
  ).bind(resetToken, user.id, 'password_reset', expiresAt, now).run();

  const origin = new URL(request.url).origin;
  const resetUrl = origin + '/api/auth/reset?token=' + resetToken;
  const displayForEmail = user.display_name || email.split('@')[0];

  await queueEmail(env, {
    to: email,
    subject: 'بازیابی رمز عبور - Mobile Toolkit',
    html: resetPasswordTemplate(displayForEmail, resetUrl),
  });

  return ok({ message: 'اگه این ایمیل ثبت شده باشه، لینک بازیابی فرستاده میشه' });
}

// ─── صفحه بازیابی رمز (GET) ───
export async function resetPage(request, env) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  if (!token) return error('توکن یافت نشد');

  const html =
    '<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>رمز جدید</title>'
    + '<meta name="viewport" content="width=device-width,initial-scale=1">'
    + '<style>body{font-family:Tahoma;background:#0f172a;color:#f1f5f9;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:20px;}'
    + '.box{background:#1e293b;padding:32px;border-radius:16px;max-width:420px;width:100%;border:1px solid #334155;}'
    + 'h1{font-size:1.2rem;margin-bottom:16px;text-align:center;}'
    + 'input{width:100%;padding:12px;background:#0f172a;border:1px solid #334155;border-radius:10px;color:#f1f5f9;font-family:inherit;font-size:0.95rem;box-sizing:border-box;direction:ltr;margin-bottom:12px;}'
    + 'button{width:100%;background:linear-gradient(135deg,#38bdf8,#818cf8);color:#0f172a;border:none;border-radius:10px;padding:12px;font-family:inherit;font-size:0.95rem;font-weight:bold;cursor:pointer;}'
    + '.msg{margin-top:12px;text-align:center;font-size:0.9rem;}'
    + '</style></head><body><div class="box">'
    + '<h1>🔑 رمز عبور جدید</h1>'
    + '<input type="password" id="pw" placeholder="رمز جدید (حداقل ۶ کاراکتر)" />'
    + '<input type="password" id="pw2" placeholder="تکرار رمز جدید" />'
    + '<button id="submit">تغییر رمز</button>'
    + '<div class="msg" id="msg"></div>'
    + '</div>'
    + '<script>'
    + 'document.getElementById("submit").onclick = async function(){'
    + '  var pw = document.getElementById("pw").value;'
    + '  var pw2 = document.getElementById("pw2").value;'
    + '  var msg = document.getElementById("msg");'
    + '  if(pw.length < 6){ msg.textContent = "رمز باید حداقل ۶ کاراکتر باشد"; msg.style.color = "#f87171"; return; }'
    + '  if(pw !== pw2){ msg.textContent = "رمزها یکسان نیستند"; msg.style.color = "#f87171"; return; }'
    + '  msg.textContent = "در حال ارسال..."; msg.style.color = "#94a3b8";'
    + '  try {'
    + '    var res = await fetch("/api/auth/reset", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ token: "' + token + '", password: pw }) });'
    + '    var data = await res.json();'
    + '    if(data.ok){ msg.textContent = "✓ رمز تغییر کرد! حالا می‌تونی وارد بشی"; msg.style.color = "#34d399"; }'
    + '    else { msg.textContent = data.error || "خطا"; msg.style.color = "#f87171"; }'
    + '  } catch(e){ msg.textContent = "خطا در ارتباط"; msg.style.color = "#f87171"; }'
    + '};'
    + '</script>'
    + '</body></html>';

  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

// ─── اعمال رمز جدید (POST) ───
export async function resetPassword(request, env) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return error('فرمت درخواست نامعتبر است');
  }

  const token = (body.token || '').trim();
  const password = body.password || '';

  if (!token) return error('توکن نامعتبر');
  if (password.length < 6) return error('رمز باید حداقل ۶ کاراکتر باشد');

  const row = await env.mtk_db.prepare(
    'SELECT * FROM tokens WHERE token = ? AND type = ? AND used = 0'
  ).bind(token, 'password_reset').first();

  if (!row) return error('توکن نامعتبر یا قبلاً استفاده شده');
  if (row.expires_at < Date.now()) return error('توکن منقضی شده');

  const newHash = await hashPassword(password);
  await env.mtk_db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(newHash, row.user_id).run();
  await env.mtk_db.prepare('UPDATE tokens SET used = 1 WHERE token = ?').bind(token).run();

  // باطل کردن session قبلی
  await env.SESSIONS.delete('session:' + row.user_id);

  return ok({ message: 'رمز با موفقیت تغییر کرد' });
}

// ─── دریافت اطلاعات کاربر فعلی ───
export async function me(request, env) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.replace('Bearer ', '').trim();
  if (!token) return error('توکن یافت نشد', 401);

  const secret = env.JWT_SECRET || 'default-secret-change-me';
  const payload = await (await import('../lib/crypto.js')).verifyJWT(token, secret);
  if (!payload) return error('توکن نامعتبر یا منقضی شده', 401);

  const user = await env.mtk_db.prepare(
    'SELECT id, email, display_name, verified, plan, plan_expires_at, created_at, last_login FROM users WHERE id = ?'
  ).bind(payload.userId).first();

  if (!user) return error('کاربر یافت نشد', 404);

  return ok({
    user: {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      verified: user.verified === 1,
      plan: user.plan,
      planExpiresAt: user.plan_expires_at,
      createdAt: user.created_at,
      lastLogin: user.last_login,
    },
  });
}