import Link from "next/link";
import "./globals.css";
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-b from-violet-100 to-violet-300 ">
        <ToastContainer position="top-right" autoClose={3000} aria-label="Toast Notifications" />
        <nav className="bg-violet-900 text-white p-4">
          <div className="container mx-auto flex space-x-6 justify-between">
            <Link href="/" className="hover:text-violet-300">Dashboard</Link>
            <Link href="/transactions" className="hover:text-violet-300">Transactions</Link>
            <Link href="/add-transaction" className="hover:text-violet-300">Add Transaction</Link>
          </div>
        </nav>
        <main className="container mx-auto p-4">{children}</main>
      </body>
    </html>
  );
}