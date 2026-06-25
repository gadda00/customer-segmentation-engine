import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Customer Segmentation Engine — RFM + K-Means",
  description: "Production-grade customer segmentation with RFM analysis, K-Means clustering, and silhouette optimization",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
