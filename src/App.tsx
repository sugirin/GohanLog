import { useState } from 'react'
import { RecordScreen } from './components/RecordScreen'
import { HistoryScreen } from './components/HistoryScreen'
import { SettingsScreen } from './components/SettingsScreen'
import { Button } from './components/ui/button'
import { History, PlusCircle, Settings } from 'lucide-react'

function App() {
  const [view, setView] = useState<'record' | 'history' | 'settings'>('record')

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main>
        {view === 'record' ? (
          <RecordScreen />
        ) : view === 'history' ? (
          <HistoryScreen />
        ) : (
          <SettingsScreen />
        )}
      </main>

      {/* Bottom Navigation for mobile feel */}
      <nav className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-1 flex justify-around items-center z-50 safe-area-pb">
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
