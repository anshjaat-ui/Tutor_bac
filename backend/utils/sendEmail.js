import nodemailer from 'nodemailer'

let transporter

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: Number(process.env.EMAIL_PORT) === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })
  }
  return transporter
}

// Agar EMAIL_* env vars set nahi hain, ye silently skip kar deta hai (crash nahi karta) —
// isliye scheme redeem tab bhi kaam karega jab email setup nahi hua ho, bas email nahi jaayegi
export async function sendEmail({ to, subject, html }) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('Email not configured (EMAIL_USER/EMAIL_PASS missing) - skipping email send.')
    return { sent: false, reason: 'not_configured' }
  }

  try {
    await getTransporter().sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      html,
    })
    return { sent: true }
  } catch (err) {
    console.error('Email send failed:', err.message)
    return { sent: false, reason: err.message }
  }
}
