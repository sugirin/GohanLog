import { db, type Log } from "./db"
import { format } from "date-fns"

export async function saveLog(log: Log) {
    await db.transaction('rw', db.logs, db.tags, async () => {
        // Save log
        await db.logs.add(log)

        // Update place tag
        const placeTag = await db.tags.where({ type: 'place', name: log.place }).first()
        if (placeTag) {
            await db.tags.update(placeTag.id!, {
                count: placeTag.count + 1,
                lastUsed: format(new Date(), 'yyyy-MM-dd')
            })
        } else {
            await db.tags.add({
                type: 'place',
                name: log.place,
                count: 1,
                lastUsed: format(new Date(), 'yyyy-MM-dd')
            })
        }

        // Update people tags
        for (const person of log.people) {
            const personTag = await db.tags.where({ type: 'person', name: person }).first()
            if (personTag) {
                await db.tags.update(personTag.id!, {
                    count: personTag.count + 1,
                    lastUsed: format(new Date(), 'yyyy-MM-dd')
                })
            } else {
                await db.tags.add({
                    type: 'person',
                    name: person,
                    count: 1,
                    lastUsed: format(new Date(), 'yyyy-MM-dd')
                })
            }
        }
    })
}

export function useTags(type: 'place' | 'person') {
    return db.tags
        .where('type').equals(type)
        .toArray()
        .then(tags => tags.sort((a, b) => b.count - a.count)) // Sort by count descending
}

export function useRecentLogs() {
    return db.logs.orderBy('date').reverse().limit(20).toArray();
}
