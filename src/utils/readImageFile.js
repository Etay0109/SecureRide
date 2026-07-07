import { MAX_IMAGE_BYTES } from "./constants";

// Read an image File as a base64 data URL, validating type and size.
// Resolves with the data URL string, or rejects with a user-facing Error.
export function readImageAsDataUrl(file, { maxBytes = MAX_IMAGE_BYTES } = {}) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type?.startsWith("image/")) {
      reject(new Error("Please upload an image file"));
      return;
    }
    if (file.size > maxBytes) {
      reject(new Error("Image must be under 10 MB"));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error("Failed to read the image file"));
    reader.readAsDataURL(file);
  });
}
