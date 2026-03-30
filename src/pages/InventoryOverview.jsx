import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit2, Trash2, FileText, Eye, Mail, ExternalLink, X, Upload, Link as LinkIcon, ChevronDown, ChevronUp } from 'lucide-react'

export default function InventoryOverview() {
  const [supplements, setSupplements] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingSupplement, setEditingSupplement] = useState(null)
  const [documentsModal, setDocumentsModal] = useState(null) // supplement object or null
  const [documents, setDocuments] = useState([])
  const [selectedRows, setSelectedRows] = useState(new Set())

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true)
      const [supRes, statsRes] = await Promise.all([
        fetch('/api/supplements'),
        fetch('/api/stats')
      ])
      if (supRes.ok) setSupplements(await supRes.json())
      if (statsRes.ok) setStats(await statsRes.json())
    } catch (err) {
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const fetchDocuments = async (supplementId) => {
    try {
      const res = await fetch(`/api/documents?supplement_id=${supplementId}`)
      if (res.ok) setDocuments(await res.json())
    } catch (err) {
      console.error('Failed to fetch documents:', err)
    }
  }

  const handleDeleteSupplement = async (id) => {
    if (!window.confirm('Are you sure you want to delete this supplement?')) return
    try {
      await fetch(`/api/supplements/${id}`, { method: 'DELETE' })
      fetchAll()
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm('Delete this document?')) return
    try {
      await fetch(`/api/documents/${docId}`, { method: 'DELETE' })
      if (documentsModal) fetchDocuments(documentsModal.id)
    } catch (err) {
      console.error('Delete doc failed:', err)
    }
  }

  const openDocuments = (supplement) => {
    setDocumentsModal(supplement)
    fetchDocuments(supplement.id)
  }

  const toggleRow = (id) => {
    const next = new Set(selectedRows)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedRows(next)
  }

  const toggleAll = () => {
    if (selectedRows.size === supplements.length) setSelectedRows(new Set())
    else setSelectedRows(new Set(supplements.map(s => s.id)))
  }

  const getStockStatus = (s) => {
    const threshold = s.low_stock_threshold || 0.5
    if (s.on_hand_kg < threshold * 0.5) return { status: 'Critical', color: 'text-red-600', bgColor: 'bg-red-50', dotColor: 'bg-red-500' }
    if (s.on_hand_kg < threshold) return { status: 'Low Stock', color: 'text-amber-600', bgColor: 'bg-amber-50', dotColor: 'bg-amber-500' }
    return { status: 'In Stock', color: 'text-green-600', bgColor: 'bg-green-50', dotColor: 'bg-green-500' }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-4 border-chocolate-200 border-t-rose-500 animate-spin mx-auto mb-3"></div>
          <p className="text-chocolate-600 text-sm">Loading inventory...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fadeIn space-y-6 p-6">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-start gap-3">
          <span className="text-4xl">🍫</span>
          <div>
            <h1 className="text-4xl font-bold text-chocolate-950">Inventory Dashboard</h1>
            <p className="text-chocolate-600 mt-2 text-lg">Welcome back, Chocolatier. Here is the status of your factory.</p>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Inventory Value */}
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-50 to-orange-50 p-6 backdrop-blur-md border border-rose-100/50 hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-rose-200/10 to-orange-200/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold tracking-widest text-rose-700 uppercase">Total Inventory Value</p>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-orange-400 flex items-center justify-center">
                  <span className="text-lg">💰</span>
                </div>
              </div>
              <p className="text-3xl font-bold text-rose-900">${stats.inventory_value?.toFixed(2) || '0.00'}</p>
            </div>
          </div>

          {/* Unique Ingredients */}
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 p-6 backdrop-blur-md border border-emerald-100/50 hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-200/10 to-teal-200/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold tracking-widest text-emerald-700 uppercase">Unique Ingredients</p>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center">
                  <span className="text-lg">🏭</span>
                </div>
              </div>
              <p className="text-3xl font-bold text-emerald-900">{stats.unique_ingredients || 0}</p>
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-50 to-pink-50 p-6 backdrop-blur-md border border-red-100/50 hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-red-200/10 to-pink-200/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold tracking-widest text-red-700 uppercase">Low Stock Alerts</p>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-400 to-pink-400 flex items-center justify-center">
                  <span className="text-lg">⚠️</span>
                </div>
              </div>
              <p className={`text-3xl font-bold ${(stats.low_stock_alerts || 0) > 0 ? 'text-red-900' : 'text-red-900'}`}>
                {stats.low_stock_alerts || 0}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stock Levels Section */}
      <div className="rounded-2xl overflow-hidden bg-white/80 backdrop-blur-sm border border-chocolate-100/50 shadow-lg">
        {/* Section Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-chocolate-100/50">
          <div>
            <h2 className="text-2xl font-bold text-chocolate-950">Current Stock Levels</h2>
            <p className="text-sm text-chocolate-500 mt-1">Real-time supplement inventory in the factory</p>
          </div>
          <button
            onClick={() => { setEditingSupplement(null); setShowAddModal(true) }}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-rose-500 hover:shadow-lg hover:shadow-rose-300/50 active:scale-95 text-white text-sm font-semibold px-6 py-3 rounded-full transition-all duration-300"
          >
            <Plus className="w-5 h-5" />
            Add New Supplement
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-chocolate-50/50 border-b border-chocolate-100/50">
                <th className="w-10 px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === supplements.length && supplements.length > 0}
                    onChange={toggleAll}
                    className="rounded border-chocolate-300 cursor-pointer transition-colors duration-300"
                  />
                </th>
                <th className="text-left px-6 py-4 text-xs font-bold tracking-widest text-chocolate-600 uppercase">Supplement Name</th>
                <th className="text-left px-6 py-4 text-xs font-bold tracking-widest text-chocolate-600 uppercase">Supplier</th>
                <th className="text-right px-6 py-4 text-xs font-bold tracking-widest text-chocolate-600 uppercase">Unit Price ($/kg)</th>
                <th className="text-right px-6 py-4 text-xs font-bold tracking-widest text-chocolate-600 uppercase">On Hand (kg)</th>
                <th className="text-right px-6 py-4 text-xs font-bold tracking-widest text-chocolate-600 uppercase">Incoming (kg)</th>
                <th className="text-right px-6 py-4 text-xs font-bold tracking-widest text-chocolate-600 uppercase">Total Value ($)</th>
                <th className="text-center px-6 py-4 text-xs font-bold tracking-widest text-chocolate-600 uppercase">Status</th>
                <th className="text-center px-6 py-4 text-xs font-bold tracking-widest text-chocolate-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {supplements.map((s, idx) => {
                const statusInfo = getStockStatus(s)
                return (
                  <tr key={s.id} className={`border-b border-chocolate-50/50 transition-colors duration-300 ${idx % 2 === 0 ? 'bg-white/50' : 'bg-chocolate-50/20'} hover:bg-rose-50/30`}>
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(s.id)}
                        onChange={() => toggleRow(s.id)}
                        className="rounded border-chocolate-300 cursor-pointer transition-colors duration-300"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-chocolate-950 text-sm">{s.name}</p>
                        <p className="text-xs text-chocolate-400 mt-0.5">ID: {s.id}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm text-chocolate-800 font-medium">{s.supplier_name || '—'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-chocolate-800 font-semibold">
                      ${s.unit_price?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-sm font-bold ${statusInfo.color}`}>
                        {s.on_hand_kg?.toFixed(3) || '0.000'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-chocolate-600 font-medium">
                      {s.incoming_kg > 0 ? s.incoming_kg.toFixed(3) : '–'}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-chocolate-900">
                      ${(s.on_hand_kg * s.unit_price).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className={`w-2 h-2 rounded-full animate-pulse ${statusInfo.dotColor}`}></div>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusInfo.bgColor} ${statusInfo.color}`}>
                          {statusInfo.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openDocuments(s)}
                          className="p-2 text-chocolate-500 hover:text-chocolate-800 hover:scale-110 bg-chocolate-50 hover:bg-chocolate-100 rounded-lg transition-all duration-300"
                          title="Documents"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setEditingSupplement(s); setShowAddModal(true) }}
                          className="p-2 text-chocolate-500 hover:text-amber-600 hover:scale-110 bg-chocolate-50 hover:bg-amber-50 rounded-lg transition-all duration-300"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSupplement(s.id)}
                          className="p-2 text-chocolate-400 hover:text-rose-600 hover:scale-110 bg-chocolate-50 hover:bg-rose-50 rounded-lg transition-all duration-300"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {supplements.length === 0 && (
          <div className="text-center py-16">
            <p className="text-chocolate-500 text-lg">No supplements found. Add your first one!</p>
          </div>
        )}
      </div>

      {/* Add/Edit Supplement Modal */}
      {showAddModal && (
        <AddSupplementModal
          supplement={editingSupplement}
          onClose={() => { setShowAddModal(false); setEditingSupplement(null) }}
          onSaved={() => { setShowAddModal(false); setEditingSupplement(null); fetchAll() }}
        />
      )}

      {/* Documents Modal */}
      {documentsModal && (
        <DocumentsModal
          supplement={documentsModal}
          documents={documents}
          onClose={() => { setDocumentsModal(null); setDocuments([]) }}
          onDeleteDoc={handleDeleteDocument}
          onDocAdded={() => fetchDocuments(documentsModal.id)}
        />
      )}
    </div>
  )
}

