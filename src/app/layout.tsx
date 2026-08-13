import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import PwaRegister from "@/components/PwaRegister";
import "./globals.css";

const THEMES = ["light", "dark", "blue-moon"] as const;

export const metadata: Metadata = {
  title: "BNI Tracker",
  description:
    "Acompanhe seu desempenho semestral no BNI e mantenha 100 pontos com análise inteligente de KPIs, registro semanal e gestão de referências.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BNI Tracker",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  userScalable: false,
  themeColor: "#CC0000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieTheme = cookies().get("theme")?.value;
  const theme = (THEMES as readonly string[]).includes(cookieTheme ?? "") ? cookieTheme! : "light";

  return (
    <html lang="pt-BR" data-theme={theme}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
