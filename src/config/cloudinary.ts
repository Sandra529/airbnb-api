import { v2 as cloudinary, UploadApiErrorResponse, UploadApiResponse } from "cloudinary";

cloudinary.config({
  cloud_name: process.env["CLOUDINARY_CLOUD_NAME"],
  api_key: process.env["CLOUDINARY_API_KEY"],
  api_secret: process.env["CLOUDINARY_API_SECRET"],
});

export const uploadToCloudinary = (
  buffer: Buffer,
  folder: string
): Promise<{ url: string; publicId: string }> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: "auto", folder },
      (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (error) return reject(error);
        if (!result) return reject(new Error("No result from Cloudinary"));
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );
    stream.end(buffer);
  });
};

export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  await cloudinary.uploader.destroy(publicId);
};

export function getOptimizedUrl(
  url: string,
  width: number,
  height: number
): string {
  return url.replace(
    "/upload/",
    `/upload/w_${width},h_${height},c_fill,f_auto,q_auto/`
  );
}