export interface Chapter {
  id: string;
  title: string;
  description?: string;
  videos: Video[];
  agents: Agent[];
  documents: Document[];
}

export interface Video {
  id: string;
  title: string;
  url: string;
  duration?: string;
  description?: string;
  type: 'video';
}

export interface Agent {
  id: string;
  title: string;
  replicaId: string;
  conversationalContext: string;
  description?: string;
  type: 'agent';
}

export interface Document {
  id: string;
  title: string;
  url: string;
  description?: string;
  isSpecial: boolean;
  completed?: boolean;
  type: 'document';
}

export interface Course {
  id: string;
  title: string;
  image: string;
  description: string;
  agentCourseDescription: string;
  sponsored: boolean;
  fees: number;
  courseMaterialUrl?: string;
  chapters: Chapter[];
  createdAt: string;
  isEnrolled?: boolean;
}