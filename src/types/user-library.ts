import type { Story } from "@/types/story";

export type ReadingEntry = {
  storyId: string;
  readAt: string;
  startedAt?: string;
};

export type UserLibraryResponse = {
  read: ReadingEntry[];
  readStories: Story[];
  unreadStories: Story[];
  recommended: Story | null;
  myStories: Story[];
  stats: {
    total: number;
    readCount: number;
    unreadCount: number;
  };
};
