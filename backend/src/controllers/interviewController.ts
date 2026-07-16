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

function buildQuestions(role: string, technologies: string[], count: number): string[] {
  const technology = technologies[0];
  const templates = [
    `How would you design a reliable ${role} solution using ${technology}?`,
    `What are the most important trade-offs you consider when working with ${technology}?`,
    `Describe a difficult problem you solved in a ${role} project and how you approached it.`,
    `How do you test and monitor a production feature in a ${role} role?`,
    `How would you improve the performance and maintainability of a ${role} codebase?`,
  ];
  return Array.from({ length: count }, (_, index) => templates[index % templates.length]);
}

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
    questions: buildQuestions(role, technologies, numberOfQuestions),
    answers: Array.from({ length: numberOfQuestions }, () => ""),
  });

  res.status(201).json({
    success: true,
    message: "Interview configuration saved",
    data: { interview: { id: interview.id, title: interview.title, role: interview.role } },
  });
}

async function findOwnedInterview(req: AuthenticatedRequest, id: string) {
  return req.user?.sub && Types.ObjectId.isValid(id)
    ? InterviewModel.findOne({ _id: id, user: req.user.sub })
    : null;
}

export async function getInterviewRoom(req: AuthenticatedRequest, res: Response): Promise<void> {
  const interviewId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const interview = await findOwnedInterview(req, interviewId);
  if (!interview) {
    res.status(404).json({ success: false, message: "Interview not found" });
    return;
  }
  res.json({
    success: true,
    data: {
      interview: {
        id: interview.id,
        title: interview.title,
        role: interview.role,
        difficulty: interview.difficulty,
        technologies: interview.technologies,
        questions: interview.questions,
        answers: interview.answers,
        status: interview.status,
      },
    },
  });
}

interface AnswerBody { questionIndex?: number; answer?: string }

export async function saveAnswer(req: AuthenticatedRequest & { body: AnswerBody }, res: Response): Promise<void> {
  const interviewId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const interview = await findOwnedInterview(req, interviewId);
  const questionIndex = Number(req.body.questionIndex);
  const answer = req.body.answer?.trim() ?? "";
  if (!interview) {
    res.status(404).json({ success: false, message: "Interview not found" });
    return;
  }
  if (!Number.isInteger(questionIndex) || questionIndex < 0 || questionIndex >= interview.questions.length) {
    res.status(400).json({ success: false, message: "Invalid question" });
    return;
  }
  interview.answers[questionIndex] = answer;
  await interview.save();
  res.json({ success: true, message: "Answer saved" });
}

export async function endInterview(req: AuthenticatedRequest, res: Response): Promise<void> {
  const interviewId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const interview = await findOwnedInterview(req, interviewId);
  if (!interview) {
    res.status(404).json({ success: false, message: "Interview not found" });
    return;
  }
  interview.status = "completed";
  interview.endedAt = new Date();
  await interview.save();
  res.json({ success: true, message: "Interview ended" });
}
