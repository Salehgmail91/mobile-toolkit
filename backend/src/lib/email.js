// مدیریت صف ایمیل - ارسال به Consumer

export async function queueEmail(env, data) {
  await env.MY_QUEUE.send({
    type: 'email',
    to: data.to,
    subject: data.subject,
    html: data.html,
    text: data.text || '',
    queuedAt: Date.now(),
  });
}

export function verifyEmailTemplate(name, verifyUrl) {
  return '<div dir="rtl" style="font-family: Tahoma, Arial; max-width: 600px; margin: auto; padding: 24px; background: #f8fafc; border-radius: 12px;">'
    + '<h1 style="color: #0f172a;">سلام ' + name + ' 👋</h1>'
    + '<p style="font-size: 15px; color: #334155; line-height: 1.8;">از ثبت‌نامت در <strong>Mobile Toolkit</strong> ممنونیم.</p>'
    + '<p style="font-size: 15px; color: #334155; line-height: 1.8;">برای فعال‌سازی حسابت، روی دکمه زیر بزن:</p>'
    + '<p style="text-align: center; margin: 28px 0;">'
    + '<a href="' + verifyUrl + '" style="display: inline-block; background: linear-gradient(135deg, #38bdf8, #818cf8); color: #0f172a; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: bold;">تأیید ایمیل</a>'
    + '</p>'
    + '<p style="font-size: 13px; color: #64748b;">اگه این درخواست از طرف تو نبود، این ایمیل رو نادیده بگیر.</p>'
    + '<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />'
    + '<p style="font-size: 12px; color: #94a3b8; text-align: center;">Krypton Studio</p>'
    + '</div>';
}

export function resetPasswordTemplate(name, resetUrl) {
  return '<div dir="rtl" style="font-family: Tahoma, Arial; max-width: 600px; margin: auto; padding: 24px; background: #f8fafc; border-radius: 12px;">'
    + '<h1 style="color: #0f172a;">بازیابی رمز عبور</h1>'
    + '<p style="font-size: 15px; color: #334155; line-height: 1.8;">سلام ' + name + ' جان،</p>'
    + '<p style="font-size: 15px; color: #334155; line-height: 1.8;">برای تنظیم رمز جدید، روی دکمه زیر بزن:</p>'
    + '<p style="text-align: center; margin: 28px 0;">'
    + '<a href="' + resetUrl + '" style="display: inline-block; background: linear-gradient(135deg, #38bdf8, #818cf8); color: #0f172a; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: bold;">تنظیم رمز جدید</a>'
    + '</p>'
    + '<p style="font-size: 13px; color: #64748b;">این لینک تا ۳۰ دقیقه معتبر است.</p>'
    + '<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />'
    + '<p style="font-size: 12px; color: #94a3b8; text-align: center;">Krypton Studio</p>'
    + '</div>';
}