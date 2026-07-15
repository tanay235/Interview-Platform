import { Schema, Types, model, type HydratedDocument } from "mongoose";

export type InterviewDifficulty = "easy" | "medium" | "hard";

export interface Interview {
  user: Types.ObjectId;
  title: string;
  role: string;
  difficulty: InterviewDifficulty;
  technologies: string[];
  numberOfQuestions: number;
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
  },
  { timestamps: true },
);

export const InterviewModel = model<Interview>("Interview", interviewSchema);
