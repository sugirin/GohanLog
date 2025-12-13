import { db, type Log } from "./db"
import { format } from "date-fns"
import { blobToBase64 } from "./imageUtils"
import { isNativePlatform } from "./platformUtils"

export async function saveLog(log: Log) {
    // iOS/Native環境ではBlobが消える可能性があるためBase64に変換して保存
    if (isNativePlatform()) {
        if (log.photos && log.photos.length > 0) {
            log.photos = await Promise.all(log.photos.map(async p =>
                p instanceof Blob ? await blobToBase64(p) : p
            ));
        }
        if (log.thumbnails && log.thumbnails.length > 0) {
            log.thumbnails = await Promise.all(log.thumbnails.map(async p =>
                p instanceof Blob ? await blobToBase64(p) : p
            ));
        }
    }

    await db.transaction('rw', db.logs, db.tags, async () => {
        // Save log
        await db.logs.add(log)

        // Update place tag
        const placeTag = await db.tags.where('[type+name]').equals(['place', log.place]).first()
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
            const personTag = await db.tags.where('[type+name]').equals(['person', person]).first()
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

export async function updateLog(id: number, newLog: Log) {
    // iOS/Native環境ではBlobが消える可能性があるためBase64に変換して保存
    if (isNativePlatform()) {
        if (newLog.photos && newLog.photos.length > 0) {
            newLog.photos = await Promise.all(newLog.photos.map(async p =>
                p instanceof Blob ? await blobToBase64(p) : p
            ));
        }
        if (newLog.thumbnails && newLog.thumbnails.length > 0) {
            newLog.thumbnails = await Promise.all(newLog.thumbnails.map(async p =>
                p instanceof Blob ? await blobToBase64(p) : p
            ));
        }
    }

    await db.transaction('rw', db.logs, db.tags, async () => {
        const oldLog = await db.logs.get(id)
        if (!oldLog) throw new Error(`Log with id ${id} not found`)

        // Update log
        await db.logs.update(id, { ...newLog })

        // Update place tags
        if (oldLog.place !== newLog.place) {
            // Decrement old place
            const oldPlaceTag = await db.tags.where('[type+name]').equals(['place', oldLog.place]).first()
            if (oldPlaceTag) {
                const newCount = Math.max(0, oldPlaceTag.count - 1)
                await db.tags.update(oldPlaceTag.id!, { count: newCount })
            }

            // Increment new place
            const newPlaceTag = await db.tags.where('[type+name]').equals(['place', newLog.place]).first()
            if (newPlaceTag) {
                await db.tags.update(newPlaceTag.id!, {
                    count: newPlaceTag.count + 1,
                    lastUsed: format(new Date(), 'yyyy-MM-dd')
                })
            } else {
                await db.tags.add({
                    type: 'place',
                    name: newLog.place,
                    count: 1,
                    lastUsed: format(new Date(), 'yyyy-MM-dd')
                })
            }
        }

        // Update people tags
        // 1. Decrement counts for people removed
        const peopleRemoved = oldLog.people.filter(p => !newLog.people.includes(p))
        for (const person of peopleRemoved) {
            const tag = await db.tags.where('[type+name]').equals(['person', person]).first()
            if (tag) {
                const newCount = Math.max(0, tag.count - 1)
                await db.tags.update(tag.id!, { count: newCount })
            }
        }


        // 2. Increment counts for people added
        const peopleAdded = newLog.people.filter(p => !oldLog.people.includes(p))
        for (const person of peopleAdded) {
            const tag = await db.tags.where('[type+name]').equals(['person', person]).first()
            if (tag) {
                await db.tags.update(tag.id!, {
                    count: tag.count + 1,
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

export async function deleteLog(id: number) {
    await db.transaction('rw', db.logs, db.tags, async () => {
        const log = await db.logs.get(id)
        if (!log) throw new Error(`Log with id ${id} not found`)

        // Delete log
        await db.logs.delete(id)

        // Decrement place tag count
        const placeTag = await db.tags.where('[type+name]').equals(['place', log.place]).first()
        if (placeTag) {
            const newCount = Math.max(0, placeTag.count - 1)
            await db.tags.update(placeTag.id!, { count: newCount })
        }

        // Decrement people tag counts
        for (const person of log.people) {
            const personTag = await db.tags.where('[type+name]').equals(['person', person]).first()
            if (personTag) {
                const newCount = Math.max(0, personTag.count - 1)
                await db.tags.update(personTag.id!, { count: newCount })
            }
        }
    })
}

export async function deleteAllLogs() {
    await db.transaction('rw', db.logs, db.tags, async () => {
        // Clear all logs
        await db.logs.clear()

        // Reset all tag counts to 0 using modify
        await db.tags.toCollection().modify({ count: 0 })
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
