import { useState, useEffect } from 'react'
import { AlertTriangle, CheckCircle2, Settings, Weight, Grid3X3, Package, TrendingUp } from 'lucide-react'

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

  const maxNeeded = Math.max(...breakdown.map(b => b.net_needed_kg), 0.001)
  const maxCost = Math.max(...breakdown.map(b => b.material_cost), 0.001)

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-stone-50/50 p-8 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="fade-in">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-chocolate-950 to-amber-900 bg-clip-text text-transparent">Production Calculator</h1>
        <p className="text-stone-600 mt-2 text-lg">Welcome back, Chocolatier. Here is the status of your factory.</p>
      </div>

      {/* Batch Planner - Premium Card */}
      <div className="rounded-2xl bg-white/60 backdrop-blur-sm border border-stone-200 shadow-lg p-8 hover:-translate-y-0.5 transition-all duration-300 fade-in">
        <h2 className="text-2xl font-bold text-chocolate-950 mb-2">Batch Planner</h2>
        <p className="text-stone-600 mb-8">How many pouches are you planning to manufacture?</p>

        <div className="space-y-8">
          <div className="flex items-end gap-8">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-stone-700 mb-3 uppercase tracking-wider">Production Volume</label>
              <input
                type="range"
                min="1"
                max="10000"
                step="1"
                value={pouches}
                onChange={handleSlider}
                className="w-full h-3 bg-gradient-to-r from-rose-400 via-amber-400 to-amber-500 rounded-lg appearance-none cursor-pointer accent-rose-500"
                style={{
                  backgroundImage: `linear-gradient(to right, rgb(251, 113, 133) 0%, rgb(251, 146, 60) 50%, rgb(245, 158, 11) 100%)`
                }}
              />
            </div>

            <div className="relative">
              <label className="block text-xs font-semibold text-stone-500 mb-2 uppercase tracking-wider">Direct Input</label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  value={pouches}
                  onChange={handleInput}
                  className="w-28 text-right text-2xl font-bold text-chocolate-950 bg-stone-50/80 border border-stone-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-stone-600">pouches</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 text-white shadow-lg">
              <p className="text-sm font-semibold uppercase tracking-wider opacity-90">Total Chocolate Weight</p>
              <p className="text-5xl font-bold mt-2 font-mono">{estimatedKg}</p>
              <p className="text-sm mt-1 opacity-90">kg</p>
            </div>
          </div>
        </div>
      </div>

      {/* Ingredient Requirements + Stock Chart */}
      {data && (
        <div className="fade-in space-y-6">
          <div className="rounded-2xl bg-white/60 backdrop-blur-sm border border-stone-200 shadow-lg overflow-hidden hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex items-center justify-between px-8 py-5 border-b border-stone-200/50 bg-stone-50/50">
              <h2 className="text-2xl font-bold text-chocolate-950">Ingredient Requirements</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-stone-200 bg-gradient-to-r from-stone-50 to-stone-100/50">
                    <th className="text-left px-8 py-4 text-xs font-bold text-stone-700 uppercase tracking-wider">Supplement</th>
                    <th className="text-right px-6 py-4 text-xs font-bold text-stone-700 uppercase tracking-wider">Net Needed</th>
                    <th className="text-right px-6 py-4 text-xs font-bold text-stone-700 uppercase tracking-wider">In Stock</th>
                    <th className="text-right px-6 py-4 text-xs font-bold text-stone-700 uppercase tracking-wider">To Order</th>
                    <th className="text-center px-6 py-4 text-xs font-bold text-stone-700 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {breakdown.map((item) => (
                    <tr key={item.supplement_id} className="border-b border-stone-100 hover:bg-stone-50/50 transition-colors">
                      <td className="px-8 py-4 text-sm font-semibold text-chocolate-900">{item.supplement_name}</td>
                      <td className="px-6 py-4 text-sm text-right text-chocolate-700 font-mono tabular-nums">{item.net_needed_kg.toFixed(3)} kg</td>
                      <td className="px-6 py-4 text-sm text-right font-mono tabular-nums">
                        <span className={item.on_hand_kg > 0 ? 'text-emerald-600 font-bold' : 'text-stone-500'}>
                          {item.on_hand_kg.toFixed(3)} kg
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-mono tabular-nums">
                        <span className={`font-bold ${item.to_order_kg > 0 ? 'text-rose-500' : 'text-stone-500'}`}>
                          {item.to_order_kg.toFixed(3)} kg
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {item.to_order_kg > 0 ? (
                          <div className="inline-flex items-center justify-center animate-pulse">
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                          </div>
                        ) : (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Stock vs Demand Chart */}
          <div className="rounded-2xl bg-white/60 backdrop-blur-sm border border-stone-200 shadow-lg p-8 hover:-translate-y-0.5 transition-all duration-300">
            <h3 className="text-xl font-bold text-chocolate-950 mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-600" />
              Stock vs. Demand
            </h3>
            <div className="space-y-4">
              {breakdown.map((item) => {
                const total = item.net_needed_kg
                const inStock = Math.min(item.on_hand_kg, total)
                const missing = item.to_order_kg
                const stockPct = total > 0 ? (inStock / total) * 100 : 0
                const missingPct = total > 0 ? (missing / total) * 100 : 0

                return (
                  <div key={item.supplement_id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-chocolate-900">{item.supplement_name}</span>
                      <span className="text-xs text-stone-600 font-mono tabular-nums">{total.toFixed(3)} kg needed</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-6 rounded-full overflow-hidden bg-stone-100 border border-stone-200">
                        {stockPct > 0 && (
                          <div
                            className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-300 rounded-full"
                            style={{ width: `${stockPct}%` }}
                          />
                        )}
                        {missingPct > 0 && (
                          <div
                            className="h-full bg-gradient-to-r from-rose-400 to-rose-500 transition-all duration-300 rounded-full"
                            style={{ width: `${missingPct}%` }}
                          />
                        )}
                      </div>
                      <div className="text-xs text-stone-600 font-mono tabular-nums w-12 text-right">{stockPct.toFixed(0)}%</div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex items-center gap-6 mt-6 pt-6 border-t border-stone-200">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500"></div>
                <span className="text-xs font-semibold text-stone-700">In Stock</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-rose-400 to-rose-500"></div>
                <span className="text-xs font-semibold text-stone-700">Missing</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Material Cost Estimate */}
      {data && (
        <div className="fade-in space-y-6">
          <div className="rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-600 shadow-lg p-8 text-white hover:-translate-y-0.5 transition-all duration-300">
            <p className="text-sm font-semibold uppercase tracking-wider opacity-90">Total Material Cost</p>
            <p className="text-5xl font-bold mt-2 font-mono tabular-nums">${totals.total_material_cost?.toFixed(2) || '0.00'}</p>
            <p className="text-sm mt-2 opacity-90">For {pouches.toLocaleString()} pouches</p>
            <p className="text-xs mt-1 opacity-75">Cost per pouch: ${pouches > 0 ? (totals.total_material_cost / pouches).toFixed(2) : '0.00'}</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
            {breakdown.map((item) => {
              const costProportion = (item.material_cost / maxCost) * 100

              return (
                <div key={item.supplement_id} className="rounded-xl bg-white/60 backdrop-blur-sm border border-stone-200 shadow-md p-5 hover:-translate-y-0.5 transition-all duration-300">
                  <p className="text-sm font-bold text-chocolate-900 truncate">{item.supplement_name}</p>
                  <p className="text-xs text-stone-600 mt-2 font-mono tabular-nums">{item.net_needed_kg.toFixed(3)} kg × ${item.unit_price.toFixed(2)}</p>
                  <p className="text-2xl font-bold text-chocolate-950 mt-3 font-mono tabular-nums">${item.material_cost.toFixed(2)}</p>
                  <div className="mt-3 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-rose-400 transition-all duration-300 rounded-full"
                      style={{ width: `${costProportion}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recipe Adjustments */}
      <div className="rounded-2xl bg-white/60 backdrop-blur-sm border border-stone-200 shadow-lg p-8 hover:-translate-y-0.5 transition-all duration-300 fade-in">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-chocolate-950 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            Recipe Adjustments
          </h2>
          <button className="text-xs font-bold text-amber-600 hover:text-amber-700 hover:bg-amber-50 px-4 py-2 rounded-lg transition-all uppercase tracking-wider">
            Edit Dosage
          </button>
        </div>
      </div>

      {/* Factory Specifications */}
      <div className="rounded-2xl bg-gradient-to-br from-stone-800 to-stone-900 shadow-xl p-8 text-white hover:-translate-y-0.5 transition-all duration-300 fade-in">
        <h2 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-8 flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Factory Specifications (Fixed)
        </h2>
        <div className="grid grid-cols-3 gap-8">
          <div className="space-y-3">
            <div className="w-12 h-12 bg-stone-700/50 rounded-xl flex items-center justify-center">
              <Weight className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-stone-400 uppercase tracking-wider font-semibold">Single Square</p>
              <p className="text-3xl font-bold text-white mt-1 font-mono tabular-nums">15g</p>
              <p className="text-xs text-stone-500 mt-1">0.015 kg / 0.53 oz</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="w-12 h-12 bg-stone-700/50 rounded-xl flex items-center justify-center">
              <Grid3X3 className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-stone-400 uppercase tracking-wider font-semibold">Squares Per Pouch</p>
              <p className="text-3xl font-bold text-white mt-1 font-mono tabular-nums">8</p>
              <p className="text-xs text-stone-500 mt-1">Fixed Configuration</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="w-12 h-12 bg-stone-700/50 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-stone-400 uppercase tracking-wider font-semibold">Total Pouch Weight</p>
              <p className="text-3xl font-bold text-white mt-1 font-mono tabular-nums">120g</p>
              <p className="text-xs text-stone-500 mt-1">0.120 kg / 4.23 oz</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
