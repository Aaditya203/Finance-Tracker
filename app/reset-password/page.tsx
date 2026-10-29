"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Brand } from "@/components/layout/brand";
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  Check,
} from "lucide-react";
import { resetPasswordApi } from "@/lib/api/auth";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // Force light mode on mount
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

  const isMinLength = password.length >= 8;
  const isMatching = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Invalid or missing password reset token.");
      return;
    }

    if (!password) {
      setError("Please enter your new password.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      await resetPasswordApi({ token, password });
      setIsSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Missing token error view
  if (!token) {
    return (
      <Card
        variant="paper"
        className="shadow-[6px_4px_24px_0px_rgba(250,166,0,0.2)] border border-[var(--color-parchment-shadow)] p-8 sm:p-10 text-center space-y-6 max-w-md mx-auto"
      >
        <div className="w-16 h-16 rounded-full bg-orange-950/40 text-orange-400 mx-auto flex items-center justify-center">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-serif text-[var(--color-ink-black)]">Invalid Reset Link</h2>
          <p className="text-sm text-[var(--color-warm-stone)]">
            This password reset link is invalid or missing required security tokens. Please request a new link.
          </p>
        </div>
        <Link href="/sign-in" className="block w-full">
          <Button variant="primary" size="lg" className="w-full font-semibold">
            Return to Sign In
          </Button>
        </Link>
      </Card>
    );
  }

  return (
    <Card
      variant="paper"
      className="shadow-[6px_4px_24px_0px_rgba(250,166,0,0.2)] border border-[var(--color-parchment-shadow)] p-8 sm:p-10 relative max-w-md mx-auto"
    >
      {isSuccess ? (
        <div className="text-center py-4 space-y-5">
          <div className="w-16 h-16 rounded-full bg-[var(--color-harvest-flame)]/10 text-[var(--color-harvest-flame)] mx-auto flex items-center justify-center animate-bounce">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-serif text-[var(--color-ink-black)] tracking-tight">
              Password Reset Complete!
            </h2>
            <p className="text-sm text-[var(--color-warm-stone)] leading-relaxed">
              Your password has been successfully updated. You can now log in with your new password.
            </p>
          </div>

          <div className="bg-[var(--color-cream-canvas)] border border-[var(--color-marigold-glow)] p-4 rounded-xl text-xs text-[var(--color-warm-stone)] text-center">
            🔒 Account secured. Previous reset links are now invalid.
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={() => router.push("/sign-in")}
            className="w-full font-semibold text-base py-4"
          >
            Sign In Now <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 bg-[var(--color-marigold-glow)]/60 text-[var(--color-harvest-flame)] px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5" /> Security Reset
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif text-[var(--color-ink-black)] tracking-tight leading-tight">
              Set New Password
            </h1>
            <p className="text-base text-[var(--color-warm-stone)] mt-2">
              Please choose a strong password to protect your account.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* New Password Input */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-[var(--color-ink-black)]">
                New Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-11 pr-11"
                  disabled={isLoading}
                />
                <Lock className="w-5 h-5 text-[var(--color-driftwood)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-driftwood)] hover:text-[var(--color-ink-black)] transition-colors cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password Input */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-[var(--color-ink-black)]">
                Confirm New Password
              </label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-11 pr-11"
                  disabled={isLoading}
                />
                <KeyRound className="w-5 h-5 text-[var(--color-driftwood)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-driftwood)] hover:text-[var(--color-ink-black)] transition-colors cursor-pointer"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Password Validation Checklist */}
            <div className="bg-[var(--color-cream-canvas)] border border-[var(--color-parchment-shadow)]/60 p-3.5 rounded-[14px] space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                    isMinLength
                      ? "bg-emerald-950/40 text-white"
                      : "bg-[var(--color-parchment-shadow)] text-[var(--color-driftwood)]"
                  }`}
                >
                  <Check className="w-3 h-3" />
                </div>
                <span
                  className={
                    isMinLength
                      ? "text-[var(--color-success)] font-medium"
                      : "text-[var(--color-warm-stone)]"
                  }
                >
                  At least 8 characters
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                    isMatching
                      ? "bg-emerald-950/40 text-white"
                      : "bg-[var(--color-parchment-shadow)] text-[var(--color-driftwood)]"
                  }`}
                >
                  <Check className="w-3 h-3" />
                </div>
                <span
                  className={
                    isMatching
                      ? "text-[var(--color-success)] font-medium"
                      : "text-[var(--color-warm-stone)]"
                  }
                >
                  Passwords match
                </span>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-950/40 border border-red-900 text-red-400 text-sm p-3.5 rounded-[12px] font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isLoading || !isMinLength || !isMatching}
              className="w-full text-base font-semibold py-4"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Updating Password...</span>
                </div>
              ) : (
                "Reset Password"
              )}
            </Button>
          </form>
        </>
      )}
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[var(--color-cream-canvas)] flex flex-col justify-between selection:bg-[var(--color-marigold-glow)] selection:text-[var(--color-ink-black)]">
      {/* Header */}
      <header className="w-full py-6 border-b border-[var(--color-parchment-shadow)]/40 bg-[var(--color-cream-canvas)]/80 backdrop-blur-md sticky top-0 z-50">
        <Container className="flex items-center justify-between">
          <Brand href="/sign-in" />
          <Link
            href="/sign-in"
            className="text-sm text-[var(--color-harvest-flame)] font-semibold hover:underline"
          >
            Back to Sign In
          </Link>
        </Container>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center py-12 md:py-16 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] hero-gradient-wash pointer-events-none rounded-full blur-3xl -z-10" />
        <Container>
          <Suspense
            fallback={
              <Card variant="paper" className="p-8 text-center max-w-md mx-auto">
                <div className="w-8 h-8 border-3 border-[var(--color-harvest-flame)] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="mt-4 text-sm text-[var(--color-warm-stone)]">Loading reset form...</p>
              </Card>
            }
          >
            <ResetPasswordForm />
          </Suspense>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-[var(--color-warm-stone)]">
            <ShieldCheck className="w-4 h-4 text-[var(--color-harvest-flame)]" />
            <span>Encrypted 256-bit password hashing with bcrypt</span>
          </div>
        </Container>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-[var(--color-parchment-shadow)]/40 text-center text-xs text-[var(--color-driftwood)]">
        <Container>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p>© {new Date().getFullYear()} Flextudy Finance Tracker. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="#" className="hover:text-[var(--color-ink-black)]">Privacy Policy</Link>
              <Link href="#" className="hover:text-[var(--color-ink-black)]">Terms of Service</Link>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
}
