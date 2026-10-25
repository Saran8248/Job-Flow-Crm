import nodemailer from "nodemailer";

interface SendOtpOptions {
  to: string;
  candidateName: string;
  otp: string;
  reason?: "FIRST_LOGIN" | "FORGOT_PASSWORD" | string;
}

interface SendStageUpdateOptions {
  to: string;
  candidateName: string;
  previousStage: string;
  newStage: string;
  specialistName?: string;
  clientNote?: string;
}

interface SendPaymentOptions {
  to: string;
  candidateName: string;
  amount: number;
  paymentMethod?: string;
  paymentStatus: string;
  balance: number;
  specialistName?: string;
}

interface SendClientUpdateOptions {
  to: string;
  candidateName: string;
  targetRole?: string;
  specialistName?: string;
  details?: string;
}

function getTransporter() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) return null;

  return {
    transporter: nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    }),
    from: process.env.SMTP_FROM || `"JobAssist Candidate Portal" <${user}>`,
  };
}

// 1. Send OTP Email (First login / Password Reset)
export async function sendOtpEmail({
  to,
  candidateName,
  otp,
  reason = "FIRST_LOGIN",
}: SendOtpOptions): Promise<{ success: boolean; error?: string; messageId?: string }> {
  const isFirstTime = reason === "FIRST_LOGIN";
  const subject = isFirstTime
    ? `Your JobAssist Candidate Portal Verification Code: ${otp}`
    : `Your JobAssist Password Reset Code: ${otp}`;

  const mailer = getTransporter();
  if (!mailer) {
    console.warn(`\n⚠️ [EMAIL NOTICE] Real-time email delivery attempted for: ${to} (OTP: ${otp})\n`);
    return { success: false, error: "SMTP credentials not configured" };
  }

  try {
    const htmlContent = `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #FAF7F2; margin: 0; padding: 24px; color: #182232;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #EAE5DC; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
    <tr>
      <td style="padding: 28px 28px 18px 28px; background: linear-gradient(135deg, #182232 0%, #0F172A 100%); text-align: center;">
        <div style="display: inline-block; width: 40px; height: 40px; line-height: 40px; border-radius: 10px; background-color: #E86328; color: #ffffff; font-size: 20px; font-weight: bold; margin-bottom: 6px;">J</div>
        <h1 style="color: #ffffff; font-size: 18px; font-weight: 700; margin: 6px 0 2px 0;">JobAssist Candidate Portal</h1>
        <p style="color: #94A3B8; font-size: 11px; margin: 0;">Authorized Real-Time Candidate Verification</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 28px 28px 24px 28px;">
        <h2 style="font-size: 16px; font-weight: 700; color: #182232; margin-top: 0; margin-bottom: 8px;">
          ${isFirstTime ? `Welcome, ${candidateName}!` : `Hello, ${candidateName}!`}
        </h2>
        <p style="font-size: 13px; line-height: 20px; color: #475569; margin: 0 0 20px 0;">
          ${
            isFirstTime
              ? "Your Career Specialist has approved your candidate portal access. Use the 6-digit verification code below to verify your email and set your permanent password."
              : "We received a request to reset your password for your JobAssist Candidate Portal account. Use the verification code below to continue."
          }
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 1px; color: #64748B; margin-bottom: 8px;">Your Verification OTP</div>
          <div style="display: inline-block; background-color: #FFF4ED; border: 2px dashed #E86328; border-radius: 12px; padding: 14px 32px; text-align: center;">
            <span style="font-family: 'Courier New', monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #E86328; display: block; margin-left: 8px;">${otp}</span>
          </div>
          <div style="font-size: 11px; color: #94A3B8; margin-top: 8px;">⏰ Code expires in <strong>15 minutes</strong></div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const info = await mailer.transporter.sendMail({
      from: mailer.from,
      to,
      subject,
      text: `Hello ${candidateName},\n\nYour 6-digit verification code is: ${otp}\nThis code expires in 15 minutes.\n\nJobAssist Candidate Portal`,
      html: htmlContent,
    });

    console.log(`✉️ [EMAIL SENT] Successfully delivered OTP email to ${to} (MessageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    console.error(`❌ [EMAIL ERROR] Failed to send email to ${to}:`, err.message);
    return { success: false, error: err.message };
  }
}

// 2. Send 5-Line Milestone / Stage Update Notification Email
export async function sendStageUpdateEmail({
  to,
  candidateName,
  previousStage,
  newStage,
  specialistName = "Your Career Specialist",
  clientNote,
}: SendStageUpdateOptions): Promise<{ success: boolean; error?: string; messageId?: string }> {
  const mailer = getTransporter();
  if (!mailer) return { success: false, error: "SMTP not configured" };

  const stageFormatted = newStage.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const subject = `Milestone Update: Your profile moved to ${stageFormatted} - JobAssist`;

  // 5-line clean message
  const line1 = `Hello ${candidateName},`;
  const line2 = `Your career pipeline milestone has been updated to: ${stageFormatted}.`;
  const line3 = clientNote || `Status update confirmed from ${previousStage.replace(/_/g, " ")} to ${stageFormatted}.`;
  const line4 = `Specialist ${specialistName} is advancing your profile and job applications.`;
  const line5 = `View live pipeline progress on your Candidate Portal: http://localhost:3000/portal`;

  const textBody = `${line1}\n\n${line2}\n${line3}\n${line4}\n${line5}\n\nWarm regards,\nJobAssist Acceleration Team`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #FAF7F2; margin: 0; padding: 24px; color: #182232;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #EAE5DC; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
    <tr>
      <td style="padding: 24px 28px; background: linear-gradient(135deg, #182232 0%, #0F172A 100%); text-align: left;">
        <span style="display: inline-block; background-color: #E86328; color: #ffffff; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: bold; text-transform: uppercase;">Milestone Reached</span>
        <h2 style="color: #ffffff; font-size: 18px; font-weight: 700; margin: 8px 0 0 0;">${stageFormatted}</h2>
      </td>
    </tr>
    <tr>
      <td style="padding: 28px; font-size: 13px; line-height: 22px; color: #334155;">
        <p style="margin: 0 0 14px 0; font-weight: 600; color: #0F172A;">${line1}</p>
        <p style="margin: 0 0 10px 0; color: #0F172A;"><strong>• Update:</strong> ${line2}</p>
        <p style="margin: 0 0 10px 0; color: #475569;"><strong>• Details:</strong> ${line3}</p>
        <p style="margin: 0 0 10px 0; color: #475569;"><strong>• Team:</strong> ${line4}</p>
        <p style="margin: 0 0 20px 0; color: #E86328;"><strong>• Portal:</strong> <a href="http://localhost:3000/portal" style="color: #E86328; text-decoration: underline; font-weight: bold;">Log in to track your live cockpit &rarr;</a></p>
        <div style="text-align: center; margin: 20px 0 10px 0;">
          <a href="http://localhost:3000/portal" style="background-color: #E86328; color: #ffffff; padding: 10px 22px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 12px; display: inline-block;">Open Candidate Portal</a>
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding: 16px 28px; background-color: #FAF7F2; text-align: center; border-top: 1px solid #EAE5DC; font-size: 11px; color: #94A3B8;">
        JobAssist Career Acceleration CRM · Real-time Confirmation Dispatch
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  try {
    const info = await mailer.transporter.sendMail({
      from: mailer.from,
      to,
      subject,
      text: textBody,
      html: htmlContent,
    });
    console.log(`✉️ [STAGE UPDATE EMAIL SENT] Dispatched milestone email to ${to} (${stageFormatted})`);
    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    console.error(`❌ [EMAIL ERROR] Failed to send stage update email:`, err.message);
    return { success: false, error: err.message };
  }
}

// 3. Send 5-Line Payment Confirmation Email
export async function sendPaymentConfirmationEmail({
  to,
  candidateName,
  amount,
  paymentMethod = "UPI / Bank Transfer",
  paymentStatus,
  balance,
  specialistName = "Your Career Specialist",
}: SendPaymentOptions): Promise<{ success: boolean; error?: string; messageId?: string }> {
  const mailer = getTransporter();
  if (!mailer) return { success: false, error: "SMTP not configured" };

  const subject = `Payment Confirmed: ₹${amount.toLocaleString()} received - JobAssist`;

  const line1 = `Hello ${candidateName},`;
  const line2 = `We have confirmed receipt of ₹${amount.toLocaleString()} via ${paymentMethod}.`;
  const line3 = `Payment Status: ${paymentStatus} · Remaining Balance: ₹${balance.toLocaleString()}.`;
  const line4 = `Career Specialist ${specialistName} has updated your official billing records.`;
  const line5 = `You can review your complete payment history on your Candidate Portal: http://localhost:3000/portal`;

  const textBody = `${line1}\n\n${line2}\n${line3}\n${line4}\n${line5}\n\nWarm regards,\nJobAssist Team`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #FAF7F2; margin: 0; padding: 24px; color: #182232;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #EAE5DC; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
    <tr>
      <td style="padding: 24px 28px; background: linear-gradient(135deg, #182232 0%, #0F172A 100%); text-align: left;">
        <span style="display: inline-block; background-color: #10B981; color: #ffffff; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: bold; text-transform: uppercase;">Payment Confirmed</span>
        <h2 style="color: #ffffff; font-size: 20px; font-weight: 700; margin: 8px 0 0 0;">₹${amount.toLocaleString()} Received</h2>
      </td>
    </tr>
    <tr>
      <td style="padding: 28px; font-size: 13px; line-height: 22px; color: #334155;">
        <p style="margin: 0 0 14px 0; font-weight: 600; color: #0F172A;">${line1}</p>
        <p style="margin: 0 0 10px 0; color: #0F172A;"><strong>• Receipt:</strong> ${line2}</p>
        <p style="margin: 0 0 10px 0; color: #475569;"><strong>• Account Status:</strong> ${line3}</p>
        <p style="margin: 0 0 10px 0; color: #475569;"><strong>• Specialist:</strong> ${line4}</p>
        <p style="margin: 0 0 20px 0; color: #E86328;"><strong>• Portal:</strong> <a href="http://localhost:3000/portal" style="color: #E86328; text-decoration: underline; font-weight: bold;">View updated pipeline & billing &rarr;</a></p>
        <div style="text-align: center; margin: 20px 0 10px 0;">
          <a href="http://localhost:3000/portal" style="background-color: #E86328; color: #ffffff; padding: 10px 22px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 12px; display: inline-block;">View Payment Status</a>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  try {
    const info = await mailer.transporter.sendMail({
      from: mailer.from,
      to,
      subject,
      text: textBody,
      html: htmlContent,
    });
    console.log(`✉️ [PAYMENT EMAIL SENT] Dispatched payment confirmation to ${to} (₹${amount})`);
    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    console.error(`❌ [EMAIL ERROR] Failed to send payment confirmation email:`, err.message);
    return { success: false, error: err.message };
  }
}

// 4. Send 5-Line General Profile Update Email
export async function sendClientUpdateEmail({
  to,
  candidateName,
  targetRole,
  specialistName = "Your Career Specialist",
  details = "Candidate profile records updated",
}: SendClientUpdateOptions): Promise<{ success: boolean; error?: string; messageId?: string }> {
  const mailer = getTransporter();
  if (!mailer) return { success: false, error: "SMTP not configured" };

  const subject = `Profile Update: Your candidate details have been updated - JobAssist`;

  const line1 = `Hello ${candidateName},`;
  const line2 = `Your career profile records have been updated in the JobAssist CRM.`;
  const line3 = targetRole ? `Target Role: ${targetRole} · Status: Active` : details;
  const line4 = `Specialist ${specialistName} has validated and updated your career plan.`;
  const line5 = `Access your live Candidate Portal anytime to view changes: http://localhost:3000/portal`;

  const textBody = `${line1}\n\n${line2}\n${line3}\n${line4}\n${line5}\n\nWarm regards,\nJobAssist Team`;

  try {
    const info = await mailer.transporter.sendMail({
      from: mailer.from,
      to,
      subject,
      text: textBody,
    });
    console.log(`✉️ [PROFILE UPDATE EMAIL SENT] Dispatched profile update to ${to}`);
    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    console.error(`❌ [EMAIL ERROR] Failed to send client update email:`, err.message);
    return { success: false, error: err.message };
  }
}
