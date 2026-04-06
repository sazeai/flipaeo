'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
  ShoppingBag,
  Plus,
  Upload,
  Loader2,
  ExternalLink,
  Trash2,
  Package,
  UploadCloud,
  CheckCircle2
} from 'lucide-react'
import { toast } from 'sonner'
// @ts-ignore
import Papa from 'papaparse'

interface Product {
  id: string
  title: string
  description: string | null
  price: number | null
  currency: string | null
  product_url: string | null
  image_url: string | null
  source: string
  is_active: boolean
  created_at: string
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', price: '', product_url: '' })
  const [uploadFile, setUploadFile] = useState<File | null>(null)

  // CSV State
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [isCsvUploading, setIsCsvUploading] = useState(false)
  const [syncReport, setSyncReport] = useState<{ updated: number; inserted: number; errors: number; errorDetails?: string[] } | null>(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    setProducts((data as Product[]) || [])
    setLoading(false)
  }

  async function handleManualUpload() {
    if (!form.title) return
    setUploading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // If we have a file, we'd upload to R2 here. For now, just create the record.
    let imageUrl = null
    if (uploadFile) {
      // TODO: Upload to R2 via API route, get back URL
      // For now, create a local object URL placeholder
      imageUrl = URL.createObjectURL(uploadFile)
    }

    await supabase.from('products').insert({
      user_id: user.id,
      title: form.title,
      description: form.description || null,
      price: form.price ? parseFloat(form.price) : null,
      product_url: form.product_url || null,
      image_url: imageUrl,
      source: 'manual',
    })

    setForm({ title: '', description: '', price: '', product_url: '' })
    setUploadFile(null)
    setShowUpload(false)
    setUploading(false)
    fetchProducts()
  }

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0])
      setSyncReport(null)
    }
  }

  const handleUploadCsv = async () => {
    if (!csvFile) return
    setIsCsvUploading(true)
    setSyncReport(null)

    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results: any) => {
        try {
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
          fetchProducts()
        } catch (error: any) {
          toast.error(`Upload error: ${error.message}`)
        } finally {
          setIsCsvUploading(false)
        }
      },
      error: (error: any) => {
        toast.error(`CSV Parsing error: ${error.message}`)
        setIsCsvUploading(false)
      }
    })
  }

  async function handleDelete(productId: string) {
    const supabase = createClient()
    await supabase.from('products').delete().eq('id', productId)
    setProducts(prev => prev.filter(p => p.id !== productId))
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-muted rounded w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-64 bg-muted rounded-2xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {products.length} product{products.length !== 1 ? 's' : ''} in your catalog
          </p>
        </div>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="bg-neutral-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-neutral-800 flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Unified Upload Dashboard */}
      {showUpload && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 bg-white border border-neutral-200 rounded-2xl">
          
          {/* Left Column: Manual Form */}
          <div className="space-y-5 lg:border-r lg:border-neutral-100 lg:pr-6">
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Plus className="w-5 h-5 text-neutral-500" /> Manual Product
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Add a single product to your catalog manually.</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Product Name *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g., Ceramic Watering Can"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Price</label>
                <input
                  type="number"
                  value={form.price}
                  onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                  placeholder="49.99"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Brief product description..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Product URL</label>
                <input
                  type="url"
                  value={form.product_url}
                  onChange={e => setForm(p => ({ ...p, product_url: e.target.value }))}
                  placeholder="https://store.com/product/..."
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Product Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full text-sm file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border-0 file:bg-neutral-100 file:text-sm file:font-medium hover:file:bg-neutral-200"
                />
              </div>
            </div>
            
            <div className="pt-2 flex gap-3">
              <button
                onClick={handleManualUpload}
                disabled={!form.title || uploading}
                className="flex-1 bg-neutral-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-neutral-800 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {uploading ? 'Adding...' : 'Add Manually'}
              </button>
              <button
                onClick={() => setShowUpload(false)}
                className="px-5 py-2.5 rounded-xl text-sm border border-neutral-200 hover:bg-neutral-50"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* Right Column: CSV Upload */}
          <div className="space-y-5 lg:pl-2">
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-neutral-500" /> Bulk CSV
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Export from Shopify and upload here for an instant sync.</p>
            </div>

            <div className="space-y-4 pt-1">
              <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center bg-neutral-50 transition-colors hover:border-neutral-400/50">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCsvFileChange}
                  className="hidden"
                  id="csv-upload"
                />
                <label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-500">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-neutral-900">Click to upload CSV</span>
                    <p className="text-xs text-neutral-500 mt-0.5">or drag and drop</p>
                  </div>
                </label>
              </div>

              {csvFile && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-green-50 border border-green-100">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-900 truncate max-w-[200px]">{csvFile.name} ready</span>
                  </div>
                </div>
              )}

              {syncReport && (
                <div className="p-4 bg-neutral-50 rounded-xl text-sm text-neutral-700 space-y-1">
                  <p className="font-semibold">Sync Report</p>
                  <p>Created: <span className="text-green-600 font-semibold">{syncReport.inserted}</span></p>
                  <p>Updated: <span className="text-blue-600 font-semibold">{syncReport.updated}</span></p>
                  <p>Errors: <span className="text-red-600 font-semibold">{syncReport.errors}</span></p>
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={handleUploadCsv}
                  disabled={!csvFile || isCsvUploading}
                  className="w-full bg-neutral-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-neutral-800 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isCsvUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                  {isCsvUploading ? 'Syncing...' : 'Sync via CSV'}
                </button>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Product Masonry Grid */}
      {products.length === 0 ? (
        <div className="text-center py-16 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200">
          <Package className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <h3 className="font-medium text-neutral-600 mb-1">No products yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Add products manually or connect your Shopify/Etsy store.
          </p>
          <button
            onClick={() => setShowUpload(true)}
            className="bg-neutral-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-neutral-800 inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add First Product
          </button>
        </div>
      ) : (
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4">

          {products.map(product => (
            <div
              key={product.id}
              style={{ breakInside: 'avoid' }}
              className="mb-4 bg-white border border-neutral-200/80 rounded-2xl overflow-hidden group hover:border-neutral-300 hover:shadow-md transition-all duration-200"
            >
              {/* Image — natural aspect ratio */}
              <div className="relative bg-neutral-50">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.title}
                    className="w-full h-auto block"
                    loading="lazy"
                    style={{ minHeight: '120px' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                ) : (
                  <div className="w-full flex items-center justify-center py-16">
                    <ShoppingBag className="w-10 h-10 text-neutral-200" />
                  </div>
                )}
                {/* Source badge */}
                <span className="absolute top-2.5 left-2.5 bg-white/95 backdrop-blur-sm text-[10px] px-2 py-0.5 rounded-md font-semibold capitalize text-neutral-600 shadow-sm border border-neutral-100">
                  {product.source}
                </span>
              </div>

              {/* Info */}
              <div className="px-3.5 py-3 border-t border-neutral-100">
                <h3 className="font-semibold text-sm text-neutral-900 line-clamp-2 leading-snug">
                  {product.title}
                </h3>
                {product.price && (
                  <p className="text-xs text-neutral-500 mt-1 font-medium">
                    ${Number(product.price).toFixed(2)} {product.currency}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-neutral-50">
                  {product.product_url && (
                    <a
                      href={product.product_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-neutral-500 hover:text-neutral-800 flex items-center gap-1 font-medium transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" /> View
                    </a>
                  )}
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="text-[11px] text-neutral-400 hover:text-red-500 flex items-center gap-1 ml-auto opacity-0 group-hover:opacity-100 transition-all font-medium"
                  >
                    <Trash2 className="w-3 h-3" /> Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
