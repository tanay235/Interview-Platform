import { Router } from "express";
import { getProfile, updateProfile } from "../controllers/profileController";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.use(requireAuth);
router.get("/profile", asyncHandler(getProfile));
router.put("/profile", asyncHandler(updateProfile));

export default router;
