
import * as React from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { MapPin, Users, Edit2, Trash2, Tag, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTags, addTag, deleteTag, renameTag } from "@/lib/actions"
import type { Tag as TagType } from "@/lib/db"

export function TagsScreen() {
    const places = useLiveQuery(() => useTags('place')) || []
    const people = useLiveQuery(() => useTags('person')) || []
    const [editingTag, setEditingTag] = React.useState<TagType | null>(null)
    const [newTagName, setNewTagName] = React.useState("")
    const [isAdding, setIsAdding] = React.useState<'place' | 'person' | null>(null)

    const handleRename = async (id: number, oldName: string, newName: string, type: 'place' | 'person') => {
        if (!newName.trim() || newName === oldName) {
            setEditingTag(null)
            return
        }

        if (confirm(`タグ「${oldName}」を「${newName}」に変更しますか？\nこれまでの記録もすべて更新されます。`)) {
            await renameTag(id, oldName, newName, type)
        }
        setEditingTag(null)
    }

    const handleDelete = async (tag: TagType) => {
        if (confirm(`タグ「${tag.name}」を削除しますか？\n(過去の記録からテキストは消えませんが、サジェストに表示されなくなります)`)) {
            await deleteTag(tag.id!)
        }
    }

    const handleAdd = async (type: 'place' | 'person') => {
        if (!newTagName.trim()) return

        await addTag(newTagName.trim(), type)
        setNewTagName("")
        setIsAdding(null)
    }

    return (
        <div className="h-full flex flex-col animate-in fade-in duration-500">
            <div className="p-4 bg-background border-b z-10">
                <h1 className="text-xl font-bold flex items-center gap-2 mb-4">
                    <Tag className="h-5 w-5" />
                    タグ管理
                </h1>
            </div>

            <Tabs defaultValue="places" className="flex-1 flex flex-col overflow-hidden">
                <div className="px-4 pt-2">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="places" className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            場所 ({places.length})
                        </TabsTrigger>
                        <TabsTrigger value="people" className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            人 ({people.length})
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
                            onConfirmEdit={handleRename}
                            onDelete={handleDelete}
                            isAdding={isAdding === 'place'}
                            onStartAdd={() => setIsAdding('place')}
                            onCancelAdd={() => {
                                setIsAdding(null)
                                setNewTagName("")
                            }}
                            newTagName={newTagName}
                            onNewTagNameChange={setNewTagName}
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
                            onConfirmEdit={handleRename}
                            onDelete={handleDelete}
                            isAdding={isAdding === 'person'}
                            onStartAdd={() => setIsAdding('person')}
                            onCancelAdd={() => {
                                setIsAdding(null)
                                setNewTagName("")
                            }}
                            newTagName={newTagName}
                            onNewTagNameChange={setNewTagName}
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
    onConfirmEdit: (id: number, oldName: string, newName: string, type: 'place' | 'person') => void
    onDelete: (tag: TagType) => void
    isAdding: boolean
    onStartAdd: () => void
    onCancelAdd: () => void
    newTagName: string
    onNewTagNameChange: (val: string) => void
    onConfirmAdd: () => void
}

function TagList({
    type,
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
    onConfirmAdd
}: TagListProps) {
    return (
        <div className="space-y-3 pb-20">
            {!isAdding ? (
                <Button
                    variant="outline"
                    className="w-full border-dashed"
                    onClick={onStartAdd}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    新しいタグを追加
                </Button>
            ) : (
                <Card className="border-primary/50">
                    <CardContent className="p-3 flex gap-2 items-center">
                        <Input
                            autoFocus
                            value={newTagName}
                            onChange={(e) => onNewTagNameChange(e.target.value)}
                            placeholder="タグ名を入力..."
                            className="h-9"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') onConfirmAdd()
                                if (e.key === 'Escape') onCancelAdd()
                            }}
                        />
                        <Button size="sm" onClick={onConfirmAdd}>追加</Button>
                        <Button size="sm" variant="ghost" onClick={onCancelAdd}><XIcon /></Button>
                    </CardContent>
                </Card>
            )}

            {tags.map(tag => (
                <Card key={tag.id} className="overflow-hidden">
                    <CardContent className="p-3 flex items-center justify-between gap-3">
                        {editingTag?.id === tag.id ? (
                            <div className="flex-1 flex gap-2">
                                <Input
                                    autoFocus
                                    defaultValue={tag.name}
                                    id={`edit-tag-${tag.id}`}
                                    className="h-8"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const val = e.currentTarget.value
                                            onConfirmEdit(tag.id!, tag.name, val, type)
                                        }
                                        if (e.key === 'Escape') onCancelEdit()
                                    }}
                                />
                                <Button
                                    size="sm"
                                    className="h-8"
                                    onClick={() => {
                                        const input = document.getElementById(`edit-tag-${tag.id}`) as HTMLInputElement
                                        onConfirmEdit(tag.id!, tag.name, input.value, type)
                                    }}
                                >保存</Button>
                                <Button size="sm" variant="ghost" className="h-8" onClick={onCancelEdit}><XIcon /></Button>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <Badge variant="secondary" className="text-sm px-2 py-1 truncate max-w-[200px]">
                                        {tag.name}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                        {tag.count}回
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
                    タグがありません
                </div>
            )}
        </div>
    )
}

function XIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
        >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
        </svg>
    )
}
