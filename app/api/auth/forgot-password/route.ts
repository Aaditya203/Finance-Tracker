import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { transporter } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "No account found with this email address" },
        { status: 404 }
      );
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        resetToken: hashToken,
        resetTokenExpiry,
      },
    });

    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000").replace(/\/$/, "");
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

    await transporter.sendMail({
      from: `"Partner Finance" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Reset your Partner Finance password",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; color: #1d1e1c;">
          <h2 style="color: #fa5d00;">Reset your password</h2>
          <p>Hello ${user.name},</p>
          <p>We received a request to reset your Partner Finance account password.</p>
          <p style="margin: 24px 0;">
            <a
              href="${resetUrl}"
              style="
                display: inline-block;
                padding: 12px 24px;
                background: #fa5d00;
                color: white;
                text-decoration: none;
                border-radius: 8px;
                font-weight: bold;
              "
            >
              Reset Password
            </a>
          </p>
          <p style="font-size: 13px; color: #615f5c;">This link expires in 15 minutes.</p>
          <p style="font-size: 13px; color: #615f5c;">If you didn't request this password reset, you can safely ignore this email.</p>
        </div>
      `,
    });

    return NextResponse.json({
      message: "Reset link has been sent to your email.",
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    return NextResponse.json(
      { error: "Failed to send reset link. Please try again." },
      { status: 500 }
    );
  }
}