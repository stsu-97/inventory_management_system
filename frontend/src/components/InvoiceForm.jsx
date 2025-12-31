import React, { useState, useEffect } from 'react';
import { Upload, Save, X, Trash2, FileSpreadsheet, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

const API_URL = 'http://localhost:5002/api';

export default function InvoiceForm() {
  const [invoices, setInvoices] = useState([]);
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    product_id: '',
    quantity: '',
    type: 'purchase',
    buyer_name: ''
  });

  useEffect(() => {
    fetchProducts();
    fetchInvoices();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/products`);
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchInvoices = async () => {
    try {
      const response = await fetch(`${API_URL}/invoices`);
      const data = await response.json();
      setInvoices(data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch(`${API_URL}/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      resetForm();
      fetchInvoices();
    } catch (error) {
      setError('Failed to save invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setError('');

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // Skip header row and process data
      const parsedData = [];
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (row[0] && row[1] && row[2]) {
          // Find product by name
          const productName = row[1];
          const product = products.find(p => p.name.toLowerCase() === productName.toLowerCase());
          
          parsedData.push({
            date: formatExcelDate(row[0]) || new Date().toISOString().split('T')[0],
            product_id: product ? product.id : '',
            product_name: productName,
            quantity: parseInt(row[2]) || 0,
            type: (row[3] || 'purchase').toLowerCase(),
            buyer_name: row[4] || '',
            error: !product ? 'Product not found' : ''
          });
        }
      }

      setPreviewData(parsedData);
      setShowPreview(true);
    } catch (error) {
      setError('Failed to parse Excel file. Please check the format.');
    } finally {
      setLoading(false);
    }
  };

  const formatExcelDate = (value) => {
    if (typeof value === 'number') {
      const date = new Date((value - 25569) * 86400 * 1000);
      return date.toISOString().split('T')[0];
    }
    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return value;
    }
    return null;
  };

  const handlePreviewSave = async () => {
    setLoading(true);
    const validInvoices = previewData.filter(d => !d.error && d.product_id);

    try {
      const response = await fetch(`${API_URL}/invoices/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validInvoices)
      });
      const results = await response.json();
      
      setShowPreview(false);
      setPreviewData([]);
      fetchInvoices();
      
      if (results.some(r => r.error)) {
        setError('Some invoices failed to save. Check the data.');
      }
    } catch (error) {
      setError('Failed to save invoices');
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewEdit = (index, field, value) => {
    const updated = [...previewData];
    updated[index][field] = value;
    
    // Recompute error
    if (field === 'product_name') {
      const product = products.find(p => p.name.toLowerCase() === value.toLowerCase());
      updated[index].product_id = product ? product.id : '';
      updated[index].error = !product ? 'Product not found' : '';
    }
    
    setPreviewData(updated);
  };

  const handlePreviewDelete = (index) => {
    const updated = previewData.filter((_, i) => i !== index);
    setPreviewData(updated);
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      product_id: '',
      quantity: '',
      type: 'purchase',
      buyer_name: ''
    });
    setShowForm(false);
    setError('');
  };

  const getTypeBadge = (type) => {
    return type === 'purchase' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Invoice Management</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Save size={20} />
          Manual Entry
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Manual Entry Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Add Invoice</h3>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleManualSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                <select
                  required
                  value={formData.product_id}
                  onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select product</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="purchase">Purchase</option>
                  <option value="sale">Sale</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Buyer Name</label>
                <input
                  type="text"
                  value={formData.buyer_name}
                  onChange={(e) => setFormData({ ...formData, buyer_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter buyer name"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel Upload Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileSpreadsheet size={20} />
          Excel Upload
        </h3>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
            id="excel-upload"
            disabled={loading}
          />
          <label
            htmlFor="excel-upload"
            className="cursor-pointer inline-flex flex-col items-center gap-2"
          >
            <Upload size={48} className="text-gray-400" />
            <span className="text-gray-600 font-medium">
              {loading ? 'Processing...' : 'Click to upload Excel file'}
            </span>
            <span className="text-sm text-gray-400">.xlsx or .xls files only</span>
          </label>
        </div>

        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">Excel Format Requirements:</h4>
          <p className="text-sm text-blue-800">Columns should be in order:</p>
          <ol className="text-sm text-blue-800 list-decimal list-inside mt-2 space-y-1">
            <li>Date (YYYY-MM-DD)</li>
            <li>Product Name</li>
            <li>Quantity</li>
            <li>Type (purchase/sale)</li>
            <li>Buyer Name (optional)</li>
          </ol>
        </div>
      </div>

      {/* Preview Table */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">
                Preview Invoice Data ({previewData.length} records)
              </h3>
              <button
                onClick={() => {
                  setShowPreview(false);
                  setPreviewData([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">Date</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">Product</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">Quantity</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">Type</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">Buyer</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {previewData.map((row, index) => (
                      <tr key={index} className={row.error ? 'bg-red-50' : ''}>
                        <td className="px-4 py-2">
                          <input
                            type="date"
                            value={row.date}
                            onChange={(e) => handlePreviewEdit(index, 'date', e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded text-sm w-full"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <select
                            value={row.product_id}
                            onChange={(e) => handlePreviewEdit(index, 'product_id', e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded text-sm w-full"
                          >
                            <option value="">Select</option>
                            {products.map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                          {row.error && (
                            <span className="text-red-600 text-xs block">{row.error}</span>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            min="1"
                            value={row.quantity}
                            onChange={(e) => handlePreviewEdit(index, 'quantity', parseInt(e.target.value) || 0)}
                            className="px-2 py-1 border border-gray-300 rounded text-sm w-24"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <select
                            value={row.type}
                            onChange={(e) => handlePreviewEdit(index, 'type', e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value="purchase">Purchase</option>
                            <option value="sale">Sale</option>
                          </select>
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={row.buyer_name}
                            onChange={(e) => handlePreviewEdit(index, 'buyer_name', e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded text-sm w-32"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <button
                            onClick={() => handlePreviewDelete(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t bg-gray-50 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowPreview(false);
                  setPreviewData([]);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handlePreviewSave}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
                disabled={loading || previewData.filter(d => !d.error && d.product_id).length === 0}
              >
                {loading ? 'Saving...' : 'Confirm & Save to Database'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoices Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h3 className="text-lg font-semibold">Recent Invoices</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Buyer</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {invoice.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {invoice.product_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {invoice.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeBadge(invoice.type)}`}>
                      {invoice.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {invoice.buyer_name || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {invoices.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No invoices found.
          </div>
        )}
      </div>
    </div>
  );
}
