/**
 * Utility functions for validating application proof screenshots and storage
 */

export const MAX_SCREENSHOT_BYTES = 2.5 * 1024 * 1024; // 2.5 MB maximum
export const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
];

export interface ProofValidationResult {
  isValid: boolean;
  error?: string;
  isDataUrl?: boolean;
  sizeBytes?: number;
}

/**
 * Validates screenshot proof image payload.
 * Accepts either:
 * 1. Base64 data URL: data:image/(png|jpeg|webp);base64,...
 * 2. Hosted HTTPS URL: https://...
 */
export function validateProofScreenshot(proofImageUrl: unknown): ProofValidationResult {
  if (!proofImageUrl || typeof proofImageUrl !== "string" || !proofImageUrl.trim()) {
    return {
      isValid: false,
      error: "Mandatory proof screenshot is missing. Please upload proof of application.",
    };
  }

  const trimmed = proofImageUrl.trim();

  // 1. Check if it's an HTTP/HTTPS URL
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      new URL(trimmed);
      return { isValid: true, isDataUrl: false };
    } catch {
      return { isValid: false, error: "Invalid screenshot URL provided." };
    }
  }

  // 2. Check if it's a Base64 Data URL
  if (trimmed.startsWith("data:")) {
    const matches = trimmed.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (!matches) {
      return {
        isValid: false,
        error: "Malformed image data URL. Format must be data:image/(png|jpeg|webp);base64,...",
      };
    }

    const mimeType = matches[1].toLowerCase();
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return {
        isValid: false,
        error: `Unsupported image format (${mimeType}). Allowed formats: PNG, JPEG, WebP.`,
      };
    }

    const base64Content = matches[2];
    // Approximate byte size: 3/4 of base64 character length
    const approxBytes = Math.ceil((base64Content.length * 3) / 4);

    if (approxBytes > MAX_SCREENSHOT_BYTES) {
      const maxMb = (MAX_SCREENSHOT_BYTES / (1024 * 1024)).toFixed(1);
      return {
        isValid: false,
        error: `Screenshot file size is too large (approx ${(approxBytes / (1024 * 1024)).toFixed(1)}MB). Maximum allowed is ${maxMb}MB.`,
        sizeBytes: approxBytes,
      };
    }

    return {
      isValid: true,
      isDataUrl: true,
      sizeBytes: approxBytes,
    };
  }

  return {
    isValid: false,
    error: "Invalid proof screenshot format. Expected an image file or URL.",
  };
}
