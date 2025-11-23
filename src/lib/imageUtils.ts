/**
 * Resizes an image to a maximum width/height while maintaining aspect ratio.
 * Returns a Blob of the resized image.
 */
export async function resizeImage(file: File, maxWidth: number, maxHeight: number, quality = 0.8): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.src = URL.createObjectURL(file)
        img.onload = () => {
            URL.revokeObjectURL(img.src)
            const canvas = document.createElement('canvas')
            let width = img.width
            let height = img.height

            if (width > height) {
                if (width > maxWidth) {
                    height *= maxWidth / width
                    width = maxWidth
                }
            } else {
                if (height > maxHeight) {
                    width *= maxHeight / height
                    height = maxHeight
                }
            }

            canvas.width = width
            canvas.height = height
            const ctx = canvas.getContext('2d')
            if (!ctx) {
                reject(new Error('Failed to get canvas context'))
                return
            }
            ctx.drawImage(img, 0, 0, width, height)

            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob)
                    } else {
                        reject(new Error('Canvas to Blob failed'))
                    }
                },
                'image/jpeg',
                quality
            )
        }
        img.onerror = (err) => reject(err)
    })
}

/**
 * Generates a thumbnail and an optimized original for a given image file.
 */
export async function processImage(file: File): Promise<{ original: Blob, thumbnail: Blob }> {
    // Optimize original (max 1920x1920)
    const original = await resizeImage(file, 1920, 1920, 0.8)
    // Generate thumbnail (max 150x150)
    const thumbnail = await resizeImage(file, 150, 150, 0.7)

    return { original, thumbnail }
}
