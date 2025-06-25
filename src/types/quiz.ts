export interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple-choice' | 'short-answer' | 'essay';
  options?: string[];
  correctAnswer?: string | number;
  marks: number;
}

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  topic?: string;
  pdfUrl?: string ;
  totalQuestions: number;
  totalMarks: number;
  questions: QuizQuestion[];
  evaluationPrompts: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  answers: Record<string, any>;
  score?: number;
  totalMarks: number;
  evaluationResult?: {
    score: number;
    strengths: string[];
    weaknesses: string[];
    improvements: string[];
    detailedFeedback: string;
  };
  startedAt: string;
  completedAt?: string;
}

export interface QuizFormData {
  title: string;
  description: string;
  topic: string;
  pdfFile?: File | null;
  totalQuestions: number;
  totalMarks: number;
  evaluationPrompts: string[];
}