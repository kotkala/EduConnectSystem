'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Camera, Loader2 } from 'lucide-react'

interface AvatarUploadProps {
  uid: string
  url: string | null
  size?: number
  onUpload: (filePath: string) => void
  fallback?: string
}

export default function AvatarUpload({ 
  uid, 
  url, 
  size = 80, 
  onUpload, 
  fallback = 'U' 
}: AvatarUploadProps) {
  const supabase = createClient()
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    async function downloadImage(path: string) {
      try {
        const { data, error } = await supabase.storage.from('avatars').download(path)
        if (error) {
          throw error
        }

        const url = URL.createObjectURL(data)
        setAvatarUrl(url)
      } catch (error) {
        console.log('Error downloading image: ', error)
      }
    }

    if (url) downloadImage(url)
  }, [url, supabase])

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.')
      }

      const file = event.target.files[0]

      // Validate file size (5MB limit)
      if (file.size > 5242880) {
        throw new Error('File size must be less than 5MB')
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      if (!allowedTypes.includes(file.type)) {
        throw new Error('File must be an image (JPEG, PNG, WebP, or GIF)')
      }

      const fileExt = file.name.split('.').pop()
      const filePath = `${uid}-${Math.random()}.${fileExt}`

      console.log('Uploading file:', { filePath, fileSize: file.size, fileType: file.type })

      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw uploadError
      }

      console.log('Upload successful:', data)
      onUpload(filePath)
    } catch (error) {
      console.error('Avatar upload error:', error)
      toast.error(error instanceof Error ? error.message : 'Error uploading avatar!')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="relative">
      <Avatar className={`w-${size/4} h-${size/4}`} style={{ width: size, height: size }}>
        <AvatarImage src={avatarUrl || ''} alt="Avatar" />
        <AvatarFallback className="text-lg">
          {fallback}
        </AvatarFallback>
      </Avatar>
      
      <Button
        size="sm"
        variant="outline"
        className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
        disabled={uploading}
        asChild
      >
        <label htmlFor="avatar-upload" className="cursor-pointer">
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Camera className="w-4 h-4" />
          )}
        </label>
      </Button>
      
      <input
        id="avatar-upload"
        type="file"
        accept="image/*"
        onChange={uploadAvatar}
        disabled={uploading}
        className="hidden"
      />
    </div>
  )
}
