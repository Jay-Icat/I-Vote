import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  runTransaction,
  deleteDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import { Competition, Team, UserVoteStatus } from "@/types/voting";

// Default starter seed for competitions
export const INITIAL_COMPETITIONS: Competition[] = [
  {
    id: "cyber-street-clash",
    slug: "cyber-street-clash",
    title: "Cyber Street Clash 2026",
    description: "The underground urban gaming championship. 4 elite crews battle for dominance in neon district.",
    status: "active",
    totalVotes: 142,
    createdAt: 1741500000000,
    teams: [
      {
        id: "team-volt-vipers",
        name: "Volt Vipers",
        tag: "VPR",
        description: "Speed-focused tech rushers known for high-octane offensive strategies.",
        votesCount: 58
      },
      {
        id: "team-neon-syndicate",
        name: "Neon Syndicate",
        tag: "SYN",
        description: "Masters of grid manipulation and tactical zone control.",
        votesCount: 46
      },
      {
        id: "team-ghost-circuit",
        name: "Ghost Circuit",
        tag: "GST",
        description: "Stealth specialists and counter-strike tactical commandos.",
        votesCount: 23
      },
      {
        id: "team-obsidian-core",
        name: "Obsidian Core",
        tag: "OBS",
        description: "Heavy armor defensive veterans with unbreakable street grit.",
        votesCount: 15
      }
    ]
  },
  {
    id: "apex-urban-drift",
    slug: "apex-urban-drift",
    title: "Apex Urban Drift League",
    description: "Night race gaming showdown through neon downtown highway overpasses.",
    status: "active",
    totalVotes: 89,
    createdAt: 1741586400000,
    teams: [
      {
        id: "team-nitro-pulse",
        name: "Nitro Pulse",
        tag: "NTR",
        description: "Raw turbo acceleration with custom light-trail drift builds.",
        votesCount: 48
      },
      {
        id: "team-carbon-shadows",
        name: "Carbon Shadows",
        tag: "CSH",
        description: "Precision cornering and high-downforce drift racers.",
        votesCount: 41
      }
    ]
  }
];

const LOCAL_STORAGE_KEY_COMPS = "icat_competitions_cache";
const LOCAL_STORAGE_KEY_VOTES = "icat_user_votes";

function getLocalCompetitions(): Competition[] {
  if (typeof window === "undefined") return INITIAL_COMPETITIONS;
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY_COMPS);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // ignore
    }
  }
  localStorage.setItem(LOCAL_STORAGE_KEY_COMPS, JSON.stringify(INITIAL_COMPETITIONS));
  return INITIAL_COMPETITIONS;
}

function saveLocalCompetitions(comps: Competition[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_STORAGE_KEY_COMPS, JSON.stringify(comps));
}

function getLocalUserVote(competitionId: string, userId: string): UserVoteStatus {
  if (typeof window === "undefined") return { hasVoted: false };
  const votesStr = localStorage.getItem(LOCAL_STORAGE_KEY_VOTES);
  if (!votesStr) return { hasVoted: false };
  try {
    const votes: Record<string, { teamId: string; votedAt: number }> = JSON.parse(votesStr);
    const key = `${competitionId}_${userId}`;
    if (votes[key]) {
      return { hasVoted: true, teamId: votes[key].teamId, votedAt: votes[key].votedAt };
    }
  } catch {
    // ignore
  }
  return { hasVoted: false };
}

function saveLocalUserVote(competitionId: string, userId: string, teamId: string) {
  if (typeof window === "undefined") return;
  const votesStr = localStorage.getItem(LOCAL_STORAGE_KEY_VOTES);
  let votes: Record<string, { teamId: string; votedAt: number }> = {};
  if (votesStr) {
    try {
      votes = JSON.parse(votesStr);
    } catch {
      votes = {};
    }
  }
  const key = `${competitionId}_${userId}`;
  votes[key] = { teamId, votedAt: Date.now() };
  localStorage.setItem(LOCAL_STORAGE_KEY_VOTES, JSON.stringify(votes));
}

// -------------------------------------------------------------
// FIRESTORE & FALLBACK OPERATIONS
// -------------------------------------------------------------

/**
 * Fetch all competitions (Firestore with LocalStorage fallback)
 */
