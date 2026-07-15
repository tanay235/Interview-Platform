import type { Request, Response } from "express";
import { UserModel, type UserDocument } from "../models/User";
import { comparePassword, hashPassword } from "../utils/password";
import { createToken } from "../utils/jwt";

interface AuthBody {
  name?: string;
  email?: string;
  password?: string;
}

function publicUser(user: UserDocument) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    skills: user.skills ?? [],
    experienceLevel: user.experienceLevel ?? "entry",
    preferredRole: user.preferredRole ?? "",
  };
}

export async function register(req: Request<unknown, unknown, AuthBody>, res: Response): Promise<void> {
  const name = req.body.name?.trim();
  const email = req.body.email?.trim().toLowerCase();
  const password = req.body.password;
  if (!name || !email || !password) {
    res.status(400).json({ success: false, message: "Name, email, and password are required" });
    return;
  }
  if (name.length < 2 || password.length < 8 || !/^\S+@\S+\.\S+$/.test(email)) {
    res.status(400).json({ success: false, message: "Enter a valid name, email, and password of at least 8 characters" });
    return;
  }
  if (await UserModel.exists({ email })) {
    res.status(409).json({ success: false, message: "An account with this email already exists" });
    return;
  }

  const user = await UserModel.create({ name, email, passwordHash: await hashPassword(password) });
  res.status(201).json({ success: true, data: { user: publicUser(user), token: createToken({ id: user.id, email: user.email, name: user.name }) } });
}

export async function login(req: Request<unknown, unknown, AuthBody>, res: Response): Promise<void> {
  const email = req.body.email?.trim().toLowerCase();
  const password = req.body.password;
  if (!email || !password) {
    res.status(400).json({ success: false, message: "Email and password are required" });
    return;
  }

  const user = await UserModel.findOne({ email }).select("+passwordHash");
  if (!user || !(await comparePassword(password, user.passwordHash))) {
    res.status(401).json({ success: false, message: "Invalid email or password" });
    return;
  }
  res.status(200).json({ success: true, data: { user: publicUser(user), token: createToken({ id: user.id, email: user.email, name: user.name }) } });
}

export function me(req: Request & { user?: { sub: string; email: string; name: string } }, res: Response): void {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Authentication required" });
    return;
  }
  res.json({ success: true, data: { user: { id: req.user.sub, email: req.user.email, name: req.user.name } } });
}
