/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Menu, X, UserCircle, LogOut, Settings } from "lucide-react";
import { usePathname } from "next/navigation";
import Image from "next/image";

type NavItem = {
  href: string;
  label: string;
};

type User = {
  id: string;
  name: string;
  email: string;
  profilePicture: string;
};

export default function Navbar() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Add click outside handler for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Check if user is logged in
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Error parsing user data", error);
        localStorage.removeItem("user");
      }
    }
  }, []);

  const navItems: NavItem[] = [
    { href: "/", label: "Home" },
    { href: "/AboutUs", label: "About" },
    { href: "/Services", label: "Services" },
    { href: "/ContactUs", label: "Contact" },
  ];

  // Function to check if a route is active
  const isActive = (path: string): boolean => {
    // Exact match for home, startsWith for other routes
    if (path === "/") {
      return pathname === "/";
    }
    return pathname?.startsWith(path) || false;
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    setDropdownOpen(false);
    // Redirect to home page
    window.location.href = "/";
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

            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-2 text-white"
                  aria-label="User menu"
                >
                  <div className="relative w-8 h-8 rounded-full overflow-hidden border border-purple-400">
                    {user.profilePicture &&
                    user.profilePicture !== "default" ? (
                      <Image
                        src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${user.profilePicture}`}
                        alt={user.name}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `/default-avatar.svg`;
                        }}
                      />
                    ) : (
                      <Image
                        src="/default-avatar.svg"
                        alt={user.name}
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                    <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                      <div className="font-semibold">{user.name}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-100 flex items-center"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <Settings size={16} className="mr-2" />
                      Profile Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-100 flex items-center"
                    >
                      <LogOut size={16} className="mr-2" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/Login"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
                  isActive("/Login")
                    ? "bg-purple-700 text-white border border-purple-400"
                    : "text-white hover:bg-purple-700/50 hover:text-white hover:border hover:border-purple-400"
                }`}
              >
                Login
              </Link>
            )}
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

            {user ? (
              <>
                <div className="flex items-center space-x-3 px-4 py-3 border-t border-gray-700 text-white">
                  <div className="relative w-8 h-8 rounded-full overflow-hidden border border-purple-400">
                    {user.profilePicture &&
                    user.profilePicture !== "default" ? (
                      <Image
                        src={`${process.env.NEXT_PUBLIC_API_URL}/uploads/${user.profilePicture}`}
                        alt={user.name}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `/default-avatar.svg`;
                        }}
                      />
                    ) : (
                      <Image
                        src="/default-avatar.svg"
                        alt={user.name}
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-xs text-gray-400">{user.email}</div>
                  </div>
                </div>
                <Link
                  href="/profile"
                  className="block px-4 py-3 text-white hover:bg-purple-700/50 rounded-md my-1 flex items-center"
                >
                  <Settings size={18} className="mr-2" />
                  Profile Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="block text-left w-full px-4 py-3 text-white hover:bg-purple-700/50 rounded-md my-1 flex items-center"
                >
                  <LogOut size={18} className="mr-2" />
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/Login"
                className={`block px-4 py-3 rounded-md text-base font-medium transition-all duration-300 my-1 ${
                  isActive("/Login")
                    ? "bg-purple-700 text-white border border-purple-400"
                    : "text-white hover:bg-purple-700/50 hover:text-white hover:border hover:border-purple-400"
                }`}
              >
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
