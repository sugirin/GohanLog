import { db } from './db';

interface DebugInfo {
    timestamp: string;
    system: {
        userAgent: string;
        language: string;
        timeZone: string;
        screen: {
            width: number;
            height: number;
        };
    };
    storage: {
        quota?: number;
        usage?: number;
        persisted?: boolean;
    };
    database: {
        dexie: {
            name: string;
            version: number;
            tables: {
                name: string;
                count: number | string;
            }[];
        };
        raw: {
            databases: IDBDatabaseInfo[];
        };
        errors: string[];
    };
}

export async function collectDebugInfo(): Promise<DebugInfo> {
    const errors: string[] = [];

    // 1. System Info
    const system = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        screen: {
            width: window.screen.width,
            height: window.screen.height
        }
    };

    // 2. Storage Info
    let storage = {};
    try {
        if (navigator.storage && navigator.storage.estimate) {
            const estimate = await navigator.storage.estimate();
            const persisted = await navigator.storage.persisted();
            storage = {
                quota: estimate.quota,
                usage: estimate.usage,
                persisted
            };
        }
    } catch (e) {
        errors.push(`Storage Info Error: ${e}`);
    }

    // 3. Database Info
    const database = {
        dexie: {
            name: db.name,
            version: db.verno,
            tables: [] as { name: string; count: number | string }[]
        },
        raw: {
            databases: [] as IDBDatabaseInfo[]
        },
        errors
    };

    // Check Dexie tables
    try {
        for (const table of db.tables) {
            try {
                const count = await table.count();
                database.dexie.tables.push({ name: table.name, count });
            } catch (e) {
                database.dexie.tables.push({ name: table.name, count: `Error: ${e}` });
                errors.push(`Dexie Table Error (${table.name}): ${e}`);
            }
        }
    } catch (e) {
        errors.push(`Dexie General Error: ${e}`);
    }

    // Check Raw IndexedDB
    try {
        if (indexedDB.databases) {
            database.raw.databases = await indexedDB.databases();
        }
    } catch (e) {
        errors.push(`Raw IndexedDB Error: ${e}`);
    }

    return {
        timestamp: new Date().toISOString(),
        system,
        storage,
        database
    };
}

export async function exportDebugLog(): Promise<void> {
    try {
        const debugInfo = await collectDebugInfo();
        const jsonString = JSON.stringify(debugInfo, null, 2);
        const fileName = `gohan-log-debug-${new Date().toISOString().split('T')[0]}.json`;

        // Try Web Share API (Mobile)
        try {
            const file = new File([jsonString], fileName, { type: 'application/json' });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: 'GohanLog Debug Info',
                    text: 'Debug information for troubleshooting'
                });
                return;
            }
        } catch (shareError) {
            console.warn('Web Share API failed, falling back to download:', shareError);
        }

        // Fallback: Direct Download
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
        console.error('Failed to export debug log:', error);
        throw error;
    }
}
