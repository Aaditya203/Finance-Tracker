import nodemailer from "nodemailer";

export function createEmailTransporter() {
  const user = process.env.EMAIL_USER?.trim();
  const pass = process.env.EMAIL_APP_PASSWORD?.replace(/\s+/g, "");

  if (!user || !pass) {
    throw new Error(
      "Missing email configuration. Please ensure EMAIL_USER and EMAIL_APP_PASSWORD are added to Vercel Environment Variables."
    );
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass,
    },
  });
}

export const transporter = {
  sendMail: (options: nodemailer.SendMailOptions) => {
    const activeTransporter = createEmailTransporter();
    return activeTransporter.sendMail(options);
  },
};