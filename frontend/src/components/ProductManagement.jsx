import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, FileSpreadsheet, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

const API_URL = 'http://localhost:5002/api';

export default function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [activeTab, setActiveTab] = useState('manual'); // 'manual', 'excel'
  const [previewData, setPreviewData] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [excelLoading, setExcelLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    initial_stock: 0
  });

  useEffect(() => {
    fetchProducts();
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

  const handleExcelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setExcelLoading(true);
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
        if (row[0] && row[1]) {
          parsedData.push({
            name: row[0],
            category: row[1] || 'Other',
            initial_stock: parseInt(row[2]) || 0,
            error: !row[1] ? 'Category required' : ''
          });
        }
      }

      setPreviewData(parsedData);
      setShowPreview(true);
    } catch (error) {
      setError('Failed to parse Excel file. Please check format.');
    } finally {
      setExcelLoading(false);
    }
  };

  const handlePreviewSave = async () => {
    setLoading(true);
    const validProducts = previewData.filter(d => !d.error && d.name);

    try {
      const response = await fetch(`${API_URL}/products/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validProducts)
      });
      const results = await response.json();
      
      setShowPreview(false);
      setPreviewData([]);
      fetchProducts();
      
      if (results.some(r => r.error)) {
        setError('Some products failed to save. Check data.');
      }
    } catch (error) {
      setError('Failed to save products');
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewEdit = (index, field, value) => {
    const updated = [...previewData];
    updated[index][field] = value;
    
    // Recompute error
    if (field === 'category') {
      updated[index].error = !value ? 'Category required' : '';
    }
    
    setPreviewData(updated);
  };

  const handlePreviewDelete = (index) => {
    const updated = previewData.filter((_, i) => i !== index);
    setPreviewData(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingProduct) {
        await fetch(`${API_URL}/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      } else {
        await fetch(`${API_URL}/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      }
      resetForm();
      fetchProducts();
    } catch (error) {
      setError('Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      initial_stock: product.initial_stock
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await fetch(`${API_URL}/products/${id}`, {
        method: 'DELETE'
      });
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', category: '', initial_stock: 0 });
    setEditingProduct(null);
    setShowForm(false);
    setError('');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Product Management</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Add Product
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            {/* Tab Navigation - Only show for new products, not editing */}
            {!editingProduct && (
              <div className="border-b border-gray-200 bg-white">
                <nav className="flex -mb-px">
                  <button
                    onClick={() => setActiveTab('manual')}
                    className={`px-6 py-4 text-sm font-medium border-b-2 ${
                      activeTab === 'manual'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Manual Entry
                  </button>
                  <button
                    onClick={() => setActiveTab('excel')}
                    className={`px-6 py-4 text-sm font-medium border-b-2 ${
                      activeTab === 'excel'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <FileSpreadsheet size={16} />
                      Excel Upload
                    </span>
                  </button>
                </nav>
              </div>
            )}

            {/* Tab Content */}
            <div className="flex-1 overflow-auto p-6">
              {/* Manual Entry Tab */}
              {(activeTab === 'manual' || editingProduct) && (
                <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter product name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select category</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Office Supplies">Office Supplies</option>
                      <option value="Furniture">Furniture</option>
                      <option value="Accessories">Accessories</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Initial Stock Quantity</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.initial_stock}
                      onChange={(e) => setFormData({ ...formData, initial_stock: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter initial stock"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Save size={18} />
                      {editingProduct ? 'Update' : 'Save'}
                    </button>
                  </div>
                </form>
              )}

              {/* Excel Upload Tab */}
              {activeTab === 'excel' && !editingProduct && (
                <div className="max-w-2xl mx-auto">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleExcelUpload}
                      className="hidden"
                      id="excel-upload"
                      disabled={excelLoading}
                    />
                    <label
                      htmlFor="excel-upload"
                      className="cursor-pointer inline-flex flex-col items-center gap-4"
                    >
                      <FileSpreadsheet size={64} className="text-gray-400" />
                      <div className="text-center">
                        <span className="text-gray-600 font-medium text-lg block">
                          {excelLoading ? 'Processing Excel file...' : 'Click to upload Excel file'}
                        </span>
                        <span className="text-sm text-gray-400">.xlsx or .xls files only</span>
                      </div>
                    </label>
                  </div>

                  <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-3">Excel Format Requirements:</h4>
                    <p className="text-sm text-blue-800 mb-2">Columns should be in order:</p>
                    <ol className="text-sm text-blue-800 list-decimal list-inside space-y-1">
                      <li>Product Name</li>
                      <li>Category</li>
                      <li>Initial Stock (optional, defaults to 0)</li>
                    </ol>
                    <p className="text-sm text-blue-800 mt-3">
                      <strong>Valid Categories:</strong> Electronics, Office Supplies, Furniture, Accessories
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Preview Table */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">
                Preview Products ({previewData.length} records)
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
                      <th className="px-4 py-2 text-left font-medium text-gray-500">Product Name</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">Category</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">Initial Stock</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {previewData.map((row, index) => (
                      <tr key={index} className={row.error ? 'bg-red-50' : ''}>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={row.name}
                            onChange={(e) => handlePreviewEdit(index, 'name', e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded text-sm w-full"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <select
                            value={row.category}
                            onChange={(e) => handlePreviewEdit(index, 'category', e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded text-sm w-full"
                          >
                            <option value="">Select</option>
                            <option value="Electronics">Electronics</option>
                            <option value="Office Supplies">Office Supplies</option>
                            <option value="Furniture">Furniture</option>
                            <option value="Accessories">Accessories</option>
                          </select>
                          {row.error && (
                            <span className="text-red-600 text-xs block">{row.error}</span>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            min="0"
                            value={row.initial_stock}
                            onChange={(e) => handlePreviewEdit(index, 'initial_stock', parseInt(e.target.value) || 0)}
                            className="px-2 py-1 border border-gray-300 rounded text-sm w-24"
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
                disabled={loading || previewData.filter(d => !d.error && d.name).length === 0}
              >
                {loading ? 'Saving...' : 'Confirm & Save to Database'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Initial Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {product.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.initial_stock}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(product.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {products.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No products found. Click "Add Product" to create one.
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Total Products:</strong> {products.length} | 
          <strong className="ml-2">Categories:</strong> Electronics, Office Supplies, Furniture, Accessories
        </p>
      </div>
    </div>
  );
}
