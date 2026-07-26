const nodemailer = require('nodemailer');

/**
 * Mailer dùng cho email hệ thống (mã xác nhận đặt lại mật khẩu, ...).
 *
 * Cấu hình qua biến môi trường (xem .env.example):
 *   SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_FROM
 *
 * Nếu chưa cấu hình SMTP, isMailerConfigured() trả về false và hệ thống sẽ
 * chạy ở "chế độ dev": mã xác nhận được in ra console máy chủ thay vì gửi email.
 */

const isMailerConfigured = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

let transporter = null;

const getTransporter = () => {
  if (!isMailerConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true', // true cho cổng 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  return transporter;
};

const sendPasswordResetEmail = async (toEmail, fullName, code, expiresMinutes) => {
  const t = getTransporter();
  if (!t) {
    throw new Error('SMTP chưa được cấu hình.');
  }

  const from = process.env.SMTP_FROM || `"KindnessMap" <${process.env.SMTP_USER}>`;

  await t.sendMail({
    from,
    to: toEmail,
    subject: `${code} là mã đặt lại mật khẩu KindnessMap của bạn`,
    text: `Xin chào ${fullName},\n\nMã xác nhận đặt lại mật khẩu của bạn là: ${code}\n\nMã có hiệu lực trong ${expiresMinutes} phút. Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.\n\n— Đội ngũ KindnessMap`,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:16px">
        <h2 style="color:#059669;margin:0 0 8px">KindnessMap — Bản Đồ Việc Tốt</h2>
        <p style="color:#334155">Xin chào <strong>${fullName}</strong>,</p>
        <p style="color:#334155">Bạn (hoặc ai đó) vừa yêu cầu đặt lại mật khẩu. Mã xác nhận của bạn là:</p>
        <div style="text-align:center;margin:20px 0">
          <span style="display:inline-block;font-size:32px;letter-spacing:8px;font-weight:bold;color:#0f172a;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:12px;padding:12px 24px">${code}</span>
        </div>
        <p style="color:#64748b;font-size:13px">Mã có hiệu lực trong <strong>${expiresMinutes} phút</strong>. Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này — tài khoản của bạn vẫn an toàn.</p>
        <p style="color:#94a3b8;font-size:12px;margin-top:24px">— Đội ngũ KindnessMap</p>
      </div>
    `
  });
};

module.exports = {
  isMailerConfigured,
  sendPasswordResetEmail
};
