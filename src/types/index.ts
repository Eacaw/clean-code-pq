export interface Question {
  id?: string;
  title: string;
  description?: string;
  type: "mcq" | "edit_code" | "concise_code" | "qa" | "explain_code";
  points: number;
  timeLimit: number;
  options?: string[];
  correctOptionIndex?: number;
  correctAnswer?: string;
  initialCode?: string;
  instructions?: string;
  scoringCriteria?: string;
  imageUrl?: string;
  createdAt?: Date;
}
