import 'bootstrap/dist/css/bootstrap.css';
import { Inter } from "next/font/google";
import "./globals.css";
import LayoutShell from "./LayoutShell";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "FeminizidMap.org",
  description: "A research project on femi(ni)cides in Germany",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}
