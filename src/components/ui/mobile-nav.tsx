'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const navigation = [
  { name: 'Dashboard', href: '/' },
  { name: 'Transactions', href: '/transactions' },
  { name: 'Add Transaction', href: '/add-transaction' },
  { name: 'Budgets', href: '/budgets' },
];

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="md:hidden">
      {/* Mobile menu button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors duration-200 z-50 relative"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </motion.button>

      {/* Collapsing dropdown under navbar */}
      <AnimatePresence initial={false}>
        <motion.div
          initial={false}
          animate={isOpen ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className={`md:hidden overflow-hidden fixed left-0 right-0 z-[60] ${
            isScrolled || isOpen ? 'top-16' : 'top-16'
          }`}
        >
          <div className={`w-full rounded-none shadow-xl ring-1 bg-violet-50 dark:bg-violet-900 ring-violet-200 dark:ring-violet-800 text-violet-900 dark:text-violet-100 ${isOpen ? 'backdrop-blur-sm' : ''}`}>
            <div className="flex items-center p-4 border-b border-violet-200 dark:border-violet-800">
              <h3 className="text-xl font-semibold text-violet-900 dark:text-violet-100">Menu</h3>
            </div>
            <nav className="divide-y divide-violet-200 dark:divide-violet-800 p-2">
              {navigation.map((item, index) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.04 * index }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="block w-full text-left px-4 py-4 text-base font-medium text-violet-900 dark:text-violet-100 hover:bg-violet-100 dark:hover:bg-violet-800 transition-colors"
                  >
                    {item.name}
                  </Link>
                </motion.div>
              ))}
            </nav>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
