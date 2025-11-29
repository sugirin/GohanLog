import { useState } from 'react'
import { RecordScreen } from './components/RecordScreen'
import { HistoryScreen } from './components/HistoryScreen'
import { SettingsScreen } from './components/SettingsScreen'
import { Button } from './components/ui/button'
import { History, PlusCircle, Settings } from 'lucide-react'

function App() {
  const [view, setView] = useState<'record' | 'history' | 'settings'>('record')

  return (
    <div className="h-[100dvh] w-screen flex flex-col bg-background text-foreground overflow-hidden safe-area-pt">
      <main className="flex-1 flex flex-col overflow-hidden min-h-0">
        {view === 'record' ? (
          <RecordScreen />
        ) : view === 'history' ? (
          <HistoryScreen />
        ) : (
          <SettingsScreen />
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="shrink-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-1 pt-3 pb-6 flex justify-around items-center z-50 safe-area-pb">
        <Button
          variant={view === 'record' ? 'default' : 'ghost'}
          onClick={() => setView('record')}
        >
          <PlusCircle className="h-4 w-4" />
          Record
        </Button>
        <Button
          variant={view === 'history' ? 'default' : 'ghost'}
          onClick={() => setView('history')}
        >
          <History className="h-4 w-4" />
          History
        </Button>
        <Button
          variant={view === 'settings' ? 'default' : 'ghost'}
          onClick={() => setView('settings')}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Button>
      </nav>
    </div>
  )
}

export default App
