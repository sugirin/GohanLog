import { db, type Log, type Tag } from './db';
import { blobToBase64 } from './imageUtils';

interface BackupData {
    version: number;
    timestamp: string;
    logs: (Omit<Log, 'photos' | 'thumbnails'> & { photos?: string[], thumbnails?: string[] })[];
    tags: Tag[];
}

// 写真は Base64 文字列（data URL）に揃える。すでに文字列ならそのまま。
const toBase64 = (image: Blob | string): Promise<string> =>
    typeof image === 'string' ? Promise.resolve(image) : blobToBase64(image);

export async function exportData(): Promise<void> {
    try {
        const logs = await db.logs.toArray();
        const tags = await db.tags.toArray();

        // Convert Blobs in logs to Base64
        const processedLogs = await Promise.all(logs.map(async (log) => {
            const photos = log.photos
                ? await Promise.all(log.photos.map(toBase64))
                : [];
            const thumbnails = log.thumbnails
                ? await Promise.all(log.thumbnails.map(toBase64))
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

        // 写真は Base64 文字列のまま保存する（Blob に戻さない）。
        // iOS / Android の WebView では IndexedDB に入れた Blob が後から読めなくなることがあるため、
        // saveLog / updateLog と同じく文字列で永続化する。表示側は Blob / string の両方に対応済み。
        const processedLogs: Log[] = backup.logs.map((log) => ({
            ...log,
            photos: log.photos ?? [],
            thumbnails: log.thumbnails ?? [],
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
