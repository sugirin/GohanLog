import * as React from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { format } from "date-fns"
import { Search, Users, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { db } from "@/lib/db"

export function HistoryScreen() {
    const [searchQuery, setSearchQuery] = React.useState("")
    const [activeTag, setActiveTag] = React.useState<string | null>(null)

    const logs = useLiveQuery(async () => {
        let collection = db.logs.orderBy('date').reverse()

        if (activeTag) {
            // Filter by person tag
            // Note: Dexie doesn't support complex multi-entry filtering easily in one go with other filters
            // So we filter in memory for this simple app if needed, or use where clause
            // Using filter() on collection is efficient enough for small datasets
            collection = collection.filter(log => log.people.includes(activeTag))
        }

        if (searchQuery) {
            const q = searchQuery.toLowerCase()
            collection = collection.filter(log =>
                log.place.toLowerCase().includes(q) ||
                log.people.some(p => p.toLowerCase().includes(q))
            )
        }

        return collection.limit(50).toArray()
    }, [searchQuery, activeTag]) || []

    const [selectedPhoto, setSelectedPhoto] = React.useState<Blob | null>(null)

    return (

        <div className="h-[calc(100vh-5rem)] flex flex-col animate-in fade-in duration-500">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-4">
                <div className="space-y-2">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search place or people..."
                            className="pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    {activeTag && (
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Filtering by:</span>
                            <Badge variant="secondary" className="gap-1 pl-2">
                                {activeTag}
                                <button onClick={() => setActiveTag(null)} className="hover:text-destructive">
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    {logs.length === 0 ? (
                        <div className="text-center text-muted-foreground py-12 flex flex-col items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                                <Search className="h-8 w-8 opacity-50" />
                            </div>
                            <p>{searchQuery || activeTag ? "No memories found matching your search." : "No memories yet. Start recording!"}</p>
                        </div>
                    ) : (
                        logs.map(log => (
                            <Card key={log.id} className="overflow-hidden">
                                <CardContent className="p-4 flex items-start gap-3">
                                    <div className="flex-1 space-y-2 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-bold text-lg truncate pr-2">{log.place}</h3>
                                        </div>
                                        <span className="text-sm text-muted-foreground block">
                                            {format(new Date(log.date), 'MMM d, yyyy')}
                                        </span>

                                        <div className="flex items-center gap-2 text-sm text-muted-foreground pt-1">
                                            <Users className="h-4 w-4 shrink-0" />
                                            <div className="flex flex-wrap gap-1">
                                                {log.people.map(person => (
                                                    <Badge
                                                        key={person}
                                                        variant={activeTag === person ? "default" : "secondary"}
                                                        className="text-xs cursor-pointer hover:bg-primary/20 px-1.5 py-0"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setActiveTag(activeTag === person ? null : person)
                                                        }}
                                                    >
                                                        {person}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {(log.thumbnails && log.thumbnails.length > 0) || (log.photos && log.photos.length > 0) ? (
                                        <div
                                            className="h-20 w-20 shrink-0 rounded-md overflow-hidden cursor-pointer border bg-muted"
                                            onClick={() => setSelectedPhoto(log.photos ? log.photos[0] : null)}
                                        >
                                            <img
                                                src={URL.createObjectURL(log.thumbnails && log.thumbnails.length > 0 ? log.thumbnails[0] : log.photos![0])}
                                                alt={log.place}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ) : null}
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>

            {/* Photo Preview Modal */}
            {selectedPhoto && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={() => setSelectedPhoto(null)}
                >
                    <button
                        className="absolute top-4 right-4 text-white p-2 rounded-full bg-white/10 hover:bg-white/20"
                        onClick={() => setSelectedPhoto(null)}
                    >
                        <X className="h-6 w-6" />
                    </button>
                    {selectedPhoto && (
                        <img
                            src={URL.createObjectURL(selectedPhoto)}
                            alt="Full size"
                            className="max-w-full max-h-full object-contain rounded-md"
                            onClick={(e) => e.stopPropagation()}
                        />
                    )}
                </div>
            )}
        </div>
    )
}
