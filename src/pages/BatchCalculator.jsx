import { useState, useEffect } from 'react'
import { AlertTriangle, Sparkles, Settings, Weight, Grid3X3, Package } from 'lucide-react'

export default function BatchCalculator() {
  const [pouches, setPouches] = useState(1000)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const calculate = async (count) => {
    try {
      setLoading(true)
      const res = await fetch('/api/batch/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pouches: count }),
      })
      if (res.ok) setData(await res.json())
    } catch (err) {
      console.error('Calculation failed:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { calculate(1000) }, [])

  const handleSlider = (e) => {
    const v = parseInt(e.target.value)
    setPouches(v)
    calculate(v)
  }

  const handleInput = (e) => {
    const v = parseInt(e.target.value) || 0
    setPouches(v)
    if (v > 0) calculate(v)
  }

  const estimatedKg = (pouches * 0.120).toFixed(1)
  const breakdown = data?.breakdown || []
  const totals = data?.totals || {}

  // Find max needed for chart scaling
  const maxNeeded = Math.max(...breakdown.map(b => b.net_needed_kg), 0.001)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-chocolate-950">Production Calculator</h1>
        <p className="text-chocolate-600 mt-1">Welcome back, Chocolatier. Here is the status of your factory.</p>
      </div>

      {/* Batch Planner */}
      <div className="bg-white rounded-lg border border-chocolate-200 shadow-chocolate p-6">
        <h2 className="text-lg font-bold text-chocolate-950 mb-1">Batch Planner</h2>
        <p className="text-sm text-chocolate-600 mb-5">How many pouches are you planning to manufacture?</p>

        <div className="flex items-center gap-6">
          <div className="flex-1">
            <input
              type="range"
              min="1"
              max="10000"
              step="1"
              value={pouches}
              onChange={handleSlider}
              className="w-full"
            />
          </div>
          <div className="flex items-center gap-2 bg-chocolate-50 border border-chocolate-200 rounded-lg px-3 py-2">
            <input
              type="number"
              min="1"
              value={pouches}
              onChange={handleInput}
              className="w-20 text-right text-lg font-bold text-chocolate-950 bg-transparent outline-none"
            />
            <span className="text-sm text-chocolate-500">units</span>
          </div>
          <div className="bg-rose-50 border-2 border-rose-200 rounded-lg px-5 py-3 text-center min-w-[160px]">
            <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Estimated Output</p>
            <p className="text-2xl font-bold text-chocolate-950">{estimatedKg} kg</p>
            <p className="text-xs text-rose-500">Total Chocolate Weight</p>
          </div>
        </div>
      </div>

      {/* Ingredient Requirements + Stock Chart */}
      {data && (
        <div className="bg-white rounded-lg border border-chocolate-200 shadow-chocolate">
          <div className="flex items-center justify-between px-6 py-4 border-b border-chocolate-100">
            <h2 className="text-lg font-bold text-chocolate-950">Ingredient Requirements</h2>
            <button className="flex items-center gap-1.5 bg-chocolate-900 text-white text-xs font-medium px-3 py-1.5 rounded-full">
              <Sparkles className="w-3.5 h-3.5" />
              AI Analysis
            </button>
          </div>

          <div className="flex">
            {/* Table */}
            <div className="flex-1 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-chocolate-100 bg-chocolate-50/50">
                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-chocolate-600">Supplement</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-chocolate-600">Net Needed (Gross)</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-chocolate-600">In Stock</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-chocolate-600">To Order</th>
                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-chocolate-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {breakdown.map((item) => (
                    <tr key={item.supplement_id} className="border-b border-chocolate-50">
                      <td className="px-5 py-3 text-sm font-medium text-chocolate-900">{item.supplement_name}</td>
                      <td className="px-4 py-3 text-sm text-right text-chocolate-700">{item.net_needed_kg.toFixed(3)} kg</td>
                      <td className="px-4 py-3 text-sm text-right">
                        <span className={item.on_hand_kg > 0 ? 'text-teal-600 font-semibold' : 'text-chocolate-500'}>
                          {item.on_hand_kg.toFixed(3)} kg
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <span className={`font-bold ${item.to_order_kg > 0 ? 'text-rose-500' : 'text-chocolate-500'}`}>
                          {item.to_order_kg.toFixed(3)} kg
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item.to_order_kg > 0 ? (
                          <AlertTriangle className="w-4 h-4 text-amber-500 mx-auto" />
                        ) : (
                          <span className="text-green-500 text-sm">✓</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Stock vs Demand Chart */}
            <div className="w-72 border-l border-chocolate-100 p-5">
              <h3 className="text-sm font-bold text-chocolate-900 mb-4">Stock vs. Demand</h3>
              <div className="space-y-3">
                {breakdown.map((item) => {
                  const total = item.net_needed_kg
                  const inStock = Math.min(item.on_hand_kg, total)
                  const missing = item.to_order_kg
                  const stockPct = total > 0 ? (inStock / maxNeeded) * 100 : 0
                  const missingPct = total > 0 ? (missing / maxNeeded) * 100 : 0

                  return (
                    <div key={item.supplement_id} className="flex items-center gap-2">
                      <span className="text-[10px] text-chocolate-600 w-20 text-right truncate">{item.supplement_name.split(' ')[0]}</span>
                      <div className="flex-1 flex h-4 rounded-sm overflow-hidden bg-chocolate-100">
                        {stockPct > 0 && (
                          <div className="bg-teal-500 h-full" style={{ width: `${stockPct}%` }} />
                        )}
                        {missingPct > 0 && (
                          <div className="bg-rose-400 h-full" style={{ width: `${missingPct}%` }} />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="flex items-center gap-4 mt-4 text-xs text-chocolate-600">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span> In Stock</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span> Missing</span>
              </div>
              <p className="text-[10px] text-chocolate-400 mt-2">Green bar shows current stock coverage. Red bar shows deficit.</p>
            </div>
          </div>
        </div>
      )}

      {/* Material Cost Estimate */}
      {data && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-chocolate-950 flex items-center gap-2">
              <span className="text-green-600">$</span> Material Cost Estimate
            </h2>
            <div className="text-right">
              <span className="text-2xl font-bold text-rose-500">${totals.total_material_cost?.toFixed(2) || '0.00'}</span>
              <p className="text-xs text-chocolate-500">Total for {pouches.toLocaleString()} pouches</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {breakdown.map((item) => (
              <div key={item.supplement_id} className="bg-white rounded-lg border border-chocolate-200 p-4">
                <p className="text-sm font-semibold text-chocolate-900 truncate">{item.supplement_name}</p>
                <p className="text-xs text-chocolate-500 mt-1">{item.net_needed_kg.toFixed(3)} kg × ${item.unit_price.toFixed(2)}</p>
                <p className="text-lg font-bold text-chocolate-950 mt-1">${item.material_cost.toFixed(2)}</p>
              </div>
            ))}
          </div>
          <div className="text-right mt-3">
            <p className="text-sm text-chocolate-600">
              Supplement Cost per Pouch: <span className="font-bold text-chocolate-950">${pouches > 0 ? (totals.total_material_cost / pouches).toFixed(2) : '0.00'}</span>
            </p>
          </div>
        </div>
      )}

      {/* Recipe Adjustments */}
      <div className="bg-white rounded-lg border border-chocolate-200 shadow-chocolate p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-chocolate-950 flex items-center gap-2">
            <Settings className="w-5 h-5 text-chocolate-600" />
            Recipe Adjustments
          </h2>
          <button className="text-xs font-semibold text-chocolate-500 hover:text-chocolate-800 uppercase tracking-wider">
            Edit Dosage
          </button>
        </div>
      </div>

      {/* Factory Specifications */}
      <div className="bg-chocolate-900 rounded-lg p-6">
        <h2 className="text-[11px] font-bold text-chocolate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Factory Specifications (Fixed)
        </h2>
        <div className="grid grid-cols-3 gap-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-chocolate-800 rounded flex items-center justify-center">
              <Weight className="w-4 h-4 text-chocolate-400" />
            </div>
            <div>
              <p className="text-[10px] text-chocolate-400 uppercase tracking-wider font-semibold">Single Square</p>
              <p className="text-xl font-bold text-white">15g</p>
              <p className="text-[10px] text-chocolate-500">0.015 kg / 0.53 oz</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-chocolate-800 rounded flex items-center justify-center">
              <Grid3X3 className="w-4 h-4 text-chocolate-400" />
            </div>
            <div>
              <p className="text-[10px] text-chocolate-400 uppercase tracking-wider font-semibold">Squares Per Pouch</p>
              <p className="text-xl font-bold text-white">8</p>
              <p className="text-[10px] text-chocolate-500">Fixed Configuration</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-chocolate-800 rounded flex items-center justify-center">
              <Package className="w-4 h-4 text-chocolate-400" />
            </div>
            <div>
              <p className="text-[10px] text-chocolate-400 uppercase tracking-wider font-semibold">Total Pouch Weight</p>
              <p className="text-xl font-bold text-white">120g</p>
              <p className="text-[10px] text-chocolate-500">0.120 kg / 4.23 oz</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
