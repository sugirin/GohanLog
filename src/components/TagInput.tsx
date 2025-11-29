import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import type { Tag } from "@/lib/db"
import { X } from "lucide-react"

interface TagInputProps {
    label: string
    placeholder?: string
    tags: string[]
    suggestions: Tag[]
    onTagsChange: (tags: string[]) => void
    hideTags?: boolean
}

export function TagInput({ label, placeholder, tags, suggestions, onTagsChange, hideTags = false }: TagInputProps) {
    const [input, setInput] = React.useState("")
    const [showSuggestions, setShowSuggestions] = React.useState(false)

    const filteredSuggestions = suggestions
        .filter(s => s.name.toLowerCase().includes(input.toLowerCase()) && !tags.includes(s.name))
        .slice(0, 5)

    const addTag = (name: string) => {
        // カンマで分割し、各名前を個別に処理
        const names = name.split(/[,、]/).map(n => n.trim()).filter(n => n)

        const newTags = [...tags]
        for (const n of names) {
            if (n && !newTags.includes(n)) {
                newTags.push(n)
            }
        }

        if (newTags.length > tags.length) {
            onTagsChange(newTags)
        }

        setInput("")
        setShowSuggestions(false)
    }

    const removeTag = (name: string) => {
        onTagsChange(tags.filter(t => t !== name))
    }

    return (
        <div className="space-y-2">
            {label && (
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {label}
                </label>
            )}
            {!hideTags && (
                <div className="flex flex-wrap gap-2 mb-2">
                    {tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-sm py-1 px-2">
                            {tag}
                            <button onClick={() => removeTag(tag)} className="ml-2 hover:text-destructive">
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}
                </div>
            )}
            <div className="relative">
                <Input
                    value={input}
                    onChange={e => {
                        setInput(e.target.value)
                        setShowSuggestions(true)
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    onKeyDown={e => {
                        if (e.key === 'Enter') {
                            e.preventDefault()
                            addTag(input)
                        }
                    }}
                    placeholder={placeholder}
                />
                {showSuggestions && (filteredSuggestions.length > 0 || (input && !filteredSuggestions.find(s => s.name === input))) && (
                    <div className="absolute z-10 w-full bg-background border rounded-md shadow-lg mt-1 max-h-60 overflow-auto">
                        {filteredSuggestions.map(suggestion => (
                            <div
                                key={suggestion.id}
                                className="px-4 py-2 hover:bg-muted cursor-pointer text-sm"
                                onClick={() => addTag(suggestion.name)}
                            >
                                {suggestion.name}
                                <span className="ml-2 text-xs text-muted-foreground">({suggestion.count})</span>
                            </div>
                        ))}
                        {input && !filteredSuggestions.find(s => s.name === input) && (
                            <div
                                className="px-4 py-2 hover:bg-muted cursor-pointer text-sm text-primary"
                                onClick={() => addTag(input)}
                            >
                                Create "{input}"
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
