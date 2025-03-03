"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
};

export default function Navbar() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const pathname = usePathname();

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const navItems: NavItem[] = [
    { href: "/", label: "Home" },
    { href: "/AboutUs", label: "About" },
    { href: "/services", label: "Services" },
    { href: "/contact", label: "Contact" },
  ];

  // Function to check if a route is active
  const isActive = (path: string): boolean => {
    // Exact match for home, startsWith for other routes
    if (path === "/") {
      return pathname === "/";
    }
    return pathname?.startsWith(path) || false;
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-gradient-to-b from-black to-transparent backdrop-blur-md shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="text-xl sm:text-2xl font-bold text-white">
            Clarity Connect
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-4 lg:space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
                  isActive(item.href)
                    ? "bg-purple-700 text-white border border-purple-400"
                    : "text-white hover:bg-purple-700/50 hover:text-white hover:border hover:border-purple-400"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-white p-2 rounded-md hover:bg-purple-700/30 focus:outline-none"
              aria-label={isOpen ? "Close menu" : "Open menu"}
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-black bg-opacity-90 backdrop-blur-md border-t border-gray-700">
          <div className="flex flex-col py-2 px-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-4 py-3 rounded-md text-base font-medium transition-all duration-300 my-1 ${
                  isActive(item.href)
                    ? "bg-purple-700 text-white border border-purple-400"
                    : "text-white hover:bg-purple-700/50 hover:text-white hover:border hover:border-purple-400"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
