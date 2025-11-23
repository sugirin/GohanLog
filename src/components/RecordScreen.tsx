import * as React from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Camera, Image as ImageIcon, Save, MapPin, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { saveLog, useTags } from "@/lib/actions"
import { TagInput } from "./TagInput"
import { processImage } from "@/lib/imageUtils"


export function RecordScreen() {
    const [date, setDate] = React.useState<Date>(new Date())
    const [place, setPlace] = React.useState("")
    const [people, setPeople] = React.useState<string[]>([])
    const [photos, setPhotos] = React.useState<Blob[]>([])
    const [thumbnails, setThumbnails] = React.useState<Blob[]>([])
    const [isSaving, setIsSaving] = React.useState(false)
    const [isProcessingPhotos, setIsProcessingPhotos] = React.useState(false)

    const placeTags = useLiveQuery(() => useTags('place')) || []
    const personTags = useLiveQuery(() => useTags('person')) || []

    // Frequent tags (top 5) - already sorted by frequency
    const frequentPlaces = placeTags.slice(0, 5)
    const frequentPeople = personTags.slice(0, 8)

    const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setIsProcessingPhotos(true)
            const newFiles = Array.from(e.target.files)

            try {
                const processed = await Promise.all(newFiles.map(file => processImage(file)))

                setPhotos(prev => [...prev, ...processed.map(p => p.original)])
                setThumbnails(prev => [...prev, ...processed.map(p => p.thumbnail)])
            } catch (error) {
                console.error("Error processing images", error)
                alert("Failed to process some images")
            } finally {
                setIsProcessingPhotos(false)
                // Reset input value to allow selecting same file again if needed
                e.target.value = ''
            }
        }
    }

    const handleSubmit = async () => {
        if (!place.trim()) return
        setIsSaving(true)
        try {
            await saveLog({
                date: format(date, 'yyyy-MM-dd'),
                place: place.trim(),
                people,
                photos,
                thumbnails,
            })
            // Reset form
            setPlace("")
            setPeople([])
            setPhotos([])
            setThumbnails([])
            setDate(new Date())
            alert("Saved!")
        } catch (error) {
            console.error("Failed to save", error)
            alert("Failed to save")
        } finally {
            setIsSaving(false)
        }
    }

    const [showPlaceSuggestions, setShowPlaceSuggestions] = React.useState(false)
    const filteredPlaceTags = placeTags
        .filter(t => t.name.toLowerCase().includes(place.toLowerCase()))
        .slice(0, 5)

    return (
        <div className="h-[calc(100vh-5rem)] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
                <div className="flex items-center justify-between shrink-0">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        GohanLog
                    </h1>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" className={cn(!date && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date ? format(date, "MMM d") : <span>Date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={(d) => d && setDate(d)}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                {/* Main Content Area - Split into Top (Where/Who) and Bottom (Photos) */}
                <div className="flex-1 flex flex-col gap-4 min-h-0">

                    {/* Top Section: Where and Who - Split 50:50 */}
                    <div className="flex-1 flex flex-col gap-4 min-h-0">
                        {/* Where Section - Takes 50% of available space */}
                        <div className="flex-1 flex flex-col gap-2 overflow-hidden border rounded-lg p-3 bg-card/30">
                            <div className="flex items-center gap-2 text-muted-foreground shrink-0">
                                <MapPin className="h-4 w-4" />
                                <span className="text-sm font-medium">Where?</span>
                            </div>
                            <div className="relative shrink-0 w-2/3">
                                <Input
                                    value={place}
                                    onChange={e => {
                                        setPlace(e.target.value)
                                        setShowPlaceSuggestions(true)
                                    }}
                                    onFocus={() => setShowPlaceSuggestions(true)}
                                    onBlur={() => setTimeout(() => setShowPlaceSuggestions(false), 200)}
                                    placeholder="Restaurant name"
                                    className="text-base h-9"
                                />
                                {showPlaceSuggestions && place && filteredPlaceTags.length > 0 && (
                                    <div className="absolute z-10 w-[150%] bg-background border rounded-md shadow-lg mt-1">
                                        {filteredPlaceTags.map(tag => (
                                            <div
                                                key={tag.id}
                                                className="px-4 py-2 hover:bg-muted cursor-pointer text-sm"
                                                onClick={() => {
                                                    setPlace(tag.name)
                                                    setShowPlaceSuggestions(false)
                                                }}
                                            >
                                                {tag.name}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {/* Quick Place Tags - Scrollable if too many */}
                            <div className="flex-1 overflow-y-auto content-start">
                                <div className="flex flex-wrap gap-2">
                                    {frequentPlaces.map(tag => (
                                        <Badge
                                            key={tag.id}
                                            variant="outline"
                                            className="cursor-pointer hover:bg-secondary transition-colors"
                                            onClick={() => setPlace(tag.name)}
                                        >
                                            {tag.name}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Who Section - Takes 50% of available space */}
                        <div className="flex-1 flex flex-col gap-2 overflow-hidden border rounded-lg p-3 bg-card/30">
                            <div className="flex items-center gap-2 text-muted-foreground shrink-0">
                                <Users className="h-4 w-4" />
                                <span className="text-sm font-medium">Who?</span>
                            </div>
                            <div className="w-2/3 shrink-0">
                                <TagInput
                                    label=""
                                    placeholder="Add people..."
                                    tags={people}
                                    suggestions={personTags}
                                    onTagsChange={setPeople}
                                />
                            </div>
                            {/* Quick People Tags - Scrollable */}
                            <div className="flex-1 overflow-y-auto content-start">
                                <div className="flex flex-wrap gap-2">
                                    {frequentPeople
                                        .filter(p => !people.includes(p.name))
                                        .map(tag => (
                                            <Badge
                                                key={tag.id}
                                                variant="secondary"
                                                className="cursor-pointer hover:bg-primary/20 transition-colors"
                                                onClick={() => setPeople([...people, tag.name])}
                                            >
                                                + {tag.name}
                                            </Badge>
                                        ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Section: Photos - Fixed height or auto */}
                    <div className="shrink-0 space-y-2 pt-2 border-t">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Camera className="h-4 w-4" />
                            <span className="text-sm font-medium">Photos</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <label className="flex flex-col items-center justify-center h-16 border-2 border-dashed rounded-xl cursor-pointer hover:bg-muted/50 transition-colors bg-muted/20 active:scale-95">
                                <Camera className="h-5 w-5 mb-1 text-primary" />
                                <span className="text-xs font-medium">Camera</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    className="hidden"
                                    onChange={handlePhotoSelect}
                                />
                            </label>
                            {/* Album Input - Fixed for iOS */}
                            <div className="relative flex flex-col items-center justify-center h-16 border-2 border-dashed rounded-xl cursor-pointer hover:bg-muted/50 transition-colors bg-muted/20 active:scale-95">
                                <ImageIcon className="h-5 w-5 mb-1 text-primary" />
                                <span className="text-xs font-medium">Album</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    onChange={handlePhotoSelect}
                                />
                            </div>
                        </div>

                        {(thumbnails.length > 0 || isProcessingPhotos) && (
                            <div className="flex gap-2 overflow-x-auto pb-2 h-20 items-center">
                                {thumbnails.map((thumb, i) => (
                                    <div key={i} className="relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border shadow-sm">
                                        <img src={URL.createObjectURL(thumb)} alt="preview" className="object-cover w-full h-full" />
                                    </div>
                                ))}
                                {isProcessingPhotos && (
                                    <div className="flex-shrink-0 w-16 h-16 flex items-center justify-center bg-muted rounded-lg">
                                        <span className="text-xs text-muted-foreground animate-pulse">...</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Action */}
            <div className="p-4 bg-background border-t shrink-0">
                <Button
                    className="w-full h-12 text-lg shadow-lg"
                    onClick={handleSubmit}
                    disabled={isSaving || !place || isProcessingPhotos}
                >
                    <Save className="mr-2 h-5 w-5" />
                    {isSaving ? "Saving..." : isProcessingPhotos ? "Processing..." : "Save Memory"}
                </Button>
            </div>
        </div>
    )
}