function AddSupplementModal({ supplement, onClose, onSaved }) {
  const [name, setName] = useState(supplement?.name || '')
  const [stock, setStock] = useState(supplement?.on_hand_kg?.toString() || '')
  const [unit, setUnit] = useState('kg')
  const [price, setPrice] = useState(supplement?.unit_price?.toString() || '')
  const [showSupplier, setShowSupplier] = useState(!!supplement?.supplier_name)
  const [supplierName, setSupplierName] = useState(supplement?.supplier_name || '')
  const [supplierEmail, setSupplierEmail] = useState('')
  const [supplierWebsite, setSupplierWebsite] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return

    setSaving(true)
    try {
      const stockKg = unit === 'g' ? (parseFloat(stock) || 0) / 1000 : (parseFloat(stock) || 0)

      const payload = {
        name: name.trim(),
        unit_price: parseFloat(price) || 0,
        on_hand_kg: stockKg,
        low_stock_threshold: 0.5,
        supplier_name: supplierName.trim() || null,
        supplier_email: supplierEmail.trim() || null,
        supplier_website: supplierWebsite.trim() || null,
      }

      const url = supplement ? `/api/supplements/${supplement.id}` : '/api/supplements'
      const method = supplement ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) onSaved()
    } catch (err) {
      console.error('Save failed:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn bg-black/20" onClick={onClose}>
      <div className="bg-white/95 rounded-2xl shadow-2xl w-full max-w-lg mx-4 animate-slideUp overflow-hidden border border-white/20" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-8 py-6 border-b border-chocolate-100/50 bg-gradient-to-r from-rose-50/50 to-orange-50/50">
          <h2 className="text-2xl font-bold text-chocolate-950">
            {supplement ? 'Edit Supplement' : 'Add New Supplement'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-chocolate-200/50 rounded-lg transition-all duration-300 hover:scale-110">
            <X className="w-5 h-5 text-chocolate-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="block text-xs font-bold text-chocolate-700 uppercase tracking-widest mb-2">
              Supplement Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Zinc Citrate"
              className="w-full px-4 py-3 border-2 border-rose-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent bg-white transition-all duration-300"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-chocolate-700 uppercase tracking-widest mb-2">
                Current Stock
              </label>
              <div className="flex overflow-hidden rounded-xl border-2 border-chocolate-200 hover:border-chocolate-300 transition-colors duration-300">
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={stock}
                  onChange={e => setStock(e.target.value)}
                  className="flex-1 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-inset bg-white"
                />
                <select
                  value={unit}
                  onChange={e => setUnit(e.target.value)}
                  className="px-3 py-3 border-l-2 border-chocolate-200 text-sm bg-chocolate-50 text-chocolate-700 font-medium cursor-pointer hover:bg-chocolate-100 transition-colors duration-300"
                >
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-chocolate-700 uppercase tracking-widest mb-2">
                Price Per KG ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={e => setPrice(e.target.value)}
                className="w-full px-4 py-3 border-2 border-chocolate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent bg-white transition-all duration-300"
              />
            </div>
          </div>

          {/* Supplier Details (collapsible) */}
          <div className="rounded-xl overflow-hidden border-2 border-chocolate-200 hover:border-chocolate-300 transition-colors duration-300">
            <button
              type="button"
              onClick={() => setShowSupplier(!showSupplier)}
              className="flex items-center justify-between w-full px-6 py-4 bg-chocolate-50/80 hover:bg-chocolate-100/50 text-sm font-bold text-chocolate-800 transition-colors duration-300"
            >
              <span className="flex items-center gap-3">
                <span className="text-lg">🏭</span>
                Supplier Details (Optional)
              </span>
              {showSupplier ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            {showSupplier && (
              <div className="p-6 space-y-4 bg-white border-t-2 border-chocolate-200/50">
                <div>
                  <label className="block text-xs font-bold text-chocolate-600 uppercase tracking-widest mb-2">Company Name</label>
                  <input
                    type="text"
                    value={supplierName}
                    onChange={e => setSupplierName(e.target.value)}
                    placeholder="e.g. NutriChem Supply"
                    className="w-full px-4 py-2.5 border-2 border-chocolate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent bg-white transition-all duration-300"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-chocolate-600 uppercase tracking-widest mb-2">Email</label>
                    <input
                      type="email"
                      value={supplierEmail}
                      onChange={e => setSupplierEmail(e.target.value)}
                      placeholder="sales@company.com"
                      className="w-full px-4 py-2.5 border-2 border-chocolate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent bg-white transition-all duration-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-chocolate-600 uppercase tracking-widest mb-2">Website</label>
                    <input
                      type="url"
                      value={supplierWebsite}
                      onChange={e => setSupplierWebsite(e.target.value)}
                      placeholder="company.com"
                      className="w-full px-4 py-2.5 border-2 border-chocolate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent bg-white transition-all duration-300"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-sm font-bold text-chocolate-700 bg-chocolate-100 hover:bg-chocolate-200 rounded-xl transition-all duration-300 hover:shadow-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-3 text-sm font-bold text-white bg-gradient-to-r from-rose-500 to-orange-500 hover:shadow-lg hover:shadow-rose-300/50 disabled:opacity-50 disabled:shadow-none rounded-xl transition-all duration-300 active:scale-95"
            >
              {saving ? 'Saving...' : supplement ? 'Update Item' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function DocumentsModal({ supplement, documents, onClose, onDeleteDoc, onDocAdded }) {
  const [docName, setDocName] = useState('')
  const [docLink, setDocLink] = useState('')
  const [uploading, setUploading] = useState(false)
  const [activeTab, setActiveTab] = useState('upload') // 'upload' or 'link'

  const handleAddDocument = async () => {
    if (!docName.trim() && !docLink.trim()) return

    setUploading(true)
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplement_id: supplement.id,
          name: docName.trim() || 'Untitled',
          link_url: docLink.trim() || null,
          doc_type: activeTab === 'link' ? 'link' : 'file',
        })
      })
      if (res.ok) {
        setDocName('')
        setDocLink('')
        onDocAdded()
      }
    } catch (err) {
      console.error('Add doc failed:', err)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn bg-black/20" onClick={onClose}>
      <div className="bg-white/95 rounded-2xl shadow-2xl w-full max-w-lg mx-4 animate-slideUp overflow-hidden border border-white/20" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-8 py-6 border-b border-chocolate-100/50 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
          <div>
            <h2 className="text-2xl font-bold text-chocolate-950">Documents</h2>
            <p className="text-sm text-chocolate-500 mt-1">For <span className="font-semibold text-chocolate-700">{supplement.name}</span></p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-chocolate-200/50 rounded-lg transition-all duration-300 hover:scale-110">
            <X className="w-5 h-5 text-chocolate-600" />
          </button>
        </div>

        <div className="p-6 space-y-3 max-h-80 overflow-y-auto">
          {documents.length === 0 ? (
            <p className="text-center text-chocolate-500 py-8 text-sm">No documents yet. Add one below to get started!</p>
          ) : (
            documents.map(doc => (
              <div key={doc.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-chocolate-50/50 to-orange-50/30 rounded-xl border border-chocolate-100/50 hover:bg-orange-50/50 transition-all duration-300 hover:shadow-md">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-rose-200 to-orange-200 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-rose-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-chocolate-900">{doc.name}</p>
                    <p className="text-xs text-chocolate-500 mt-1">{new Date(doc.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {doc.link_url && (
                    <a href={doc.link_url} target="_blank" rel="noopener noreferrer" className="p-2 text-chocolate-600 hover:text-blue-600 hover:scale-110 bg-chocolate-50 hover:bg-blue-50 rounded-lg transition-all duration-300">
                      <Eye className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    onClick={() => onDeleteDoc(doc.id)}
                    className="p-2 text-rose-500 hover:text-rose-700 hover:scale-110 bg-rose-50 hover:bg-rose-100 rounded-lg transition-all duration-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add document section */}
        <div className="px-8 pb-8 border-t border-chocolate-100/50 pt-6">
          <div className="flex items-center gap-4 mb-6 p-1 bg-chocolate-50/50 rounded-lg">
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${activeTab === 'upload' ? 'bg-white text-rose-600 shadow-md' : 'text-chocolate-500 hover:text-chocolate-700'}`}
            >
              <Upload className="w-4 h-4" />
              Upload File
            </button>
            <button
              onClick={() => setActiveTab('link')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${activeTab === 'link' ? 'bg-white text-rose-600 shadow-md' : 'text-chocolate-500 hover:text-chocolate-700'}`}
            >
              <LinkIcon className="w-4 h-4" />
              Add Link
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-chocolate-700 uppercase tracking-widest mb-2">Document Name (Optional)</label>
                <input
                  type="text"
                  value={docName}
                  onChange={e => setDocName(e.target.value)}
                  placeholder="e.g. COA - Batch 102"
                  className="w-full px-4 py-2.5 border-2 border-chocolate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent bg-white transition-all duration-300"
                />
              </div>
              {activeTab === 'link' ? (
                <div>
                  <label className="block text-xs font-bold text-chocolate-700 uppercase tracking-widest mb-2">URL</label>
                  <input
                    type="url"
                    value={docLink}
                    onChange={e => setDocLink(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-2.5 border-2 border-chocolate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent bg-white transition-all duration-300"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-chocolate-700 uppercase tracking-widest mb-2">File</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="px-4 py-2.5 bg-gradient-to-r from-rose-500 to-orange-500 hover:shadow-md hover:shadow-rose-300/50 text-white text-xs font-bold rounded-lg transition-all duration-300 active:scale-95"
                    >
                      Choose File
                    </button>
                    <span className="text-xs text-chocolate-500">No file chosen</span>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={handleAddDocument}
              disabled={uploading}
              className="w-full px-6 py-3 bg-gradient-to-r from-chocolate-950 to-rose-950 hover:shadow-lg hover:shadow-chocolate-900/50 text-white text-sm font-bold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:shadow-none active:scale-95"
            >
              {uploading ? 'Adding...' : 'Add Document'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
