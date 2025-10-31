"use client"

import type React from "react"

import { useState } from "react"
import { Upload, CheckCircle, AlertCircle, Image as ImageIcon, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Progress } from "@/components/ui/progress"

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [result, setResult] = useState<{
    success: boolean
    hash?: string
    message: string
    similarity?: string
    details?: {
      pixelSimilarity?: string
      perceptualSimilarity?: string
      structuralSimilarity?: string
      processingTime?: string
    }
  } | null>(null)
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Validate file type
      if (!selectedFile.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file (JPEG, PNG, WebP)",
          variant: "destructive",
        })
        return
      }

      // Validate file size (10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 10MB",
          variant: "destructive",
        })
        return
      }

      setFile(selectedFile)
      setResult(null)

      // Generate preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(selectedFile)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select an image to verify",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setUploadProgress(0)
    
    try {
      const formData = new FormData()
      formData.append("file", file)

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const response = await fetch("/api/verify", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      const data = await response.json()

      if (data.success) {
        setResult({
          success: true,
          hash: data.hash,
          similarity: data.similarity,
          message: "✅ Image verified successfully!",
          details: data.details,
        })
        toast({
          title: "Success",
          description: `Image matched with ${data.similarity}% similarity`,
        })
      } else {
        setResult({
          success: false,
          similarity: data.similarity,
          message: data.error || "Image does not match. Please try again.",
          details: data.details,
        })
        toast({
          title: "Verification failed",
          description: data.error || "Image did not match the reference.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Verification error:", error)
      setResult({
        success: false,
        message: "An error occurred during verification.",
      })
      toast({
        title: "Error",
        description: "Failed to verify image. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setUploadProgress(0)
    }
  }

  const resetForm = () => {
    setResult(null)
    setFile(null)
    setPreview(null)
    setUploadProgress(0)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
          <h1 className="text-3xl font-bold text-center flex items-center justify-center gap-3">
            <ImageIcon className="w-8 h-8" />
            MRI Image Verification System
          </h1>
          <p className="text-center text-purple-100 mt-2">Advanced perceptual hash matching</p>
        </div>

        <div className="p-8">
          {result ? (
            <div
              className={`p-6 rounded-lg border-2 ${
                result.success ? "bg-green-50 border-green-300" : "bg-red-50 border-red-300"
              }`}
            >
              <div className="flex items-center gap-3 mb-4">
                {result.success ? (
                  <CheckCircle className="w-8 h-8 text-green-600" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-red-600" />
                )}
                <p className={`font-bold text-lg ${result.success ? "text-green-900" : "text-red-900"}`}>
                  {result.message}
                </p>
              </div>

              {/* Similarity Score */}
              {result.similarity && (
                <div className="mb-4 p-4 bg-white rounded-lg border">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-slate-700">Overall Similarity</span>
                    <span className={`text-2xl font-bold ${
                      result.success ? "text-green-600" : "text-red-600"
                    }`}>
                      {result.similarity}%
                    </span>
                  </div>
                  <Progress value={parseFloat(result.similarity)} className="h-2" />
                </div>
              )}

              {/* Detailed Metrics */}
              {result.details && (
                <div className="mb-4 p-4 bg-white rounded-lg border space-y-2">
                  <h3 className="font-semibold text-slate-800 mb-2">Analysis Details:</h3>
                  {result.details.pixelSimilarity && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Pixel Match:</span>
                      <span className="font-mono text-slate-800">{result.details.pixelSimilarity}%</span>
                    </div>
                  )}
                  {result.details.perceptualSimilarity && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Perceptual Hash:</span>
                      <span className="font-mono text-slate-800">{result.details.perceptualSimilarity}%</span>
                    </div>
                  )}
                  {result.details.structuralSimilarity && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Structural Match:</span>
                      <span className="font-mono text-slate-800">{result.details.structuralSimilarity}%</span>
                    </div>
                  )}
                  {result.details.processingTime && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Processing Time:</span>
                      <span className="font-mono text-slate-800">{result.details.processingTime}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Hash Code */}
              {result.hash && (
                <div className="mt-4 p-4 bg-gradient-to-r from-slate-100 to-slate-200 rounded-lg">
                  <p className="text-xs font-semibold text-slate-600 mb-2">🔐 SECRET HASH CODE:</p>
                  <div className="font-mono text-sm text-slate-900 break-all bg-white p-3 rounded border-2 border-green-400">
                    {result.hash}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">SHA-256 cryptographic hash of your verified image</p>
                </div>
              )}

              <Button onClick={resetForm} className="w-full mt-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                Verify Another Image
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Upload Area */}
              <label 
                htmlFor="file-input" 
                className="block border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-purple-400 hover:bg-purple-50 transition-all cursor-pointer"
              >
                <Upload className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <span className="text-slate-700 font-semibold text-lg block">Click to upload or drag and drop</span>
                <p className="text-sm text-slate-500 mt-2">PNG, JPG, JPEG, WebP • Max 10MB</p>
                <input
                  id="file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={loading}
                />
              </label>

              {/* Image Preview */}
              {preview && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="flex items-start gap-4">
                    <img 
                      src={preview} 
                      alt="Preview" 
                      className="w-32 h-32 object-cover rounded-lg border-2 border-purple-300"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-slate-800">Selected Image:</p>
                      <p className="text-sm text-slate-600 mt-1">{file?.name}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Size: {file ? (file.size / 1024).toFixed(2) : 0} KB
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Upload Progress */}
              {loading && uploadProgress > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Processing...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}

              {/* Submit Button */}
              <Button 
                type="submit" 
                disabled={!file || loading} 
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-6 text-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Analyzing Image...
                  </>
                ) : (
                  "Verify Image"
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
