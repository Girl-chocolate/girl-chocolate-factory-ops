import { useState, useEffect } from 'react'
import { Plus, Trash2, X, Sparkles, ClipboardList, Clock, Check, Package } from 'lucide-react'

export default function IncomingOrders() {
  const [orders, setOrders] = useState([])
  const [supplements, setSupplements] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')

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

  const filteredOrders = statusFilter === 'all'
    ? orders
    : orders.filter(order => order.status === statusFilter)

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'amber'
      case 'received': return 'green'
      case 'in-transit': return 'blue'
      default: return 'gray'
    }
  }

  const getStatusAccentBorder = (status) => {
    switch(status) {
      case 'pending': return 'border-l-4 border-l-amber-400'
      case 'received': return 'border-l-4 border-l-green-400'
      case 'in-transit': return 'border-l-4 border-l-blue-400'
      default: return 'border-l-4 border-l-gray-400'
    }
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Premium Header Section */}
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-chocolate-950 to-chocolate-700 bg-clip-text text-transparent">
            Order Management
          </h1>
          <p className="text-chocolate-600 mt-2 text-base">Track and manage your incoming purchase orders with precision</p>
        </div>

        {/* Premium Action Buttons */}
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 group">
            <Sparkles className="w-5 h-5 group-hover:animate-spin" />
            Scan PO (AI)
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2.5 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            Manual Entry
          </button>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-chocolate-200 pb-4">
        {[
          { label: 'All', value: 'all' },
          { label: 'Pending', value: 'pending' },
          { label: 'In Transit', value: 'in-transit' },
          { label: 'Received', value: 'received' }
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-4 py-2.5 font-medium text-sm transition-all duration-300 relative group ${
              statusFilter === tab.value
                ? 'text-chocolate-950'
                : 'text-chocolate-500 hover:text-chocolate-700'
            }`}
          >
            {tab.label}
            {statusFilter === tab.value && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-amber-500 rounded-full"></div>
            )}
          </button>
        ))}
      </div>

      {/* Orders Section */}
      <div>
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 rounded-full border-4 border-chocolate-200 border-t-rose-500 animate-spin mx-auto"></div>
              <p className="text-chocolate-600 font-medium">Loading orders...</p>
            </div>
          </div>
        ) : filteredOrders.length === 0 ? (
          /* Premium Empty State */
          <div className="flex items-center justify-center py-32">
            <div className="text-center space-y-6 w-full max-w-md">
              <div className="flex justify-center">
                <div className="w-24 h-24 bg-gradient-to-br from-chocolate-50 to-chocolate-100 rounded-3xl flex items-center justify-center border-2 border-dashed border-chocolate-200">
                  <ClipboardList className="w-12 h-12 text-chocolate-400" />
                </div>
              </div>
              <div>
                <p className="text-xl font-semibold text-chocolate-950">No pending orders yet</p>
                <p className="text-chocolate-600 mt-2 text-sm">Create your first purchase order to get started</p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <Plus className="w-4 h-4" />
                Create Order
              </button>
            </div>
          </div>
        ) : (
          /* Premium Orders Grid */
          <div className="grid grid-cols-1 gap-4">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className={`${getStatusAccentBorder(order.status)} bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-all duration-300 group`}
              >
                {/* Header Section */}
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-chocolate-100 to-chocolate-50 rounded-xl flex items-center justify-center group-hover:from-chocolate-200 transition-colors duration-300">
                      <Package className="w-6 h-6 text-chocolate-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold text-lg text-chocolate-950">
                          Order #{order.id?.slice(0, 8)}
                        </h3>
                        <StatusBadge status={order.status} />
                      </div>
                      {order.supplier_name && (
                        <p className="text-chocolate-600 font-medium text-sm">{order.supplier_name}</p>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                      onClick={() => handleStatusChange(order.id, order.status === 'pending' ? 'received' : 'pending')}
                      className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-300 ${
                        order.status === 'pending'
                          ? 'bg-green-50 text-green-700 hover:bg-green-100'
                          : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                      }`}
                    >
                      {order.status === 'pending' ? 'Mark Received' : 'Reopen'}
                    </button>
                    <button
                      onClick={() => handleDelete(order.id)}
                      className="p-2 text-chocolate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all duration-300"
                      title="Delete order"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expected Date */}
                {order.expected_date && (
                  <p className="text-xs text-chocolate-500 mb-4 font-medium">
                    Expected: {new Date(order.expected_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                )}

                {/* Line Items Table */}
                {order.items && order.items.length > 0 && (
                  <div className="space-y-2 pt-4 border-t border-chocolate-100">
                    <div className="text-xs font-semibold text-chocolate-600 uppercase tracking-wider mb-3">Order Items</div>
                    {order.items.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="flex items-center justify-between bg-gradient-to-r from-chocolate-50 to-transparent rounded-lg px-4 py-3 hover:from-chocolate-100 transition-colors duration-300"
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-chocolate-950 text-sm mb-1">
                            {item.supplement_name || 'Unknown Item'}
                          </p>
                          <p className="text-xs text-chocolate-600">
                            {item.quantity_kg?.toFixed(3)} kg at ${item.unit_price?.toFixed(2)}/kg
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-chocolate-950">
                            ${(item.quantity_kg * item.unit_price).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
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

function StatusBadge({ status }) {
  const statusConfig = {
    pending: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
    received: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
    'in-transit': { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' }
  }

  const config = statusConfig[status] || statusConfig.pending

  return (
    <span className={`inline-flex items-center gap-2 ${config.bg} ${config.text} text-xs font-bold px-3 py-1 rounded-full`}>
      <span className={`w-2 h-2 rounded-full ${config.dot} ${status === 'pending' ? 'animate-pulse' : ''}`}></span>
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
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
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slideUp"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-chocolate-100 bg-gradient-to-r from-chocolate-50 to-transparent">
          <div>
            <h2 className="text-2xl font-bold text-chocolate-950">Create Purchase Order</h2>
            <p className="text-sm text-chocolate-600 mt-1">Add new incoming supplies to your inventory</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-chocolate-100 rounded-lg transition-colors duration-300"
          >
            <X className="w-6 h-6 text-chocolate-500" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Supplier & Date Row */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-chocolate-950 mb-2">Supplier Name *</label>
              <input
                type="text"
                value={supplier}
                onChange={e => setSupplier(e.target.value)}
                required
                placeholder="Enter supplier name"
                className="w-full px-4 py-3 border border-chocolate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all duration-300"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-chocolate-950 mb-2">Expected Delivery</label>
              <input
                type="date"
                value={expectedDate}
                onChange={e => setExpectedDate(e.target.value)}
                className="w-full px-4 py-3 border border-chocolate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all duration-300"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-bold text-chocolate-950 mb-2">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add any additional notes about this order..."
              rows="2"
              className="w-full px-4 py-3 border border-chocolate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all duration-300 resize-none"
            />
          </div>

          {/* Line Items Section */}
          <div className="space-y-4 pt-4 border-t border-chocolate-100">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-bold text-chocolate-950">Line Items</label>
              <span className="text-xs text-chocolate-600 font-medium">{items.length} item{items.length !== 1 ? 's' : ''}</span>
            </div>

            <div className="space-y-3">
              {items.map((item, i) => (
                <div
                  key={i}
                  className="flex items-end gap-3 p-4 bg-gradient-to-r from-chocolate-50 to-transparent rounded-xl border border-chocolate-100 hover:border-chocolate-200 transition-all duration-300"
                >
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-chocolate-700 mb-1.5 uppercase tracking-wider">Supplement</label>
                    <select
                      value={item.supplement_id}
                      onChange={e => updateItem(i, 'supplement_id', e.target.value)}
                      className="w-full px-4 py-2.5 border border-chocolate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all duration-300 appearance-none bg-white cursor-pointer"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23999' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 12px center',
                        paddingRight: '36px'
                      }}
                    >
                      <option value="">Select supplement</option>
                      {supplements.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="w-32">
                    <label className="block text-xs font-bold text-chocolate-700 mb-1.5 uppercase tracking-wider">Qty (kg)</label>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      value={item.quantity_kg}
                      onChange={e => updateItem(i, 'quantity_kg', e.target.value)}
                      placeholder="0.000"
                      className="w-full px-3 py-2.5 border border-chocolate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all duration-300"
                    />
                  </div>

                  <div className="w-32">
                    <label className="block text-xs font-bold text-chocolate-700 mb-1.5 uppercase tracking-wider">$/kg</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.unit_price}
                      onChange={e => updateItem(i, 'unit_price', e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2.5 border border-chocolate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all duration-300"
                    />
                  </div>

                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      className="p-2.5 text-chocolate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all duration-300"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-2 text-sm font-bold text-rose-600 hover:text-rose-700 px-4 py-2.5 hover:bg-rose-50 rounded-lg transition-all duration-300 mt-3"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          </div>

          {/* Order Total */}
          {total > 0 && (
            <div className="bg-gradient-to-r from-amber-50 to-rose-50 rounded-xl p-4 border border-amber-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-chocolate-950">Estimated Total:</span>
                <span className="text-2xl font-bold bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">
                  ${total.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-6 border-t border-chocolate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 text-sm font-bold text-chocolate-700 bg-chocolate-100 hover:bg-chocolate-200 rounded-xl transition-all duration-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                  Creating...
                </>
              ) : (
                'Create Order'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
