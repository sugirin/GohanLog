import { useState } from 'react'
import { RecordScreen } from './components/RecordScreen'
import { HistoryScreen } from './components/HistoryScreen'
import { SettingsScreen } from './components/SettingsScreen'
import { Button } from './components/ui/button'
import { History, PlusCircle, Settings } from 'lucide-react'

function App() {
  const [view, setView] = useState<'record' | 'history' | 'settings'>('record')

  return (
    <div className="h-full w-full bg-background text-foreground overflow-hidden">
      <main className="h-full w-full pb-20 safe-area-pt overflow-y-auto">
        {view === 'record' ? (
          <RecordScreen />
        ) : view === 'history' ? (
          <HistoryScreen />
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
          <span className="text-xs">Record</span>
        </Button>
        <Button
          variant={view === 'history' ? 'default' : 'ghost'}
          onClick={() => setView('history')}
          className="flex flex-col h-full justify-center gap-1 rounded-full flex-1"
        >
          <History className="h-5 w-5" />
          <span className="text-xs">History</span>
        </Button>
        <Button
          variant={view === 'settings' ? 'default' : 'ghost'}
          onClick={() => setView('settings')}
          className="flex flex-col h-full justify-center gap-1 rounded-full flex-1"
        >
          <Settings className="h-5 w-5" />
          <span className="text-xs">Settings</span>
        </Button>
      </nav>
    </div>
  )
}

export default App
