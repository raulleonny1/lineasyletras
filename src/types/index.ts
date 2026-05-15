export type MembershipLevel = "free" | "supporter" | "premium";
export type UserRole = "reader" | "writer" | "superuser";
export type RecordLabel = "libre" | "clasificado" | "premium";

export interface ArchivumRecord {
  id: string;
  title: string;
  slug: string;
  synopsis: string;
  content: string;
  season: number;
  episode: number;
  story_title: string;
  story_slug: string;
  season_title: string;
  is_premium: boolean;
  published: boolean;
  featured: boolean;
  tags: string[];
  cover_url: string | null;
  created_at: string;
}

export interface AdminRecordOwner {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
}

export interface AdminRecord extends ArchivumRecord {
  created_by: string | null;
  owner: AdminRecordOwner | null;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  membership_level: MembershipLevel;
  role: UserRole;
  created_at: string;
}

export interface ReadingProgress {
  user_id: string;
  record_id: string;
  progress_percent: number;
  last_position: number;
}

export interface Payment {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  created_at: string;
}

export type RecordInput = Omit<ArchivumRecord, "id" | "created_at"> & {
  id?: string;
};

export interface CarouselNovel {
  id: string;
  story_title: string;
  story_slug: string;
  cover_url: string | null;
  synopsis: string;
  entry: ArchivumRecord;
  chapters: ArchivumRecord[];
}

export interface SeasonCharacter {
  id: string;
  season: number;
  story_slug: string;
  name: string;
  role: string;
  description: string;
  published: boolean;
  image_url: string | null;
  created_at: string;
}

export type SeasonCharacterInput = Omit<SeasonCharacter, "id" | "created_at"> & {
  id?: string;
};
