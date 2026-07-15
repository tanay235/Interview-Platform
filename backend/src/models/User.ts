import { Schema, model, type HydratedDocument } from "mongoose";

export interface User {
  name: string;
  email: string;
  skills: string[];
  experienceLevel: "student" | "entry" | "mid" | "senior" | "lead";
  preferredRole: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export type UserDocument = HydratedDocument<User>;

const userSchema = new Schema<User>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    skills: { type: [String], default: [] },
    experienceLevel: {
      type: String,
      enum: ["student", "entry", "mid", "senior", "lead"],
      default: "entry",
    },
    preferredRole: { type: String, default: "", trim: true, maxlength: 100 },
    passwordHash: { type: String, required: true, select: false },
  },
  { timestamps: true },
);

export const UserModel = model<User>("User", userSchema);
