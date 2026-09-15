"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Brand } from "@/components/layout/brand";
import { ForgotPasswordModal } from "@/components/auth/forgot-password-modal";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
  Sparkles,
} from "lucide-react";

import { useRouter } from "next/navigation";
import { loginApi } from "@/lib/api/auth";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [year] = useState<number | null>(() => new Date().getFullYear());

  useEffect(() => {
    // Force light mode on mount
    const isDark = document.documentElement.classList.contains("dark");
    if (isDark) {
      document.documentElement.classList.remove("dark");
    }

    // Restore user theme preference on unmount
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
      setError("Please enter your work email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setIsLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const data = await loginApi({ email: normalizedEmail, password });

      if (data.user?.id) {
        localStorage.setItem("flextudy-current-user-id", data.user.id);
      }

      setIsSubmitted(true);

      setTimeout(() => {
        router.push("/dashboard");
      }, 400);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid email or password. Please try again.");
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
        </Container>
      </header>

      {/* Main Sign In Section */}
      <main className="flex-1 flex items-center justify-center py-12 md:py-16 relative overflow-hidden">
        {/* Warm Ambient Glow Wash */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] hero-gradient-wash pointer-events-none rounded-full blur-3xl -z-10" />

        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center max-w-5xl mx-auto">
            {/* Left Column: Sign-in Form Card */}
            <div className="lg:col-span-7">
              <Card variant="paper" className="shadow-[6px_4px_24px_0px_rgba(250,166,0,0.2)] border border-[#e3d6c5] p-5 sm:p-8 md:p-10 relative">
                {/* Form Header */}
                <div className="mb-8">
                  <div className="inline-flex items-center gap-2 bg-[#fee3b5]/60 text-[#fa5d00] px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
                    <Sparkles className="w-3.5 h-3.5" /> Secure Authentication
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-serif text-[#1d1e1c] tracking-tight leading-tight">
                    Welcome back
                  </h1>
                  <p className="text-base text-[#615f5c] mt-2">
                    Enter your details to access your finance tracker workspace.
                  </p>
                </div>

                {isSubmitted ? (
                  <div className="bg-[#fff8f1] border border-[#fee3b5] rounded-[16px] p-6 text-center space-y-4 my-6">
                    <div className="w-12 h-12 rounded-full bg-[#fa5d00]/10 text-[#fa5d00] mx-auto flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-semibold text-[#1d1e1c]">
                      Signed in successfully!
                    </h3>
                    <p className="text-sm text-[#615f5c]">
                      Redirecting you to your Finance Tracker dashboard...
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Social OAuth Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                      <button
                        type="button"
                        onClick={() => alert("Google Sign-In integration ready")}
                        className="flex items-center justify-center gap-2.5 bg-white hover:bg-[#fff8f1] border border-[#c0bbb6] text-[#1d1e1c] font-medium text-sm px-4 py-3 rounded-[16px] shadow-sm transition-all duration-200 active:scale-[0.98] cursor-pointer"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                          />
                        </svg>
                        Google
                      </button>

                      <button
                        type="button"
                        onClick={() => alert("GitHub Sign-In integration ready")}
                        className="flex items-center justify-center gap-2.5 bg-white hover:bg-[#fff8f1] border border-[#c0bbb6] text-[#1d1e1c] font-medium text-sm px-4 py-3 rounded-[16px] shadow-sm transition-all duration-200 active:scale-[0.98] cursor-pointer"
                      >
                        <svg className="w-4 h-4 fill-current text-[#1d1e1c]" viewBox="0 0 24 24">
                          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                        </svg>
                        GitHub
                      </button>
                    </div>

                    {/* Divider */}
                    <div className="relative flex items-center justify-center my-6">
                      <div className="border-t border-[#d9d9d9] w-full" />
                      <span className="bg-white px-3 text-xs font-semibold uppercase tracking-wider text-[#8e8b87] absolute">
                        or sign in with email
                      </span>
                    </div>

                    {/* Email & Password Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                      {/* Email Field */}
                      <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-[#1d1e1c]">
                          Work Email
                        </label>
                        <div className="relative">
                          <Input
                            type="email"
                            placeholder="name@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoCapitalize="none"
                            autoCorrect="off"
                            spellCheck={false}
                            className="pl-11"
                          />
                          <Mail className="w-5 h-5 text-[#8e8b87] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>

                      {/* Password Field */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="block text-sm font-semibold text-[#1d1e1c]">
                            Password
                          </label>
                          <button
                            type="button"
                            onClick={() => setIsForgotPasswordOpen(true)}
                            className="text-xs font-semibold text-[#fa5d00] hover:underline cursor-pointer"
                          >
                            Forgot password?
                          </button>
                        </div>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pl-11 pr-11"
                          />
                          <Lock className="w-5 h-5 text-[#8e8b87] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8e8b87] hover:text-[#1d1e1c] transition-colors"
                          >
                            {showPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Remember Me Checkbox */}
                      <div className="flex items-center justify-between pt-1">
                        <label className="flex items-center gap-2.5 text-sm text-[#615f5c] cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="w-4 h-4 rounded border-[#c0bbb6] text-[#fa5d00] focus:ring-[#fa5d00] cursor-pointer accent-[#fa5d00]"
                          />
                          Keep me signed in for 30 days
                        </label>
                      </div>

                      {/* Error Message */}
                      {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3.5 rounded-[12px] font-medium flex items-center gap-2">
                          <span>{error}</span>
                        </div>
                      )}

                      {/* Submit CTA Button */}
                      <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        disabled={isLoading}
                        className="w-full text-base font-semibold py-4"
                      >
                        {isLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Signing in...</span>
                          </div>
                        ) : (
                          "Sign in to Flextudy"
                        )}
                      </Button>
                    </form>
                  </>
                )}
              </Card>
            </div>

            {/* Right Column: Editorial Social Proof & Visual Card */}
            <div className="lg:col-span-5 hidden lg:block space-y-6">
              {/* Product Proof floating card */}
              <div className="bg-white border border-[#e3d6c5] rounded-[20px] p-6 shadow-[6px_4px_24px_0px_rgba(250,166,0,0.15)] relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#fa5d00]">
                    LIVE FINANCIAL SNAPSHOT
                  </span>
                  <TrendingUp className="w-4 h-4 text-[#fa5d00]" />
                </div>

                <div className="space-y-3">
                  <div className="bg-[#fff8f1] p-4 rounded-[16px] border border-[#e3d6c5]/50 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[#8e8b87]">Monthly Tracked Expenses</p>
                      <p className="text-xl font-bold text-[#1d1e1c]">$14,280.50</p>
                    </div>
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      +12.4% vs last mo
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white border border-[#d9d9d9] p-3.5 rounded-[14px]">
                      <p className="text-xs text-[#8e8b87]">Settled Expenses</p>
                      <p className="text-lg font-semibold text-[#1d1e1c]">$9,850.00</p>
                    </div>
                    <div className="bg-white border border-[#d9d9d9] p-3.5 rounded-[14px]">
                      <p className="text-xs text-[#8e8b87]">Pending Claims</p>
                      <p className="text-lg font-semibold text-[#fa5d00]">$4,430.50</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Testimonial Quote */}
              <div className="bg-[#fff8f1] border border-[#e3d6c5] rounded-[20px] p-6 relative">
                <p className="text-base text-[#1d1e1c] leading-relaxed italic font-serif">
                  &ldquo;Paisa Jaaega tabhi to Paisa aaega&rdquo;
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#fa5d00] text-white font-bold flex items-center justify-center text-sm">
                    AS
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1d1e1c]">Aditya Sharma</p>
                    <p className="text-xs text-[#615f5c]">Partner, Flextudy Workspace</p>
                  </div>
                </div>
              </div>

              {/* Security Trust Badge */}
              <div className="flex items-center gap-3 text-xs text-[#615f5c] px-2">
                <ShieldCheck className="w-4 h-4 text-[#fa5d00]" />
                <span>256-bit SSL encryption · SOC2 Type II Certified</span>
              </div>
            </div>
          </div>
        </Container>
      </main>

      {/* Page Footer */}
      <footer className="py-6 border-t border-[#e3d6c5]/40 text-center text-xs text-[#8e8b87]">
        <Container>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p>© {year ?? ""} Flextudy Finance Tracker. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="#" className="hover:text-[#1d1e1c]">Privacy Policy</Link>
              <Link href="#" className="hover:text-[#1d1e1c]">Terms of Service</Link>
              <Link href="#" className="hover:text-[#1d1e1c]">Security</Link>
            </div>
          </div>
        </Container>
      </footer>
      {/* Forgot Password Dialog Modal */}
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        initialEmail={email}
      />
    </div>
  );
}
