import { Router } from "express";
import {
  uploadAvatar,
  uploadListingPhoto,
  deleteListingPhoto,
} from "../controllers/upload.controller";
import { authenticate } from "../middlewares/auth.middleware";
import multer from "multer";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * @swagger
 * /users/{id}/avatar:
 *   post:
 *     summary: Upload user avatar
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Avatar uploaded
 */
router.post("/users/:id/avatar", authenticate, upload.single("file"), uploadAvatar);

/**
 * @swagger
 * /listings/{id}/photos:
 *   post:
 *     summary: Upload a photo for a listing
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Photo uploaded
 */
router.post("/listings/:id/photos", authenticate, upload.single("file"), uploadListingPhoto);

/**
 * @swagger
 * /listings/{id}/photos/{photoId}:
 *   delete:
 *     summary: Delete a listing photo
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: photoId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Photo deleted
 */
router.delete("/listings/:id/photos/:photoId", authenticate, deleteListingPhoto);

export default router;