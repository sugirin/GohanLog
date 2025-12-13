import * as React from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { format } from "date-fns"
import { Search, Users, X, MapPin, Edit2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { db, type Log } from "@/lib/db"
import { updateLog } from "@/lib/actions"
import { LogForm } from "./LogForm"

export function HistoryScreen() {
    const [searchQuery, setSearchQuery] = React.useState("")
    const [activePerson, setActivePerson] = React.useState<string | null>(null)
    const [activePlace, setActivePlace] = React.useState<string | null>(null)

    const logs = useLiveQuery(async () => {
        let collection = db.logs.orderBy('date').reverse()

        if (activePerson) {
            // Filter by person tag
            collection = collection.filter(log => log.people.includes(activePerson))
        }

        if (activePlace) {
            // Filter by place tag
            collection = collection.filter(log => log.place === activePlace)
        }

        if (searchQuery) {
            const q = searchQuery.toLowerCase()
            collection = collection.filter(log =>
                log.place.toLowerCase().includes(q) ||
                log.people.some(p => p.toLowerCase().includes(q))
            )
        }

        return collection.limit(50).toArray()
    }, [searchQuery, activePerson, activePlace]) || []

    const [selectedPhoto, setSelectedPhoto] = React.useState<Blob | string | null>(null)
    const [editingLog, setEditingLog] = React.useState<Log | null>(null)

    // Helper to get image source from Blob or Base64 string
    const getImageSrc = (image: Blob | string) => {
        if (image instanceof Blob) {
            return URL.createObjectURL(image)
        }
        return image // Base64 string
    }

    return (

        <div className="h-full flex flex-col animate-in fade-in duration-500">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 border rounded-md px-3 bg-background">
                        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                        <Input
                            placeholder="Search place or people..."
                            className="border-0 focus-visible:ring-0 px-0 h-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="text-muted-foreground hover:text-foreground shrink-0"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    {(activePerson || activePlace) && (
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Filtering by:</span>
                            <div className="flex gap-2">
                                {activePlace && (
                                    <Badge variant="secondary" className="gap-1 pl-2">
                                        <MapPin className="h-3 w-3" />
                                        {activePlace}
                                        <button onClick={() => setActivePlace(null)} className="hover:text-destructive">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                )}
                                {activePerson && (
                                    <Badge variant="secondary" className="gap-1 pl-2">
                                        <Users className="h-3 w-3" />
                                        {activePerson}
                                        <button onClick={() => setActivePerson(null)} className="hover:text-destructive">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    {logs.length === 0 ? (
                        <div className="text-center text-muted-foreground py-12 flex flex-col items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                                <Search className="h-8 w-8 opacity-50" />
                            </div>
                            <p>{searchQuery || activePerson || activePlace ? "No memories found matching your search." : "No memories yet. Start recording!"}</p>
                        </div>
                    ) : (
                        logs.map(log => (
                            <Card key={log.id} className="overflow-hidden">
                                <CardContent className="p-4 flex items-start gap-3">
                                    <div className="flex-1 space-y-2 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <Badge
                                                variant={activePlace === log.place ? "default" : "outline"}
                                                className="text-base font-bold cursor-pointer hover:bg-primary/20 px-2 py-1 max-w-full truncate"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    setActivePlace(activePlace === log.place ? null : log.place)
                                                }}
                                            >
                                                {log.place}
                                            </Badge>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 -mr-2 -mt-1 text-muted-foreground hover:text-foreground"
                                                onClick={() => setEditingLog(log)}
                                            >
                                                <Edit2 className="h-3 w-3" />
                                            </Button>
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
                                                        variant={activePerson === person ? "default" : "secondary"}
                                                        className="text-xs cursor-pointer hover:bg-primary/20 px-1.5 py-0"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setActivePerson(activePerson === person ? null : person)
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
                                            className="flex flex-wrap gap-2 mt-2"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {(log.thumbnails && log.thumbnails.length > 0 ? log.thumbnails : log.photos || []).map((img, i) => (
                                                <div
                                                    key={i}
                                                    className="h-20 w-20 shrink-0 rounded-md overflow-hidden cursor-pointer border bg-muted"
                                                    onClick={() => setSelectedPhoto(log.photos ? log.photos[i] : null)}
                                                >
                                                    <img
                                                        src={getImageSrc(img)}
                                                        alt={`${log.place} ${i + 1}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            ))}
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
                            src={getImageSrc(selectedPhoto)}
                            alt="Full size"
                            className="max-w-full max-h-full object-contain rounded-md"
                            onClick={(e) => e.stopPropagation()}
                        />
                    )}
                </div>
            )}

            {/* Edit Modal */}
            {editingLog && (
                <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-background border rounded-lg shadow-lg w-full max-w-lg h-[90vh] flex flex-col overflow-hidden">
                        <div className="p-4 border-b flex items-center justify-between shrink-0">
                            <h2 className="text-lg font-semibold">Edit Memory</h2>
                            <Button variant="ghost" size="icon" onClick={() => setEditingLog(null)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="flex-1 overflow-hidden p-4">
                            <LogForm
                                initialData={editingLog}
                                submitLabel="Update Memory"
                                onCancel={() => setEditingLog(null)}
                                onSave={async (data) => {
                                    await updateLog(editingLog.id!, data)
                                    setEditingLog(null)
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
