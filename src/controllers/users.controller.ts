import { Request, Response } from "express";
import prisma from "../config/prisma";
import bcrypt from "bcrypt";

// GET /users
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      include: { _count: { select: { listings: true } } },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

// GET /users/:id
export const getUserById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const user = await prisma.user.findUnique({
      where: { id },
      include: { listings: true, bookings: true },
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

// POST /users
export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, username, phone, role, password } = req.body;

    if (!name || !email || !username || !phone || !role || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });

    if (existing) {
      return res.status(409).json({ message: "Email or username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name, email, username, role,
        password: hashedPassword,
        avatar: req.body.avatar,
        bio: req.body.bio,
      },
    });

    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

// PUT /users/:id
export const updateUser = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const existing = await prisma.user.findFirst({ where: { id } });
    if (!existing) return res.status(404).json({ message: "User not found" });

    const user = await prisma.user.update({ where: { id }, data: req.body });

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

// DELETE /users/:id
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const existing = await prisma.user.findFirst({ where: { id } });
    if (!existing) return res.status(404).json({ message: "User not found" });

    await prisma.user.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};