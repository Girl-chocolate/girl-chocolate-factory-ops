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

  const isLowStock = (s) => s.on_hand_kg < (s.low_stock_threshold || 0.5)

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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-chocolate-950">Inventory Dashboard</h1>
        <p className="text-chocolate-600 mt-1">Welcome back, Chocolatier. Here is the status of your factory.</p>
      </div>

      {/* Stat Cards */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-chocolate-200 p-5 border-l-4 border-l-chocolate-700">
            <p className="text-[11px] font-bold tracking-wider text-chocolate-700 uppercase">Total Inventory Value</p>
            <p className="text-2xl font-bold text-chocolate-900 mt-1">${stats.inventory_value?.toFixed(2) || '0.00'}</p>
          </div>
          <div className="bg-white rounded-lg border border-chocolate-200 p-5 border-l-4 border-l-chocolate-700">
            <p className="text-[11px] font-bold tracking-wider text-chocolate-700 uppercase">Unique Ingredients</p>
            <p className="text-2xl font-bold text-chocolate-900 mt-1">{stats.unique_ingredients || 0}</p>
          </div>
          <div className="bg-white rounded-lg border border-chocolate-200 p-5 border-l-4 border-l-rose-500">
            <p className="text-[11px] font-bold tracking-wider text-chocolate-700 uppercase">Low Stock Alerts</p>
            <p className={`text-2xl font-bold mt-1 ${(stats.low_stock_alerts || 0) > 0 ? 'text-rose-500' : 'text-chocolate-900'}`}>
              {stats.low_stock_alerts || 0}
            </p>
          </div>
        </div>
      )}

      {/* Stock Levels Section */}
      <div className="bg-white rounded-lg border border-chocolate-200 shadow-chocolate">
        {/* Section Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-chocolate-100">
          <div>
            <h2 className="text-lg font-bold text-chocolate-950">Current Stock Levels</h2>
            <p className="text-sm text-chocolate-500">Real-time supplement inventory in the factory</p>
          </div>
          <button
            onClick={() => { setEditingSupplement(null); setShowAddModal(true) }}
            className="flex items-center gap-2 bg-chocolate-950 hover:bg-chocolate-900 text-white text-sm font-medium px-4 py-2 rounded-full transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add New Supplement
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-chocolate-100">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === supplements.length && supplements.length > 0}
                    onChange={toggleAll}
                    className="rounded border-chocolate-300"
                  />
                </th>
                <th className="text-left px-4 py-3 text-[11px] font-bold tracking-wider text-chocolate-600 uppercase">Supplement Name</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold tracking-wider text-chocolate-600 uppercase">Supplier</th>
                <th className="text-right px-4 py-3 text-[11px] font-bold tracking-wider text-chocolate-600 uppercase">Unit Price ($/kg)</th>
                <th className="text-right px-4 py-3 text-[11px] font-bold tracking-wider text-chocolate-600 uppercase">On Hand (kg)</th>
                <th className="text-right px-4 py-3 text-[11px] font-bold tracking-wider text-chocolate-600 uppercase">Incoming (kg)</th>
                <th className="text-right px-4 py-3 text-[11px] font-bold tracking-wider text-chocolate-600 uppercase">Total Value ($)</th>
                <th className="text-center px-4 py-3 text-[11px] font-bold tracking-wider text-chocolate-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {supplements.map((s) => (
                <tr key={s.id} className="border-b border-chocolate-50 hover:bg-chocolate-50/50 transition-colors">
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(s.id)}
                      onChange={() => toggleRow(s.id)}
                      className="rounded border-chocolate-300"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-semibold text-chocolate-950 text-sm">{s.name}</p>
                      <p className="text-xs text-chocolate-400 mt-0.5">ID: {s.id}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Mail className="w-3 h-3 text-chocolate-400" />
                        <ExternalLink className="w-3 h-3 text-chocolate-400" />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <p className="text-sm text-chocolate-800">{s.supplier_name || '—'}</p>
                      {s.supplier_name && (
                        <div className="flex items-center gap-2 mt-1">
                          <Mail className="w-3 h-3 text-chocolate-400" />
                          <ExternalLink className="w-3 h-3 text-chocolate-400" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right text-sm text-chocolate-800 font-medium">
                    ${s.unit_price?.toFixed(2) || '0.00'}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className={`text-sm font-bold ${isLowStock(s) ? 'text-rose-500' : 'text-chocolate-800'}`}>
                      {s.on_hand_kg?.toFixed(3) || '0.000'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right text-sm text-chocolate-600">
                    {s.incoming_kg > 0 ? s.incoming_kg.toFixed(3) : '–'}
                  </td>
                  <td className="px-4 py-4 text-right text-sm font-semibold text-chocolate-800">
                    ${(s.on_hand_kg * s.unit_price).toFixed(2)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => openDocuments(s)}
                        className="relative p-1.5 text-chocolate-500 hover:text-chocolate-800 hover:bg-chocolate-100 rounded transition-colors"
                        title="Documents"
                      >
                        <FileText className="w-4 h-4" />
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-500 rounded-full"></span>
                      </button>
                      <button
                        onClick={() => { setEditingSupplement(s); setShowAddModal(true) }}
                        className="relative p-1.5 text-chocolate-500 hover:text-chocolate-800 hover:bg-chocolate-100 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-500 rounded-full"></span>
                      </button>
                      <button
                        onClick={() => handleDeleteSupplement(s.id)}
                        className="p-1.5 text-chocolate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {supplements.length === 0 && (
          <div className="text-center py-16">
            <p className="text-chocolate-500">No supplements found. Add your first one!</p>
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
    <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50 animate-fadeIn" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 animate-slideUp" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-chocolate-100">
          <h2 className="text-xl font-bold text-chocolate-950">
            {supplement ? 'Edit Supplement' : 'Add New Supplement'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-chocolate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-chocolate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-chocolate-700 uppercase tracking-wider mb-1.5">
              Supplement Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Zinc Citrate"
              className="w-full px-3 py-2.5 border-2 border-rose-200 rounded-lg text-sm focus:outline-none focus:border-rose-400 bg-rose-50/30"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-chocolate-700 uppercase tracking-wider mb-1.5">
                Current Stock
              </label>
              <div className="flex">
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={stock}
                  onChange={e => setStock(e.target.value)}
                  className="flex-1 px-3 py-2.5 border border-chocolate-200 rounded-l-lg text-sm focus:outline-none focus:border-chocolate-400"
                />
                <select
                  value={unit}
                  onChange={e => setUnit(e.target.value)}
                  className="px-2 py-2.5 border border-l-0 border-chocolate-200 rounded-r-lg text-sm bg-chocolate-50 text-chocolate-700"
                >
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-chocolate-700 uppercase tracking-wider mb-1.5">
                Price Per KG ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={e => setPrice(e.target.value)}
                className="w-full px-3 py-2.5 border border-chocolate-200 rounded-lg text-sm focus:outline-none focus:border-chocolate-400"
              />
            </div>
          </div>

          {/* Supplier Details (collapsible) */}
          <div className="border border-chocolate-200 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setShowSupplier(!showSupplier)}
              className="flex items-center justify-between w-full px-4 py-3 bg-chocolate-50 text-sm font-semibold text-chocolate-800"
            >
              <span className="flex items-center gap-2">
                <span>🏭</span>
                Supplier Details (Optional)
              </span>
              {showSupplier ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showSupplier && (
              <div className="p-4 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-chocolate-600 uppercase tracking-wider mb-1">Company Name</label>
                  <input
                    type="text"
                    value={supplierName}
                    onChange={e => setSupplierName(e.target.value)}
                    placeholder="e.g. NutriChem Supply"
                    className="w-full px-3 py-2 border border-chocolate-200 rounded-lg text-sm focus:outline-none focus:border-chocolate-400"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-chocolate-600 uppercase tracking-wider mb-1">Email</label>
                    <input
                      type="email"
                      value={supplierEmail}
                      onChange={e => setSupplierEmail(e.target.value)}
                      placeholder="sales@company.com"
                      className="w-full px-3 py-2 border border-chocolate-200 rounded-lg text-sm focus:outline-none focus:border-chocolate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-chocolate-600 uppercase tracking-wider mb-1">Website</label>
                    <input
                      type="url"
                      value={supplierWebsite}
                      onChange={e => setSupplierWebsite(e.target.value)}
                      placeholder="company.com"
                      className="w-full px-3 py-2 border border-chocolate-200 rounded-lg text-sm focus:outline-none focus:border-chocolate-400"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-chocolate-700 bg-chocolate-100 hover:bg-chocolate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-rose-500 hover:bg-rose-600 disabled:opacity-50 rounded-lg transition-colors"
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
    <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50 animate-fadeIn" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 animate-slideUp" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-chocolate-100">
          <div>
            <h2 className="text-xl font-bold text-chocolate-950">Documents</h2>
            <p className="text-sm text-chocolate-500">For {supplement.name}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-chocolate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-chocolate-500" />
          </button>
        </div>

        <div className="p-6 space-y-3 max-h-80 overflow-y-auto">
          {documents.length === 0 ? (
            <p className="text-center text-chocolate-500 py-4 text-sm">No documents yet</p>
          ) : (
            documents.map(doc => (
              <div key={doc.id} className="flex items-center justify-between p-3 bg-chocolate-50 rounded-lg border border-chocolate-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-rose-100 rounded flex items-center justify-center">
                    <FileText className="w-4 h-4 text-rose-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-chocolate-900 flex items-center gap-1">
                      {doc.name}
                      <Edit2 className="w-3 h-3 text-chocolate-400" />
                    </p>
                    <p className="text-xs text-chocolate-500">{new Date(doc.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {doc.link_url && (
                    <a href={doc.link_url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-chocolate-500 hover:text-chocolate-800 hover:bg-chocolate-100 rounded transition-colors">
                      <Eye className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    onClick={() => onDeleteDoc(doc.id)}
                    className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add document section */}
        <div className="px-6 pb-6 border-t border-chocolate-100 pt-4">
          <div className="flex items-center gap-4 mb-3">
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex items-center gap-1.5 text-sm font-medium ${activeTab === 'upload' ? 'text-rose-600' : 'text-chocolate-500'}`}
            >
              <Upload className="w-3.5 h-3.5" />
              Upload File
            </button>
            <button
              onClick={() => setActiveTab('link')}
              className={`flex items-center gap-1.5 text-sm font-medium ${activeTab === 'link' ? 'text-rose-600' : 'text-chocolate-500'}`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              Add Link
            </button>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-chocolate-600 uppercase tracking-wider mb-1">Document Name (Optional)</label>
                <input
                  type="text"
                  value={docName}
                  onChange={e => setDocName(e.target.value)}
                  placeholder="e.g. COA - Batch 102"
                  className="w-full px-3 py-2 border border-chocolate-200 rounded-lg text-sm focus:outline-none focus:border-chocolate-400"
                />
              </div>
              {activeTab === 'link' ? (
                <div>
                  <label className="block text-xs font-bold text-chocolate-600 uppercase tracking-wider mb-1">URL</label>
                  <input
                    type="url"
                    value={docLink}
                    onChange={e => setDocLink(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border border-chocolate-200 rounded-lg text-sm focus:outline-none focus:border-chocolate-400"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-chocolate-600 uppercase tracking-wider mb-1">File</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="px-3 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-medium rounded-lg transition-colors"
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
              className="w-full mt-2 px-4 py-2 bg-chocolate-950 hover:bg-chocolate-900 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {uploading ? 'Adding...' : 'Add Document'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
