"use client"

import { useState } from "react"
// @ts-ignore
import Papa from "papaparse"
import { toast } from "sonner"
import { GlobalCard } from "@/components/ui/global-card"
import { Button } from "@/components/ui/button"
import { UploadCloud, CheckCircle2, Loader2, Key, Link as LinkIcon, AlertCircle } from "lucide-react"

export default function SyncPage() {
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [syncReport, setSyncReport] = useState<{ updated: number; inserted: number; errors: number; errorDetails?: string[] } | null>(null)

  const [storeUrl, setStoreUrl] = useState("")
  const [clientId, setClientId] = useState("")
  const [clientSecret, setClientSecret] = useState("")
  const [isSavingToken, setIsSavingToken] = useState(false)

  // -- Feature 1: CSV Upload --
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0])
      setSyncReport(null)
    }
  }

  const handleUploadCsv = async () => {
    if (!csvFile) return
    setIsUploading(true)
    setSyncReport(null)

    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results: any) => {
        try {
          // Send parsed json to backend
          const res = await fetch("/api/sync/csv", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rows: results.data }),
          })

          if (!res.ok) {
            const err = await res.json()
            throw new Error(err.message || "Failed to sync products")
          }

          const data = await res.json()
          toast.success("Products synced successfully via CSV!")
          setSyncReport(data.report)
          setCsvFile(null)
        } catch (error: any) {
          toast.error(`Upload error: ${error.message}`)
        } finally {
          setIsUploading(false)
        }
      },
      error: (error: any) => {
        toast.error(`CSV Parsing error: ${error.message}`)
        setIsUploading(false)
      }
    })
  }

  // -- Feature 2: Custom App API Token --
  const handleSaveToken = async () => {
    if (!storeUrl.trim() || !clientId.trim() || !clientSecret.trim()) {
      toast.error("Please enter the store URL, Client ID, and Client Secret.")
      return
    }

    setIsSavingToken(true)
    try {
      const res = await fetch("/api/sync/validate-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeUrl: storeUrl.trim(), clientId: clientId.trim(), clientSecret: clientSecret.trim() }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || "Failed to validate or save token")
      }

      toast.success("API Token validated and saved! Auto-sync is now active.")
    } catch (error: any) {
      toast.error(`Validation error: ${error.message}`)
    } finally {
      setIsSavingToken(false)
    }
  }

  return (
    <div className="w-full min-h-screen font-sans bg-stone-50/30 rounded-t-xl p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-stone-900 tracking-tight">Shopify Product Sync</h1>
        <p className="text-sm text-stone-500 font-medium mt-1">
          Keep your PinLoop catalog in sync with your Shopify store. Choose manual CSV upload or configure Auto-Sync.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* left col: CSV upload */}
        <GlobalCard className="w-full bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
          <div className="border-b border-stone-100 bg-stone-50/50 p-4">
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-stone-500" />
              Manual CSV Upload
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Export your products from Shopify (Export → All Products → CSV) and upload here for an instant sync. Matches by product Handle.
            </p>
          </div>
          <div className="p-5 space-y-4">
            <div className="border-2 border-dashed border-stone-200 rounded-xl p-8 text-center bg-stone-50 transition-colors hover:border-brand-500/50 hover:bg-brand-50/50">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-stone-900">Click to upload CSV</span>
                  <p className="text-xs text-stone-500 mt-0.5">or drag and drop</p>
                </div>
              </label>
            </div>
            {csvFile && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-100">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-900">{csvFile.name} ready to sync.</span>
                </div>
              </div>
            )}
            {syncReport && (
              <div className="p-4 bg-stone-50 rounded-lg text-sm text-stone-700 space-y-1">
                <p className="font-bold">Sync Complete!</p>
                <p>Created: <span className="text-green-600 font-semibold">{syncReport.inserted}</span></p>
                <p>Updated: <span className="text-blue-600 font-semibold">{syncReport.updated}</span></p>
                <p>Errors/Skipped: <span className="text-red-600 font-semibold">{syncReport.errors}</span></p>
                {syncReport.errorDetails && syncReport.errorDetails.length > 0 && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded text-xs text-red-600 max-h-40 overflow-y-auto space-y-1">
                    <p className="font-bold">Error Details:</p>
                    {syncReport.errorDetails.map((err, i) => <div key={i}>{err}</div>)}
                  </div>
                )}
              </div>
            )}
            <div className="pt-2">
              <Button
                onClick={handleUploadCsv}
                disabled={!csvFile || isUploading}
                className="w-full bg-stone-900 text-white hover:bg-stone-800 h-10"
              >
                {isUploading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Syncing Products...</>
                ) : (
                  "Sync via CSV"
                )}
              </Button>
            </div>
          </div>
        </GlobalCard>

        {/* right col: API Key */}
        <GlobalCard className="w-full bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
          <div className="border-b border-stone-100 bg-stone-50/50 p-4">
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <Key className="w-4 h-4 text-stone-500" />
              Auto-Sync Setup (Advanced)
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Configure a Shopify Custom App to automatically sync products in the background daily.
            </p>
          </div>
          <div className="p-5 space-y-5">
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-800 space-y-1.5 flex gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">2026 Authentication Setup:</p>
                <ol className="list-decimal pl-4 space-y-1 mt-1">
                  <li>Go to Shopify Settings → Apps and sales channels → Develop apps.</li>
                  <li>Click "Create an app" (Name it PinLoop).</li>
                  <li>Go to <b>Configuration</b> → Admin API Scopes: Check <code className="bg-amber-100 px-1 rounded">read_products</code> and Save.</li>
                  <li>Go to <b>API Credentials</b>. Copy the <b>Client ID</b> and <b>Client Secret</b> and paste them below.</li>
                </ol>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Shopify Store URL
                </label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    value={storeUrl}
                    onChange={(e) => setStoreUrl(e.target.value)}
                    placeholder="your-store.myshopify.com"
                    className="w-full pl-9 pr-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Client ID
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input
                      type="text"
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      placeholder="Client ID"
                      className="w-full pl-9 pr-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Client Secret
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input
                      type="password"
                      value={clientSecret}
                      onChange={(e) => setClientSecret(e.target.value)}
                      placeholder="Client Secret"
                      className="w-full pl-9 pr-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button
                onClick={handleSaveToken}
                disabled={!storeUrl || !clientId || !clientSecret || isSavingToken}
                className="w-full bg-stone-900 text-white hover:bg-stone-800 h-10"
              >
                {isSavingToken ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...</>
                ) : (
                  "Save & Verify Connection"
                )}
              </Button>
            </div>
          </div>
        </GlobalCard>

      </div>
    </div>
  )
}
