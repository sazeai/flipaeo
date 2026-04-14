'use client'

import { useState, useRef } from 'react'
import { Upload, FileSpreadsheet, Store, CheckCircle2, AlertCircle, Loader2, Key, Link as LinkIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
// @ts-ignore
import Papa from 'papaparse'

type Tab = 'csv' | 'shopify'

interface SyncReport {
  inserted: number
  updated: number
  errors: number
}

export function StepProducts() {
  const [tab, setTab] = useState<Tab>('csv')

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-neutral-950">
          Import your products
        </h2>
        <p className="mt-2 text-sm text-neutral-600">
          EcomPin generates pins from your product catalog. Upload a CSV or connect Shopify to get started.
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex rounded-xl border border-neutral-200 bg-neutral-50 p-1">
        <button
          type="button"
          onClick={() => setTab('csv')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
            tab === 'csv'
              ? 'bg-white text-neutral-950 shadow-sm'
              : 'text-neutral-500 hover:text-neutral-700'
          }`}
        >
          <FileSpreadsheet className="h-4 w-4" />
          CSV Upload
        </button>
        <button
          type="button"
          onClick={() => setTab('shopify')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
            tab === 'shopify'
              ? 'bg-white text-neutral-950 shadow-sm'
              : 'text-neutral-500 hover:text-neutral-700'
          }`}
        >
          <Store className="h-4 w-4" />
          Connect Shopify
        </button>
      </div>

      {tab === 'csv' ? <CsvUpload /> : <ShopifyConnect />}
    </div>
  )
}

/* ─── CSV Upload ─── */

function CsvUpload() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [report, setReport] = useState<SyncReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  async function handleFile(file: File) {
    setError(null)
    setReport(null)
    setFileName(file.name)
    setUploading(true)

    try {
      const text = await file.text()
      const parsed = Papa.parse(text, { header: true, skipEmptyLines: true })

      if (!parsed.data || parsed.data.length === 0) {
        setError('CSV file is empty or could not be parsed.')
        setUploading(false)
        return
      }

      const res = await fetch('/api/sync/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: parsed.data }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Import failed')
      }

      const { report: r } = await res.json()
      setReport(r)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <input
        ref={fileRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={e => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
        }}
      />

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50/50 px-6 py-10 transition-colors hover:border-neutral-300 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {uploading ? (
          <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
        ) : (
          <Upload className="h-8 w-8 text-neutral-400" />
        )}
        <div className="text-center">
          <p className="text-sm font-medium text-neutral-700">
            {uploading ? 'Importing...' : 'Click to upload CSV'}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            Shopify product export format recommended. Max 5,000 rows.
          </p>
        </div>
      </button>

      {fileName && !error && !report && !uploading && (
        <p className="text-xs text-neutral-500">Selected: {fileName}</p>
      )}

      {report && (
        <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
          <div className="text-sm text-green-800">
            <p className="font-medium">Import complete</p>
            <p className="mt-1">
              {report.inserted} new products added, {report.updated} updated
              {report.errors > 0 && `, ${report.errors} errors`}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <div className="text-sm text-red-800">
            <p className="font-medium">Import failed</p>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Shopify Connect ─── */

function ShopifyConnect() {
  const [storeUrl, setStoreUrl] = useState('')
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [saving, setSaving] = useState(false)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConnect() {
    if (!storeUrl || !clientId || !clientSecret) return
    setError(null)
    setSaving(true)

    try {
      const res = await fetch('/api/sync/validate-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeUrl, clientId, clientSecret }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Validation failed')
      }

      setConnected(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Connection failed')
    } finally {
      setSaving(false)
    }
  }

  if (connected) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-5">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
        <div>
          <p className="text-sm font-medium text-green-800">Shopify connected</p>
          <p className="mt-1 text-sm text-green-700">
            {storeUrl} is linked. Products will sync automatically.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-xs leading-5 text-amber-800">
          <strong>Setup guide:</strong> In your Shopify admin, go to Settings &rarr; Apps and sales channels &rarr; Develop apps &rarr; Create an app. Grant <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-[11px]">read_products</code> scope, then copy the credentials below.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-neutral-900">
            <LinkIcon className="h-3.5 w-3.5" />
            Store URL
          </label>
          <Input
            value={storeUrl}
            onChange={e => setStoreUrl(e.target.value)}
            placeholder="your-store.myshopify.com"
            className="h-12 rounded-xl border-neutral-200 bg-white px-4"
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-neutral-900">
            <Key className="h-3.5 w-3.5" />
            Client ID
          </label>
          <Input
            value={clientId}
            onChange={e => setClientId(e.target.value)}
            placeholder="Shopify API Client ID"
            className="h-12 rounded-xl border-neutral-200 bg-white px-4"
          />
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-neutral-900">
            <Key className="h-3.5 w-3.5" />
            Client Secret
          </label>
          <Input
            type="password"
            value={clientSecret}
            onChange={e => setClientSecret(e.target.value)}
            placeholder="Shopify API Client Secret"
            className="h-12 rounded-xl border-neutral-200 bg-white px-4"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <Button
        onClick={handleConnect}
        disabled={saving || !storeUrl || !clientId || !clientSecret}
        className="h-12 w-full rounded-xl bg-neutral-900 text-sm font-medium text-white hover:bg-neutral-800"
      >
        {saving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Validating...
          </>
        ) : (
          'Connect Shopify'
        )}
      </Button>
    </div>
  )
}
