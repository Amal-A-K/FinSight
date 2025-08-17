import Link from "next/link";
import "./globals.css";
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import { ThemeProvider } from 'next-themes';
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-gradient-to-b from-violet-50 to-violet-200 dark:from-violet-950 dark:to-violet-900 transition-colors duration-300">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <ToastContainer position="top-right" autoClose={3000} aria-label="Toast Notifications" />
          <nav className="bg-violet-900 dark:bg-violet-950 text-white p-4 shadow-lg">
            <div className="container mx-auto flex items-center justify-between">
              <div className="flex space-x-6">
                <Link href="/" className="hover:text-violet-300 transition-colors">Dashboard</Link>
                <Link href="/transactions" className="hover:text-violet-300 transition-colors">Transactions</Link>
                <Link href="/add-transaction" className="hover:text-violet-300 transition-colors">Add Transaction</Link>
              </div>
              <ThemeToggle />
            </div>
          </nav>
          <main className="container mx-auto p-4">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}