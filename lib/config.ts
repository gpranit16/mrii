// Application configuration
export const config = {
  // Image comparison threshold (0-100)
  similarityThreshold: Number(process.env.SIMILARITY_THRESHOLD) || 95,
  
  // Max file size in bytes (default 10MB)
  maxFileSize: (Number(process.env.MAX_FILE_SIZE_MB) || 10) * 1024 * 1024,
  
  // Reference image path (relative to project root)
  referenceImagePath: "dataset/tumor.jpg",
  
  // Supported image formats
  supportedFormats: ["image/jpeg", "image/jpg", "image/png", "image/webp"] as string[],
  
  // Image processing settings
  imageProcessing: {
    resizeWidth: 512,
    resizeHeight: 512,
    quality: 90,
  },
} as const;
