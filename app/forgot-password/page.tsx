"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Brand } from "@/components/layout/brand";
import {
  Mail,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";
import { forgotPasswordApi } from "@/lib/api/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // Force light mode on mount matching sign-in
    const isDark = document.documentElement.classList.contains("dark");
    if (isDark) {
      document.documentElement.classList.remove("dark");
    }

    return () => {
      const savedTheme = localStorage.getItem("flextudy-theme");
      if (savedTheme === "dark") {
        document.documentElement.classList.add("dark");
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);

    try {
      await forgotPasswordApi(email);
      setIsSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fff8f1] flex flex-col justify-between selection:bg-[#fee3b5] selection:text-[#1d1e1c]">
      {/* Top Header Navigation */}
      <header className="w-full py-6 border-b border-[#e3d6c5]/40 bg-[#fff8f1]/80 backdrop-blur-md sticky top-0 z-50">
        <Container className="flex items-center justify-between">
          <Brand href="/sign-in" />

          <div className="flex items-center gap-2 text-sm text-[#615f5c]">
            <Link
              href="/sign-in"
              className="text-[#fa5d00] font-semibold hover:underline inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Sign In
            </Link>
          </div>
        </Container>
      </header>

      {/* Main Section */}
      <main className="flex-1 flex items-center justify-center py-12 md:py-16 relative overflow-hidden">
        {/* Warm Ambient Glow Wash */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] hero-gradient-wash pointer-events-none rounded-full blur-3xl -z-10" />

        <Container>
          <div className="max-w-md mx-auto">
            <Card
              variant="paper"
              className="shadow-[6px_4px_24px_0px_rgba(250,166,0,0.2)] border border-[#e3d6c5] p-8 sm:p-10 relative"
            >
              {isSuccess ? (
                <div className="text-center py-4 space-y-5">
                  <div className="w-16 h-16 rounded-full bg-[#fa5d00]/10 text-[#fa5d00] mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-serif text-[#1d1e1c] tracking-tight">
                      Check your inbox
                    </h2>
                    <p className="text-sm text-[#615f5c] leading-relaxed">
                      We&apos;ve sent a password reset link to{" "}
                      <span className="font-semibold text-[#1d1e1c]">{email}</span>.
                    </p>
                  </div>

                  <div className="bg-[#fff8f1] border border-[#fee3b5] p-4 rounded-[16px] text-xs text-[#615f5c] text-left space-y-1">
                    <p className="font-semibold text-[#1d1e1c]">Next steps:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Open your email client.</li>
                      <li>Click the &quot;Reset Password&quot; button in the email.</li>
                      <li>Set your new secure password.</li>
                    </ol>
                    <p className="text-[11px] text-[#8e8b87] pt-1">The reset link expires in 15 minutes.</p>
                  </div>

                  <Link href="/sign-in" className="block w-full">
                    <Button variant="primary" size="lg" className="w-full font-semibold">
                      Return to Sign In
                    </Button>
                  </Link>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="mb-8">
                    <div className="inline-flex items-center gap-2 bg-[#fee3b5]/60 text-[#fa5d00] px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
                      <Sparkles className="w-3.5 h-3.5" /> Account Recovery
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-serif text-[#1d1e1c] tracking-tight leading-tight">
                      Reset Password
                    </h1>
                    <p className="text-base text-[#615f5c] mt-2">
                      Enter your email address and we&apos;ll send you a link to reset your password.
                    </p>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold text-[#1d1e1c]">
                        Work Email Address
                      </label>
                      <div className="relative">
                        <Input
                          type="email"
                          placeholder="name@company.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-11"
                        />
                        <Mail className="w-5 h-5 text-[#8e8b87] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {error && (
                      <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3.5 rounded-[12px] font-medium flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                        <span>{error}</span>
                      </div>
                    )}

                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      disabled={isLoading}
                      className="w-full text-base font-semibold py-4"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Sending Reset Link...</span>
                        </div>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          Send Reset Link <ArrowRight className="w-4 h-4" />
                        </span>
                      )}
                    </Button>
                  </form>
                </>
              )}
            </Card>

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-[#615f5c]">
              <ShieldCheck className="w-4 h-4 text-[#fa5d00]" />
              <span>Protected by Flextudy 256-bit SSL Security</span>
            </div>
          </div>
        </Container>
      </main>

      {/* Page Footer */}
      <footer className="py-6 border-t border-[#e3d6c5]/40 text-center text-xs text-[#8e8b87]">
        <Container>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p>© {new Date().getFullYear()} Flextudy Finance Tracker. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="#" className="hover:text-[#1d1e1c]">Privacy Policy</Link>
              <Link href="#" className="hover:text-[#1d1e1c]">Terms of Service</Link>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
}
