import { useState, useEffect } from 'react'
import { Plus, Trash2, X, Sparkles, ClipboardList, Clock, Check, Package } from 'lucide-react'

export default function IncomingOrders() {
  const [orders, setOrders] = useState([])
  const [supplements, setSupplements] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchOrders()
    fetchSupplements()
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/orders')
      if (res.ok) setOrders(await res.json())
    } catch (err) {
      console.error('Failed to fetch orders:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchSupplements = async () => {
    try {
      const res = await fetch('/api/supplements')
      if (res.ok) setSupplements(await res.json())
    } catch (err) {
      console.error('Failed to fetch supplements:', err)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this order?')) return
    try {
      await fetch(`/api/orders/${id}`, { method: 'DELETE' })
      fetchOrders()
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  const handleStatusChange = async (id, newStatus) => {
    try {
      await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      fetchOrders()
    } catch (err) {
      console.error('Status update failed:', err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-chocolate-950">Order Management</h1>
        <p className="text-chocolate-600 mt-1">Welcome back, Chocolatier. Here is the status of your factory.</p>
      </div>

      {/* Purchase Orders Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-chocolate-950">Purchase Orders</h2>
            <p className="text-sm text-chocolate-500">Track shipments arriving at the factory</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 bg-fuchsia-700 hover:bg-fuchsia-800 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors">
              <Sparkles className="w-4 h-4" />
              Scan PO (AI)
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Manual Entry
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg border border-chocolate-200 shadow-chocolate">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 rounded-full border-4 border-chocolate-200 border-t-rose-500 animate-spin"></div>
            </div>
          ) : orders.length === 0 ? (
            /* Empty State */
            <div className="py-20">
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-chocolate-200 rounded-lg mx-6 my-4 py-16">
                <div className="w-12 h-12 bg-chocolate-100 rounded-full flex items-center justify-center mb-3">
                  <ClipboardList className="w-6 h-6 text-chocolate-400" />
                </div>
                <p className="text-chocolate-500 text-sm">No pending orders found.</p>
              </div>
            </div>
          ) : (
            /* Orders List */
            <div className="divide-y divide-chocolate-100">
              {orders.map((order) => (
                <div key={order.id} className="p-5 hover:bg-chocolate-50/50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-chocolate-100 rounded-lg flex items-center justify-center">
                        <Package className="w-4 h-4 text-chocolate-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-chocolate-950 text-sm">
                          Order #{order.id?.slice(0, 8)}
                        </h3>
                        {order.supplier_name && (
                          <p className="text-xs text-chocolate-500">{order.supplier_name}</p>
                        )}
                      </div>
                      <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                        order.status === 'pending'
                          ? 'bg-amber-100 text-amber-700'
                          : order.status === 'received'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-chocolate-100 text-chocolate-700'
                      }`}>
                        {order.status === 'pending' && <Clock className="w-3 h-3 inline mr-1" />}
                        {order.status === 'received' && <Check className="w-3 h-3 inline mr-1" />}
                        {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleStatusChange(order.id, order.status === 'pending' ? 'received' : 'pending')}
                        className="text-xs font-medium px-3 py-1.5 bg-chocolate-100 hover:bg-chocolate-200 text-chocolate-800 rounded-lg transition-colors"
                      >
                        {order.status === 'pending' ? 'Mark Received' : 'Reopen'}
                      </button>
                      <button
                        onClick={() => handleDelete(order.id)}
                        className="p-1.5 text-chocolate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Order items */}
                  {order.items && order.items.length > 0 && (
                    <div className="ml-12 space-y-1.5">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-xs bg-chocolate-50 rounded-lg px-3 py-2">
                          <div>
                            <span className="font-medium text-chocolate-800">{item.supplement_name || 'Unknown'}</span>
                            <span className="text-chocolate-500 ml-2">{item.quantity_kg?.toFixed(3)} kg @ ${item.unit_price?.toFixed(2)}/kg</span>
                          </div>
                          <span className="font-semibold text-chocolate-900">${(item.quantity_kg * item.unit_price).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {order.expected_date && (
                    <p className="text-xs text-chocolate-500 ml-12 mt-2">
                      Expected: {new Date(order.expected_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Manual Entry Modal */}
      {showModal && (
        <ManualEntryModal
          supplements={supplements}
          onClose={() => setShowModal(false)}
          onCreated={() => { setShowModal(false); fetchOrders() }}
        />
      )}
    </div>
  )
}

function ManualEntryModal({ supplements, onClose, onCreated }) {
  const [supplier, setSupplier] = useState('')
  const [expectedDate, setExpectedDate] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState([{ supplement_id: '', quantity_kg: '', unit_price: '' }])
  const [saving, setSaving] = useState(false)

  const addItem = () => setItems([...items, { supplement_id: '', quantity_kg: '', unit_price: '' }])
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i))

  const updateItem = (i, field, value) => {
    const next = [...items]
    next[i][field] = value
    setItems(next)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier_id: null,
          supplier_name: supplier,
          expected_date: expectedDate || null,
          notes,
          items: items.filter(it => it.supplement_id).map(it => ({
            supplement_id: it.supplement_id,
            quantity_kg: parseFloat(it.quantity_kg) || 0,
            unit_price: parseFloat(it.unit_price) || 0,
          })),
        }),
      })
      if (res.ok) onCreated()
    } catch (err) {
      console.error('Create order failed:', err)
    } finally {
      setSaving(false)
    }
  }

  const total = items.reduce((sum, it) => sum + (parseFloat(it.quantity_kg) || 0) * (parseFloat(it.unit_price) || 0), 0)

  return (
    <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50 animate-fadeIn" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl mx-4 max-h-[90vh] overflow-y-auto animate-slideUp" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-chocolate-100">
          <h2 className="text-xl font-bold text-chocolate-950">Create Purchase Order</h2>
          <button onClick={onClose} className="p-1 hover:bg-chocolate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-chocolate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-chocolate-700 uppercase tracking-wider mb-1.5">Supplier *</label>
              <input
                type="text"
                value={supplier}
                onChange={e => setSupplier(e.target.value)}
                required
                placeholder="Supplier name"
                className="w-full px-3 py-2.5 border border-chocolate-200 rounded-lg text-sm focus:outline-none focus:border-chocolate-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-chocolate-700 uppercase tracking-wider mb-1.5">Expected Delivery</label>
              <input
                type="date"
                value={expectedDate}
                onChange={e => setExpectedDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-chocolate-200 rounded-lg text-sm focus:outline-none focus:border-chocolate-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-chocolate-700 uppercase tracking-wider mb-1.5">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Additional notes..."
              rows="2"
              className="w-full px-3 py-2.5 border border-chocolate-200 rounded-lg text-sm focus:outline-none focus:border-chocolate-400 resize-none"
            />
          </div>

          <div className="border-t border-chocolate-100 pt-4">
            <label className="block text-xs font-bold text-chocolate-700 uppercase tracking-wider mb-3">Line Items</label>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <select
                    value={item.supplement_id}
                    onChange={e => updateItem(i, 'supplement_id', e.target.value)}
                    className="flex-1 px-3 py-2 border border-chocolate-200 rounded-lg text-sm focus:outline-none focus:border-chocolate-400"
                  >
                    <option value="">Select supplement</option>
                    {supplements.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={item.quantity_kg}
                    onChange={e => updateItem(i, 'quantity_kg', e.target.value)}
                    placeholder="Qty (kg)"
                    className="w-24 px-3 py-2 border border-chocolate-200 rounded-lg text-sm focus:outline-none focus:border-chocolate-400"
                  />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.unit_price}
                    onChange={e => updateItem(i, 'unit_price', e.target.value)}
                    placeholder="$/kg"
                    className="w-24 px-3 py-2 border border-chocolate-200 rounded-lg text-sm focus:outline-none focus:border-chocolate-400"
                  />
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(i)} className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={addItem} className="text-sm font-medium text-rose-600 hover:text-rose-700 mt-2">
              + Add Item
            </button>
          </div>

          {total > 0 && (
            <div className="text-right text-sm text-chocolate-700">
              Order Total: <span className="font-bold text-chocolate-950">${total.toFixed(2)}</span>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-medium text-chocolate-700 bg-chocolate-100 hover:bg-chocolate-200 rounded-lg transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-rose-500 hover:bg-rose-600 disabled:opacity-50 rounded-lg transition-colors">
              {saving ? 'Creating...' : 'Create Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
