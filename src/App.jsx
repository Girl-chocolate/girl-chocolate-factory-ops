import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Calculator, Package, Download, ClipboardCheck } from 'lucide-react'
import InventoryOverview from './pages/InventoryOverview'
import BatchCalculator from './pages/BatchCalculator'
import IncomingOrders from './pages/IncomingOrders'

function Sidebar() {
  const location = useLocation()

  const navItems = [
    { path: '/', label: 'Inventory', icon: LayoutDashboard },
    { path: '/batch', label: 'Batch Calculator', icon: Calculator },
    { path: '/orders', label: 'Orders', icon: Package },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-gradient-to-b from-stone-900 to-stone-800 flex flex-col z-50">
      {/* Logo Section */}
      <div className="px-6 py-8 border-b border-stone-700">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center flex-shrink-0 shadow-lg">
            <span className="text-xl">🍫</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-white font-bold text-base leading-tight">Girl Chocolate</h1>
            <p className="text-stone-300 text-xs font-semibold tracking-widest uppercase">Factory Ops</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map(({ path, label, icon: Icon }) => (
          <Link
            key={path}
            to={path}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
              isActive(path)
                ? 'bg-gradient-to-r from-rose-500/20 to-amber-500/20 text-white border-l-4 border-rose-500'
                : 'text-stone-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      {/* Export Button */}
      <div className="px-4 pb-6 border-t border-stone-700">
        <button className="flex items-center gap-2 text-stone-500 hover:text-white text-sm px-4 py-3 w-full transition-colors duration-200 rounded-lg hover:bg-white/5">
          <Download className="w-4 h-4 flex-shrink-0" />
          <span>Export Data (CSV)</span>
        </button>
      </div>
    </aside>
  )
}

export default function App() {
  const [isShopifyConnected, setIsShopifyConnected] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const isShopify = params.has('host') || params.has('shop')
    setIsShopifyConnected(isShopify)
  }, [])

  return (
    <Router>
      <div className="min-h-screen flex">
        <Sidebar />
        <main className="flex-1 ml-64 min-h-screen p-8 bg-stone-50 overflow-y-auto">
          {isShopifyConnected && (
            <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs text-emerald-700 font-medium">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              Shopify Connected
            </div>
          )}
          <Routes>
            <Route path="/" element={<InventoryOverview />} />
            <Route path="/batch" element={<BatchCalculator />} />
            <Route path="/orders" element={<IncomingOrders />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}