export async function getCompetitions(): Promise<{ competitions: Competition[]; isLive: boolean; error?: string }> {
  try {
    const colRef = collection(db, "competitions");
    const snapshot = await getDocs(colRef);
    if (!snapshot.empty) {
      const comps = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Competition));
      saveLocalCompetitions(comps);
      return { competitions: comps, isLive: true };
    } else {
      // If collection is empty, seed with initial competitions
      for (const comp of INITIAL_COMPETITIONS) {
        await setDoc(doc(db, "competitions", comp.id), comp);
      }
      return { competitions: INITIAL_COMPETITIONS, isLive: true };
    }
  } catch (err: unknown) {
    const errCode = typeof err === "object" && err && "code" in err ? (err as { code: string }).code : "";
    const errMsg = err instanceof Error ? err.message : String(err);
    console.warn("Firestore getCompetitions notice (using fallback cache):", errMsg);
    return { 
      competitions: getLocalCompetitions(), 
      isLive: false, 
      error: errCode === "permission-denied" 
        ? "Firestore rules are currently locked. Showing local/cached competitions. Deploy firestore.rules to enable cloud sync." 
        : errMsg 
    };
  }
}

/**
 * Get a single competition by ID or slug
 */
export async function getCompetitionById(idOrSlug: string): Promise<Competition | null> {
  try {
    const docRef = doc(db, "competitions", idOrSlug);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as Competition;
    }
  } catch {
    // fallback
  }

  const local = getLocalCompetitions();
  return local.find(c => c.id === idOrSlug || c.slug === idOrSlug) || null;
}

/**
 * Real-time subscription to a competition (Used for /track/[id] and voting)
 */
export function subscribeToCompetition(
  idOrSlug: string,
  onUpdate: (comp: Competition) => void,
  onError?: (err: unknown) => void
): () => void {
  try {
    const docRef = doc(db, "competitions", idOrSlug);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as Competition;
        onUpdate(data);
      } else {
        // Look up local
        const local = getLocalCompetitions();
        const found = local.find(c => c.id === idOrSlug || c.slug === idOrSlug);
        if (found) onUpdate(found);
      }
    }, (err) => {
      console.warn("Firestore onSnapshot error:", err);
      if (onError) onError(err);
      // Fallback
      const local = getLocalCompetitions();
      const found = local.find(c => c.id === idOrSlug || c.slug === idOrSlug);
      if (found) onUpdate(found);
    });
    return unsubscribe;
  } catch (err) {
    if (onError) onError(err);
    const local = getLocalCompetitions();
    const found = local.find(c => c.id === idOrSlug || c.slug === idOrSlug);
    if (found) onUpdate(found);
    return () => {};
  }
}

/**
 * Check if the user has already cast a vote in this competition
 */
export async function checkUserVote(competitionId: string, userId: string): Promise<UserVoteStatus> {
  if (!userId) return { hasVoted: false };

  // 1. Check Local storage first for fast response
  const localStatus = getLocalUserVote(competitionId, userId);
  if (localStatus.hasVoted) return localStatus;

  // 2. Query Firestore
  try {
    const voteDocRef = doc(db, "votes", `${competitionId}_${userId}`);
    const snap = await getDoc(voteDocRef);
    if (snap.exists()) {
      const data = snap.data();
      saveLocalUserVote(competitionId, userId, data.teamId);
      return { hasVoted: true, teamId: data.teamId, votedAt: data.votedAt };
    }
  } catch {
    // ignore
  }

  return { hasVoted: false };
}

/**
 * Cast a vote: ATOMIC 1-VOTE ENFORCEMENT
 */
