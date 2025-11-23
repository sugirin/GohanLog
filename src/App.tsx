import { useState } from 'react'
import { RecordScreen } from './components/RecordScreen'
import { HistoryScreen } from './components/HistoryScreen'
import { Button } from './components/ui/button'
import { History, PlusCircle } from 'lucide-react'

function App() {
  const [view, setView] = useState<'record' | 'history'>('record')

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main>
        {view === 'record' ? (
          <RecordScreen />
        ) : (
          <HistoryScreen />
        )}
      </main>

      {/* Bottom Navigation for mobile feel */}
      <nav className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 flex justify-around items-center z-50 safe-area-pb">
        <Button
          variant={view === 'record' ? 'default' : 'ghost'}
          onClick={() => setView('record')}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Record
        </Button>
        <Button
          variant={view === 'history' ? 'default' : 'ghost'}
          onClick={() => setView('history')}
        >
          <History className="mr-2 h-4 w-4" />
          History
        </Button>
      </nav>
    </div>
  )
}

export default App
