import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from './db';
import { updateLog } from './actions';
import "fake-indexeddb/auto";

describe('updateLog', () => {
    beforeEach(async () => {
        await db.delete();
        await db.open();
    });

    afterEach(async () => {
        db.close();
    });

    it('should correctly update place counts when place changes', async () => {
        // 1. Create initial log
        const logId = await db.logs.add({
            date: '2023-01-01',
            place: 'Place A',
            people: ['Person A'],
            photos: [],
            thumbnails: []
        });

        // Initialize tags
        await db.tags.add({ type: 'place', name: 'Place A', count: 1, lastUsed: '2023-01-01' });

        // 2. Update log: Place A -> Place B
        await updateLog(logId as number, {
            id: logId as number,
            date: '2023-01-01',
            place: 'Place B',
            people: ['Person A'],
            photos: [],
            thumbnails: []
        });

        // 3. Verify counts
        const placeA = await db.tags.where({ type: 'place', name: 'Place A' }).first();
        const placeB = await db.tags.where({ type: 'place', name: 'Place B' }).first();

        expect(placeA?.count).toBe(0);
        expect(placeB?.count).toBe(1);
    });

    it('should correctly update person counts when people change', async () => {
        // 1. Create initial log
        const logId = await db.logs.add({
            date: '2023-01-01',
            place: 'Place A',
            people: ['Person A', 'Person B'],
            photos: [],
            thumbnails: []
        });

        // Initialize tags
        await db.tags.bulkAdd([
            { type: 'person', name: 'Person A', count: 1, lastUsed: '2023-01-01' },
            { type: 'person', name: 'Person B', count: 1, lastUsed: '2023-01-01' }
        ]);

        // 2. Update log: Remove Person A, Add Person C
        await updateLog(logId as number, {
            id: logId as number,
            date: '2023-01-01',
            place: 'Place A',
            people: ['Person B', 'Person C'],
            photos: [],
            thumbnails: []
        });

        // 3. Verify counts
        const personA = await db.tags.where({ type: 'person', name: 'Person A' }).first();
        const personB = await db.tags.where({ type: 'person', name: 'Person B' }).first();
        const personC = await db.tags.where({ type: 'person', name: 'Person C' }).first();

        expect(personA?.count).toBe(0);
        expect(personB?.count).toBe(1); // Should remain 1 (or increment if logic was different, but here it's same occurrence in same log, so count is per log? No, count is usage frequency. If I edit the log, I am not adding a NEW usage, I am modifying the existing one. So if Person B is still there, count should not change. Wait, my implementation logic:
        // "Increment counts for people added": Person B is NOT in peopleAdded because it was in oldLog.people.
        // "Decrement counts for people removed": Person B is NOT in peopleRemoved.
        // So Person B count remains 1. Correct.
        expect(personC?.count).toBe(1);
    });

    it('should not change counts if tags are unchanged', async () => {
        // 1. Create initial log
        const logId = await db.logs.add({
            date: '2023-01-01',
            place: 'Place A',
            people: ['Person A'],
            photos: [],
            thumbnails: []
        });
        await db.tags.add({ type: 'place', name: 'Place A', count: 1, lastUsed: '2023-01-01' });
        await db.tags.add({ type: 'person', name: 'Person A', count: 1, lastUsed: '2023-01-01' });

        // 2. Update log with same data
        await updateLog(logId as number, {
            id: logId as number,
            date: '2023-01-02', // Changed date only
            place: 'Place A',
            people: ['Person A'],
            photos: [],
            thumbnails: []
        });

        // 3. Verify counts
        const placeA = await db.tags.where({ type: 'place', name: 'Place A' }).first();
        const personA = await db.tags.where({ type: 'person', name: 'Person A' }).first();

        expect(placeA?.count).toBe(1);
        expect(personA?.count).toBe(1);
    });
});
