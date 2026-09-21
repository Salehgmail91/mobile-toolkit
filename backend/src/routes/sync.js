// همگام‌سازی داده‌های کاربر بین دستگاه‌ها

import { ok, error } from '../lib/response.js';
import { verifyJWT } from '../lib/crypto.js';

// ─── گرفتن userId از JWT ───
async function getUserId(request, env) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.replace('Bearer ', '').trim();
  if (!token) return null;

  const secret = env.JWT_SECRET || 'default-secret-change-me';
  const payload = await verifyJWT(token, secret);
  if (!payload) return null;

  return payload.userId;
}

// ─── ذخیره داده (Push) ───
export async function push(request, env) {
  const userId = await getUserId(request, env);
  if (!userId) return error('ابتدا وارد شوید', 401);

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return error('فرمت درخواست نامعتبر است');
  }

  const items = body.items || {};
  // items = { "notes": "[...]", "todos": "[...]", "finance": "[...]" }
  const keys = Object.keys(items);
  const now = Date.now();

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const value = items[key];
    await env.mtk_db.prepare(
      'INSERT INTO sync_data (user_id, key, value, updated_at) VALUES (?, ?, ?, ?) ' +
      'ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at'
    ).bind(userId, key, value, now).run();
  }

  return ok({ message: keys.length + ' مورد ذخیره شد', count: keys.length });
}

// ─── خوندن داده (Pull) ───
export async function pull(request, env) {
  const userId = await getUserId(request, env);
  if (!userId) return error('ابتدا وارد شوید', 401);

  const rows = await env.mtk_db.prepare(
    'SELECT key, value, updated_at FROM sync_data WHERE user_id = ?'
  ).bind(userId).all();

  const items = {};
  let lastUpdated = 0;

  if (rows.results) {
    for (let i = 0; i < rows.results.length; i++) {
      const row = rows.results[i];
      items[row.key] = row.value;
      if (row.updated_at > lastUpdated) lastUpdated = row.updated_at;
    }
  }

  return ok({ items: items, lastUpdated: lastUpdated });
}

// ─── پاک کردن یه کلید ───
export async function remove(request, env) {
  const userId = await getUserId(request, env);
  if (!userId) return error('ابتدا وارد شوید', 401);

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return error('فرمت درخواست نامعتبر است');
  }

  const key = body.key;
  if (!key) return error('کلید مشخص نشده');

  await env.mtk_db.prepare(
    'DELETE FROM sync_data WHERE user_id = ? AND key = ?'
  ).bind(userId, key).run();

  return ok({ message: 'حذف شد' });
}

// ─── پاک کردن همه داده‌ها ───
export async function removeAll(request, env) {
  const userId = await getUserId(request, env);
  if (!userId) return error('ابتدا وارد شوید', 401);

  await env.mtk_db.prepare('DELETE FROM sync_data WHERE user_id = ?').bind(userId).run();

  return ok({ message: 'همه داده‌ها پاک شد' });
}