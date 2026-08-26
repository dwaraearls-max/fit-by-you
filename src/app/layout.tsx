import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Toaster } from "sonner";

import { TooltipProvider } from "@/components/ui/menu";
import { getAppUrl } from "@/lib/app-url";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

/** The editorial serif, reserved for brand moments and display headings. */
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["400", "500", "600"],
});

const appUrl = getAppUrl();

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "FIT BY YOU — Your Fashion Business Has a Memory",
    template: "%s · FIT BY YOU",
  },
  description:
    "Store customer measurements, styles, orders, photos and payment records in one beautifully simple workspace. Built for tailors, seamstresses and fashion designers.",
  applicationName: "FIT BY YOU",
  keywords: [
    "tailor software",
    "measurement app",
    "fashion business management",
    "seamstress CRM",
    "customer measurements",
    "Ghana tailor app",
    "dressmaker software",
  ],
  authors: [{ name: "FIT BY YOU" }],
  openGraph: {
    type: "website",
    siteName: "FIT BY YOU",
    title: "FIT BY YOU — Your Fashion Business Has a Memory",
    description:
      "Customer measurements, styles, orders, photos and payments in one elegant workspace.",
    url: appUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "FIT BY YOU — Your Fashion Business Has a Memory",
    description:
      "Customer measurements, styles, orders, photos and payments in one elegant workspace.",
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg" }],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf8f4" },
    { media: "(prefers-color-scheme: dark)", color: "#08080a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-dvh antialiased">
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster
          position="bottom-right"
          gap={10}
          toastOptions={{
            classNames: {
              toast:
                "!rounded-lg !border !border-border !bg-elevated !text-foreground !shadow-lg !font-sans",
              title: "!text-sm !font-medium",
              description: "!text-xs !text-muted-foreground",
              actionButton: "!bg-ink-950 !text-ivory-100 !rounded-md !text-xs",
              cancelButton: "!bg-surface-muted !text-muted-foreground !rounded-md !text-xs",
            },
          }}
        />
      </body>
    </html>
  );
}