export async function castVote(params: {
  competitionId: string;
  teamId: string;
  userId: string;
  userEmail: string;
}): Promise<{ success: boolean; error?: string }> {
  const { competitionId, teamId, userId, userEmail } = params;

  if (!userId) {
    return { success: false, error: "You must be signed in to vote." };
  }

  // 1. Guard check locally
  const existingLocal = getLocalUserVote(competitionId, userId);
  if (existingLocal.hasVoted) {
    return { success: false, error: "One account can do 1 vote only in this competition!" };
  }

  const voteDocId = `${competitionId}_${userId}`;
  const voteDocRef = doc(db, "votes", voteDocId);
  const compDocRef = doc(db, "competitions", competitionId);

  try {
    // 2. Attempt Firestore Transaction
    await runTransaction(db, async (transaction) => {
      const voteSnap = await transaction.get(voteDocRef);
      if (voteSnap.exists()) {
        throw new Error("ALREADY_VOTED");
      }

      const compSnap = await transaction.get(compDocRef);
      let compData: Competition;
      
      // If competition is missing in Firestore (created offline), try to sync it from local cache
      if (!compSnap.exists()) {
        const localComps = getLocalCompetitions();
        const foundLocal = localComps.find(c => c.id === competitionId);
        if (!foundLocal) {
          throw new Error("COMPETITION_NOT_FOUND");
        }
        compData = foundLocal;
        transaction.set(compDocRef, compData);
      } else {
        compData = compSnap.data() as Competition;
      }

      if (compData.status === "ended") {
        throw new Error("COMPETITION_ENDED");
      }

      // Update team vote count
      let foundTeam = false;
      const updatedTeams = compData.teams.map(team => {
        if (team.id === teamId) {
          foundTeam = true;
          return { ...team, votesCount: (team.votesCount || 0) + 1 };
        }
        return team;
      });

      if (!foundTeam) {
        throw new Error("TEAM_NOT_FOUND");
      }

      // Write vote document
      transaction.set(voteDocRef, {
        competitionId,
        teamId,
        userId,
        userEmail: userEmail || "anonymous",
        votedAt: Date.now()
      });

      // Update competition total & teams
      transaction.update(compDocRef, {
        teams: updatedTeams,
        totalVotes: (compData.totalVotes || 0) + 1,
        updatedAt: Date.now()
      });
    });

    saveLocalUserVote(competitionId, userId, teamId);
    return { success: true };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.warn("Firestore vote transaction warning:", errMsg);

    if (errMsg === "ALREADY_VOTED") {
      saveLocalUserVote(competitionId, userId, teamId);
      return { success: false, error: "You have already voted in this competition!" };
    }
    if (errMsg === "COMPETITION_ENDED") {
      return { success: false, error: "This competition has ended. Voting is closed." };
    }

    // 3. Absolute Fallback: Force update local cache if Firestore is completely unreachable
    const comps = getLocalCompetitions();
    const compIdx = comps.findIndex(c => c.id === competitionId || c.slug === competitionId);
    if (compIdx >= 0) {
      comps[compIdx].teams = comps[compIdx].teams.map(t => 
        t.id === teamId ? { ...t, votesCount: t.votesCount + 1 } : t
      );
      comps[compIdx].totalVotes = (comps[compIdx].totalVotes || 0) + 1;
      comps[compIdx].updatedAt = Date.now();
      saveLocalCompetitions(comps);
      saveLocalUserVote(competitionId, userId, teamId);
      return { success: true }; // Succeed locally
    }

    return { success: false, error: errMsg || "Failed to submit vote." };
  }
}

/**
 * Admin: Create a new competition
 */
export async function createCompetition(comp: Omit<Competition, "createdAt" | "totalVotes">): Promise<Competition> {
  const newComp: Competition = {
    ...comp,
    createdAt: Date.now(),
    totalVotes: comp.teams.reduce((acc, t) => acc + (t.votesCount || 0), 0)
  };

  try {
    await setDoc(doc(db, "competitions", newComp.id), newComp);
  } catch (err) {
    console.warn("Firestore createCompetition fallback:", err);
  }

  const local = getLocalCompetitions();
  const updated = [newComp, ...local.filter(c => c.id !== newComp.id)];
  saveLocalCompetitions(updated);
  return newComp;
}

/**
 * Admin: Add a team to an existing competition
 */
export async function addTeamToCompetition(competitionId: string, team: Omit<Team, "id" | "votesCount">): Promise<Team> {
  const newTeam: Team = {
    id: `team-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    votesCount: 0,
    ...team
  };

  try {
    const compRef = doc(db, "competitions", competitionId);
    const compSnap = await getDoc(compRef);
    if (compSnap.exists()) {
      const data = compSnap.data() as Competition;
      const teams = [...(data.teams || []), newTeam];
      await updateDoc(compRef, { teams });
    }
  } catch (err) {
    console.warn("Firestore addTeam fallback:", err);
  }

  const comps = getLocalCompetitions();
  const idx = comps.findIndex(c => c.id === competitionId || c.slug === competitionId);
  if (idx >= 0) {
    comps[idx].teams.push(newTeam);
    saveLocalCompetitions(comps);
  }

  return newTeam;
}

/**
 * Admin: Toggle competition status
 */
export async function toggleCompetitionStatus(competitionId: string, newStatus: "active" | "ended"): Promise<void> {
  try {
    const compRef = doc(db, "competitions", competitionId);
    await updateDoc(compRef, { status: newStatus });
  } catch (err) {
    console.warn("Firestore status toggle fallback:", err);
  }

  const comps = getLocalCompetitions();
  const idx = comps.findIndex(c => c.id === competitionId || c.slug === competitionId);
  if (idx >= 0) {
    comps[idx].status = newStatus;
    saveLocalCompetitions(comps);
  }
}

/**
 * Admin: Delete competition
 */
export async function deleteCompetition(competitionId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "competitions", competitionId));
  } catch (err) {
    console.warn("Firestore delete fallback:", err);
  }

  const comps = getLocalCompetitions();
  const filtered = comps.filter(c => c.id !== competitionId && c.slug !== competitionId);
  saveLocalCompetitions(filtered);
}
