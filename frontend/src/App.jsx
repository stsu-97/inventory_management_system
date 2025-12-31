import React, { useState } from 'react';
import { Package, FileText, ClipboardList, Warehouse, BarChart3 } from 'lucide-react';
import ProductManagement from './components/ProductManagement';
import InvoiceForm from './components/InvoiceForm';
import StaffNoteForm from './components/StaffNoteForm';
import RealStockForm from './components/RealStockForm';
import Dashboard from './components/Dashboard';

function App() {
  const [activeTab, setActiveTab] = useState('products');

  const tabs = [
    { id: 'products', label: 'Products', icon: Package },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'staff-notes', label: 'Staff Notes', icon: ClipboardList },
    { id: 'stock-counts', label: 'Stock Counts', icon: Warehouse },
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">Inventory Management System</h1>
          <p className="text-blue-100 text-sm mt-1">Full-stack inventory tracking with multi-warehouse analytics</p>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex overflow-x-auto">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-4 font-medium transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white border-b-4 border-blue-600'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 border-b-4 border-transparent'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {activeTab === 'products' && <ProductManagement />}
        {activeTab === 'invoices' && <InvoiceForm />}
        {activeTab === 'staff-notes' && <StaffNoteForm />}
        {activeTab === 'stock-counts' && <RealStockForm />}
        {activeTab === 'dashboard' && <Dashboard />}
      </main>
    </div>
  );
}

export default App;
