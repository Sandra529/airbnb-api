import { Request, Response } from "express";
import { v2 as cloudinary } from "cloudinary";
import prisma from "../config/prisma";
import { AuthRequest } from "../middlewares/auth.middleware";

cloudinary.config({
  cloud_name: process.env["CLOUDINARY_CLOUD_NAME"],
  api_key: process.env["CLOUDINARY_API_KEY"],
  api_secret: process.env["CLOUDINARY_API_SECRET"],
});

// POST /users/:id/avatar
export const uploadAvatar = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    if (req.userId !== id) {
      return res.status(403).json({ message: "You can only update your own avatar" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.avatarPublicId) {
      await cloudinary.uploader.destroy(user.avatarPublicId);
    }

    const result = await new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream({ folder: "avatars" }, (error, result) => {
            if (error || !result) return reject(error);
            resolve(result);
          })
          .end(req.file!.buffer);
      }
    );

    const updated = await prisma.user.update({
      where: { id },
      data: { avatar: result.secure_url, avatarPublicId: result.public_id },
    });

    const { password: _, ...userWithoutPassword } = updated;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

// POST /listings/:id/photos
export const uploadListingPhoto = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) return res.status(404).json({ message: "Listing not found" });

    if (req.userId !== listing.hostId) {
      return res.status(403).json({ message: "You can only add photos to your own listings" });
    }

    const photos = await prisma.listingPhoto.findMany({
      where: { listingId: id },
    });

    if (photos.length >= 5) {
      return res.status(400).json({ message: "Maximum 5 photos per listing" });
    }

    const result = await new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream({ folder: "listings" }, (error, result) => {
            if (error || !result) return reject(error);
            resolve(result);
          })
          .end(req.file!.buffer);
      }
    );

    const { url, publicId } = { url: result.secure_url, publicId: result.public_id };

    const photo = await prisma.listingPhoto.create({
      data: { url, publicId, listingId: id },
    });

    await prisma.listing.update({ where: { id }, data: {} });

    res.status(201).json(photo);
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

// DELETE /listings/:id/photos/:photoId
export const deleteListingPhoto = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const photoId = req.params.photoId as string;

    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) return res.status(404).json({ message: "Listing not found" });

    const photo = await prisma.listingPhoto.findUnique({ where: { id: photoId } });
    if (!photo) return res.status(404).json({ message: "Photo not found" });

    if (photo.listingId !== id) {
      return res.status(403).json({ message: "Photo does not belong to this listing" });
    }

    await cloudinary.uploader.destroy(photo.publicId);
    await prisma.listingPhoto.delete({ where: { id: photoId } });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};