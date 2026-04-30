import { useEffect, useState } from 'react'
import { RecordScreen } from './components/RecordScreen'
import { HistoryScreen } from './components/HistoryScreen'
import { SettingsScreen } from './components/SettingsScreen'
import { TagsScreen } from './components/TagsScreen'
import { ReleaseNotesDialog } from './components/ReleaseNotesDialog'
import { Button } from './components/ui/button'
import { History, PlusCircle, Settings, Tag } from 'lucide-react'
import { LanguageProvider, useTranslation } from './lib/i18n/LanguageContext'
import {
  getPendingReleaseNote,
  markReleaseNoteSeen,
  type ReleaseNote,
} from './lib/releaseNotes'

type HistoryFilter = { place?: string; person?: string }

function AppContent() {
  const [view, setView] = useState<'record' | 'history' | 'settings' | 'tags'>('record')
  const [pendingHistoryFilter, setPendingHistoryFilter] = useState<HistoryFilter | null>(null)
  const [pendingReleaseNote, setPendingReleaseNote] = useState<ReleaseNote | null>(null)
  const { t } = useTranslation()

  // 起動時に一度だけ：アップデート後ならリリースノートを出す。
  // lastSeenVersion が未保存なら getPendingReleaseNote 内でサイレントに記録される。
  useEffect(() => {
    const note = getPendingReleaseNote(__APP_VERSION__)
    if (note) {
      // 起動時に一度だけ判定する性質上、ここでの setState はマウント直後の
      // 一回限りで cascading rerender にはならないため許容する。
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPendingReleaseNote(note)
    }
  }, [])

  const handleCloseReleaseNotes = () => {
    markReleaseNoteSeen(__APP_VERSION__)
    setPendingReleaseNote(null)
  }

  const handleSelectTagFromTags = (filter: HistoryFilter) => {
    setPendingHistoryFilter(filter)
    setView('history')
  }

  return (
    <div className="h-full w-full bg-background text-foreground overflow-hidden">
      <main className="h-full w-full pb-20 safe-area-pt overflow-y-auto">
        {view === 'record' ? (
          <RecordScreen />
        ) : view === 'history' ? (
          <HistoryScreen
            pendingFilter={pendingHistoryFilter}
            onFilterApplied={() => setPendingHistoryFilter(null)}
          />
        ) : view === 'tags' ? (
          <TagsScreen onSelectTag={handleSelectTagFromTags} />
        ) : (
          <SettingsScreen />
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-2 right-2 h-12 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex justify-around items-center z-50 safe-area-pb">
        <Button
          variant={view === 'record' ? 'default' : 'ghost'}
          onClick={() => setView('record')}
          className="flex flex-col h-full justify-center gap-1 rounded-full flex-1"
        >
          <PlusCircle className="h-5 w-5" />
          <span className="text-xs">{t('nav.record')}</span>
        </Button>
        <Button
          variant={view === 'history' ? 'default' : 'ghost'}
          onClick={() => setView('history')}
          className="flex flex-col h-full justify-center gap-1 rounded-full flex-1"
        >
          <History className="h-5 w-5" />
          <span className="text-xs">{t('nav.history')}</span>
        </Button>
        <Button
          variant={view === 'tags' ? 'default' : 'ghost'}
          onClick={() => setView('tags')}
          className="flex flex-col h-full justify-center gap-1 rounded-full flex-1"
        >
          <Tag className="h-5 w-5" />
          <span className="text-xs">{t('nav.tags')}</span>
        </Button>
        <Button
          variant={view === 'settings' ? 'default' : 'ghost'}
          onClick={() => setView('settings')}
          className="flex flex-col h-full justify-center gap-1 rounded-full flex-1"
        >
          <Settings className="h-5 w-5" />
          <span className="text-xs">{t('nav.settings')}</span>
        </Button>
      </nav>

      {pendingReleaseNote && (
        <ReleaseNotesDialog
          note={pendingReleaseNote}
          onClose={handleCloseReleaseNotes}
        />
      )}
    </div>
  )
}

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  )
}

export default App
