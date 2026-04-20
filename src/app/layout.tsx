import type { Metadata } from "next";
import { Inter, Lora, Fira_Code } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils/utils";
import { Providers } from "./providers";

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontSerif = Lora({
  subsets: ["latin"],
  variable: "--font-serif",
});

const fontMono = Fira_Code({
  subsets: ["latin"],
  variable: "--font-mono",
});


export const metadata: Metadata = {
  title: "b-link",
  description: "Sistema di gestione donazioni sangue",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="it"
      className={cn("h-full", "antialiased", fontSans.variable, fontMono.variable, "font-sans", fontSerif.variable)}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}