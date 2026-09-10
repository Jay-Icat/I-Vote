"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { getCompetitions } from "@/lib/voting-service";
import { Competition } from "@/types/voting";
import { 
  Flame, 
  Trophy, 
  ShieldAlert,
  ArrowRight,
  Activity
} from "lucide-react";

export default function HomePage() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await getCompetitions();
      setCompetitions(res.competitions);
      setLoading(false);
    }
    load();
  }, []);

  const totalVotesCast = competitions.reduce((acc, c) => acc + (c.totalVotes || 0), 0);
  const activeCompetitions = competitions.filter((c) => c.status === "active");

  return (
    <div className="flex-1 w-full h-full flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      
      <div className="w-full max-w-7xl h-full glass-panel rounded-[2.5rem] flex flex-col overflow-hidden relative">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#38BDF8]/10 blur-[100px] pointer-events-none rounded-full" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#A855F7]/10 blur-[100px] pointer-events-none rounded-full" />
        
        {/* Header Section */}
        <div className="flex-shrink-0 p-6 sm:p-8 border-b border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 rounded-full bg-[#4ADE80]/10 border border-[#4ADE80]/30 text-[#4ADE80] text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] animate-pulse" />
                SYSTEM ONLINE
              </span>
              <span className="text-[10px] font-mono text-[#94A3B8] tracking-widest">v1.2.0</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-[#F8FAFC] tracking-tighter uppercase">
              ICAT <span className="text-[#38BDF8] neon-text-blue">VOTING SYSTEM</span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="px-5 py-3 rounded-2xl bg-[#38BDF8]/5 backdrop-blur-md border border-white/5 flex items-center gap-3">
              <Activity className="w-4 h-4 text-[#38BDF8]" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Active Links</span>
                <span className="text-sm font-black text-[#F8FAFC] font-mono">{activeCompetitions.length}</span>
              </div>
            </div>
            <div className="px-5 py-3 rounded-2xl bg-[#38BDF8]/5 backdrop-blur-md border border-white/5 flex items-center gap-3">
              <Flame className="w-4 h-4 text-[#A855F7]" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">Total Volume</span>
                <span className="text-sm font-black text-[#F8FAFC] font-mono">{totalVotesCast}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar relative z-10 p-6 sm:p-8">
          {loading ? (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <div className="w-12 h-12 border-4 border-[#38BDF8]/20 border-t-[#38BDF8] rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(56,189,248,0.5)]" />
              <p className="text-[#38BDF8] font-bold tracking-widest text-xs uppercase animate-pulse">Scanning Grid...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              <AnimatePresence>
                {competitions.map((comp, idx) => (
                  <motion.div
                    key={comp.id}
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: idx * 0.1, type: "spring", stiffness: 200, damping: 20 }}
                  >
                    <Link 
                      href={`/competition/${comp.slug || comp.id}`}
                      className="block h-full group"
                    >
                      <div className="playing-card h-[200px] sm:h-auto sm:aspect-[5/7] p-5 sm:p-6 flex flex-col justify-between relative">
                        {/* Status Strip */}
                        <div className={`absolute top-0 left-0 w-full h-1 ${
                          comp.status === "active" ? "bg-gradient-to-r from-[#4ADE80] to-[#38BDF8]" : "bg-[#94A3B8]"
                        }`} />

                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-[#94A3B8] tracking-widest bg-[#38BDF8]/5 backdrop-blur-md px-2 py-0.5 rounded border border-white/10">
                            ID: {comp.id.substring(0,6)}
                          </span>
                          {comp.status === "active" && (
                            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#4ADE80]/10 border border-[#4ADE80]/30 text-[#4ADE80] text-[9px] font-bold uppercase tracking-widest">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] animate-pulse" />
                              LIVE
                            </span>
                          )}
                        </div>

                        <div className="my-auto py-1">
                          <h3 className="text-xl sm:text-2xl font-black text-[#F8FAFC] group-hover:text-[#38BDF8] transition-colors line-clamp-1 sm:line-clamp-2 uppercase tracking-tight mb-1">
                            {comp.title}
                          </h3>
                          
                          <p className="text-xs sm:text-sm text-[#94A3B8] line-clamp-2 sm:line-clamp-4">
                            {comp.description}
                          </p>
                        </div>

                        <div className="pt-3 sm:pt-6 border-t border-white/10 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex flex-col">
                              <span className="text-[9px] sm:text-[10px] font-bold text-[#475569] uppercase tracking-widest">CREWS</span>
                              <span className="text-sm font-black text-[#F8FAFC] font-mono">{comp.teams.length}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[9px] sm:text-[10px] font-bold text-[#475569] uppercase tracking-widest">VOTES</span>
                              <span className="text-sm font-black text-[#38BDF8] font-mono">{comp.totalVotes || 0}</span>
                            </div>
                          </div>
                          
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#38BDF8]/10 border border-[#38BDF8]/30 flex items-center justify-center group-hover:bg-[#38BDF8] group-hover:text-[#030406] transition-all text-[#38BDF8] shadow-[0_0_10px_rgba(56,189,248,0)] group-hover:shadow-[0_0_15px_rgba(56,189,248,0.5)]">
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
