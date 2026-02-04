/**
 * Lossless/near-lossless image compression for accepted upload types.
 * Re-encodes images via Canvas to reduce size without visible quality loss.
 */

const COMPRESSIBLE_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'] as const
const MIME_MAP: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
}

export function isCompressibleImage(ext: string): boolean {
  return COMPRESSIBLE_IMAGE_EXTENSIONS.includes(ext.toLowerCase() as typeof COMPRESSIBLE_IMAGE_EXTENSIONS[number])
}

/**
 * Compress image losslessly (PNG/WebP) or near-losslessly (JPEG).
 * Returns original file if not compressible or if compression fails/increases size.
 */
export async function compressImageLossless(file: File): Promise<File> {
  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  if (!isCompressibleImage(ext)) return file

  return new Promise((resolve) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(file)
        return
      }
      ctx.drawImage(img, 0, 0)

      const mime = MIME_MAP[ext] || 'image/png'
      const quality = mime === 'image/jpeg' ? 0.95 : 1.0

      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            resolve(file)
            return
          }
          const compressed = new File([blob], file.name, {
            type: mime,
            lastModified: file.lastModified,
          })
          resolve(compressed)
        },
        mime,
        quality
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(file)
    }

    img.src = objectUrl
  })
}
