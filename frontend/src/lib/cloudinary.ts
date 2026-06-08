// Unsigned, client-side Cloudinary upload. The cloud name + unsigned upload
// preset are public by design (no API secret involved). Configure them in
// frontend/.env.local:
//   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud
//   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-unsigned-preset

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function isCloudinaryConfigured(): boolean {
  return Boolean(CLOUD_NAME && UPLOAD_PRESET);
}

export async function uploadToCloudinary(file: File): Promise<string> {
  if (!isCloudinaryConfigured()) {
    throw new Error(
      "Image upload is not configured. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET."
    );
  }
  if (!ALLOWED.includes(file.type)) {
    throw new Error("Please choose a JPG, PNG, WEBP, or GIF image.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Image must be 5 MB or smaller.");
  }

  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", UPLOAD_PRESET as string);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    let msg = "Image upload failed.";
    try {
      const data = await res.json();
      msg = data?.error?.message || msg;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }

  const data = (await res.json()) as { secure_url?: string };
  if (!data.secure_url) {
    throw new Error("Image upload did not return a URL.");
  }
  return data.secure_url;
}
