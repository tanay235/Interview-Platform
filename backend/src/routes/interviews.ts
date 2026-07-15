import { Router } from "express";
import { createInterview } from "../controllers/interviewController";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.use(requireAuth);
router.post("/", asyncHandler(createInterview));

export default router;
