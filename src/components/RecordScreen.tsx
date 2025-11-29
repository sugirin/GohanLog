import * as React from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Camera, Image as ImageIcon, Save, MapPin, Users, X, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { saveLog, useTags } from "@/lib/actions"
import { TagInput } from "./TagInput"
import { processImage, capturePhotoNative, pickPhotoFromGallery } from "@/lib/imageUtils"
import { isNativePlatform, isWeb } from "@/lib/platformUtils"

// メモリリークを防ぐための画像プレビューコンポーネント
const ImagePreview = ({ blob, onRemove }: { blob: Blob, onRemove: () => void }) => {
    const [url, setUrl] = React.useState<string>("")

    React.useEffect(() => {
        const objectUrl = URL.createObjectURL(blob)
        setUrl(objectUrl)
        return () => URL.revokeObjectURL(objectUrl)
    }, [blob])

    if (!url) return <div className="w-16 h-16 bg-muted rounded-lg animate-pulse" />

    return (
        <div className="relative flex-shrink-0 w-16 h-16 group block">
            <div className="w-full h-full rounded-lg overflow-hidden border shadow-sm">
                <img src={url} alt="preview" className="object-cover w-full h-full" />
            </div>
            <button
                onClick={onRemove}
                className="absolute z-10 bg-black/60 text-white rounded-full p-1 hover:bg-black/80 shadow-sm"
                style={{ position: 'absolute', top: '4px', right: '4px' }}
                type="button"
            >
                <X className="h-3 w-3" />
            </button>
        </div>
    )
}

export function RecordScreen() {
    const [date, setDate] = React.useState<Date>(new Date())
    const [place, setPlace] = React.useState("")
    const [people, setPeople] = React.useState<string[]>([])

    // 画像とサムネイルを1つの状態で管理
    const [images, setImages] = React.useState<{ original: Blob, thumbnail: Blob }[]>([])

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
                setImages(prev => [...prev, ...processed])
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

    const handleNativeCamera = async () => {
        setIsProcessingPhotos(true)
        try {
            const photo = await capturePhotoNative()
            const processed = await processImage(photo)
            setImages(prev => [...prev, processed])
        } catch (error) {
            console.error("Error capturing photo", error)
            // キャンセル時はアラートを出さない
        } finally {
            setIsProcessingPhotos(false)
        }
    }

    const handleNativeGallery = async () => {
        setIsProcessingPhotos(true)
        try {
            const photo = await pickPhotoFromGallery()
            const processed = await processImage(photo)
            setImages(prev => [...prev, processed])
        } catch (error) {
            console.error("Error picking photo", error)
        } finally {
            setIsProcessingPhotos(false)
        }
    }

    const handleRemovePhoto = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index))
    }

    const handleSubmit = async () => {
        if (!place.trim()) return
        setIsSaving(true)
        try {
            await saveLog({
                date: format(date, 'yyyy-MM-dd'),
                place: place.trim(),
                people,
                photos: images.map(img => img.original),
                thumbnails: images.map(img => img.thumbnail),
            })
            // Reset form
            setPlace("")
            setPeople([])
            setImages([])
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
            <div className="flex-1 flex flex-col p-0 gap-0 overflow-hidden">
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
                <div className="flex-1 flex flex-col gap-2 min-h-0">

                    {/* Top Section: Where and Who - Split 50:50 */}
                    <div className="flex-1 flex flex-col gap-2 min-h-0">
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
                    <div className="shrink-0 space-y-2 pt-2 pb-2 border-t">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Camera className="h-4 w-4" />
                            <span className="text-sm font-medium">Photos</span>
                        </div>

                        {/* PWA警告メッセージ */}
                        {isWeb() && (
                            <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500 mt-0.5 shrink-0" />
                                <div className="text-xs text-yellow-800 dark:text-yellow-200">
                                    <p className="font-semibold mb-1">Web版の制限</p>
                                    <p>ブラウザ版では写真が永続保存されない場合があります。完全な機能をご利用いただくにはモバイルアプリ版をお勧めします。</p>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            {isNativePlatform() ? (
                                // ネイティブアプリ版: ネイティブカメラとギャラリーを使用
                                <>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex flex-col items-center justify-center h-16 border-2 border-dashed rounded-xl hover:bg-muted/50 transition-colors bg-muted/20 active:scale-95"
                                        onClick={handleNativeCamera}
                                        disabled={isProcessingPhotos}
                                    >
                                        <Camera className="h-5 w-5 mb-1 text-primary" />
                                        <span className="text-xs font-medium">Camera</span>
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex flex-col items-center justify-center h-16 border-2 border-dashed rounded-xl hover:bg-muted/50 transition-colors bg-muted/20 active:scale-95"
                                        onClick={handleNativeGallery}
                                        disabled={isProcessingPhotos}
                                    >
                                        <ImageIcon className="h-5 w-5 mb-1 text-primary" />
                                        <span className="text-xs font-medium">Gallery</span>
                                    </Button>
                                </>
                            ) : (
                                // Web版: 従来のファイル入力を使用
                                <>
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
                                </>
                            )}
                        </div>

                        {(images.length > 0 || isProcessingPhotos) && (
                            <div className="flex gap-2 overflow-x-auto pb-2 h-20 items-center">
                                {images.map((img, i) => (
                                    <ImagePreview
                                        key={i}
                                        blob={img.thumbnail}
                                        onRemove={() => handleRemovePhoto(i)}
                                    />
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
            <div className="px-2 pt-2 pb-0 bg-background border-t shrink-0 flex gap-2">
                <Button
                    variant="ghost"
                    className="flex-1 h-12 text-lg shadow-lg bg-destructive/10 text-destructive hover:bg-destructive/20"
                    onClick={() => {
                        if (confirm("Clear all fields?")) {
                            setPlace("")
                            setPeople([])
                            setImages([])
                            setDate(new Date())
                        }
                    }}
                    disabled={isSaving || isProcessingPhotos}
                >
                    <X className="mr-2 h-5 w-5" />
                    Clear All
                </Button>
                <Button
                    className="flex-[2] h-12 text-lg shadow-lg bg-primary text-primary-foreground hover:bg-primary/90"
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
