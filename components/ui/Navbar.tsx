"use client";

import React, { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Flame, 
  ShieldCheck, 
  Menu, 
  X, 
  LogIn, 
  LogOut,
  ChevronDown
} from "lucide-react";

const emptySubscribe = () => () => {};

export default function Navbar() {
  const pathname = usePathname();
  const { user, signInWithGoogle, signOutUser, simulateLogin, isSimulated } = useAuth();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authDropdownOpen, setAuthDropdownOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "ARENAS", icon: Flame },
    { href: "/admin", label: "SYSTEM ADMIN", icon: ShieldCheck },
  ];

  const isTrackPage = pathname?.startsWith("/track/");

  return (
    <header className={`relative z-50 w-full px-4 sm:px-6 py-4 flex-shrink-0 ${isTrackPage ? 'hidden md:block' : ''}`}>
      {/* Gamified HUD Dock */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-6xl mx-auto glass-panel rounded-full px-4 sm:px-6 py-2 flex items-center justify-between border-b border-[#38BDF8]/30 shadow-[0_4px_20px_rgba(56,189,248,0.1)]"
      >
        
        {/* Brand Logo */}
        <Link 
          href="/" 
          className="flex items-center gap-3 group focus-visible:outline-none"
        >
          <div className="relative w-8 h-8 rounded-full bg-[#030406] flex items-center justify-center transition-transform group-hover:scale-105 border border-[#38BDF8]/50 shadow-[0_0_10px_rgba(56,189,248,0.4)]">
            <Image
              src="/icat-emblem.png"
              alt="ICAT"
              width={24}
              height={24}
              className="object-contain"
            />
          </div>
          <span className="text-sm font-black tracking-widest text-[#F8FAFC] uppercase">
            ICAT<span className="text-[#38BDF8] neon-text-blue">VOTE</span>
          </span>
        </Link>

        {/* Center Navigation (Desktop) */}
        <nav className="hidden md:flex items-center gap-2 p-1.5 rounded-full bg-[#38BDF8]/5 backdrop-blur-md border border-white/5">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative flex items-center gap-2 px-6 py-2 rounded-full text-xs font-bold tracking-widest uppercase transition-colors ${
                  isActive
                    ? "text-[#030406]"
                    : "text-[#94A3B8] hover:text-[#F8FAFC]"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="navbar-active"
                    className="absolute inset-0 bg-[#38BDF8] rounded-full shadow-[0_0_15px_rgba(56,189,248,0.5)]"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <link.icon className={`relative z-10 w-4 h-4 ${isActive ? "text-[#030406]" : ""}`} />
                <span className="relative z-10">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Auth Action (Desktop) */}
        <div className="hidden md:flex items-center gap-2">
          {mounted && user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setAuthDropdownOpen(!authDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#38BDF8]/5 backdrop-blur-md hover:bg-[#38BDF8]/10 backdrop-blur-md border border-white/10 text-xs text-[#F8FAFC] transition-all shadow-sm"
              >
                <div className="w-6 h-6 rounded-full bg-[#38BDF8]/20 border border-[#38BDF8]/50 flex items-center justify-center text-[10px] font-bold text-[#38BDF8]">
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : "U"}
                </div>
                <span className="truncate max-w-[110px] font-bold tracking-wider">
                  {user.displayName || user.email || "GUEST"}
                </span>
                <ChevronDown className="w-4 h-4 text-[#94A3B8]" />
              </button>

              <AnimatePresence>
                {authDropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-3 w-64 rounded-3xl bg-[#030406]/95 backdrop-blur-3xl p-3 z-50 border border-[#38BDF8]/30 shadow-[0_10px_40px_rgba(0,0,0,0.8)]"
                  >
                    <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-2xl mb-2">
                      <p className="text-sm font-bold text-[#F8FAFC] truncate">{user.displayName || "GUEST_USER"}</p>
                      <p className="text-xs text-[#94A3B8] truncate mt-0.5">{user.email || "NO_UPLINK"}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        signOutUser();
                        setAuthDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-[#EF4444] hover:bg-[#EF4444]/10 rounded-2xl transition-all uppercase tracking-widest"
                    >
                      <LogOut className="w-4 h-4" />
                      DISCONNECT
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            mounted ? (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => signInWithGoogle()}
                  className="flex items-center gap-2 px-6 py-2 rounded-full bg-[#38BDF8] text-[#030406] hover:bg-[#00D2FF] text-xs font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(56,189,248,0.4)] transition-all"
                >
                  <LogIn className="w-4 h-4" />
                  INIT LINK
                </button>
              </div>
            ) : <div className="w-32 h-10" />
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2.5 rounded-full bg-[#38BDF8]/5 backdrop-blur-md border border-white/10 text-[#F8FAFC]"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </motion.div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden mt-3 max-w-4xl mx-auto bg-[#030406]/95 backdrop-blur-3xl border border-[#38BDF8]/30 rounded-3xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.8)]"
          >
            <div className="p-4 space-y-4">
              <nav className="flex flex-col gap-2">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-bold tracking-widest uppercase transition-all ${
                        isActive
                          ? "bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/50"
                          : "text-[#94A3B8] hover:bg-white/5"
                      }`}
                    >
                      <link.icon className={`w-5 h-5 ${isActive ? "text-[#38BDF8]" : ""}`} />
                      {link.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="pt-4 border-t border-white/10">
                {mounted && user ? (
                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={() => {
                        signOutUser();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30 hover:bg-[#EF4444]/20 text-sm font-bold tracking-widest uppercase"
                    >
                      <LogOut className="w-5 h-5" />
                      DISCONNECT
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      signInWithGoogle();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-5 py-4 rounded-2xl bg-[#38BDF8] text-[#030406] text-sm font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(56,189,248,0.4)]"
                  >
                    <LogIn className="w-5 h-5" />
                    INIT LINK
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
