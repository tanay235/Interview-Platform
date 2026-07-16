import { Router } from "express";
import { createInterview, endInterview, getInterviewRoom, saveAnswer } from "../controllers/interviewController";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.use(requireAuth);
router.post("/", asyncHandler(createInterview));
router.get("/:id", asyncHandler(getInterviewRoom));
router.patch("/:id/answers", asyncHandler(saveAnswer));
router.post("/:id/end", asyncHandler(endInterview));

export default router;
