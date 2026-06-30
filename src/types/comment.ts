export interface StoryComment {
  id: string;
  storyId: string;
  authorName: string;
  text: string;
  createdAt: string;
}

export interface StoryEngagement {
  storyId: string;
  likeCount: number;
}
