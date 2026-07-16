import { Schema, Types, model, type HydratedDocument } from "mongoose";

export type InterviewDifficulty = "easy" | "medium" | "hard";
export type InterviewStatus = "in-progress" | "completed";
export type CodingLanguage = "cpp" | "java" | "python" | "javascript";

export interface CodeSubmission {
  language: CodingLanguage;
  code: string;
  submittedAt: Date;
}

export interface Interview {
  user: Types.ObjectId;
  title: string;
  role: string;
  difficulty: InterviewDifficulty;
  technologies: string[];
  numberOfQuestions: number;
  questions: string[];
  answers: string[];
  status: InterviewStatus;
  endedAt?: Date;
  code: Record<CodingLanguage, string>;
  submissions: CodeSubmission[];
  createdAt: Date;
  updatedAt: Date;
}

export type InterviewDocument = HydratedDocument<Interview>;

const interviewSchema = new Schema<Interview>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    role: { type: String, required: true, trim: true, maxlength: 100 },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], required: true },
    technologies: { type: [String], required: true, default: [] },
    numberOfQuestions: { type: Number, required: true, min: 1, max: 50 },
    questions: { type: [String], required: true, default: [] },
    answers: { type: [String], required: true, default: [] },
    status: { type: String, enum: ["in-progress", "completed"], default: "in-progress" },
    endedAt: { type: Date },
    code: { type: Schema.Types.Mixed, default: {} },
    submissions: {
      type: [{ language: String, code: String, submittedAt: Date }],
      default: [],
    },
  },
  { timestamps: true },
);

export const InterviewModel = model<Interview>("Interview", interviewSchema);
