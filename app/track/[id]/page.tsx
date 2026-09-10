"use client";

import React, { useEffect, useState, use, useRef } from "react";
import Link from "next/link";
import { getCompetitionById, subscribeToCompetition } from "@/lib/voting-service";
import { Competition } from "@/types/voting";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Share2, 
  Crown, 
  BarChart3, 
  Check, 
  AlertCircle
} from "lucide-react";

export default function TrackLiveScorePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [lastUpdatedTeamId, setLastUpdatedTeamId] = useState<string | null>(null);
  const [liveAnnouncement, setLiveAnnouncement] = useState<string>("");
  const prevTeamsRef = useRef<Record<string, number>>({});

  useEffect(() => {
    let unsubscribe: () => void = () => {};

    async function init() {
      setLoading(true);
      const initial = await getCompetitionById(id);
      if (initial) {
        setCompetition(initial);
        const map: Record<string, number> = {};
        initial.teams.forEach((t) => (map[t.id] = t.votesCount));
        prevTeamsRef.current = map;
      }

      unsubscribe = subscribeToCompetition(
        id,
        (updated) => {
          if (prevTeamsRef.current && updated.teams) {
            for (const t of updated.teams) {
              const prev = prevTeamsRef.current[t.id] || 0;
              if (t.votesCount > prev) {
                setLastUpdatedTeamId(t.id);
                setLiveAnnouncement(`Update: ${t.name} +1 Vote. Total: ${t.votesCount}`);
                setTimeout(() => setLastUpdatedTeamId(null), 2500);
                break;
              }
            }
            const map: Record<string, number> = {};
            updated.teams.forEach((t) => (map[t.id] = t.votesCount));
            prevTeamsRef.current = map;
          }

          setCompetition(updated);
          setLoading(false);
        },
        (err) => {
          console.warn("Track live listener error:", err);
          setLoading(false);
        }
      );
    }

    init();
    return () => unsubscribe();
  }, [id]);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading && !competition) {
    return (
      <div className="flex-1 w-full h-full flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 border-2 border-[#38BDF8]/20 border-t-[#38BDF8] rounded-full animate-spin mb-6 shadow-[0_0_15px_rgba(56,189,248,0.5)]" />
        <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#38BDF8] animate-pulse">
          CALIBRATING TELEMETRY...
        </p>
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="flex-1 w-full h-full flex flex-col items-center justify-center p-4 text-center">
        <AlertCircle className="w-16 h-16 text-[#EF4444] mb-4 drop-shadow-[0_0_15px_rgba(239,68,68,0.6)]" />
        <h2 className="text-2xl font-black text-[#F8FAFC] uppercase tracking-widest mb-2">HUD OFFLINE</h2>
        <p className="text-[10px] text-[#94A3B8] font-mono tracking-widest uppercase mb-8">
          TARGET NODE NOT FOUND
        </p>
        <Link href="/" className="px-8 py-3 rounded-sm bg-white/10 hover:bg-white/20 text-[#F8FAFC] text-xs font-black tracking-widest uppercase transition-all">
          RETURN TO HUB
        </Link>
      </div>
    );
  }

  const sortedTeams = [...competition.teams].sort((a, b) => b.votesCount - a.votesCount);
  const totalVotes = competition.totalVotes || 0;
  const maxVotes = sortedTeams.length > 0 ? sortedTeams[0].votesCount : 0;
  const isEnded = competition.status === "ended";

  return (
    <div className="flex-1 w-full h-full flex flex-col p-2.5 sm:p-6 lg:p-8 overflow-hidden">
      
      {/* Screen Reader Live Telemetry Announcement */}
      <div aria-live="polite" className="sr-only">
        {liveAnnouncement}
      </div>

      <div className="w-full max-w-7xl mx-auto h-full glass-panel rounded-2xl sm:rounded-[2.5rem] flex flex-col overflow-hidden relative">
        
        {/* Sleek Compact Telemetry Header */}
        <div className="flex-shrink-0 px-4 py-3 sm:p-6 border-b border-white/10 flex items-center justify-between gap-3 z-10 bg-[#38BDF8]/5 backdrop-blur-md">
          {/* Back Button & Match Title */}
          <div className="flex items-center gap-3 min-w-0">
            <Link 
              href={`/competition/${competition.slug || competition.id}`} 
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[#94A3B8] hover:text-[#F8FAFC] text-[10px] font-black tracking-widest uppercase transition-all flex-shrink-0"
              title="Return to Arena"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">ARENA</span>
            </Link>

            <div className="h-6 w-px bg-white/10 flex-shrink-0" />

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-2xl font-black text-[#F8FAFC] tracking-tight uppercase truncate">
                  {competition.title}
                </h1>
                {isEnded ? (
                  <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[#94A3B8] text-[8px] sm:text-[9px] font-bold uppercase tracking-widest flex-shrink-0">
                    ENDED
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-[#4ADE80]/10 border border-[#4ADE80]/30 text-[#4ADE80] text-[8px] sm:text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 flex-shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] animate-ping" />
                    LIVE
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Volume ticker & Share Button */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center gap-1.5 bg-[#38BDF8]/5 border border-[#38BDF8]/20 px-2.5 py-1.5 rounded-lg font-mono text-[10px] text-[#38BDF8]">
              <span className="text-[#94A3B8] text-[8px] uppercase tracking-widest">TOTAL</span>
              <span className="font-black text-xs text-[#F8FAFC]">{totalVotes}</span>
            </div>

            <button
              onClick={handleShare}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black tracking-widest uppercase transition-all border ${
                copied 
                  ? "bg-[#4ADE80]/20 border-[#4ADE80]/50 text-[#4ADE80]" 
                  : "bg-white/5 border-white/10 text-[#F8FAFC] hover:bg-white/10"
              }`}
              title="Share Live Scoreboard"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? "COPIED" : "SHARE"}</span>
            </button>
          </div>
        </div>

        {/* Cricket-Style Multi-Team Live Distribution Bar */}
        <div className="flex-shrink-0 px-4 py-2 bg-black/40 border-b border-white/5 flex items-center justify-between gap-3 text-[10px] font-mono">
          <div className="flex items-center gap-2 min-w-0">
            <Crown className="w-3.5 h-3.5 text-[#38BDF8] flex-shrink-0 animate-pulse" />
            <span className="text-[#94A3B8] uppercase tracking-wider text-[9px]">LEADER:</span>
            <span className="font-black text-[#F8FAFC] truncate uppercase">
              {sortedTeams[0] ? sortedTeams[0].name : "NO VOTES YET"}
            </span>
            {sortedTeams[0] && totalVotes > 0 && (
              <span className="text-[#38BDF8] font-bold">
                ({((sortedTeams[0].votesCount / totalVotes) * 100).toFixed(0)}%)
              </span>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-1 text-[#94A3B8] text-[9px] uppercase tracking-widest">
            <BarChart3 className="w-3 h-3 text-[#38BDF8]" />
            REAL-TIME TELEMETRY
          </div>
        </div>

        {/* Main Content Area: High-Density Scoreboard */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-3 sm:p-6 flex flex-col md:flex-row gap-4 sm:gap-8">
          
          {/* Desktop Only: Spotlight Frontrunner Crown Card */}
          <div className="hidden md:flex md:w-1/3 flex-shrink-0 flex-col">
            {sortedTeams.length > 0 && maxVotes > 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-1 bg-[#38BDF8]/10 backdrop-blur-md border border-[#38BDF8]/30 rounded-2xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-[0_0_30px_rgba(56,189,248,0.1)]"
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-36 bg-[#38BDF8]/20 blur-[50px] rounded-full pointer-events-none" />
                
                <div className="w-16 h-16 rounded-full bg-[#030406] border border-[#38BDF8] flex items-center justify-center shadow-[0_0_20px_rgba(56,189,248,0.4)] mb-4 z-10">
                  <Crown className="w-8 h-8 text-[#38BDF8]" />
                </div>
                
                <span className="text-[#38BDF8] text-[10px] font-bold tracking-[0.2em] uppercase mb-1 z-10">
                  {isEnded ? "VICTOR" : "MATCH FRONTRUNNER"}
                </span>
                
                <h3 className="text-2xl font-black text-[#F8FAFC] tracking-tighter uppercase mb-2 z-10">
                  {sortedTeams[0].name}
                </h3>

                <div className="text-4xl font-black text-[#38BDF8] tracking-tighter neon-text-blue z-10">
                  {sortedTeams[0].votesCount}
                </div>
                <div className="text-[9px] font-mono text-[#94A3B8] uppercase tracking-widest mt-1 z-10">
                  VOTES SECURED
                </div>
              </motion.div>
            ) : (
              <div className="flex-1 bg-[#38BDF8]/5 border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                <BarChart3 className="w-10 h-10 text-[#94A3B8]/40 mb-3" />
                <p className="text-xs font-mono text-[#94A3B8] uppercase tracking-widest">
                  AWAITING FIRST BALLOT
                </p>
              </div>
            )}
          </div>

          {/* Cricket-Style All-Team Observable Standings */}
          <div className="flex-1 flex flex-col justify-start">
            <div className="flex items-center justify-between mb-2.5 pb-1.5 border-b border-white/10">
              <span className="text-[10px] font-black text-[#94A3B8] tracking-widest uppercase">
                ALL CREWS ({sortedTeams.length})
              </span>
              <span className="text-[9px] font-mono font-bold text-[#38BDF8] uppercase tracking-widest flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] animate-pulse" />
                LIVE SYNC
              </span>
            </div>

            {/* High-Density Row List - Observable in 1 Viewport */}
            <div className="space-y-2 flex-1 flex flex-col justify-start">
              <AnimatePresence>
                {sortedTeams.map((team, index) => {
                  const percentage = totalVotes > 0 ? (team.votesCount / totalVotes) * 100 : 0;
                  const isRecentlyUpdated = team.id === lastUpdatedTeamId;
                  const isLeader = index === 0 && team.votesCount > 0;

                  return (
                    <motion.div
                      key={`${team.id}-${index}`}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 350, damping: 25 }}
                      className={`relative px-3.5 py-3 rounded-xl border transition-all duration-300 overflow-hidden ${
                        isRecentlyUpdated 
                          ? "bg-[#38BDF8]/20 border-[#38BDF8] shadow-[0_0_20px_rgba(56,189,248,0.4)] neon-outline" 
                          : isLeader
                          ? "bg-[#38BDF8]/10 border-[#38BDF8]/40 shadow-[0_0_15px_rgba(56,189,248,0.15)]"
                          : "bg-black/30 border-white/10 hover:border-white/20"
                      }`}
                    >
                      {/* Integrated Liquid Progress Fill */}
                      <div 
                        className={`absolute inset-y-0 left-0 transition-all duration-1000 ease-out pointer-events-none ${
                          isLeader 
                            ? "bg-gradient-to-r from-[#38BDF8]/25 to-[#A855F7]/25" 
                            : "bg-[#38BDF8]/15"
                        }`}
                        style={{ width: `${Math.max(percentage, 0)}%` }}
                      />

                      <div className="relative flex items-center justify-between gap-3 z-10">
                        
                        {/* Rank Badge & Team Identity */}
                        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                          {/* Rank Badge */}
                          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg border flex items-center justify-center font-mono font-black text-xs shrink-0 ${
                            isLeader
                              ? "bg-[#38BDF8]/20 border-[#38BDF8] text-[#38BDF8] shadow-[0_0_10px_rgba(56,189,248,0.4)]" 
                              : index === 1
                              ? "bg-white/5 border-white/20 text-[#F8FAFC]"
                              : index === 2
                              ? "bg-[#A855F7]/10 border-[#A855F7]/40 text-[#A855F7]"
                              : "bg-white/5 border-white/10 text-[#64748B]"
                          }`}>
                            {isLeader ? (
                              <Crown className="w-3.5 h-3.5 text-[#38BDF8]" />
                            ) : (
                              `0${index + 1}`
                            )}
                          </div>

                          {/* Team Name & Tag */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs sm:text-sm font-black text-[#F8FAFC] tracking-tight uppercase truncate">
                                {team.name}
                              </h4>
                              <span className="px-1.5 py-0.5 rounded bg-white/10 text-[#94A3B8] text-[8px] font-mono uppercase flex-shrink-0">
                                {team.tag}
                              </span>
                            </div>

                            {/* Mobile Live Status Alert */}
                            {isRecentlyUpdated && (
                              <span className="text-[#38BDF8] text-[8px] font-black uppercase tracking-widest animate-pulse inline-flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-[#38BDF8] animate-ping" />
                                +1 VOTE RECEIVED
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Cricket Scoreboard Right Stats: Votes & % Share */}
                        <div className="flex items-center justify-end gap-3 sm:gap-6 flex-shrink-0">
                          {/* Vote Count */}
                          <div className="flex flex-col items-end">
                            <span className="text-base sm:text-xl font-black text-[#F8FAFC] tabular-nums leading-none">
                              {team.votesCount}
                            </span>
                            <span className="text-[7px] sm:text-[8px] font-mono text-[#94A3B8] uppercase tracking-widest mt-0.5">
                              {team.votesCount === 1 ? "VOTE" : "VOTES"}
                            </span>
                          </div>

                          {/* Percentage Share */}
                          <div className="w-12 text-right">
                            <span className={`text-xs sm:text-sm font-black tabular-nums ${
                              isLeader ? "text-[#38BDF8] neon-text-blue text-sm sm:text-base" : "text-[#94A3B8]"
                            }`}>
                              {percentage.toFixed(0)}%
                            </span>
                          </div>
                        </div>

                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
