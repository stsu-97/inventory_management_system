import React, { useState, useEffect } from 'react';
import { X, TrendingUp, AlertTriangle, Info } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const API_URL = 'http://localhost:5002/api';

export default function Dashboard() {
  const [analytics, setAnalytics] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('2024-12');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const months = [
    { value: '2024-10', label: 'October 2024' },
    { value: '2024-11', label: 'November 2024' },
    { value: '2024-12', label: 'December 2024' }
  ];

  useEffect(() => {
    fetchAnalytics();
  }, [selectedMonth]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [year, month] = selectedMonth.split('-');
      const response = await fetch(
        `${API_URL}/dashboard/analytics?month=${month}&year=${year}`
      );
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = async (product) => {
    setSelectedProduct(product);
    setShowModal(true);
    
    const [year, month] = selectedMonth.split('-');
    const startDate = `${year}-${month}-01`;
    const endDate = `${year}-${month}-31`;

    try {
      const response = await fetch(
        `${API_URL}/products/${product.product_id}/history?start_date=${startDate}&end_date=${endDate}`
      );
      const data = await response.json();
      
      // Calculate cumulative stock levels
      const stockLevels = [];
      let cumulativeStock = product.total_real_stock;
      
      // Reverse to show from beginning to end
      [...data].reverse().forEach(record => {
        if (record.type === 'stock_count') {
          cumulativeStock = record.quantity;
        } else if (record.type === 'invoice') {
          if (record.transaction_type === 'purchase') {
            cumulativeStock -= record.quantity;
          } else {
            cumulativeStock += record.quantity;
          }
        } else if (record.type === 'staff_note') {
          cumulativeStock += record.quantity;
        }
        
        stockLevels.push({
          date: record.date,
          stock: cumulativeStock,
          type: record.type,
          transaction_type: record.transaction_type
        });
      });

      // Add final stock level at the end
      stockLevels.push({
        date: data.length > 0 ? data[data.length - 1].date : `${year}-${month}-31`,
        stock: product.total_real_stock,
        type: 'current',
        transaction_type: 'current'
      });

      setHistoryData(stockLevels);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const getDiscrepancyClass = (pct) => {
    const absPct = Math.abs(pct);
    if (absPct > 10) return 'bg-red-100 text-red-800 font-bold';
    if (absPct > 5) return 'bg-yellow-100 text-yellow-800 font-bold';
    return 'bg-green-100 text-green-800';
  };

  const getDiscrepancyIcon = (pct) => {
    const absPct = Math.abs(pct);
    if (absPct > 10) return <AlertTriangle size={16} className="inline mr-1" />;
    if (absPct > 5) return <Info size={16} className="inline mr-1" />;
    return null;
  };

  const chartData = historyData.map(h => ({
    date: h.date,
    stock: h.stock
  }));

  const getMonthName = (value) => {
    const month = months.find(m => m.value === value);
    return month ? month.label : value;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Monthly Analysis Dashboard</h2>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <TrendingUp size={20} />
          <span>Multi-Warehouse Analytics</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {months.map(month => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2 flex items-end">
            <p className="text-sm text-gray-600">
              Analyze inventory discrepancies between invoice records, staff notes, and real stock counts across both warehouses.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      ) : (
        <>
          {/* Analytics Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50">
              <h3 className="text-lg font-semibold">
                Inventory Analysis - {getMonthName(selectedMonth)}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Click on any product row to view detailed history and trends
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500 uppercase">Invoice Stock</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500 uppercase">Staff Stock</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500 uppercase">Warehouse 1</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500 uppercase">Warehouse 2</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500 uppercase bg-blue-50">Real Total</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500 uppercase">vs Invoice</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500 uppercase">vs Staff</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analytics.map((item, index) => (
                    <tr
                      key={index}
                      onClick={() => handleProductClick(item)}
                      className="hover:bg-blue-50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                        {item.product_name}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900">
                        {item.invoice_stock}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900">
                        {item.staff_stock}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900">
                        {item.warehouse1_stock}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900">
                        {item.warehouse2_stock}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-blue-900 bg-blue-50">
                        {item.total_real_stock}
                      </td>
                      <td className={`px-4 py-3 text-right ${getDiscrepancyClass(item.discrepancy_invoice_pct)}`}>
                        {getDiscrepancyIcon(item.discrepancy_invoice_pct)}
                        {item.discrepancy_invoice > 0 ? '+' : ''}{item.discrepancy_invoice}
                        <br />
                        <span className="text-xs">({item.discrepancy_invoice_pct}%)</span>
                      </td>
                      <td className={`px-4 py-3 text-right ${getDiscrepancyClass(item.discrepancy_staff_pct)}`}>
                        {getDiscrepancyIcon(item.discrepancy_staff_pct)}
                        {item.discrepancy_staff > 0 ? '+' : ''}{item.discrepancy_staff}
                        <br />
                        <span className="text-xs">({item.discrepancy_staff_pct}%)</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {analytics.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No data available for selected period
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="bg-white rounded-lg shadow p-4">
            <h4 className="font-semibold text-gray-900 mb-3">Discrepancy Legend</h4>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-green-100 rounded"></span>
                <span className="text-gray-700">≤5% difference (Good)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-yellow-100 rounded"></span>
                <span className="text-gray-700">5-10% difference (Warning)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 bg-red-100 rounded"></span>
                <span className="text-gray-700">>10% difference (Critical)</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* History Modal */}
      {showModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedProduct.product_name}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {getMonthName(selectedMonth)} - History & Trends
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
              {/* Chart */}
              <div className="mb-8">
                <h4 className="text-lg font-semibold mb-4 text-gray-800">Stock Level Over Time</h4>
                {historyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#1f2937',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#f3f4f6'
                        }}
                        labelStyle={{ color: '#f3f4f6' }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="stock" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No transaction data available for this period
                  </div>
                )}
              </div>

              {/* Transaction History Table */}
              <div>
                <h4 className="text-lg font-semibold mb-4 text-gray-800">Transaction History</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase">Transaction</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase">Quantity</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase">Buyer</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase">Warehouse</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase">Stock After</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {[...historyData].reverse().map((h, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-gray-900 whitespace-nowrap">
                            {h.date}
                          </td>
                          <td className="px-4 py-2">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              h.type === 'invoice' ? 'bg-blue-100 text-blue-800' :
                              h.type === 'staff_note' ? 'bg-green-100 text-green-800' :
                              'bg-purple-100 text-purple-800'
                            }`}>
                              {h.type.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-gray-900 capitalize">
                            {h.transaction_type}
                          </td>
                          <td className={`px-4 py-2 font-semibold ${
                            (h.type === 'invoice' && h.transaction_type === 'sale') ||
                            h.type === 'staff_note'
                              ? 'text-red-600'
                              : 'text-green-600'
                          }`}>
                            {(h.type === 'invoice' && h.transaction_type === 'sale') || h.type === 'staff_note'
                              ? '-' : '+'}{h.type === 'stock_count' ? h.stock : 
                                (h.type === 'invoice' && h.transaction_type === 'sale') || h.type === 'staff_note' ?
                                historyData[index + 1]?.stock - h.stock :
                                h.stock - historyData[index + 1]?.stock}
                          </td>
                          <td className="px-4 py-2 text-gray-600 whitespace-nowrap">
                            {historyData.find(original => 
                              original.date === h.date && 
                              original.type === h.type &&
                              original.buyer_name
                            )?.buyer_name || '-'}
                          </td>
                          <td className="px-4 py-2 text-gray-600">
                            {historyData.find(original => 
                              original.date === h.date && 
                              original.type === h.type &&
                              original.warehouse
                            )?.warehouse || '-'}
                          </td>
                          <td className="px-4 py-2 text-gray-900 font-bold">
                            {h.stock}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {historyData.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No transactions recorded for this period
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t bg-gray-50">
              <button
                onClick={() => setShowModal(false)}
                className="w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
