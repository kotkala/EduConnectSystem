'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { Camera, Upload, Trash2, Loader2, ZoomIn, ZoomOut } from 'lucide-react'
import { Slider } from '@/components/ui/slider'

interface AvatarEditorProps {
  uid: string
  url: string | null
  size?: number
  onUpload: (filePath: string) => void
  onRemove?: () => void
  fallback?: string
}

interface CropData {
  x: number
  y: number
  width: number
  height: number
  scale: number
}

export default function AvatarEditor({ 
  uid, 
  url, 
  size = 80, 
  onUpload,
  onRemove,
  fallback = 'U' 
}: AvatarEditorProps) {
  const supabase = createClient()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [cropData, setCropData] = useState<CropData>({
    x: 0,
    y: 0,
    width: 200,
    height: 200,
    scale: 1
  })
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  // Load existing avatar
  const loadAvatar = useCallback(async (path: string) => {
    try {
      const { data, error } = await supabase.storage.from('avatars').download(path)
      if (error) throw error
      const url = URL.createObjectURL(data)
      setAvatarUrl(url)
    } catch (error) {
      console.log('Error downloading image: ', error)
    }
  }, [supabase])

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Reset file input
    event.target.value = ''

    // Validate file
    if (file.size > 5242880) {
      toast.error('File size must be less than 5MB')
      return
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      toast.error('File must be an image (JPEG, PNG, or WebP)')
      return
    }

    // Create preview URL
    const reader = new FileReader()
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string)
      setCropData({ x: 0, y: 0, width: 200, height: 200, scale: 1 }) // Reset crop data
      setIsEditorOpen(true)
    }
    reader.readAsDataURL(file)
  }

  // Crop and upload image
  const handleSaveAvatar = async () => {
    if (!selectedImage || !canvasRef.current) return

    try {
      setUploading(true)

      // Create image element to load the selected image
      const img = new Image()
      img.onload = async () => {
        const canvas = canvasRef.current!
        const ctx = canvas.getContext('2d')!

        // Set canvas size to 200x200 for avatar
        canvas.width = 200
        canvas.height = 200

        // Calculate the crop area based on the current scale and image dimensions
        const containerSize = 264 // Height of preview container
        const imageDisplayHeight = Math.min(containerSize, img.height * (containerSize / img.width))
        const imageDisplayWidth = Math.min(containerSize, img.width * (containerSize / img.height))

        // Scale factor between displayed image and actual image
        const scaleX = img.width / imageDisplayWidth
        const scaleY = img.height / imageDisplayHeight

        // Crop size in actual image coordinates (120px circle in 264px container)
        const cropSizeInDisplay = 120
        const cropSizeInImage = cropSizeInDisplay * Math.max(scaleX, scaleY) / cropData.scale

        // Center crop
        const cropX = (img.width - cropSizeInImage) / 2
        const cropY = (img.height - cropSizeInImage) / 2

        // Draw cropped image
        ctx.drawImage(
          img,
          cropX,
          cropY,
          cropSizeInImage,
          cropSizeInImage,
          0,
          0,
          200,
          200
        )

        // Convert to blob
        canvas.toBlob(async (blob) => {
          if (!blob) return

          try {
            // Upload to Supabase
            const fileExt = 'jpg'
            const filePath = `${uid}-${Math.random()}.${fileExt}`

            const { error: uploadError } = await supabase.storage
              .from('avatars')
              .upload(filePath, blob)

            if (uploadError) throw uploadError

            onUpload(filePath)
            setIsEditorOpen(false)
            setSelectedImage(null)
            // Toast will be shown by parent component
          } catch (error) {
            console.error('Avatar upload error:', error)
            toast.error('Error uploading avatar!')
          } finally {
            setUploading(false)
          }
        }, 'image/jpeg', 0.9)
      }

      img.src = selectedImage
    } catch (error) {
      console.error('Avatar upload error:', error)
      toast.error('Error uploading avatar!')
      setUploading(false)
    }
  }

  // Handle remove avatar
  const handleRemoveAvatar = async () => {
    if (onRemove) {
      setAvatarUrl(null) // Clear local avatar state
      onRemove()
      // Toast will be shown by parent component
    }
  }

  // Load avatar on URL change
  useEffect(() => {
    if (url) loadAvatar(url)
  }, [url, loadAvatar])

  return (
    <>
      <div className="relative">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="relative cursor-pointer group">
              <Avatar className="transition-all duration-200 group-hover:brightness-90 border-2 border-transparent group-hover:border-blue-200" style={{ width: size, height: size }}>
                <AvatarImage src={avatarUrl || ''} alt="Avatar" />
                <AvatarFallback className="text-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  {fallback}
                </AvatarFallback>
              </Avatar>

              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 bg-black/30 rounded-full">
                <div className="bg-white/90 rounded-full p-1.5">
                  <Camera className="w-4 h-4 text-gray-700" />
                </div>
              </div>

              {/* Small edit indicator */}
              <div className="absolute -bottom-1 -right-1 bg-blue-600 rounded-full p-1 border-2 border-white shadow-sm">
                <Camera className="w-3 h-3 text-white" />
              </div>
            </div>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start" className="w-52">
            <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="py-3">
              <Upload className="w-4 h-4 mr-3" />
              <div>
                <div className="font-medium">Upload Photo</div>
                <div className="text-xs text-gray-500">Choose from your device</div>
              </div>
            </DropdownMenuItem>
            {avatarUrl && (
              <DropdownMenuItem onClick={handleRemoveAvatar} className="py-3 text-red-600 focus:text-red-600">
                <Trash2 className="w-4 h-4 mr-3" />
                <div>
                  <div className="font-medium">Remove Photo</div>
                  <div className="text-xs text-red-400">Use default avatar</div>
                </div>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Avatar Editor Dialog */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Edit Profile Picture</DialogTitle>
            <p className="text-sm text-gray-600">Adjust your photo and choose how you want it to appear.</p>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedImage && (
              <div className="relative">
                {/* Preview container */}
                <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                  <div
                    className="relative flex items-center justify-center"
                    style={{
                      transform: `scale(${cropData.scale})`,
                      transformOrigin: 'center'
                    }}
                  >
                    <img
                      ref={imageRef}
                      src={selectedImage}
                      alt="Preview"
                      className="max-h-64 max-w-full object-contain"
                    />
                  </div>

                  {/* Circular crop overlay - fixed position */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div
                      className="border-2 border-white shadow-lg bg-transparent relative z-10"
                      style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '50%',
                        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
                      }}
                    />
                  </div>
                </div>

                {/* Zoom control */}
                <div className="space-y-2 mt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Zoom</span>
                    <span className="text-xs text-gray-500">{Math.round(cropData.scale * 100)}%</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <ZoomOut className="w-4 h-4 text-gray-500" />
                    <Slider
                      value={[cropData.scale]}
                      onValueChange={([scale]) => setCropData(prev => ({ ...prev, scale }))}
                      min={0.5}
                      max={3}
                      step={0.1}
                      className="flex-1"
                    />
                    <ZoomIn className="w-4 h-4 text-gray-500" />
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-between items-center pt-4 border-t">
              <Button variant="ghost" onClick={() => setIsEditorOpen(false)} disabled={uploading}>
                Cancel
              </Button>
              <Button onClick={handleSaveAvatar} disabled={uploading} className="bg-blue-600 hover:bg-blue-700">
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Save Photo
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />
    </>
  )
}
