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

import { addTag, deleteTag, renameTag } from './actions';

describe('Tag Management', () => {
    beforeEach(async () => {
        await db.delete();
        await db.open();
    });

    afterEach(() => {
        db.close();
    });

    it('should add a new tag', async () => {
        await addTag('New Place', 'place');
        const tag = await db.tags.where({ type: 'place', name: 'New Place' }).first();
        expect(tag).toBeDefined();
        expect(tag?.count).toBe(0);
    });

    it('should delete a tag', async () => {
        const id = await db.tags.add({ type: 'place', name: 'To Delete', count: 1, lastUsed: '2023-01-01' });
        await deleteTag(id as number);
        const tag = await db.tags.get(id as number);
        expect(tag).toBeUndefined();
    });

    it('should rename a place tag and update logs', async () => {
        // 1. Create Logs
        await db.logs.add({ date: '2023-01-01', place: 'Old Name', people: [], photos: [], thumbnails: [] });
        await db.logs.add({ date: '2023-01-02', place: 'Old Name', people: [], photos: [], thumbnails: [] });

        // 2. Create Tag
        const tagId = await db.tags.add({ type: 'place', name: 'Old Name', count: 2, lastUsed: '2023-01-02' });

        // 3. Rename
        await renameTag(tagId as number, 'Old Name', 'New Name', 'place');

        // 4. Verify Tag
        const oldTag = await db.tags.where({ type: 'place', name: 'Old Name' }).first();
        const newTag = await db.tags.where({ type: 'place', name: 'New Name' }).first();
        expect(oldTag).toBeUndefined();
        expect(newTag).toBeDefined();
        expect(newTag?.id).toBe(tagId);

        // 5. Verify Logs
        const logs = await db.logs.toArray();
        expect(logs[0].place).toBe('New Name');
        expect(logs[1].place).toBe('New Name');
    });

    it('should rename a person tag and update logs', async () => {
        // 1. Create Logs
        await db.logs.add({ date: '2023-01-01', place: 'Somewhere', people: ['Person A', 'Person B'], photos: [], thumbnails: [] });

        // 2. Create Tag
        const tagId = await db.tags.add({ type: 'person', name: 'Person A', count: 1, lastUsed: '2023-01-01' });

        // 3. Rename
        await renameTag(tagId as number, 'Person A', 'Person Z', 'person');

        // 4. Verify Tag
        const oldTag = await db.tags.where({ type: 'person', name: 'Person A' }).first();
        const newTag = await db.tags.where({ type: 'person', name: 'Person Z' }).first();
        expect(oldTag).toBeUndefined();
        expect(newTag).toBeDefined();

        // 5. Verify Logs
        const logs = await db.logs.toArray();
        expect(logs[0].people).toContain('Person Z');
        expect(logs[0].people).not.toContain('Person A');
        // Check Person B is untouched
        expect(logs[0].people).toContain('Person B');
    });

    it('should merge tags if renaming to an existing tag name', async () => {
        // Setup: 'Old' with count 1, 'New' with count 5.
        // Rename 'Old' -> 'New'. Result should be 'New' with count 6. 'Old' deleted.

        const oldId = await db.tags.add({ type: 'place', name: 'Old Name', count: 1, lastUsed: '2023-01-01' });
        const newId = await db.tags.add({ type: 'place', name: 'New Name', count: 5, lastUsed: '2023-02-01' });

        await db.logs.add({ date: '2023-01-01', place: 'Old Name', people: [], photos: [], thumbnails: [] });

        await renameTag(oldId as number, 'Old Name', 'New Name', 'place');

        const oldTag = await db.tags.get(oldId as number);
        const newTag = await db.tags.get(newId as number);

        expect(oldTag).toBeUndefined();
        expect(newTag?.count).toBe(6);
        expect(newTag?.lastUsed).toBe('2023-02-01');

        const log = await db.logs.orderBy('date').first();
        expect(log?.place).toBe('New Name');
    });
});
