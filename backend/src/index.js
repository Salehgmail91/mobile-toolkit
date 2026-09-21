// /**
//  * Welcome to Cloudflare Workers!
//  *
//  * This is a template for a Queue consumer: a Worker that can consume from a
//  * Queue: https://developers.cloudflare.com/queues/get-started/
//  *
//  * - Run `npm run dev` in your terminal to start a development server
//  * - Open a browser tab at http://localhost:8787/ to see your worker in action
//  * - Run `npm run deploy` to publish your worker
//  *
//  * Learn more at https://developers.cloudflare.com/workers/
//  */

// export default {
// 	// Our fetch handler is invoked on a HTTP request: we can send a message to a queue
// 	// during (or after) a request.
// 	// https://developers.cloudflare.com/queues/platform/javascript-apis/#producer
// 	async fetch(req, env, ctx) {
// 		// To send a message on a queue, we need to create the queue first
// 		// https://developers.cloudflare.com/queues/get-started/#3-create-a-queue
// 		await env.MY_QUEUE.send({
// 			url: req.url,
// 			method: req.method,
// 			headers: Object.fromEntries(req.headers),
// 		});
// 		return new Response('Sent message to the queue');
// 	},
// 	// The queue handler is invoked when a batch of messages is ready to be delivered
// 	// https://developers.cloudflare.com/queues/platform/javascript-apis/#messagebatch
// 	async queue(batch, env) {
// 		// A queue consumer can make requests to other endpoints on the Internet,
// 		// write to R2 object storage, query a D1 Database, and much more.
// 		for (let message of batch.messages) {
// 			// Process each message (we'll just log these)
// 			console.log(`message ${message.id} processed: ${JSON.stringify(message.body)}`);
// 		}
// 	},
// };
// Mobile Toolkit Backend — Krypton Studio
// Worker اصلی: API + Queue Consumer

import { cors, error } from './lib/response.js';
import * as auth from './routes/auth.js';
import * as sync from './routes/sync.js';

// ═══════════════════════════════════════════════
//   Router
// ═══════════════════════════════════════════════
async function handleRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // CORS Preflight
  if (method === 'OPTIONS') return cors();

  // ─── Home ───
  if (path === '/' || path === '') {
    return new Response(
      JSON.stringify({
        ok: true,
        name: 'Mobile Toolkit API',
        version: '1.0.0',
        studio: 'Krypton Studio',
        time: new Date().toISOString(),
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  // ═══════════════════════════════════════════════
  //   Auth Routes
  // ═══════════════════════════════════════════════
  if (path === '/api/auth/register' && method === 'POST') return auth.register(request, env);
  if (path === '/api/auth/login' && method === 'POST') return auth.login(request, env);
  if (path === '/api/auth/verify' && method === 'GET') return auth.verify(request, env);
  if (path === '/api/auth/forgot' && method === 'POST') return auth.forgotPassword(request, env);
  if (path === '/api/auth/reset' && method === 'GET') return auth.resetPage(request, env);
  if (path === '/api/auth/reset' && method === 'POST') return auth.resetPassword(request, env);
  if (path === '/api/auth/me' && method === 'GET') return auth.me(request, env);

  // ═══════════════════════════════════════════════
  //   Sync Routes
  // ═══════════════════════════════════════════════
  if (path === '/api/sync/push' && method === 'POST') return sync.push(request, env);
  if (path === '/api/sync/pull' && method === 'GET') return sync.pull(request, env);
  if (path === '/api/sync/remove' && method === 'POST') return sync.remove(request, env);
  if (path === '/api/sync/remove-all' && method === 'POST') return sync.removeAll(request, env);

  // ─── 404 ───
  return error('مسیر یافت نشد: ' + path, 404, 'NOT_FOUND');
}

// ═══════════════════════════════════════════════
//   Queue Consumer — پردازش ایمیل‌ها
// ═══════════════════════════════════════════════
async function handleQueue(batch, env) {
  for (let i = 0; i < batch.messages.length; i++) {
    const message = batch.messages[i];
    try {
      const body = message.body;

      if (body.type === 'email') {
        const result = await sendEmail(env, body);
        if (result.ok) {
          message.ack();
        } else {
          // retry میشه خودکار
          message.retry();
        }
      } else {
        console.log('Unknown message type:', body.type);
        message.ack();
      }
    } catch (e) {
      console.error('Queue error:', e.message);
      message.retry();
    }
  }
}

// ═══════════════════════════════════════════════
//   ارسال ایمیل از طریق Resend
// ═══════════════════════════════════════════════
async function sendEmail(env, data) {
  // اگه API Key ست نشده، فقط لاگ کن
  if (!env.RESEND_API_KEY) {
    console.log('📧 [Email would be sent] To:', data.to, '| Subject:', data.subject);
    console.log('   (RESEND_API_KEY not set — email skipped)');
    return { ok: true };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + env.RESEND_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM || 'Mobile Toolkit <onboarding@resend.dev>',
        to: [data.to],
        subject: data.subject,
        html: data.html,
        text: data.text || '',
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Resend error:', response.status, errText);
      return { ok: false };
    }

    const result = await response.json();
    console.log('📧 Email sent:', result.id, '→', data.to);
    return { ok: true };
  } catch (e) {
    console.error('Send email failed:', e.message);
    return { ok: false };
  }
}

// ═══════════════════════════════════════════════
//   Export
// ═══════════════════════════════════════════════
export default {
  async fetch(request, env, ctx) {
    try {
      return await handleRequest(request, env);
    } catch (e) {
      console.error('Worker error:', e.message, e.stack);
      return error('خطای سرور: ' + e.message, 500, 'INTERNAL_ERROR');
    }
  },

  async queue(batch, env, ctx) {
    return handleQueue(batch, env);
  },
};