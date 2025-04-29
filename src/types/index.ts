//eslint-ignore-file @typescript-eslint/no-explicit-any
export interface Session {
  id: string;
  name: string;
  status: "pending" | "active" | "completed";
  createdAt: any; // Firestore Timestamp
  questionIds: string[]; // References to questions in this session
  currentQuestionIndex?: number; // Index of the current active question
  currentQuestionStartTime?: any; // Timestamp when the current question started
}

// QuestionBase defines the common properties for all question types
export interface QuestionBase {
  id: string;
  title: string;
  description: string;
  points: number;
  timeLimit: number; // in seconds
  type: "mcq" | "edit_code" | "concise_code" | "qa" | "explain_code";
  imageUrl?: string | null;
  topic: string;
}

// Extended Question type with all possible fields
export interface Question extends QuestionBase {
  // Multiple choice question fields
  options?: string[];
  correctOptionIndex?: number;
  correctAnswer?: string;

  // Code-related question fields
  initialCode?: string;
  instructions?: string;
  scoringCriteria?: string;

  createdAt?: any;
}

// Team represents a group of participants
export interface Team {
  id: string;
  name: string;
  members?: string[]; // Array of user IDs
  score: number;
  sessionId?: string; // Reference to the session this team is part of
  createdAt: any; // Firestore Timestamp
}

// SubmissionBase defines the common properties for all submission types
export interface SubmissionBase {
  id: string;
  questionId: string;
  teamId: string;
  sessionId: string;
  timestamp: any; // Firestore Timestamp
  submittedAt: any; // Timestamp when the submission was made
  status: "pending" | "correct" | "incorrect" | "partial" | "marked";
  score: number;
  conciseBonus?: number;
  criteria?: Record<string, number>;
  markedAt?: any; // Timestamp when the submission was marked
  questionType: "mcq" | "edit_code" | "concise_code" | "qa" | "explain_code";
}

// Extended Submission type with all possible fields
export interface Submission extends SubmissionBase {
  // Multiple choice submission
  selectedOptionIndex?: number;

  // Code submission
  code?: string;
  codeLength?: number;

  // Q&A submission
  answer?: string;

  // Team info
  teamName: string;

  // Feedback from admin/marker
  feedback?: string;

  explanation?: string; // For explain_code questions
}
