export interface Team {
  id: string;
  name: string;
  tag: string;
  description: string;
  votesCount: number;
}

export interface Competition {
  id: string;
  title: string;
  slug: string;
  description: string;
  status: "active" | "ended" | "upcoming";
  teams: Team[];
  totalVotes: number;
  createdAt: number;
  updatedAt?: number;
}

export interface VoteRecord {
  id: string; // ${competitionId}_${userId}
  competitionId: string;
  teamId: string;
  userId: string;
  userEmail: string;
  votedAt: number;
}

export interface UserVoteStatus {
  hasVoted: boolean;
  teamId?: string;
  votedAt?: number;
}
