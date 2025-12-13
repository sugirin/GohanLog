
import * as React from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { MapPin, Users, Edit2, Trash2, Tag, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTags, addTag, deleteTag, renameTag, updateTag } from "@/lib/actions"
import type { Tag as TagType } from "@/lib/db"
import { useTranslation } from "@/lib/i18n/LanguageContext"

export function TagsScreen() {
    const { t } = useTranslation()
    const places = useLiveQuery(() => useTags('place')) || []
    const people = useLiveQuery(() => useTags('person')) || []
    const [editingTag, setEditingTag] = React.useState<TagType | null>(null)
    const [newTagName, setNewTagName] = React.useState("")
    const [newTagEmoji, setNewTagEmoji] = React.useState("")
    const [isAdding, setIsAdding] = React.useState<'place' | 'person' | null>(null)

    const handleUpdate = async (tag: TagType, newName: string, newEmoji: string) => {
        const trimmedName = newName.trim()
        const trimmedEmoji = newEmoji.trim()

        if (!trimmedName) return

        // 1. Rename if needed
        if (trimmedName !== tag.name) {
            if (confirm(t('tags.renameConfirm', { old: tag.name, new: trimmedName }))) {
                await renameTag(tag.id!, tag.name, trimmedName, tag.type)
            } else {
                // If user cancels rename, do we still update emoji? 
                // Let's assume cancellation means "stop everything".
                // But what if they only wanted to change emoji and accidentally changed name?
                // For simplicity: confirm is only for rename.
                // If rename cancelled, we abort.
                setEditingTag(null)
                return
            }
        }

        // 2. Update emoji if changed (and rename didn't fail/cancel)
        // We re-update even if name changed because renameTag doesn't touch emoji.
        if (trimmedEmoji !== (tag.emoji || "")) {
            await updateTag(tag.id!, { emoji: trimmedEmoji })
        }
        setEditingTag(null)
    }

    const handleDelete = async (tag: TagType) => {
        if (confirm(t('tags.deleteConfirm', { name: tag.name }))) {
            await deleteTag(tag.id!)
        }
    }

    const handleAdd = async (type: 'place' | 'person') => {
        if (!newTagName.trim()) return

        await addTag(newTagName.trim(), type, newTagEmoji.trim())
        setNewTagName("")
        setNewTagEmoji("")
        setIsAdding(null)
    }

    return (
        <div className="h-full flex flex-col animate-in fade-in duration-500">
            <div className="p-4 bg-background border-b z-10">
                <h1 className="text-xl font-bold flex items-center gap-2 mb-4">
                    <Tag className="h-5 w-5" />
                    {t('tags.title')}
                </h1>
            </div>

            <Tabs defaultValue="places" className="flex-1 flex flex-col overflow-hidden">
                <div className="px-4 pt-2">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="places" className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {t('tags.places')} ({places.length})
                        </TabsTrigger>
                        <TabsTrigger value="people" className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            {t('tags.people')} ({people.length})
                        </TabsTrigger>
                    </TabsList>
                </div>

                <div className="p-4 flex-1 overflow-y-auto">
                    <TabsContent value="places" className="mt-0 h-full">
                        <TagList
                            type="place"
                            tags={places}
                            editingTag={editingTag}
                            onTypeEdit={(tag) => setEditingTag(tag)}
                            onCancelEdit={() => setEditingTag(null)}
                            onConfirmEdit={handleUpdate}
                            onDelete={handleDelete}
                            isAdding={isAdding === 'place'}
                            onStartAdd={() => setIsAdding('place')}
                            onCancelAdd={() => {
                                setIsAdding(null)
                                setNewTagName("")
                                setNewTagEmoji("")
                            }}
                            newTagName={newTagName}
                            onNewTagNameChange={setNewTagName}
                            newTagEmoji={newTagEmoji}
                            onNewTagEmojiChange={setNewTagEmoji}
                            onConfirmAdd={() => handleAdd('place')}
                        />
                    </TabsContent>

                    <TabsContent value="people" className="mt-0 h-full">
                        <TagList
                            type="person"
                            tags={people}
                            editingTag={editingTag}
                            onTypeEdit={(tag) => setEditingTag(tag)}
                            onCancelEdit={() => setEditingTag(null)}
                            onConfirmEdit={handleUpdate}
                            onDelete={handleDelete}
                            isAdding={isAdding === 'person'}
                            onStartAdd={() => setIsAdding('person')}
                            onCancelAdd={() => {
                                setIsAdding(null)
                                setNewTagName("")
                                setNewTagEmoji("")
                            }}
                            newTagName={newTagName}
                            onNewTagNameChange={setNewTagName}
                            newTagEmoji={newTagEmoji}
                            onNewTagEmojiChange={setNewTagEmoji}
                            onConfirmAdd={() => handleAdd('person')}
                        />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    )
}

