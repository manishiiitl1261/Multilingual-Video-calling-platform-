'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-transparent backdrop-blur-md shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="text-2xl font-bold text-white">Clarity Connect</div>

          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-6">
            <Link href="/" className="text-white hover:text-gray-300 transition">Home</Link>
            <Link href="/about" className="text-white hover:text-gray-300 transition">About</Link>
            <Link href="/services" className="text-white hover:text-gray-300 transition">Services</Link>
            <Link href="/contact" className="text-white hover:text-gray-300 transition">Contact</Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-white focus:outline-none">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-black bg-opacity-80 backdrop-blur-md">
          <div className="flex flex-col space-y-4 py-4 px-6">
            <Link href="/" className="text-white hover:text-gray-300" onClick={() => setIsOpen(false)}>Home</Link>
            <Link href="/about" className="text-white hover:text-gray-300" onClick={() => setIsOpen(false)}>About</Link>
            <Link href="/services" className="text-white hover:text-gray-300" onClick={() => setIsOpen(false)}>Services</Link>
            <Link href="/contact" className="text-white hover:text-gray-300" onClick={() => setIsOpen(false)}>Contact</Link>
          </div>
        </div>
      )}
    </nav>
  );
}
