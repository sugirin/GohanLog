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

/**
 * Capacitorのカメラプラグインを使用して写真を撮影
 * ネイティブプラットフォームでのみ動作
 */
export async function capturePhotoNative(): Promise<File> {
    const { Camera } = await import('@capacitor/camera');
    const { CameraResultType, CameraSource } = await import('@capacitor/camera');

    const photo = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        quality: 90,
    });

    if (!photo.webPath) {
        throw new Error('Failed to capture photo');
    }

    // webPathからFileオブジェクトを作成
    const response = await fetch(photo.webPath);
    const blob = await response.blob();
    const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });

    return file;
}

/**
 * Capacitorのカメラプラグインを使用してギャラリーから写真を選択
 * ネイティブプラットフォームでのみ動作
 */
export async function pickPhotoFromGallery(): Promise<File> {
    const { Camera } = await import('@capacitor/camera');
    const { CameraResultType, CameraSource } = await import('@capacitor/camera');

    const photo = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos,
        quality: 90,
    });

    if (!photo.webPath) {
        throw new Error('Failed to pick photo');
    }

    // webPathからFileオブジェクトを作成
    const response = await fetch(photo.webPath);
    const blob = await response.blob();
    const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });

    return file;
}

/**
 * BlobをBase64文字列に変換
 */
export function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result);
            } else {
                reject(new Error('Failed to convert blob to base64'));
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

/**
 * Base64文字列をBlobに変換
 */
export async function base64ToBlob(base64: string): Promise<Blob> {
    const response = await fetch(base64);
    return await response.blob();
}
