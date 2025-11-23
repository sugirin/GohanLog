import Dexie, { type EntityTable } from 'dexie';

export interface Log {
    id?: number;
    date: string;
    place: string;
    people: string[];
    photos?: Blob[];
    thumbnails?: Blob[];
}

export interface Tag {
    id?: number;
    type: 'place' | 'person';
    name: string;
    lastUsed: string;
    count: number;
}

const db = new Dexie('DiningLogDB') as Dexie & {
    logs: EntityTable<Log, 'id'>;
    tags: EntityTable<Tag, 'id'>;
};

db.version(1).stores({
    logs: '++id, date, place, *people',
    tags: '++id, type, name, count, lastUsed'
});

db.version(2).stores({
    logs: '++id, date, place, *people',
    tags: '++id, type, name, count, lastUsed, [type+count]'
}).upgrade(async tx => {
    // Migrate useCount to count if it exists
    await tx.table('tags').toCollection().modify(tag => {
        if (tag.useCount !== undefined) {
            tag.count = tag.useCount;
            delete tag.useCount;
        }
        if (!tag.count) {
            tag.count = 1;
        }
    });
});

export { db };