interface TagListProps {
    type: 'place' | 'person'
    tags: TagType[]
    editingTag: TagType | null
    onTypeEdit: (tag: TagType) => void
    onCancelEdit: () => void
    onConfirmEdit: (tag: TagType, newName: string, newEmoji: string) => void
    onDelete: (tag: TagType) => void
    isAdding: boolean
    onStartAdd: () => void
    onCancelAdd: () => void
    newTagName: string
    onNewTagNameChange: (val: string) => void
    newTagEmoji: string
    onNewTagEmojiChange: (val: string) => void
    onConfirmAdd: () => void
}

function TagList({
    tags,
    editingTag,
    onTypeEdit,
    onCancelEdit,
    onConfirmEdit,
    onDelete,
    isAdding,
    onStartAdd,
    onCancelAdd,
    newTagName,
    onNewTagNameChange,
    newTagEmoji,
    onNewTagEmojiChange,
    onConfirmAdd
}: TagListProps) {
    const { t } = useTranslation()

    return (
        <div className="space-y-3 pb-20">
            {!isAdding ? (
                <Button
                    variant="outline"
                    className="w-full border-dashed"
                    onClick={onStartAdd}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    {t('tags.add')}
                </Button>
            ) : (
                <Card className="border-primary/50">
                    <CardContent className="p-3 flex gap-2 items-center">
                        <Input
                            className="w-12 h-9 p-1 text-center text-lg"
                            placeholder="😀"
                            value={newTagEmoji}
                            onChange={(e) => onNewTagEmojiChange(e.target.value)}
                            maxLength={10}
                        />
                        <Input
                            autoFocus
                            value={newTagName}
                            onChange={(e) => onNewTagNameChange(e.target.value)}
                            placeholder={t('tags.addPlaceholder')}
                            className="h-9 flex-1"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') onConfirmAdd()
                                if (e.key === 'Escape') onCancelAdd()
                            }}
                        />
                        <Button size="sm" onClick={onConfirmAdd}>{t('tags.addConfirm')}</Button>
                        <Button size="sm" variant="ghost" onClick={onCancelAdd}><X className="h-4 w-4" /></Button>
                    </CardContent>
                </Card>
            )}

            {tags.map(tag => (
                <Card key={tag.id} className="overflow-hidden">
                    <CardContent className="p-3 flex items-center justify-between gap-3">
                        {editingTag?.id === tag.id ? (
                            <div className="flex-1 flex gap-2 items-center">
                                <Input
                                    id={`edit-tag-emoji-${tag.id}`}
                                    className="w-12 h-8 p-1 text-center text-lg"
                                    defaultValue={tag.emoji || ""}
                                    placeholder="😀"
                                    maxLength={10}
                                />
                                <Input
                                    autoFocus
                                    defaultValue={tag.name}
                                    id={`edit-tag-${tag.id}`}
                                    className="h-8 flex-1"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const val = e.currentTarget.value
                                            const emojiInput = document.getElementById(`edit-tag-emoji-${tag.id}`) as HTMLInputElement
                                            onConfirmEdit(tag, val, emojiInput.value)
                                        }
                                        if (e.key === 'Escape') onCancelEdit()
                                    }}
                                />
                                <Button
                                    size="sm"
                                    className="h-8"
                                    onClick={() => {
                                        const input = document.getElementById(`edit-tag-${tag.id}`) as HTMLInputElement
                                        const emojiInput = document.getElementById(`edit-tag-emoji-${tag.id}`) as HTMLInputElement
                                        onConfirmEdit(tag, input.value, emojiInput.value)
                                    }}
                                >{t('common.save')}</Button>
                                <Button size="sm" variant="ghost" className="h-8" onClick={onCancelEdit}><X className="h-4 w-4" /></Button>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <Badge variant="secondary" className="text-sm px-2 py-1 truncate max-w-[200px] flex gap-1.5 items-center">
                                        {tag.emoji && <span className="text-base leading-none">{tag.emoji}</span>}
                                        {tag.name}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                        {tag.count}
                                    </span>
                                </div>
                                <div className="flex items-center gap-0.5 shrink-0">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onTypeEdit(tag)}>
                                        <Edit2 className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDelete(tag)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            ))}

            {tags.length === 0 && !isAdding && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                    {t('tags.noTags')}
                </div>
            )}
        </div>
    )
}
