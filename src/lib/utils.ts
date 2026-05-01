import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility for merging tailwind classes using clsx and tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  // If twMerge is not available in the environment, fallback to clsx
  try {
    return twMerge(clsx(inputs));
  } catch (e) {
    return clsx(inputs);
  }
}

/**
 * Upload a base64 encoded image to Cloudinary
 */
export const uploadBase64Image = async (
  base64Data: string
): Promise<string> => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    console.error("Cloudinary configuration missing");
    throw new Error("Cloudinary configuration missing");
  }

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: JSON.stringify({
        file: `data:image/jpeg;base64,${base64Data}`,
        upload_preset: uploadPreset,
      }),
      headers: { "Content-Type": "application/json" },
    }
  );

  if (!res.ok) {
    const errorBody = await res.json();
    console.error("Cloudinary upload failed:", errorBody);
    throw new Error(errorBody.error?.message || "Cloudinary upload failed");
  }

  const file = await res.json();
  return file.secure_url;
};

/**
 * Convert a File object to a base64 string
 */
export const convertFileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string)
        .replace("data:", "")
        .replace(/^.+,/, "");
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

/**
 * Normalize and clean string inputs
 */
export function cleanString(str: any): string {
  // Convert to proper JS string, remove nulls, normalize unicode
  return String(str || "")
    .normalize("NFC")
    .replace(/\u0000/g, "")
    .trim();
}
