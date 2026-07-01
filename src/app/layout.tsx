import type { Metadata, Viewport } from "next";
import { Geist, Lora } from "next/font/google";
import { FirebaseAnalytics } from "@/components/providers/firebase-analytics";
import { CookieConsentProvider } from "@/components/legal/cookie-consent";
import { UserAuthProvider } from "@/components/providers/user-auth-provider";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#312e81",
};

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: "Líneas y Letras — Literatura, fe y palabras que inspiran",
  description:
    "Lee, escribe y comparte parábolas, lecciones de vida y relatos profundos en Líneas y Letras.",
  applicationName: "Líneas y Letras",
  openGraph: {
    siteName: "Líneas y Letras",
    locale: "es_ES",
    type: "website",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Líneas y Letras",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} ${lora.variable} h-full`}>
      <body className="min-h-full flex flex-col font-sans overscroll-none">
        <CookieConsentProvider>
          <UserAuthProvider>{children}</UserAuthProvider>
        </CookieConsentProvider>
        <FirebaseAnalytics />
      </body>
    </html>
  );
}
