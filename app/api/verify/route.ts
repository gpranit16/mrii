import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import crypto from "crypto"
import { Jimp } from "jimp"
import { config } from "@/lib/config"
import path from "path"
import fs from "fs"

function getSupabaseClient() {
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      getAll: () => [],
      setAll: () => {},
    },
  })
}

// Generate SHA-256 hash of file
function hashFile(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex")
}

// Generate perceptual hash (similar to Python's imagehash.phash)
async function generatePerceptualHash(imageBuffer: Buffer): Promise<string> {
  try {
    const image = await Jimp.read(imageBuffer)
    
    // Resize to 32x32 for perceptual hashing and convert to greyscale
    image.resize({ w: 32, h: 32 }).greyscale()
    
    const pixels: number[] = []
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 32; x++) {
        const pixel = image.getPixelColor(x, y)
        // Extract red channel (grayscale, so r=g=b)
        const r = (pixel >> 24) & 0xff
        pixels.push(r)
      }
    }
    
    // Calculate average pixel value
    const avg = pixels.reduce((sum, val) => sum + val, 0) / pixels.length
    
    // Create hash: 1 if pixel > average, 0 otherwise
    let hash = ""
    for (const pixel of pixels) {
      hash += pixel > avg ? "1" : "0"
    }
    
    // Convert binary to hex
    let hexHash = ""
    for (let i = 0; i < hash.length; i += 4) {
      const chunk = hash.slice(i, i + 4)
      hexHash += parseInt(chunk, 2).toString(16)
    }
    
    return hexHash
  } catch (error) {
    console.error("[Perceptual Hash Error]", error)
    throw new Error("Failed to generate perceptual hash")
  }
}

// Calculate Hamming distance between two hex hashes
function hammingDistance(hash1: string, hash2: string): number {
  if (hash1.length !== hash2.length) {
    throw new Error("Hashes must be of equal length")
  }
  
  let distance = 0
  for (let i = 0; i < hash1.length; i++) {
    const xor = parseInt(hash1[i], 16) ^ parseInt(hash2[i], 16)
    // Count bits set in XOR result
    distance += xor.toString(2).split('1').length - 1
  }
  
  return distance
}

