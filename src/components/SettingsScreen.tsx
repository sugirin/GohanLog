import * as React from "react"
import { Download, Upload, AlertTriangle, CheckCircle2, Trash2, Languages, Bug } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { exportData, importData } from "@/lib/backup"
import { deleteAllLogs } from "@/lib/actions"
import { exportDebugLog } from "@/lib/debug"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useTranslation } from "@/lib/i18n/LanguageContext"

export function SettingsScreen() {
    const { t, language, setLanguage } = useTranslation()
    const [isExporting, setIsExporting] = React.useState(false)
    const [isImporting, setIsImporting] = React.useState(false)
    const [message, setMessage] = React.useState<{ type: 'success' | 'error', text: string } | null>(null)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    const handleExport = async () => {
        setIsExporting(true)
        setMessage(null)
        try {
            await exportData()
            setMessage({ type: 'success', text: t('settings.successExport') })
        } catch (error) {
            console.error(error)
            setMessage({ type: 'error', text: t('settings.errorExport') })
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

        if (!confirm(t('settings.confirmImport'))) {
            e.target.value = ''
            return
        }

        setIsImporting(true)
        setMessage(null)
        try {
            await importData(file)
            setMessage({ type: 'success', text: t('settings.successImport') })
        } catch (error) {
            console.error(error)
            setMessage({ type: 'error', text: t('settings.errorImport') })
        } finally {
            setIsImporting(false)
            e.target.value = ''
        }
    }

    return (
        <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 p-4 gap-4 overflow-y-auto">
            <h1 className="text-2xl font-bold">{t('settings.title')}</h1>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Languages className="h-5 w-5" />
                        {t('settings.language')}
                    </CardTitle>
                    <CardDescription>
                        {t('settings.languageDescription')}
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex gap-4">
                    <Button
                        variant={language === 'ja' ? 'default' : 'outline'}
                        onClick={() => setLanguage('ja')}
                        className="flex-1"
                    >
                        日本語
                    </Button>
                    <Button
                        variant={language === 'en' ? 'default' : 'outline'}
                        onClick={() => setLanguage('en')}
                        className="flex-1"
                    >
                        English
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t('settings.dataManagement')}</CardTitle>
                    <CardDescription>
                        {t('settings.backupDescription')}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium">{t('settings.export')}</h3>
                        <p className="text-sm text-muted-foreground">
                            {t('settings.exportDescription')}
                        </p>
                        <Button
                            onClick={handleExport}
                            disabled={isExporting || isImporting}
                            variant="outline"
                            className="w-full sm:w-auto"
                        >
                            <Download className="mr-2 h-4 w-4" />
                            {isExporting ? t('settings.exporting') : t('settings.exportButton')}
                        </Button>
                    </div>

                    <div className="border-t pt-4 space-y-2">
                        <h3 className="text-sm font-medium">{t('settings.import')}</h3>
                        <p className="text-sm text-muted-foreground">
                            {t('settings.importDescription')}
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
                            {isImporting ? t('settings.importing') : t('settings.importButton')}
                        </Button>
                    </div>

                    <div className="border-t pt-4 space-y-2">
                        <h3 className="text-sm font-medium text-destructive">{t('settings.dangerZone')}</h3>
                        <p className="text-sm text-muted-foreground">
                            {t('settings.deleteAllDescription')}
                        </p>
                        <Button
                            onClick={async () => {
                                if (confirm(t('settings.confirmDelete'))) {
                                    if (confirm(t('settings.confirmDeleteFinal'))) {
                                        try {
                                            await deleteAllLogs()
                                            setMessage({ type: 'success', text: t('settings.successDelete') })
                                        } catch (e) {
                                            console.error(e)
                                            setMessage({ type: 'error', text: t('settings.errorDelete') })
                                        }
                                    }
                                }
                            }}
                            variant="destructive"
                            className="w-full sm:w-auto"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t('settings.deleteAllButton')}
                        </Button>
                    </div>

                    <div className="border-t pt-4 space-y-2">
                        <h3 className="text-sm font-medium">Debug</h3>
                        <p className="text-sm text-muted-foreground">
                            Export debug logs to help diagnose issues.
                        </p>
                        <Button
                            onClick={async () => {
                                try {
                                    await exportDebugLog()
                                    setMessage({ type: 'success', text: 'Debug log exported' })
                                } catch (e) {
                                    console.error(e)
                                    setMessage({ type: 'error', text: 'Failed to export debug log' })
                                }
                            }}
                            variant="outline"
                            className="w-full sm:w-auto"
                        >
                            <Bug className="mr-2 h-4 w-4" />
                            Export Debug Log
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
