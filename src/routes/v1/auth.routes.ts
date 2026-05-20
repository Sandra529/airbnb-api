import { Router } from "express";
import {
  register,
  login,
  getMe,
  changePassword,
  forgotPassword,
  resetPassword,
} from "../../controllers/auth.controller";
import { authenticate } from "../../middlewares/auth.middleware";

const router = Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterInput'
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Missing or invalid fields
 *       409:
 *         description: Email or username already in use
 */
router.post("/register", register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login and receive JWT token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", login);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get logged in user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *       401:
 *         description: Unauthorized
 */
router.get("/me", authenticate, getMe);

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: Change password
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       401:
 *         description: Unauthorized
 */
router.post("/change-password", authenticate, changePassword);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset link
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Reset link sent if email is registered
 */
router.post("/forgot-password", forgotPassword);

/**
 * @swagger
 * /auth/reset-password/{token}:
 *   post:
 *     summary: Reset password using token
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid or expired token
 */
router.post("/reset-password/:token", resetPassword);

export default router;