import * as React from "react"
import { Download, Upload, AlertTriangle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { exportData, importData } from "@/lib/backup"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function SettingsScreen() {
    const [isExporting, setIsExporting] = React.useState(false)
    const [isImporting, setIsImporting] = React.useState(false)
    const [message, setMessage] = React.useState<{ type: 'success' | 'error', text: string } | null>(null)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    const handleExport = async () => {
        setIsExporting(true)
        setMessage(null)
        try {
            await exportData()
            setMessage({ type: 'success', text: 'Data exported successfully!' })
        } catch (error) {
            console.error(error)
            setMessage({ type: 'error', text: 'Failed to export data.' })
        } finally {
            setIsExporting(false)
        }
    }

    const handleImportClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!confirm("Importing data will merge with your current data. Existing records with the same ID will be overwritten. Are you sure?")) {
            e.target.value = ''
            return
        }

        setIsImporting(true)
        setMessage(null)
        try {
            await importData(file)
            setMessage({ type: 'success', text: 'Data imported successfully! Please refresh the page to see changes.' })
            // Optional: Reload page to reflect changes immediately if needed, but let's just show success first.
        } catch (error) {
            console.error(error)
            setMessage({ type: 'error', text: 'Failed to import data. Please check the file format.' })
        } finally {
            setIsImporting(false)
            e.target.value = ''
        }
    }

    return (
        <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 p-4 gap-4 overflow-y-auto">
            <h1 className="text-2xl font-bold">Settings</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Data Management</CardTitle>
                    <CardDescription>
                        Backup your memories or restore them from a file.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium">Export Data</h3>
                        <p className="text-sm text-muted-foreground">
                            Save all your logs and photos to a JSON file. This is useful for backing up your data or moving to another device.
                        </p>
                        <Button
                            onClick={handleExport}
                            disabled={isExporting || isImporting}
                            variant="outline"
                            className="w-full sm:w-auto"
                        >
                            <Download className="mr-2 h-4 w-4" />
                            {isExporting ? "Exporting..." : "Export Backup"}
                        </Button>
                    </div>

                    <div className="border-t pt-4 space-y-2">
                        <h3 className="text-sm font-medium">Import Data</h3>
                        <p className="text-sm text-muted-foreground">
                            Restore data from a previously exported JSON file.
                        </p>
                        <input
                            type="file"
                            accept=".json"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <Button
                            onClick={handleImportClick}
                            disabled={isExporting || isImporting}
                            variant="outline"
                            className="w-full sm:w-auto"
                        >
                            <Upload className="mr-2 h-4 w-4" />
                            {isImporting ? "Importing..." : "Import Backup"}
                        </Button>
                    </div>

                    {message && (
                        <Alert variant={message.type === 'error' ? "destructive" : "default"} className={message.type === 'success' ? "border-primary text-primary" : ""}>
                            {message.type === 'error' ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                            <AlertTitle>{message.type === 'error' ? "Error" : "Success"}</AlertTitle>
                            <AlertDescription>
                                {message.text}
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            <div className="text-xs text-center text-muted-foreground mt-auto pb-4">
                GohanLog v1.0.0
            </div>
        </div>
    )
}
