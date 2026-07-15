import type { Request, Response } from "express";
import { Types } from "mongoose";
import type { AuthenticatedRequest } from "../middleware/auth";
import { InterviewModel, type InterviewDifficulty } from "../models/Interview";

interface InterviewBody {
  title?: string;
  role?: string;
  difficulty?: InterviewDifficulty;
  technologies?: string[];
  numberOfQuestions?: number;
}

const difficulties: InterviewDifficulty[] = ["easy", "medium", "hard"];

export async function createInterview(
  req: Request<unknown, unknown, InterviewBody> & AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const userId = req.user?.sub;
  const title = req.body.title?.trim();
  const role = req.body.role?.trim();
  const technologies = req.body.technologies?.map((technology: string) => technology.trim()).filter(Boolean);
  const numberOfQuestions = Number(req.body.numberOfQuestions);

  if (!userId || !Types.ObjectId.isValid(userId)) {
    res.status(401).json({ success: false, message: "Authentication required" });
    return;
  }
  if (!title || !role || !req.body.difficulty || !technologies?.length || !Number.isInteger(numberOfQuestions)) {
    res.status(400).json({ success: false, message: "Complete all interview configuration fields" });
    return;
  }
  if (title.length > 120 || role.length > 100 || !difficulties.includes(req.body.difficulty) || numberOfQuestions < 1 || numberOfQuestions > 50) {
    res.status(400).json({ success: false, message: "Please check the interview configuration values" });
    return;
  }

  const interview = await InterviewModel.create({
    user: new Types.ObjectId(userId),
    title,
    role,
    difficulty: req.body.difficulty,
    technologies,
    numberOfQuestions,
  });

  res.status(201).json({
    success: true,
    message: "Interview configuration saved",
    data: { interview },
  });
}
