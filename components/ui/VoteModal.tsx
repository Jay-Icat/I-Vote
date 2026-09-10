"use client";

import React, { useEffect, useRef } from "react";
import { Team } from "@/types/voting";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface VoteModalProps {
  isOpen: boolean;
  team: Team | null;
  competitionTitle: string;
  isSubmitting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function VoteModal({
  isOpen,
  team,
  competitionTitle,
  isSubmitting,
  onConfirm,
  onClose,
}: VoteModalProps) {
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      setTimeout(() => confirmBtnRef.current?.focus(), 50);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && team && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#030406]/80 backdrop-blur-md"
            onClick={!isSubmitting ? onClose : undefined}
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-md bg-[#030406]/95 backdrop-blur-3xl rounded-2xl p-8 relative overflow-hidden border border-[#EF4444]/50 shadow-[0_0_40px_rgba(239,68,68,0.3)] z-10"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            {/* Top scanning line */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#EF4444] via-[#F8FAFC] to-[#EF4444] opacity-80" />

            <div className="flex items-center justify-between pb-5 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#EF4444]/20 border border-[#EF4444]/50 flex items-center justify-center text-[#EF4444] shadow-[0_0_10px_rgba(239,68,68,0.4)]">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <h2 id="modal-title" className="text-sm font-black tracking-widest text-[#F8FAFC] uppercase">
                  CONFIRM ACTION
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="p-1.5 rounded-sm bg-white/5 hover:bg-white/10 text-[#94A3B8] hover:text-[#F8FAFC] transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-8 space-y-5 text-center">
              <div className="p-6 bg-black/40 border border-white/10 shadow-inner rounded-xl">
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#38BDF8] font-bold">
                  TARGET CREW
                </span>
                <h3 className="text-3xl font-black text-[#F8FAFC] mt-2 tracking-tighter uppercase neon-text-blue">
                  {team.name}
                </h3>
                <span className="inline-block mt-3 px-3 py-1 bg-white/5 border border-white/10 text-[#94A3B8] text-[10px] font-mono tracking-widest uppercase">
                  ID: {team.tag}
                </span>
              </div>

              <p className="text-xs text-[#94A3B8] font-mono leading-relaxed px-2 uppercase tracking-wide">
                Voting for <strong className="text-[#F8FAFC]">{competitionTitle}</strong>. 
                <br/><br/>
                <span className="text-[#EF4444] font-bold">WARNING:</span> 1 ACCOUNT = 1 VOTE. 
                THIS ACTION IS IRREVERSIBLE.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="w-full sm:w-auto flex-1 h-12 bg-transparent text-[#94A3B8] hover:text-[#F8FAFC] text-xs font-black tracking-widest transition-all border border-white/10 hover:border-white/30"
              >
                ABORT
              </button>
              <button
                ref={confirmBtnRef}
                type="button"
                onClick={onConfirm}
                disabled={isSubmitting}
                className="w-full sm:w-auto flex-[2] h-12 bg-[#EF4444] text-[#030406] hover:bg-[#F87171] text-xs font-black tracking-widest uppercase flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.4)]"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#030406]/30 border-t-[#030406] rounded-full animate-spin" />
                    EXECUTING...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    CONFIRM BALLOT
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
