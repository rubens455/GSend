import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { QueryProvider } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ConditionalSidebar from "@/components/ConditionalSidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GSend - SMS Marketing Platform",
  description: "Professional SMS marketing and automation platform",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head />
      <body className={inter.className}>
        <AuthProvider>
          <QueryProvider>
            <TooltipProvider>
              <Toaster />
              <ConditionalSidebar>
                {children}
              </ConditionalSidebar>
            </TooltipProvider>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
