"use client";

import React, { useState } from "react";
import { Mail, CheckCircle2, AlertCircle, X, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

import { forgotPasswordApi } from "@/lib/api/auth";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
}

export function ForgotPasswordModal({
  isOpen,
  onClose,
  initialEmail = "",
}: ForgotPasswordModalProps) {
  const [email, setEmail] = useState(initialEmail);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

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

  const handleResetState = () => {
    setEmail("");
    setError("");
    setIsSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md">
        <Card
          variant="paper"
          className="shadow-[0px_8px_32px_0px_rgba(250,166,0,0.25)] border border-[#e3d6c5] p-5 sm:p-8 relative bg-white rounded-[24px] max-h-[90dvh] overflow-y-auto"
        >
          {/* Close Button */}
          <button
            onClick={handleResetState}
            className="absolute top-5 right-5 p-2 rounded-full text-[#8e8b87] hover:text-[#1d1e1c] hover:bg-[#fff8f1] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {isSuccess ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 rounded-full bg-[#fa5d00]/10 text-[#fa5d00] mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-serif font-semibold text-[#1d1e1c]">
                  Check your inbox
                </h3>
                <p className="text-sm text-[#615f5c] leading-relaxed">
                  If an account exists for <span className="font-semibold text-[#1d1e1c]">{email}</span>, we&apos;ve sent a password reset link to your email.
                </p>
              </div>
              <div className="bg-[#fff8f1] border border-[#fee3b5] p-3.5 rounded-[14px] text-xs text-[#615f5c]">
                Please check your inbox (and spam folder). The link will expire in 15 minutes.
              </div>
              <Button
                variant="primary"
                onClick={handleResetState}
                className="w-full mt-2"
              >
                Back to Sign In
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header */}
              <div>
                <div className="inline-flex items-center gap-1.5 bg-[#fee3b5]/60 text-[#fa5d00] px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
                  <Sparkles className="w-3.5 h-3.5" /> Account Recovery
                </div>
                <h2 className="text-2xl sm:text-3xl font-serif text-[#1d1e1c] tracking-tight">
                  Forgot Password?
                </h2>
                <p className="text-sm text-[#615f5c] mt-1.5 leading-relaxed">
                  Enter your registered work email address below and we&apos;ll send you instructions to reset your password.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
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
                      disabled={isLoading}
                      autoFocus
                    />
                    <Mail className="w-5 h-5 text-[#8e8b87] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-[12px] font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex flex-col gap-2 pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={isLoading}
                    className="w-full text-base font-semibold py-3.5"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Sending Link...</span>
                      </div>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        Send Reset Link <ArrowRight className="w-4 h-4" />
                      </span>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleResetState}
                    disabled={isLoading}
                    className="w-full text-sm text-[#615f5c]"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
