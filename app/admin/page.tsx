"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  getCompetitions, 
  createCompetition, 
  addTeamToCompetition, 
  toggleCompetitionStatus, 
  deleteCompetition
} from "@/lib/voting-service";
import { Competition, Team } from "@/types/voting";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheck, 
  Plus, 
  Trash2, 
  ToggleLeft, 
  ToggleRight, 
  Radio, 
  Flame, 
  Copy, 
  Check, 
  AlertTriangle,
  Lock,
  Unlock,
  X,
  Server
} from "lucide-react";

export default function AdminPage() {
  // Password Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState(false);

  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [rulesCopied, setRulesCopied] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [formTeams, setFormTeams] = useState<Array<{ name: string; tag: string; description: string }>>([
    { name: "Design Vanguard", tag: "DVG", description: "UI/UX & Interactive Design pioneers." },
    { name: "VFX Titans", tag: "VFX", description: "3D Animation & Cinematic Visual Effects artists." },
  ]);

  const [targetCompId, setTargetCompId] = useState<string>("");
  const [teamName, setTeamName] = useState("");
  const [teamTag, setTeamTag] = useState("");
  const [teamDesc, setTeamDesc] = useState("");

  const refreshCompetitions = async () => {
    setIsLoading(true);
    const res = await getCompetitions();
    setCompetitions(res.competitions);
    if (res.competitions.length > 0 && !targetCompId) {
      setTargetCompId(res.competitions[0].id);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    let isMounted = true;
    async function load() {
      const res = await getCompetitions();
      if (isMounted) {
        setCompetitions(res.competitions);
        if (res.competitions.length > 0) {
          setTargetCompId(res.competitions[0].id);
        }
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === "IcatVoting98007!") {
      setIsAuthenticated(true);
      setAuthError(false);
    } else {
      setAuthError(true);
      setPasswordInput("");
    }
  };

  const handleTitleChange = (val: string) => {
    setNewTitle(val);
    const autoSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setNewSlug(autoSlug);
  };

  const handleAddFormTeam = () => {
    setFormTeams([...formTeams, { name: "", tag: "", description: "" }]);
  };

  const handleRemoveFormTeam = (idx: number) => {
    if (formTeams.length <= 2) return;
    setFormTeams(formTeams.filter((_, i) => i !== idx));
  };

  const handleFormTeamChange = (idx: number, field: "name" | "tag" | "description", val: string) => {
    const updated = [...formTeams];
    updated[idx][field] = val;
    setFormTeams(updated);
  };

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleCreateCompetition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newSlug.trim()) {
      showFeedback("Title and Slug are required.");
      return;
    }
    const cleanTeams = formTeams.filter(t => t.name.trim() !== "");
    if (cleanTeams.length < 2) {
      showFeedback("At least 2 teams are required.");
      return;
    }

    setIsLoading(true);
    try {
      await createCompetition({
        id: newSlug,
        slug: newSlug,
        title: newTitle,
        description: newDescription,
        status: "active",
        teams: cleanTeams.map(t => ({
          ...t,
          id: `team-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`,
          votesCount: 0
        }))
      });
      showFeedback("Arena created successfully.");
      setNewTitle("");
      setNewSlug("");
      setNewDescription("");
      setFormTeams([{ name: "", tag: "", description: "" }, { name: "", tag: "", description: "" }]);
      await refreshCompetitions();
    } catch (err: any) {
      showFeedback(`Error: ${err.message || String(err)}`);
    }
    setIsLoading(false);
  };

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCompId || !teamName.trim() || !teamTag.trim()) {
      showFeedback("Competition, Team Name, and Tag are required.");
      return;
    }
    setIsLoading(true);
    try {
      await addTeamToCompetition(targetCompId, { name: teamName, tag: teamTag, description: teamDesc });
      showFeedback("Team added successfully.");
      setTeamName("");
      setTeamTag("");
      setTeamDesc("");
      await refreshCompetitions();
    } catch (err: any) {
      showFeedback(`Error: ${err.message || String(err)}`);
    }
    setIsLoading(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="flex-1 w-full h-full flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md glass-panel p-8 rounded-3xl text-center border-t border-[#38BDF8]/50 shadow-[0_0_30px_rgba(56,189,248,0.15)]"
        >
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#38BDF8]/10 backdrop-blur-md flex items-center justify-center mb-6 border border-white/10 shadow-inner">
            <Lock className="w-8 h-8 text-[#38BDF8]" />
          </div>
          <h2 className="text-2xl font-black text-[#F8FAFC] tracking-widest uppercase mb-2">
            RESTRICTED ACCESS
          </h2>
          <p className="text-xs text-[#94A3B8] font-mono tracking-widest mb-8">
            AUTHORIZATION REQUIRED
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="ENTER PASSPHRASE"
                className={`w-full bg-[#38BDF8]/5 backdrop-blur-md border rounded-xl px-4 py-3.5 text-center text-sm font-mono text-[#F8FAFC] tracking-widest focus:outline-none focus:ring-2 focus:ring-[#38BDF8] transition-all ${
                  authError ? "border-[#EF4444] shadow-[0_0_10px_rgba(239,68,68,0.2)]" : "border-white/10"
                }`}
              />
              {authError && (
                <p className="text-[#EF4444] text-[10px] font-bold mt-2 tracking-widest uppercase animate-pulse">
                  ACCESS DENIED
                </p>
              )}
            </div>
            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-[#38BDF8] text-[#030406] text-xs font-black uppercase tracking-widest shadow-[0_0_15px_rgba(56,189,248,0.3)] hover:bg-[#00D2FF] hover:shadow-[0_0_25px_rgba(56,189,248,0.5)] transition-all flex items-center justify-center gap-2"
            >
              <Unlock className="w-4 h-4" />
              AUTHENTICATE
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full h-full flex flex-col p-4 sm:p-6 lg:p-8 overflow-hidden">
      
      <div className="w-full max-w-7xl mx-auto h-full glass-panel rounded-[2.5rem] flex flex-col overflow-hidden relative border border-[#4ADE80]/20 shadow-[0_0_30px_rgba(74,222,128,0.05)]">
        
        {/* Header */}
        <div className="flex-shrink-0 p-6 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#38BDF8]/5 backdrop-blur-md z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#4ADE80]/10 border border-[#4ADE80]/30 flex items-center justify-center text-[#4ADE80]">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-widest text-[#F8FAFC] uppercase">
                SYSTEM <span className="text-[#4ADE80] neon-text-green">ADMIN</span>
              </h1>
              <p className="text-[10px] text-[#94A3B8] font-mono tracking-widest uppercase mt-1">
                Authorized Override Control
              </p>
            </div>
          </div>
          
          {feedback && (
            <div className="px-5 py-3 rounded-xl bg-[#4ADE80]/10 border border-[#4ADE80]/30 text-[#4ADE80] text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 shadow-sm animate-pulse">
              <Check className="w-3.5 h-3.5" />
              {feedback}
            </div>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            
            {/* Left Col: Setup */}
            <div className="lg:col-span-1 space-y-6">
              <motion.form 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onSubmit={handleCreateCompetition}
                className="p-6 rounded-2xl bg-[#38BDF8]/10 backdrop-blur-md border border-white/5"
              >
                <h2 className="text-sm font-black text-[#F8FAFC] mb-6 flex items-center gap-2 uppercase tracking-widest">
                  <Plus className="w-4 h-4 text-[#38BDF8]" />
                  Deploy New Arena
                </h2>

                <div className="space-y-4">
                  <div>
                    <input
                      type="text"
                      required
                      value={newTitle}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      className="w-full bg-[#38BDF8]/10 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-[#F8FAFC] placeholder-[#38BDF8]/40 focus:outline-none focus:border-[#38BDF8] transition-all"
                      placeholder="ARENA DESIGNATION"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      required
                      value={newSlug}
                      onChange={(e) => setNewSlug(e.target.value)}
                      className="w-full bg-[#38BDF8]/10 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-[#475569] focus:outline-none"
                      placeholder="URL-SLUG"
                    />
                  </div>
                  <div>
                    <textarea
                      required
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      className="w-full bg-[#38BDF8]/10 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-[#F8FAFC] placeholder-[#38BDF8]/40 focus:outline-none focus:border-[#38BDF8] transition-all h-20 resize-none"
                      placeholder="ARENA DIRECTIVE..."
                    />
                  </div>

                  <div className="pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">
                        SLOTS ({formTeams.length})
                      </span>
                      <button
                        type="button"
                        onClick={handleAddFormTeam}
                        className="text-[10px] font-bold text-[#38BDF8] uppercase hover:text-[#F8FAFC] transition-colors"
                      >
                        + ADD SLOT
                      </button>
                    </div>

                    <div className="space-y-3">
                      {formTeams.map((team, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-[#38BDF8]/10 backdrop-blur-md border border-white/5 relative">
                          {formTeams.length > 2 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveFormTeam(idx)}
                              className="absolute top-2 right-2 text-[#EF4444]/50 hover:text-[#EF4444]"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                          <div className="flex gap-2 mb-2 pr-6">
                            <input
                              type="text"
                              required
                              placeholder="CREW ID"
                              value={team.name}
                              onChange={(e) => handleFormTeamChange(idx, "name", e.target.value)}
                              className="flex-1 bg-transparent border-b border-white/10 px-1 py-1 text-[11px] font-mono focus:outline-none focus:border-[#38BDF8] placeholder-[#38BDF8]/40"
                            />
                            <input
                              type="text"
                              required
                              placeholder="TAG"
                              maxLength={4}
                              value={team.tag}
                              onChange={(e) => handleFormTeamChange(idx, "tag", e.target.value)}
                              className="w-14 bg-transparent border-b border-white/10 px-1 py-1 text-[10px] font-mono focus:outline-none focus:border-[#38BDF8] uppercase text-center placeholder-[#38BDF8]/40"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 mt-4 rounded-xl bg-[#4ADE80] text-[#030406] text-xs font-black uppercase tracking-widest shadow-[0_0_15px_rgba(74,222,128,0.2)] hover:bg-[#22c55e] transition-all"
                  >
                    {isLoading ? "PROCESSING..." : "EXECUTE DEPLOYMENT"}
                  </button>
                </div>
              </motion.form>
            </div>

            {/* Right Col: Registry */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between pb-2 mb-4 border-b border-white/10">
                <h2 className="text-sm font-black text-[#F8FAFC] flex items-center gap-2 uppercase tracking-widest">
                  <Radio className="w-4 h-4 text-[#A855F7]" />
                  Active Registry
                </h2>
                <button 
                  onClick={refreshCompetitions}
                  className="text-[10px] font-bold text-[#38BDF8] hover:text-[#F8FAFC] transition-colors uppercase tracking-widest"
                >
                  REFRESH
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {competitions.map((comp, idx) => (
                  <motion.div 
                    key={comp.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-5 rounded-2xl bg-[#38BDF8]/10 backdrop-blur-md border border-white/5 flex flex-col sm:flex-row justify-between gap-5 relative overflow-hidden group hover:border-white/10 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {comp.status === "active" ? (
                          <span className="px-2.5 py-1 rounded-sm bg-[#4ADE80]/10 border border-[#4ADE80]/30 text-[#4ADE80] text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] animate-pulse" />
                            LIVE
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-sm bg-white/5 border border-white/10 text-[#94A3B8] text-[9px] font-bold uppercase tracking-widest">
                            TERMINATED
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-[#475569]">[{comp.id.substring(0,8)}]</span>
                      </div>
                      <h3 className="text-lg font-black text-[#F8FAFC] tracking-widest uppercase mb-1">{comp.title}</h3>
                      
                      <div className="flex items-center gap-4 mt-3 text-[10px] font-mono text-[#94A3B8]">
                        <span className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded">
                          <Flame className="w-3 h-3 text-[#A855F7]" />
                          {comp.teams.length} UNITS
                        </span>
                        <span className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded">
                          <ShieldCheck className="w-3 h-3 text-[#38BDF8]" />
                          {comp.totalVotes || 0} VOTES
                        </span>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-center gap-2 shrink-0 pt-4 sm:pt-0 sm:pl-4">
                      <button
                        onClick={async () => {
                          setIsLoading(true);
                          await toggleCompetitionStatus(comp.id, comp.status === "active" ? "ended" : "active");
                          await refreshCompetitions();
                        }}
                        className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#F8FAFC] transition-all flex items-center gap-2 text-[10px] font-bold uppercase w-full sm:w-auto"
                      >
                        {comp.status === "active" ? <ToggleRight className="w-4 h-4 text-[#4ADE80]" /> : <ToggleLeft className="w-4 h-4 text-[#94A3B8]" />}
                        <span className="hidden sm:inline">TOGGLE</span>
                      </button>

                      <button
                        onClick={async () => {
                          if (confirm(`PURGE ARENA [${comp.title}]? THIS ACTION IS IRREVERSIBLE.`)) {
                            setIsLoading(true);
                            await deleteCompetition(comp.id);
                            await refreshCompetitions();
                          }
                        }}
                        className="p-2.5 rounded-xl bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-[#EF4444] transition-all flex items-center gap-2 text-[10px] font-bold uppercase w-full sm:w-auto"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">PURGE</span>
                      </button>
                    </div>
                  </motion.div>
                ))}

                {competitions.length === 0 && !isLoading && (
                  <div className="p-12 text-center border border-dashed border-white/10 rounded-2xl text-[#475569] font-mono text-xs tracking-widest uppercase">
                    NO ACTIVE NODES DETECTED
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
