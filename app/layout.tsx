import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import { CurrentUserProvider } from "@/components/providers/current-user-provider";
import { ServiceWorkerRegister } from "@/components/providers/sw-register";
import { InstallPWABanner } from "@/components/ui/install-pwa-banner";

const sans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const serif = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const viewport: Viewport = {
  themeColor: "#ff6a00",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Flextudy Finance Tracker",
  description: "A private shared-finance workspace for Flextudy partners.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Finance Tracker",
  },
  formatDetection: {
    telephone: false,
  },
};

import { ThemeProvider } from "@/components/providers/theme-provider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${serif.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("flextudy-theme");if(t==="light"){document.documentElement.classList.add("light");document.documentElement.setAttribute("data-theme","light");}else{document.documentElement.classList.add("dark");document.documentElement.setAttribute("data-theme","dark");}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[var(--color-cream-canvas)] text-[var(--color-ink-black)] font-sans antialiased selection:bg-[var(--color-marigold-glow)] selection:text-[var(--color-ink-black)]" suppressHydrationWarning>
        <ThemeProvider>
          <CurrentUserProvider>
            <ServiceWorkerRegister />
            {children}
            <InstallPWABanner />
          </CurrentUserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
