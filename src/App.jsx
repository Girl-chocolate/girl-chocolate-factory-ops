import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import { LayoutGrid, Calculator, Truck, Download, ClipboardCheck } from 'lucide-react'
import InventoryOverview from './pages/InventoryOverview'
import BatchCalculator from './pages/BatchCalculator'
import IncomingOrders from './pages/IncomingOrders'

function Sidebar() {
  const location = useLocation()

  const navItems = [
    { path: '/', label: 'Inventory Overview', icon: LayoutGrid },
    { path: '/batch', label: 'Batch Calculator', icon: Calculator },
    { path: '/orders', label: 'Incoming Orders', icon: Truck },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-52 bg-chocolate-950 flex flex-col z-50">
      {/* Logo */}
      <div className="px-4 py-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-500 flex items-center justify-center flex-shrink-0">
            <ClipboardCheck className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-white font-bold text-sm leading-tight">Girl Chocolate</h1>
            <p className="text-rose-200 text-xs font-semibold tracking-widest uppercase">Factory Ops</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map(({ path, label, icon: Icon }) => (
          <Link
            key={path}
            to={path}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              isActive(path)
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25'
                : 'text-rose-100 hover:text-white hover:bg-chocolate-900'
            }`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      {/* Export */}
      <div className="px-3 pb-6">
        <button className="flex items-center gap-2 text-rose-100 hover:text-white text-sm px-3 py-2 w-full transition-colors hover:bg-chocolate-900 rounded-lg">
          <Download className="w-4 h-4 flex-shrink-0" />
          <span>Export Data (CSV)</span>
        </button>
      </div>
    </aside>
  )
}

export default function App() {
  return (
    <Router>
      <div className="min-h-screen flex">
        <Sidebar />
        <main className="flex-1 ml-52 min-h-screen p-8 bg-cream-50">
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
