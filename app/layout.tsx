import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { siteUrl } from "@/lib/site";
import "./globals.css";
import { Navigation } from "./navigation";

const appTitle = "SVG Viewer";
const appDescription =
  "A public, client-side SVG viewer for safe preview, worker-based inspection, and practical export on Vercel.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: appTitle,
    template: "%s | SVG Viewer",
  },
  description: appDescription,
  applicationName: appTitle,
  alternates: {
    canonical: "/",
  },
  category: "developer tools",
  keywords: [
    "svg viewer",
    "svg inspect",
    "svg export png",
    "client-side svg",
    "safe svg preview",
    "vercel nextjs tool",
  ],
  openGraph: {
    title: appTitle,
    description: appDescription,
    url: siteUrl,
    siteName: appTitle,
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "SVG Viewer preview card",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: appTitle,
    description: appDescription,
    images: ["/opengraph-image"],
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: ["/icon.svg"],
    apple: [{ url: "/icon.svg" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  colorScheme: "dark",
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var theme = localStorage.getItem('svg-viewer-theme');
              var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              if (theme === 'light' || (theme === null && !systemDark)) {
                document.documentElement.classList.add('theme-light');
              }
            } catch (e) {}
          })();
        ` }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,100..900;1,9..144,100..900&family=Source+Serif+4:ital,opsz,wght@0,8..60,200..900;1,8..60,200..900&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body>
        <Navigation />
        <main id="main">
          {children}
        </main>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

