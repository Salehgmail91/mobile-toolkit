// پاسخ‌های استاندارد JSON برای API

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

export function json(data, status) {
  status = status || 200;
  return new Response(JSON.stringify(data), {
    status: status,
    headers: Object.assign(
      { 'Content-Type': 'application/json; charset=utf-8' },
      CORS_HEADERS
    ),
  });
}

export function ok(data) {
  data = data || {};
  return json(Object.assign({ ok: true }, data));
}

export function error(message, status, code) {
  status = status || 400;
  return json({ ok: false, error: message, code: code || null }, status);
}

export function cors() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export function html(content, status) {
  status = status || 200;
  return new Response(content, {
    status: status,
    headers: Object.assign(
      { 'Content-Type': 'text/html; charset=utf-8' },
      CORS_HEADERS
    ),
  });
}