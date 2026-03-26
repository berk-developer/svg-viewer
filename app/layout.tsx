import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { siteUrl } from "@/lib/site";
import "./globals.css";

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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,100..900;1,9..144,100..900&family=Source+Serif+4:ital,opsz,wght@0,8..60,200..900;1,8..60,200..900&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body>
        <Navigation />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

function Navigation() {
  return (
    <header className="siteHeader">
      <div className="siteHeaderInner">
        <a href="/" className="siteBrand">
          <svg className="siteBrandIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          <span className="siteBrandText">SVG Tools</span>
        </a>
        <nav className="mainNav">
          <NavLink href="/" exact>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 3v18" />
            </svg>
            Viewer
          </NavLink>
          <NavLink href="/compare">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="4" width="8" height="16" rx="1" />
              <rect x="13" y="4" width="8" height="16" rx="1" />
            </svg>
            Compare
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

function NavLink({ href, exact, children }: { href: string; exact?: boolean; children: React.ReactNode }) {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  const isActive = exact ? pathname === href : pathname.startsWith(href);
  
  return (
    <a href={href} className={`navLink ${isActive ? 'navLink--active' : ''}`}>
      {children}
    </a>
  );
}

