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
} from 'lucide-react'

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

      {/* Manual Upload Form */}
      {showUpload && (
        <div className="bg-white border rounded-2xl p-6 space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Upload className="w-4 h-4" /> Manual Product Upload
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Product Name *</label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="e.g., Ceramic Watering Can"
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Price</label>
              <input
                type="number"
                value={form.price}
                onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                placeholder="49.99"
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Brief product description..."
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 resize-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Product URL</label>
              <input
                type="url"
                value={form.product_url}
                onChange={e => setForm(p => ({ ...p, product_url: e.target.value }))}
                placeholder="https://store.com/product/..."
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Product Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={e => setUploadFile(e.target.files?.[0] || null)}
                className="w-full text-sm file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border-0 file:bg-neutral-100 file:text-sm file:font-medium hover:file:bg-neutral-200"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleManualUpload}
              disabled={!form.title || uploading}
              className="bg-neutral-900 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-neutral-800 disabled:opacity-50 flex items-center gap-2"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {uploading ? 'Adding...' : 'Add Product'}
            </button>
            <button
              onClick={() => setShowUpload(false)}
              className="px-5 py-2 rounded-xl text-sm border border-neutral-200 hover:bg-neutral-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Product Grid */}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(product => (
            <div key={product.id} className="bg-white border rounded-2xl overflow-hidden group hover:shadow-sm transition-shadow">
              {/* Image */}
              <div className="aspect-square bg-neutral-100 relative">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag className="w-12 h-12 text-neutral-300" />
                  </div>
                )}
                <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-xs px-2 py-1 rounded-full font-medium capitalize">
                  {product.source}
                </span>
              </div>
              {/* Info */}
              <div className="p-4">
                <h3 className="font-medium truncate">{product.title}</h3>
                {product.price && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    ${product.price.toFixed(2)} {product.currency}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-3">
                  {product.product_url && (
                    <a
                      href={product.product_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" /> View
                    </a>
                  )}
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
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
