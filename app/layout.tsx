import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BlunderLess — Chess Improvement Tracker",
  description:
    "Connect your chess account, find your biggest weaknesses, and get a weekly coaching report that tells you exactly what to work on.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-stone-50 text-stone-900 antialiased">
        {children}
      </body>
    </html>
  );
}
