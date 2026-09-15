import React from "react";
import Link from "next/link";
import { Brand } from "@/components/layout/brand";
import { Container } from "@/components/ui/container";

export const metadata = {
  title: "Privacy Policy | Partner Finance Tracker",
  description: "Privacy Policy for Partner Finance Tracker application.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#fff8f1] text-[#1d1e1c] flex flex-col justify-between selection:bg-[#fee3b5]">
      {/* Top Header */}
      <header className="w-full py-5 border-b border-[#e3d6c5]/40 bg-[#fff8f1]/90 backdrop-blur-md sticky top-0 z-50">
        <Container className="flex items-center justify-between">
          <Brand href="/" />
          <Link
            href="/sign-in"
            className="text-xs font-semibold text-[#fa5d00] hover:underline"
          >
            Back to Sign In
          </Link>
        </Container>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-12 md:py-16">
        <Container className="max-w-3xl">
          <div className="bg-white border border-[#e3d6c5] rounded-[24px] p-6 sm:p-10 shadow-sm space-y-8">
            <div>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#fee3b5]/60 text-[#fa5d00] mb-3">
                Legal
              </span>
              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#1d1e1c]">
                Privacy Policy
              </h1>
              <p className="text-xs text-[#8e8b87] mt-2">
                Last updated: September 15, 2026
              </p>
            </div>

            <div className="space-y-6 text-sm text-[#615f5c] leading-relaxed">
              <section className="space-y-2">
                <h2 className="text-lg font-bold text-[#1d1e1c]">1. Introduction</h2>
                <p>
                  Welcome to <strong>Partner Finance Tracker</strong> (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;). We respect your privacy and are committed to protecting the personal data you share with us when using our application.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-lg font-bold text-[#1d1e1c]">2. Information We Collect</h2>
                <p>We collect minimal information necessary to operate the application:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Account Information:</strong> Name, email address, and authentication credentials when you sign in or log in via Google.</li>
                  <li><strong>Financial &amp; Settlement Records:</strong> Expenses logged, partner settlement records, and uploaded receipts/proofs.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h2 className="text-lg font-bold text-[#1d1e1c]">3. How We Use Your Information</h2>
                <p>We use the collected information solely for:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Authenticating your account identity.</li>
                  <li>Calculating equal partner expense splits and balance summaries.</li>
                  <li>Sending security notifications such as password reset links.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h2 className="text-lg font-bold text-[#1d1e1c]">4. Data Protection &amp; Sharing</h2>
                <p>
                  We do not sell, rent, or trade your personal data to third parties. Data is stored securely and processed exclusively for providing application features.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-lg font-bold text-[#1d1e1c]">5. Contact Us</h2>
                <p>
                  If you have any questions or concerns regarding this Privacy Policy, please contact us at:
                </p>
                <p className="font-semibold text-[#1d1e1c]">
                  Email: <a href="mailto:flextudy.official@gmail.com" className="text-[#fa5d00] underline">flextudy.official@gmail.com</a>
                </p>
              </section>
            </div>
          </div>
        </Container>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-[#e3d6c5]/40 text-center text-xs text-[#8e8b87]">
        <Container>
          <p>&copy; 2026 Partner Finance Tracker. All rights reserved.</p>
        </Container>
      </footer>
    </div>
  );
}
