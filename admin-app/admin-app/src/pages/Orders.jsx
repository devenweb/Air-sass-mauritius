import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '../components/Card';
import { Button } from '../components/Button';
import { Package, Info, Loader2, Plus, Search, Trash2, ChevronDown, ArrowUpDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { showAlert, showConfirm } from '../utils/swal';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(10);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  // — Filtering & Sorting State —
  const [filterMethod, setFilterMethod] = useState('all');
  const [sortBy, setSortBy] = useState('created_at:desc');

  const selectCls = "bg-gray-50 border border-slate-300 text-gray-900 text-[11px] font-black uppercase tracking-widest rounded-2xl focus:ring-brand-red focus:border-brand-red block w-full p-2.5 appearance-none pr-8 transition-all cursor-pointer hover:bg-white";

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          customers (
            first_name,
            last_name
          ),
          booking_items (
            id,
            service_name,
            amount
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      } else {
        // Map data to match existing UI expectations if possible
        const mappedData = (data || []).map(b => ({
            ...b,
            customer_name: b.customers ? `${b.customers.first_name} ${b.customers.last_name}` : 'Unknown Customer',
            total_items: b.booking_items?.length || 1,
            amount: b.total_price || b.amount || 0
        }));
        setOrders(mappedData);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      showAlert('Error', 'Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  const deleteOrder = async (id) => {
    const result = await showConfirm(
      'Delete Order?',
      'Are you sure you want to remove this order? This will not affect inventory.'
    );

    if (!result.isConfirmed) return;

    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      showAlert('Success', 'Order deleted successfully');
      fetchOrders();
    } catch (error) {
      console.error('Delete order error:', error);
      showAlert('Error', 'Failed to delete order', 'error');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const toggleExpand = (orderId) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Filter and sort orders
  const processedOrders = useMemo(() => {
    let list = [...orders];

    // 1. Search filter
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(order =>
        (order.customer_name?.toLowerCase() || '').includes(q) ||
        order.id?.toString().includes(q) ||
        (order.payment_method?.toLowerCase() || '').includes(q)
      );
    }

    // 2. Method filter
    if (filterMethod !== 'all') {
      list = list.filter(order => (order.payment_method || '').toLowerCase() === filterMethod.toLowerCase());
    }

    // 3. Sorting
    const [field, dir] = sortBy.split(':');
    list.sort((a, b) => {
      let vA, vB;
      if (field === 'total_amount') {
        vA = Number(a.total_amount || 0);
        vB = Number(b.total_amount || 0);
      } else if (field === 'created_at') {
        vA = new Date(a.created_at || 0);
        vB = new Date(b.created_at || 0);
      } else {
        vA = (a[field] || '').toString().toLowerCase();
        vB = (b[field] || '').toString().toLowerCase();
      }

      if (vA < vB) return dir === 'asc' ? -1 : 1;
      if (vA > vB) return dir === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [orders, searchTerm, filterMethod, sortBy]);

  const hasActiveFilters = searchTerm !== '' || filterMethod !== 'all';

  const clearFilters = () => {
    setSearchTerm('');
    setFilterMethod('all');
    setSortBy('created_at:desc');
    setCurrentPage(1);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterMethod]);

  // Pagination
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = processedOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(processedOrders.length / ordersPerPage);

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Orders Management</h1>
          <p className="text-gray-400 text-sm font-medium">Track and fulfill premium luxury service orders</p>
        </div>
        <div className="flex items-center gap-2">
          {/* <Button
            variant="outline"
            onClick={fetchOrders}
            className="text-gray-500 border-slate-300 flex items-center gap-2"
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Sync
          </Button> */}
          <Link to="/orders/create">
            <Button className="bg-brand-red hover:opacity-90 text-white flex items-center gap-2 shadow-lg shadow-red-100 font-bold">
              <Plus size={16} />
              Add Order
            </Button>
          </Link>
        </div>
      </div>

      <Card className="border border-slate-300 shadow-xl shadow-gray-200/50 rounded-3xl overflow-hidden">
        <CardHeader className="border-b border-gray-50 pb-4 bg-white px-8 pt-8">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="relative flex-1 min-w-0 max-w-md">
                <Search className="absolute left-3 top-2.5 text-gray-300" size={16} />
                <input
                  type="text"
                  placeholder="Intercept order streams…"
                  className="pl-9 pr-9 py-2.5 w-full border border-slate-300 bg-gray-50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all font-medium"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[140px]">
                  <select
                    className={selectCls}
                    value={filterMethod}
                    onChange={(e) => setFilterMethod(e.target.value)}
                  >
                    <option value="all">Every Method</option>
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="Transfer">Transfer</option>
                  </select>
                  <ChevronDown size={12} className="absolute right-2.5 top-3.5 text-gray-400 pointer-events-none" />
                </div>

                <div className="relative min-w-[140px]">
                  <select
                    className={selectCls}
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="created_at:desc">Newest First</option>
                    <option value="created_at:asc">Oldest First</option>
                    <option value="total_amount:desc">Highest Value</option>
                    <option value="total_amount:asc">Lowest Value</option>
                  </select>
                  <ArrowUpDown size={12} className="absolute right-2.5 top-3.5 text-gray-400 pointer-events-none" />
                </div>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-brand-red text-[10px] font-black uppercase tracking-widest px-4 py-2 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    Clear Engine
                  </button>
                )}

                <span className="ml-auto text-[10px] text-gray-400 font-black uppercase tracking-widest shrink-0">
                  {processedOrders.length} Global Orders
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 bg-white">
          <div className="overflow-x-auto min-h-[400px]">
            {loading ? (
              <div className="py-32 flex flex-col items-center">
                <Loader2 className="animate-spin text-brand-red mb-4" size={48} />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Querying Transaction Ledger...</p>
              </div>
            ) : currentOrders.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-50">
                <thead className="bg-gray-50/30">
                  <tr>
                    <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Order & Linkage</th>
                    <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Account & Volume</th>
                    <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Financials & Status</th>
                    <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentOrders.map((order) => (
                    <React.Fragment key={order.id}>
                      <tr key={order.id} className="even:bg-gray-100/40 hover:bg-gray-100/60 transition-colors">
                        <td className="px-8 py-5 whitespace-nowrap">
                          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">#{order.id?.slice(0, 8)}</div>
                          <div className="text-xs font-semibold text-gray-500">{formatDate(order.created_at)}</div>
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap">
                          <div className="text-sm font-black text-gray-900 leading-tight mb-1">{order.customer_name}</div>
                          <div className="flex items-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            <Package className="mr-1.5 shrink-0" size={12} />
                            {order.total_items || 0} Units
                          </div>
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap">
                          <div className="text-sm font-black text-brand-red mb-1.5">
                            <span className="text-[10px] opacity-70 mr-0.5 tracking-tighter">Rs</span>
                            {Number(order.amount).toLocaleString()}
                          </div>
                          <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-lg border ${order.status === 'Completed'
                            ? 'bg-green-50 text-green-700 border-green-100'
                            : order.status === 'Pending'
                              ? 'bg-yellow-50 text-yellow-700 border-yellow-100'
                              : order.status === 'Processing'
                                ? 'bg-red-50 text-red-700 border-red-100'
                                : order.status === 'Shipped'
                                  ? 'bg-purple-50 text-purple-700 border-purple-100'
                                  : 'bg-red-50 text-red-700 border-red-100'
                            }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap text-right">
                          <div className="flex justify-end items-center gap-1">
                            <button
                              onClick={() => toggleExpand(order.id)}
                              className="p-2.5 text-gray-400 hover:text-brand-red hover:bg-red-50 rounded-xl transition-all"
                              title="Inspection"
                            >
                              <Info size={16} />
                            </button>
                            <button
                              onClick={() => deleteOrder(order.id)}
                              className="p-2.5 text-gray-400 hover:text-brand-red hover:bg-red-50 rounded-xl transition-all"
                              title="Archive Document"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {expandedOrderId === order.id && (
                        <tr>
                          <td colSpan="7" className="px-8 py-6 bg-gray-50/50">
                            <div className="bg-white rounded-2xl p-6 border border-slate-300 shadow-sm">
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="font-black text-gray-400 uppercase text-[10px] tracking-widest flex items-center gap-2">
                                  <Package size={14} /> Itemized Manifest
                                </h4>
                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                  Payment Method: {order.payment_method}
                                </div>
                              </div>

                              <div className="space-y-3">
                                {order.booking_items && order.booking_items.length > 0 ? (
                                  order.booking_items.map((item, idx) => (
                                    <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 border-dashed">
                                      <div className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center text-[10px] font-black text-gray-400">
                                          {idx + 1}
                                        </div>
                                        <div>
                                          <p className="text-sm font-black text-gray-900 leading-none mb-1">{item.service_name}</p>
                                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Luxury Provisioning</p>
                                        </div>
                                      </div>
                                      <div className="text-sm font-black text-gray-900">
                                        Rs {Number(item.amount).toLocaleString()}
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest italic py-4 text-center bg-gray-50/50 rounded-xl border border-dashed border-slate-300">
                                    No itemized data available for this legacy transactional record.
                                  </div>
                                )}
                              </div>

                              <div className="mt-6 pt-4 border-t border-gray-50 flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                <div className="flex items-center gap-4">
                                  <span>System Trace: <span className="font-mono text-gray-300 ml-1">{order.id}</span></span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="opacity-50">Total Gross:</span>
                                  <span className="text-brand-red text-base">Rs {Number(order.amount).toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="bg-gray-50 p-6 rounded-full mb-4">
                  <Package className="text-gray-300" size={48} />
                </div>
                <h3 className="text-lg font-bold text-gray-900">No orders found</h3>
                <p className="text-gray-500 max-w-xs mt-2 mx-auto">
                  Manage your sales and shipments from here. Link them to your global customer base.
                </p>
                <Link to="/orders/create">
                  <Button
                    className="mt-6 bg-brand-red text-white"
                  >
                    Create Your First Order
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Pagination */}
          {/* {processedOrders.length > ordersPerPage && ( */}
          {processedOrders.length > 0 && (
            <div className="flex items-center justify-between px-8 py-6 bg-gray-50/50 border-t border-slate-300">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-3 bg-white border border-slate-300 rounded-xl disabled:opacity-30 shadow-sm hover:border-slate-300 transition-all font-bold text-xs"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-3 bg-white border border-gray-100 rounded-xl disabled:opacity-30 shadow-sm hover:border-slate-300 transition-all font-bold text-xs"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Orders;
