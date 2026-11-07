import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import "fake-indexeddb/auto";
import { db } from './db';
import { importData } from './backup';

const PHOTO = 'data:image/jpeg;base64,cGhvdG8=';
const THUMB = 'data:image/jpeg;base64,dGh1bWI=';

// jsdom の File は text() を実装していないため、importData が使う text() だけを持つスタブを渡す。
const makeBackupFile = (data: unknown) =>
    ({ text: () => Promise.resolve(JSON.stringify(data)) }) as unknown as File;

describe('importData', () => {
    beforeEach(async () => {
        await db.delete();
        await db.open();
    });

    afterEach(() => {
        db.close();
    });

    it('stores photos and thumbnails as Base64 strings, not Blobs', async () => {
        await importData(makeBackupFile({
            version: 1,
            timestamp: '2026-01-01T00:00:00.000Z',
            logs: [{
                id: 1,
                date: '2026-01-01',
                place: 'Place A',
                people: ['Person A'],
                photos: [PHOTO],
                thumbnails: [THUMB],
            }],
            tags: [{ id: 1, type: 'place', name: 'Place A', count: 1, lastUsed: '2026-01-01' }],
        }));

        const log = await db.logs.get(1);
        expect(log?.photos).toEqual([PHOTO]);
        expect(log?.thumbnails).toEqual([THUMB]);
        expect(log?.photos?.[0]).not.toBeInstanceOf(Blob);
    });

    it('defaults missing photo arrays to empty arrays', async () => {
        await importData(makeBackupFile({
            version: 1,
            timestamp: '2026-01-01T00:00:00.000Z',
            logs: [{ id: 1, date: '2026-01-01', place: 'Place A', people: [] }],
            tags: [],
        }));

        const log = await db.logs.get(1);
        expect(log?.photos).toEqual([]);
        expect(log?.thumbnails).toEqual([]);
    });

    it('rejects a file without logs/tags', async () => {
        await expect(importData(makeBackupFile({ version: 1 }))).rejects.toThrow();
    });

    it.each([
        ['an object', [{}]],
        ['a non-data-URL string', ['https://example.com/a.jpg']],
        ['a non-array value', 'data:image/jpeg;base64,cGhvdG8='],
    ])('rejects the whole import when photos contain %s', async (_label, photos) => {
        await expect(importData(makeBackupFile({
            version: 1,
            timestamp: '2026-01-01T00:00:00.000Z',
            logs: [{ id: 1, date: '2026-01-01', place: 'Place A', people: [], photos }],
            tags: [],
        }))).rejects.toThrow();

        expect(await db.logs.count()).toBe(0);
    });
});
