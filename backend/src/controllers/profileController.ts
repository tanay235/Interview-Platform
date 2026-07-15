import type { Request, Response } from "express";
import { UserModel, type UserDocument } from "../models/User";
import { createToken } from "../utils/jwt";
import type { AuthenticatedRequest } from "../middleware/auth";

type ExperienceLevel = "student" | "entry" | "mid" | "senior" | "lead";

interface ProfileBody {
  name?: string;
  email?: string;
  skills?: string[];
  experienceLevel?: ExperienceLevel;
  preferredRole?: string;
}

const experienceLevels: ExperienceLevel[] = ["student", "entry", "mid", "senior", "lead"];

function serializeUser(user: Pick<UserDocument, "_id" | "name" | "email" | "skills" | "experienceLevel" | "preferredRole">) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    skills: user.skills ?? [],
    experienceLevel: user.experienceLevel ?? "entry",
    preferredRole: user.preferredRole ?? "",
  };
}

function getUserId(req: AuthenticatedRequest): string | undefined {
  return req.user?.sub;
}

export async function getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = getUserId(req);
  const user = userId ? await UserModel.findById(userId) : null;
  if (!user) {
    res.status(404).json({ success: false, message: "User profile not found" });
    return;
  }
  res.json({ success: true, data: { user: serializeUser(user) } });
}

export async function updateProfile(req: Request<unknown, unknown, ProfileBody> & AuthenticatedRequest, res: Response): Promise<void> {
  const userId = getUserId(req);
  const name = req.body.name?.trim();
  const email = req.body.email?.trim().toLowerCase();
  const skills = req.body.skills?.map((skill: string) => skill.trim()).filter(Boolean);
  const preferredRole = req.body.preferredRole?.trim();

  if (!userId || !name || !email || !/^\S+@\S+\.\S+$/.test(email)) {
    res.status(400).json({ success: false, message: "Enter a valid name and email" });
    return;
  }
  if (name.length < 2 || (skills && skills.length > 20) || (preferredRole && preferredRole.length > 100)) {
    res.status(400).json({ success: false, message: "Please check your profile fields and try again" });
    return;
  }
  if (req.body.experienceLevel && !experienceLevels.includes(req.body.experienceLevel)) {
    res.status(400).json({ success: false, message: "Invalid experience level" });
    return;
  }

  const existingEmail = await UserModel.findOne({ email, _id: { $ne: userId } });
  if (existingEmail) {
    res.status(409).json({ success: false, message: "An account with this email already exists" });
    return;
  }

  const user = await UserModel.findByIdAndUpdate(
    userId,
    { name, email, ...(skills ? { skills } : {}), ...(req.body.experienceLevel ? { experienceLevel: req.body.experienceLevel } : {}), preferredRole: preferredRole ?? "" },
    { new: true, runValidators: true },
  );
  if (!user) {
    res.status(404).json({ success: false, message: "User profile not found" });
    return;
  }

  const publicUser = serializeUser(user);
  res.json({
    success: true,
    message: "Profile updated successfully",
    data: { user: publicUser, token: createToken({ id: user.id, email: user.email, name: user.name }) },
  });
}
