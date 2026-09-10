"use client";

import React from "react";
import { Team } from "@/types/voting";
import { Check, Flame, Lock } from "lucide-react";
import { motion } from "framer-motion";

interface TeamCardProps {
  team: Team;
  totalVotes: number;
  hasVoted: boolean;
  userVotedTeamId?: string;
  isEnded: boolean;
  onSelectVote: (team: Team) => void;
}

export default function TeamCard({
  team,
  totalVotes,
  hasVoted,
  userVotedTeamId,
  isEnded,
  onSelectVote,
}: TeamCardProps) {
  const isSelected = hasVoted && userVotedTeamId === team.id;
  const isLockedOut = hasVoted && userVotedTeamId !== team.id;

  const percentage = totalVotes > 0 
    ? Math.round((team.votesCount / totalVotes) * 100) 
    : 0;

  return (
    <motion.div
      onClick={() => !hasVoted && !isEnded && onSelectVote(team)}
      className={`playing-card flex flex-col justify-between p-5 sm:p-7 h-[200px] sm:h-auto sm:aspect-[5/7] relative ${!hasVoted && !isEnded ? 'cursor-pointer' : ''} ${
        isSelected
          ? "neon-outline shadow-[0_0_30px_rgba(56,189,248,0.5)]"
          : ""
      }`}
    >
      {/* Selected indicator pill */}
      {isSelected && (
        <div className="absolute top-0 right-6 sm:left-1/2 sm:-translate-x-1/2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-b-xl bg-[#38BDF8] text-[#030406] text-[9px] sm:text-[10px] font-black uppercase tracking-widest shadow-[0_5px_20px_rgba(56,189,248,0.5)] z-10 flex items-center gap-1.5">
          <Check className="w-3 h-3 stroke-[3]" />
          LOCKED
        </div>
      )}

      <div>
        {/* Team Header */}
        <div className="flex items-start justify-between gap-3 mb-1 sm:mb-4">
          <div>
            <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-mono font-bold bg-white/5 border border-white/10 text-[#94A3B8] uppercase tracking-widest">
              ID: {team.tag}
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-[#F8FAFC] tracking-tighter uppercase mt-1 sm:mt-2">
              {team.name}
            </h3>
          </div>
          <div className="text-right">
            <span className="text-xl sm:text-3xl font-black text-[#38BDF8] block neon-text-blue">
              {percentage}%
            </span>
            <span className="text-[10px] font-mono text-[#475569] uppercase tracking-widest">
              {team.votesCount} VOL
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-[11px] sm:text-xs text-[#94A3B8] leading-tight sm:leading-relaxed line-clamp-1 sm:line-clamp-2 mt-1 sm:mt-2 font-mono">
          {team.description}
        </p>

        {/* Liquid Fill Gauge */}
        <div 
          className="w-full h-1.5 sm:h-2 bg-[#030406] border border-white/10 my-2.5 sm:my-6 overflow-hidden relative"
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(percentage, 1)}%` }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-0 left-0 h-full liquid-fill"
          />
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-1 sm:pt-2">
        {isSelected ? (
          <button
            type="button"
            disabled
            className="w-full h-9 sm:h-12 rounded-xl bg-[#38BDF8]/10 border border-[#38BDF8]/30 text-[#38BDF8] text-xs font-black tracking-widest uppercase flex items-center justify-center gap-2 cursor-default"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            BALLOT SECURED
          </button>
        ) : isLockedOut ? (
          <button
            type="button"
            disabled
            className="w-full h-9 sm:h-12 rounded-xl bg-[#38BDF8]/5 backdrop-blur-md border border-white/5 text-[#475569] text-xs font-black tracking-widest uppercase flex items-center justify-center gap-2 cursor-not-allowed"
          >
            <Lock className="w-4 h-4" />
            LOCKED OUT
          </button>
        ) : isEnded ? (
          <button
            type="button"
            disabled
            className="w-full h-9 sm:h-12 rounded-xl bg-[#38BDF8]/5 backdrop-blur-md border border-[#EF4444]/20 text-[#EF4444]/50 text-xs font-black tracking-widest uppercase flex items-center justify-center gap-2 cursor-not-allowed"
          >
            ARENA CLOSED
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onSelectVote(team)}
            className="w-full h-9 sm:h-12 rounded-xl bg-white text-[#030406] hover:bg-[#38BDF8] text-xs font-black tracking-widest uppercase flex items-center justify-center gap-2 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:shadow-[0_0_20px_rgba(56,189,248,0.5)]"
          >
            <Flame className="w-4 h-4" />
            SELECT {team.tag}
          </button>
        )}
      </div>
    </motion.div>
  );
}
