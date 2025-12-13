import * as React from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Camera, Image as ImageIcon, Save, MapPin, Users, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useTags } from "@/lib/actions"
import { TagInput } from "./TagInput"
import { processImage } from "@/lib/imageUtils"
import type { Log } from "@/lib/db"
import { useTranslation } from "@/lib/i18n/LanguageContext"

interface LogFormProps {
    initialData?: Log
    onSave: (data: Log) => Promise<void>
    onCancel?: () => void
    onDelete?: () => void
    submitLabel?: string
}

export function LogForm({ initialData, onSave, onCancel, onDelete, submitLabel }: LogFormProps) {
    const { t } = useTranslation()
    const [date, setDate] = React.useState<Date>(initialData ? new Date(initialData.date) : new Date())
    const [place, setPlace] = React.useState(initialData?.place || "")
    const [people, setPeople] = React.useState<string[]>(initialData?.people || [])
    const [photos, setPhotos] = React.useState<(Blob | string)[]>(initialData?.photos?.filter(p => p instanceof Blob) as Blob[] || [])
    const [thumbnails, setThumbnails] = React.useState<(Blob | string)[]>(initialData?.thumbnails?.filter(t => t instanceof Blob) as Blob[] || [])
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
            await onSave({
                date: format(date, 'yyyy-MM-dd'),
                place: place.trim(),
                people,
                photos,
                thumbnails,
            })
            // Only reset if it's a new entry (no initial data)
            if (!initialData) {
                setPlace("")
                setPeople([])
                setPhotos([])
                setThumbnails([])
                setDate(new Date())
            }
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
        <div className="flex flex-col h-full overflow-hidden">
            <div className="flex-1 flex flex-col gap-4 min-h-0 overflow-y-auto">
                <div className="flex items-center justify-between shrink-0">
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

                {/* Top Section: Where and Who - Split 50:50 */}
                <div className="flex-1 flex flex-col gap-4 min-h-0">
                    {/* Where Section - Takes 50% of available space */}
                    <div className="flex-1 flex flex-col gap-2 overflow-hidden border rounded-lg p-3 bg-card/30">
                        <div className="flex items-center gap-2 text-muted-foreground shrink-0">
                            <MapPin className="h-4 w-4" />
                            <span className="text-sm font-medium">{t('record.where')}</span>
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
                                placeholder={t('record.wherePlaceholder')}
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
                            <span className="text-sm font-medium">{t('record.who')}</span>
                        </div>
                        <div className="w-2/3 shrink-0">
                            <TagInput
                                label=""
                                placeholder={t('record.whoPlaceholder')}
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
                        <span className="text-sm font-medium">{t('record.photo')}</span>
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
                                <div key={i} className="relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border shadow-sm group">
                                    <img src={thumb instanceof Blob ? URL.createObjectURL(thumb) : thumb} alt="preview" className="object-cover w-full h-full" />
                                    <button
                                        onClick={() => {
                                            setPhotos(prev => prev.filter((_, idx) => idx !== i))
                                            setThumbnails(prev => prev.filter((_, idx) => idx !== i))
                                        }}
                                        className="absolute top-0 right-0 bg-black/50 text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        &times;
                                    </button>
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


            {/* Bottom Action */}
            <div className="pt-4 bg-background border-t shrink-0 flex gap-2">
                {onDelete && (
                    <Button
                        variant="destructive"
                        className="h-12 w-12 px-0 shrink-0"
                        onClick={onDelete}
                        title={t('history.delete')}
                    >
                        <Trash2 className="h-5 w-5" />
                    </Button>
                )}
                {onCancel && (
                    <Button
                        variant="outline"
                        className="flex-1 h-12 text-lg"
                        onClick={onCancel}
                    >
                        {t('common.cancel')}
                    </Button>
                )}
                <Button
                    className="flex-1 h-12 text-lg shadow-lg"
                    onClick={handleSubmit}
                    disabled={isSaving || !place || isProcessingPhotos}
                >
                    <Save className="mr-2 h-5 w-5" />
                    {isSaving ? t('record.saving') : isProcessingPhotos ? "Processing..." : (submitLabel || t('record.save'))}
                </Button>
            </div>
        </div>
    )
}
