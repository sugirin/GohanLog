import { db, type Log, type Tag } from './db';

interface BackupData {
    version: number;
    timestamp: string;
    logs: (Omit<Log, 'photos' | 'thumbnails'> & { photos?: string[], thumbnails?: string[] })[];
    tags: Tag[];
}

// Helper to convert Blob to Base64
const blobToBase64 = (blob: Blob | string): Promise<string> => {
    if (typeof blob === 'string') {
        return Promise.resolve(blob);
    }
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

// Helper to convert Base64 to Blob
const base64ToBlob = async (base64: string): Promise<Blob> => {
    const res = await fetch(base64);
    return res.blob();
};

export async function exportData(): Promise<void> {
    try {
        const logs = await db.logs.toArray();
        const tags = await db.tags.toArray();

        // Convert Blobs in logs to Base64
        const processedLogs = await Promise.all(logs.map(async (log) => {
            const photos = log.photos
                ? await Promise.all(log.photos.map(blobToBase64))
                : [];
            const thumbnails = log.thumbnails
                ? await Promise.all(log.thumbnails.map(blobToBase64))
                : [];

            return {
                ...log,
                photos,
                thumbnails
            };
        }));

        const backup: BackupData = {
            version: 1,
            timestamp: new Date().toISOString(),
            logs: processedLogs,
            tags
        };

        const jsonString = JSON.stringify(backup);
        const fileName = `gohan-log-backup-${new Date().toISOString().split('T')[0]}.json`;

        // Try Web Share API first (better for Mobile/PWA)
        try {
            const file = new File([jsonString], fileName, { type: 'application/json' });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'GohanLog Backup',
                    text: 'Backup data from GohanLog'
                });
                return; // Share successful, exit
            }
        } catch (shareError) {
            console.warn('Web Share API failed or rejected, falling back to download:', shareError);
            // Continue to fallback
        }

        // Fallback: Direct Download (Desktop / Non-share browsers)
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Export failed:', error);
        throw new Error('Failed to export data');
    }
}

export async function importData(file: File): Promise<void> {
    try {
        const text = await file.text();
        const backup: BackupData = JSON.parse(text);

        if (!backup.logs || !backup.tags) {
            throw new Error('Invalid backup file format');
        }

        // Convert Base64 back to Blobs
        const processedLogs = await Promise.all(backup.logs.map(async (log) => {
            const photos = log.photos
                ? await Promise.all(log.photos.map(base64ToBlob))
                : [];
            const thumbnails = log.thumbnails
                ? await Promise.all(log.thumbnails.map(base64ToBlob))
                : [];

            return {
                ...log,
                photos,
                thumbnails
            } as Log;
        }));

        await db.transaction('rw', db.logs, db.tags, async () => {
            // Clear existing data? Or merge? 
            // For safety, let's merge/overwrite by ID if exists, or add if new.
            // But if IDs conflict, it might be messy. 
            // Simplest approach for "Restore" is usually to clear and replace, or merge intelligently.
            // Given the user might be moving devices, IDs might clash if they started using the new device.
            // Let's use bulkPut which updates if key exists, adds if not.

            await db.logs.bulkPut(processedLogs);
            await db.tags.bulkPut(backup.tags);
        });

    } catch (error) {
        console.error('Import failed:', error);
        throw new Error('Failed to import data');
    }
}
