import { Router } from "express";
import { createInterview, deleteInterview, endInterview, getInterviewResult, getInterviewRoom, listInterviews, saveAnswer, saveCode, submitCode } from "../controllers/interviewController";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.use(requireAuth);
router.post("/", asyncHandler(createInterview));
router.get("/", asyncHandler(listInterviews));
router.get("/:id", asyncHandler(getInterviewRoom));
router.patch("/:id/answers", asyncHandler(saveAnswer));
router.post("/:id/end", asyncHandler(endInterview));
router.delete("/:id", asyncHandler(deleteInterview));
router.get("/:id/result", asyncHandler(getInterviewResult));
router.patch("/:id/code", asyncHandler(saveCode));
router.post("/:id/submit", asyncHandler(submitCode));

export default router;
