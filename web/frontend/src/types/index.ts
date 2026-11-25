export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface Question {
  id: string;
  sessionId: string;
  category: string;
  text: string;
  subPrompt?: string;
  timeLimit: number;
  order: number;
}

export interface Answer {
  id: string;
  questionId: string;
  text: string;
  confidence: 'low' | 'medium' | 'high';
  duration: number;
  score?: number;
  feedback?: string;
}

export interface FeedbackReport {
  id: string;
  sessionId: string;
  overallScore: number;
  overallAssessment: string;
  strengths: FeedbackItem[];
  improvements: FeedbackItem[];
  recommendedActions: RecommendedAction[];
  vocalConfidenceData: { label: string; value: number }[];
}

export interface FeedbackItem {
  title: string;
  description: string;
}

export interface RecommendedAction {
  title: string;
  link: string;
}