// Advanced pixel-by-pixel comparison using Jimp
async function compareImagesAdvanced(uploadedBuffer: Buffer, referenceBuffer: Buffer): Promise<{
  pixelSimilarity: number
  perceptualSimilarity: number
  structuralSimilarity: number
  overallSimilarity: number
}> {
  try {
    const [uploadedImage, referenceImage] = await Promise.all([
      Jimp.read(uploadedBuffer),
      Jimp.read(referenceBuffer),
    ])

    // Resize both images to standard size for fair comparison
    const { resizeWidth, resizeHeight } = config.imageProcessing
    uploadedImage.resize({ w: resizeWidth, h: resizeHeight })
    referenceImage.resize({ w: resizeWidth, h: resizeHeight })

    // 1. Pixel-by-pixel comparison
    let matchingPixels = 0
    let totalDifference = 0
    const totalPixels = resizeWidth * resizeHeight

    for (let y = 0; y < resizeHeight; y++) {
      for (let x = 0; x < resizeWidth; x++) {
        const uploadedPixel = uploadedImage.getPixelColor(x, y)
        const referencePixel = referenceImage.getPixelColor(x, y)

        // Extract RGBA components (color is stored as 32-bit integer: RGBA)
        const ur = (uploadedPixel >> 24) & 0xff
        const ug = (uploadedPixel >> 16) & 0xff
        const ub = (uploadedPixel >> 8) & 0xff
        
        const rr = (referencePixel >> 24) & 0xff
        const rg = (referencePixel >> 16) & 0xff
        const rb = (referencePixel >> 8) & 0xff

        const diff = Math.abs(ur - rr) + Math.abs(ug - rg) + Math.abs(ub - rb)

        totalDifference += diff
        if (diff < 30) matchingPixels++ // Tolerance for similar pixels
      }
    }

    const pixelSimilarity = (matchingPixels / totalPixels) * 100
    const structuralSimilarity = Math.max(0, 100 - (totalDifference / (totalPixels * 765)) * 100) // 765 = max RGB diff

    // 2. Perceptual hash comparison
    const uploadedHash = await generatePerceptualHash(uploadedBuffer)
    const referenceHash = await generatePerceptualHash(referenceBuffer)
    const hammingDist = hammingDistance(uploadedHash, referenceHash)
    
    // Convert Hamming distance to similarity percentage (lower distance = higher similarity)
    // Max distance for 256-bit hash is ~256, we use threshold of 10 for "similar"
    const perceptualSimilarity = Math.max(0, 100 - (hammingDist / 10) * 100)

    // 3. Overall similarity (weighted average)
    const overallSimilarity = (
      pixelSimilarity * 0.4 +
      structuralSimilarity * 0.3 +
      perceptualSimilarity * 0.3
    )

    console.log("[Comparison Results]", {
      pixelSimilarity: pixelSimilarity.toFixed(2),
      perceptualSimilarity: perceptualSimilarity.toFixed(2),
      structuralSimilarity: structuralSimilarity.toFixed(2),
      overallSimilarity: overallSimilarity.toFixed(2),
      hammingDist,
    })

    return {
      pixelSimilarity,
      perceptualSimilarity,
      structuralSimilarity,
      overallSimilarity,
    }
  } catch (error) {
    console.error("[Image Comparison Error]", error)
    throw new Error("Failed to compare images")
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    console.log("[API] Starting verification request")

    // Parse form data
    const formData = await request.formData()
    const file = formData.get("file") as File

    // Validate file existence
    if (!file) {
      console.log("[API] No file provided")
      return NextResponse.json({ 
        success: false, 
        error: "No file provided" 
      }, { status: 400 })
    }

    // Validate file size
    if (file.size > config.maxFileSize) {
      console.log("[API] File too large:", file.size)
      return NextResponse.json({ 
        success: false, 
        error: `File size exceeds ${config.maxFileSize / 1024 / 1024}MB limit` 
      }, { status: 400 })
    }

    // Validate file type
    if (!config.supportedFormats.includes(file.type)) {
      console.log("[API] Unsupported file type:", file.type)
      return NextResponse.json({ 
        success: false, 
        error: "Unsupported file format. Please upload JPEG, PNG, or WebP images." 
      }, { status: 400 })
    }

    console.log("[API] File received:", {
      name: file.name,
      size: `${(file.size / 1024).toFixed(2)} KB`,
      type: file.type,
    })

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Generate SHA-256 hash
    const hash = hashFile(buffer)
    console.log("[API] SHA-256 hash computed:", hash.substring(0, 16) + "...")

    // Load reference image from file system (dataset folder is in root, not public)
    const referenceImagePath = path.join(process.cwd(), "dataset", "tumor.jpg")
    
    if (!fs.existsSync(referenceImagePath)) {
      console.error("[API] Reference image not found at:", referenceImagePath)
      return NextResponse.json({ 
        success: false, 
        error: "Reference image not found on server" 
      }, { status: 500 })
    }

    const referenceBuffer = fs.readFileSync(referenceImagePath)
    console.log("[API] Reference image loaded:", {
      size: `${(referenceBuffer.length / 1024).toFixed(2)} KB`,
    })

    // Perform advanced image comparison
    const comparisonResult = await compareImagesAdvanced(buffer, referenceBuffer)
    const { overallSimilarity, pixelSimilarity, perceptualSimilarity, structuralSimilarity } = comparisonResult

    // Determine if match based on threshold
    const isMatch = overallSimilarity >= config.similarityThreshold

    const processingTime = Date.now() - startTime
    console.log("[API] Verification complete:", {
      isMatch,
      overallSimilarity: overallSimilarity.toFixed(2) + "%",
      processingTime: processingTime + "ms",
    })

    // Log to Supabase (optional - gracefully skip if not configured)
    try {
      // Check if Supabase is properly configured
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      
      if (supabaseUrl && supabaseKey && 
          !supabaseUrl.includes('your-project') && 
          !supabaseKey.includes('your_service')) {
        const supabase = getSupabaseClient()
        const { error: insertError } = await supabase.from("verifications").insert({
          filename: file.name,
          match_result: isMatch,
          hash,
          similarity_percentage: overallSimilarity,
        })

        if (insertError) {
          console.error("[API] Supabase insert error:", insertError.message)
        } else {
          console.log("[API] Verification logged to Supabase")
        }
      } else {
        console.log("[API] Supabase not configured - skipping database logging")
      }
    } catch (dbError) {
      // Don't fail the request if database logging fails
      console.log("[API] Database logging skipped:", dbError instanceof Error ? dbError.message : 'Unknown error')
    }

    // Return detailed response
    if (isMatch) {
      return NextResponse.json({
        success: true,
        hash,
        similarity: overallSimilarity.toFixed(2),
        details: {
          pixelSimilarity: pixelSimilarity.toFixed(2),
          perceptualSimilarity: perceptualSimilarity.toFixed(2),
          structuralSimilarity: structuralSimilarity.toFixed(2),
          processingTime: `${processingTime}ms`,
        },
      })
    } else {
      return NextResponse.json({
        success: false,
        error: "Image does not match the reference",
        similarity: overallSimilarity.toFixed(2),
        details: {
          pixelSimilarity: pixelSimilarity.toFixed(2),
          perceptualSimilarity: perceptualSimilarity.toFixed(2),
          structuralSimilarity: structuralSimilarity.toFixed(2),
          threshold: config.similarityThreshold,
          processingTime: `${processingTime}ms`,
        },
      })
    }
  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error("[API] Verification error:", error)
    
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Verification failed",
      processingTime: `${processingTime}ms`,
    }, { status: 500 })
  }
}
