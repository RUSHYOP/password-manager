import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "SecureVault - Password Manager",
  description: "A secure and modern password manager to keep your credentials safe",
  keywords: ["password manager", "security", "vault", "credentials"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            className: "glass border-white/10",
            style: {
              background: "rgba(30, 30, 45, 0.9)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              color: "#f1f5f9",
            },
          }}
        />
      </body>
    </html>
  );
}
