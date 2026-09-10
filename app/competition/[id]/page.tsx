"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { 
  getCompetitionById, 
  subscribeToCompetition, 
  checkUserVote, 
  castVote 
} from "@/lib/voting-service";
import { Competition, Team, UserVoteStatus } from "@/types/voting";
import TeamCard from "@/components/ui/TeamCard";
import VoteModal from "@/components/ui/VoteModal";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Lock, 
  CheckCircle2, 
  AlertCircle,
  LogIn,
  Activity
} from "lucide-react";

export default function CompetitionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user, signInWithGoogle, simulateLogin } = useAuth();

  const [competition, setCompetition] = useState<Competition | null>(null);
  const [loading, setLoading] = useState(true);
  const [voteStatus, setVoteStatus] = useState<UserVoteStatus>({ hasVoted: false });
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    let unsubscribe: () => void = () => {};

    async function init() {
      setLoading(true);
      const initial = await getCompetitionById(id);
      if (initial) {
        setCompetition(initial);
      }

      unsubscribe = subscribeToCompetition(
        id,
        (updated) => {
          setCompetition(updated);
          setLoading(false);
        },
        (err) => {
          console.warn("Real-time listener warning:", err);
          setLoading(false);
        }
      );
    }

    init();
    return () => unsubscribe();
  }, [id]);

  useEffect(() => {
    async function check() {
      if (user && competition) {
        const status = await checkUserVote(competition.id, user.uid);
        setVoteStatus(status);
      } else {
        setVoteStatus({ hasVoted: false });
      }
    }
    check();
  }, [user, competition]);

  const handleSelectTeam = (team: Team) => {
    if (!user) {
      setFeedbackMsg({
        type: "error",
        text: "UNAUTHORIZED: INITIALIZE LINK TO CAST BALLOT.",
      });
      return;
    }

    if (voteStatus.hasVoted) {
      setFeedbackMsg({
        type: "error",
        text: "REJECTED: ACCOUNT HAS ALREADY SUBMITTED BALLOT.",
      });
      return;
    }

    setSelectedTeam(team);
    setIsModalOpen(true);
  };

  const handleConfirmVote = async () => {
    if (!user || !competition || !selectedTeam) return;

    setIsSubmitting(true);
    const result = await castVote({
      competitionId: competition.id,
      userId: user.uid,
      teamId: selectedTeam.id,
      userEmail: user.email || ""
    });
    setIsSubmitting(false);

    if (result.success) {
      setIsModalOpen(false);
      setVoteStatus({ hasVoted: true, teamId: selectedTeam.id });
      setFeedbackMsg({
        type: "success",
        text: "BALLOT SECURED AND VERIFIED.",
      });
      confetti({
        particleCount: 100,
        spread: 100,
        origin: { y: 0.5 },
        colors: ["#38BDF8", "#A855F7", "#F8FAFC"],
        disableForReducedMotion: true
      });
    } else {
      setFeedbackMsg({
        type: "error",
        text: `ERROR: ${result.error?.toUpperCase() || "BALLOT REJECTED."}`,
      });
      setIsModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 w-full h-full flex flex-col items-center justify-center p-8">
        <div className="w-16 h-16 border-2 border-[#38BDF8]/20 border-t-[#38BDF8] rounded-full animate-spin shadow-[0_0_15px_rgba(56,189,248,0.5)]" />
        <p className="mt-6 text-[#38BDF8] font-bold tracking-[0.3em] uppercase text-xs animate-pulse">
          ACCESSING ARENA...
        </p>
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center h-full">
        <AlertCircle className="w-16 h-16 text-[#EF4444] mb-4 drop-shadow-[0_0_15px_rgba(239,68,68,0.6)]" />
        <h2 className="text-2xl font-black text-[#F8FAFC] tracking-widest uppercase mb-2">ARENA OFFLINE</h2>
        <p className="text-[#94A3B8] font-mono text-xs uppercase tracking-widest mb-8">Node not found in registry.</p>
        <Link href="/" className="px-8 py-3 rounded-sm bg-white/10 hover:bg-white/20 text-[#F8FAFC] text-xs font-black tracking-widest uppercase transition-all">
          RETURN TO HUB
        </Link>
      </div>
    );
  }

  const isEnded = competition.status === "ended";

  return (
    <div className="flex-1 w-full h-full flex flex-col p-4 sm:p-6 lg:p-8 overflow-hidden">
      
      <div className="w-full max-w-7xl mx-auto h-full glass-panel rounded-[2.5rem] flex flex-col overflow-hidden relative">
        
        {/* 1. Header & Context */}
        <div className="flex-shrink-0 p-6 sm:p-8 border-b border-white/10 flex flex-col md:flex-row md:items-start justify-between gap-6 z-10 bg-[#38BDF8]/5 backdrop-blur-md">
          <div>
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-[#94A3B8] hover:text-[#F8FAFC] text-[10px] font-black tracking-widest uppercase transition-all mb-6"
            >
              <ArrowLeft className="w-3 h-3" />
              HUB
            </Link>
            
            <div className="flex items-center gap-3 mb-2">
              {isEnded ? (
                <span className="px-2 py-1 rounded-sm bg-white/5 border border-white/10 text-[#94A3B8] text-[9px] font-bold uppercase tracking-widest">
                  TERMINATED
                </span>
              ) : (
                <span className="px-2 py-1 rounded-sm bg-[#4ADE80]/10 border border-[#4ADE80]/30 text-[#4ADE80] text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] animate-pulse" />
                  LIVE ARENA
                </span>
              )}
              <span className="text-[10px] font-mono text-[#94A3B8] uppercase tracking-widest">
                VOL: {competition.totalVotes || 0}
              </span>
            </div>
            
            <h1 className="text-3xl sm:text-5xl font-black text-[#F8FAFC] tracking-tighter uppercase mb-2">
              {competition.title}
            </h1>
            <p className="text-xs text-[#94A3B8] font-mono uppercase tracking-widest max-w-2xl">
              {competition.description}
            </p>
          </div>

          <Link 
            href={`/track/${competition.slug || competition.id}`}
            className="shrink-0 flex items-center gap-2 px-6 py-3 bg-[#38BDF8]/10 hover:bg-[#38BDF8]/20 border border-[#38BDF8]/30 text-[#38BDF8] text-xs font-black tracking-widest uppercase rounded-sm transition-all"
          >
            <Activity className="w-4 h-4" />
            TELEMETRY HUD
          </Link>
        </div>

        {/* 2. Global Feedback Message (Absolute positioned so it doesn't shift layout) */}
        <AnimatePresence>
          {feedbackMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`absolute top-32 left-1/2 -translate-x-1/2 z-20 px-6 py-3 rounded-sm flex items-center gap-3 shadow-lg border backdrop-blur-md ${
                feedbackMsg.type === "success" 
                  ? "bg-[#4ADE80]/20 border-[#4ADE80]/50 text-[#4ADE80]" 
                  : "bg-[#EF4444]/20 border-[#EF4444]/50 text-[#EF4444]"
              }`}
            >
              {feedbackMsg.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <p className="text-[10px] font-black tracking-widest uppercase">{feedbackMsg.text}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3. Auth Gate OR Teams Grid */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-6 sm:p-8 relative z-10">
          {!user ? (
            <div className="w-full h-full flex items-center justify-center">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-lg bg-[#38BDF8]/10 backdrop-blur-md border border-white/10 p-10 rounded-2xl text-center"
              >
                <div className="w-16 h-16 mx-auto rounded-xl bg-white/5 flex items-center justify-center mb-6 border border-white/10">
                  <Lock className="w-8 h-8 text-[#38BDF8]" />
                </div>
                <h2 className="text-xl font-black text-[#F8FAFC] tracking-widest uppercase mb-2">
                  AUTHENTICATION REQUIRED
                </h2>
                <p className="text-xs font-mono text-[#94A3B8] tracking-widest uppercase mb-8 leading-relaxed">
                  1-ACCOUNT = 1-VOTE SECURITY ACTIVE.<br/>
                  INITIALIZE LINK TO ACCESS GRID.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <button
                    onClick={() => signInWithGoogle()}
                    className="flex-1 h-12 bg-[#38BDF8] text-[#030406] hover:bg-[#00D2FF] text-xs font-black tracking-widest uppercase flex items-center justify-center gap-2 rounded-sm shadow-[0_0_15px_rgba(56,189,248,0.4)] transition-all"
                  >
                    <LogIn className="w-4 h-4" />
                    GOOGLE LINK
                  </button>
                  <button
                    onClick={() => simulateLogin()}
                    className="flex-1 h-12 bg-white/5 border border-white/10 hover:bg-white/10 text-[#F8FAFC] text-xs font-black tracking-widest uppercase flex items-center justify-center gap-2 rounded-sm transition-all"
                  >
                    DEMO LINK
                  </button>
                </div>
              </motion.div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 pb-8">
              {competition.teams.map((team, idx) => (
                <motion.div 
                  key={`${team.id}-${idx}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <TeamCard
                    team={team}
                    totalVotes={competition.totalVotes || 0}
                    hasVoted={voteStatus.hasVoted}
                    userVotedTeamId={voteStatus.teamId}
                    isEnded={isEnded}
                    onSelectVote={handleSelectTeam}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 5. Confirmation Modal */}
      <VoteModal
        isOpen={isModalOpen}
        team={selectedTeam}
        competitionTitle={competition.title}
        isSubmitting={isSubmitting}
        onConfirm={handleConfirmVote}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
