import { Router, type Request, type Response } from "express";
import authRoutes from "./auth";
import userRoutes from "./users";

const router = Router();

router.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "API is running",
  });
});

router.use("/auth", authRoutes);
router.use("/users", userRoutes);

export default router;
