import { Router } from "express";
import { createInterview, endInterview, getInterviewResult, getInterviewRoom, saveAnswer, saveCode, submitCode } from "../controllers/interviewController";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.use(requireAuth);
router.post("/", asyncHandler(createInterview));
router.get("/:id", asyncHandler(getInterviewRoom));
router.patch("/:id/answers", asyncHandler(saveAnswer));
router.post("/:id/end", asyncHandler(endInterview));
router.get("/:id/result", asyncHandler(getInterviewResult));
router.patch("/:id/code", asyncHandler(saveCode));
router.post("/:id/submit", asyncHandler(submitCode));

export default router;
