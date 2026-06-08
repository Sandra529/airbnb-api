import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import prisma from "../config/prisma";
import { AuthRequest } from "../middlewares/auth.middleware";
import { sendEmail } from "../config/email";
import { welcomeEmail, passwordResetEmail } from "../templates/emails";

const JWT_SECRET = process.env["JWT_SECRET"] as string;

export async function register(req: Request, res: Response) {
  try {
    const { name, email, username, password, role } = req.body;
    if (!name || !email || !username || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (existing) {
      return res.status(409).json({ error: "Email or username already in use" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const validRoles = ["GUEST", "HOST", "ADMIN"];
    const userRole = validRoles.includes(role) ? role : "GUEST";
    const user = await prisma.user.create({
      data: { name, email, username, password: hashedPassword, role: userRole },
    });
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json({ token, user: userWithoutPassword });
    try {
      await sendEmail(email, "Welcome to Airbnb!", welcomeEmail(name, userRole));
    } catch (emailError) {
      console.error("Welcome email failed:", emailError);
    }
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
    const { password: _, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
}

export async function getMe(req: AuthRequest, res: Response) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { listings: req.role === "HOST", bookings: req.role === "GUEST" },
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
}

export async function changePassword(req: AuthRequest, res: Response) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "currentPassword and newPassword are required" });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters" });
    }
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ error: "User not found" });
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: req.userId }, data: { password: hashedPassword } });
    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
}

export async function forgotPassword(req: Request, res: Response) {
  try {
    const { email } = req.body;
    const successResponse = { message: "If that email is registered, a reset link has been sent" };
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.json(successResponse);
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: hashedToken, resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000) },
    });
    const resetLink = `${process.env["API_URL"] || "http://localhost:3000"}/auth/reset-password/${rawToken}`;
    res.json(successResponse);
    try {
      await sendEmail(email, "Password Reset Request", passwordResetEmail(user.name, resetLink));
    } catch (emailError) {
      console.error("Password reset email failed:", emailError);
    }
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
}

export async function resetPassword(req: Request, res: Response) {
  try {
    const token = req.params.token as string;
    const { password } = req.body;
    if (!password || password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await prisma.user.findFirst({
      where: { resetToken: hashedToken, resetTokenExpiry: { gt: new Date() } },
    });
    if (!user) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, resetToken: null, resetTokenExpiry: null },
    });
    res.json({ message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
}
