import { describe, it, expect, beforeEach } from 'vitest';
import { db } from './db';
import { saveLog } from './actions';
import 'fake-indexeddb/auto';

// Mock Blob for test environment if needed, or just use plain objects to verify array handling logic.
// Since fake-indexeddb/jsdom has issues with structuredClone of Blobs, we verify the logic using plain objects.
// The browser's IndexedDB handles Blobs natively.

describe('Database Image Handling', () => {
    beforeEach(async () => {
        await db.delete();
        await db.open();
    });

    it('should save a single record with multiple images (simulated as objects)', async () => {
        // Using plain objects to verify array persistence logic
        const photo1 = { type: 'image/jpeg', content: 'photo1' } as unknown as Blob;
        const photo2 = { type: 'image/jpeg', content: 'photo2' } as unknown as Blob;
        const thumbnail1 = { type: 'image/jpeg', content: 'thumb1' } as unknown as Blob;
        const thumbnail2 = { type: 'image/jpeg', content: 'thumb2' } as unknown as Blob;

        const log = {
            date: '2023-01-01',
            place: 'Test Place',
            people: ['Person A'],
            photos: [photo1, photo2],
            thumbnails: [thumbnail1, thumbnail2]
        };

        await saveLog(log);

        const savedLog = await db.logs.orderBy('id').last();
        expect(savedLog).toBeDefined();
        expect(savedLog?.photos).toHaveLength(2);
        expect(savedLog?.thumbnails).toHaveLength(2);

        // Verify content
        const savedPhoto1 = savedLog?.photos?.[0] as any;
        const savedPhoto2 = savedLog?.photos?.[1] as any;

        expect(savedPhoto1.content).toBe('photo1');
        expect(savedPhoto2.content).toBe('photo2');
    });

    it('should save multiple records with images independently', async () => {
        const photoA = { type: 'image/jpeg', content: 'photoA' } as unknown as Blob;
        const photoB = { type: 'image/jpeg', content: 'photoB' } as unknown as Blob;

        // Record 1
        await saveLog({
            date: '2023-01-01',
            place: 'Place A',
            people: ['Person A'],
            photos: [photoA],
            thumbnails: [photoA]
        });

        // Record 2
        await saveLog({
            date: '2023-01-02',
            place: 'Place B',
            people: ['Person B'],
            photos: [photoB],
            thumbnails: [photoB]
        });

        const logs = await db.logs.toArray();
        expect(logs).toHaveLength(2);

        const logA = logs.find(l => l.place === 'Place A');
        const logB = logs.find(l => l.place === 'Place B');

        expect(logA?.photos).toHaveLength(1);
        expect((logA?.photos?.[0] as any).content).toBe('photoA');

        expect(logB?.photos).toHaveLength(1);
        expect((logB?.photos?.[0] as any).content).toBe('photoB');
    });
});
