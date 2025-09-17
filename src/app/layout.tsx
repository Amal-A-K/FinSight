import Link from "next/link";
import "./globals.css";
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import { ThemeProvider } from 'next-themes';
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ReduxProvider } from "@/providers/ReduxProvider";
import { MobileNav } from "@/components/ui/mobile-nav";

const navigation = [
  { name: 'Dashboard', href: '/' },
  { name: 'Transactions', href: '/transactions' },
  { name: 'Add Transaction', href: '/add-transaction' },
  { name: 'Budgets', href: '/budgets' },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-gradient-to-b from-violet-50 to-violet-200 dark:from-violet-950 dark:to-violet-900 transition-colors duration-300">
        <ReduxProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <ToastContainer position="top-right" autoClose={3000} aria-label="Toast Notifications" />
            <nav className="sticky top-0 z-50 bg-violet-900/95 dark:bg-violet-950/95 text-white p-4 shadow-lg backdrop-blur-sm">
              <div className="container mx-auto flex items-center justify-between">
                {/* Desktop Navigation */}
                <div className="hidden md:flex space-x-6">
                  {navigation.map((item) => (
                    <Link 
                      key={item.name}
                      href={item.href}
                      className="hover:text-violet-300 font-medium transition-colors"
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
                
                <div className="flex items-center space-x-4">
                  <MobileNav />
                  <ThemeToggle />
                </div>
              </div>
            </nav>
            <main className="container mx-auto p-4">{children}</main>
          </ThemeProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}