import { Sparkles, X } from 'lucide-react'
import { Button } from './ui/button'
import { useTranslation } from '../lib/i18n/LanguageContext'
import type { ReleaseNote } from '../lib/releaseNotes'

interface ReleaseNotesDialogProps {
    note: ReleaseNote
    onClose: () => void
}

export function ReleaseNotesDialog({ note, onClose }: ReleaseNotesDialogProps) {
    const { language, t } = useTranslation()
    const content = note[language]

    return (
        <div
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="release-notes-title"
        >
            <div className="bg-background border rounded-lg shadow-lg w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden">
                <div className="p-4 border-b flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        <h2 id="release-notes-title" className="text-lg font-semibold">
                            {t('releaseNotes.title')}
                        </h2>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        aria-label={t('releaseNotes.closeButton')}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    <div className="text-xs text-muted-foreground">
                        {t('releaseNotes.versionLabel', { version: note.version })}
                    </div>
                    <h3 className="text-base font-medium">{content.title}</h3>
                    {content.bullets.length > 0 ? (
                        <ul className="list-disc pl-5 space-y-1.5 text-sm text-foreground">
                            {content.bullets.map((bullet, idx) => (
                                <li key={idx}>{bullet}</li>
                            ))}
                        </ul>
                    ) : null}
                </div>

                <div className="p-4 border-t shrink-0">
                    <Button onClick={onClose} className="w-full">
                        {t('releaseNotes.closeButton')}
                    </Button>
                </div>
            </div>
        </div>
    )
}
