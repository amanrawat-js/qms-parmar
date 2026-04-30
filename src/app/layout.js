import Providers from "@/components/Providers"; // You'll need to create this for Theme/Session
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Suspense } from "react";
import Script from "next/script";

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        
      </head>
      <body>
        <Suspense fallback={<div className="min-h-[70vh]" />}>
          <Providers>
            {children}
            <Toaster richColors position="top-right" />
          </Providers>
        </Suspense>
      </body>
    </html>
  );
}
