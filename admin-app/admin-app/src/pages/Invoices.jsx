import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '../components/Card';
import { Button } from '../components/Button';
import {
  Download, Eye, Send, Calendar, Loader2, Search, Plus,
  Edit2, Trash2, CheckCircle, Hash, FileText, CreditCard, User, Clock, ArrowUpDown, ChevronDown
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import Modal from '../components/Modal';
import { showAlert, showConfirm } from '../utils/swal';

// ─── Status helpers ────────────────────────────────────────────────────────
const statusBadge = (s) => {
  const status = s?.toLowerCase();
  if (status === 'paid') return 'bg-green-50 text-green-700 border-green-100';
  if (status === 'pending') return 'bg-yellow-50 text-yellow-700 border-yellow-100';
  if (status === 'overdue') return 'bg-red-50 text-red-700 border-red-100';
  if (status === 'cancelled') return 'bg-gray-100 text-gray-500 border-gray-100';
  return 'bg-red-50 text-red-600 border-red-100';
};

// ─── Default form factory (outside component to avoid hoisting issues) ────────
const genDefaultForm = () => ({
  customer_id: '',
  customer_name: '',
  status: 'Pending',
  reference: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
  due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  items: [{ id: crypto.randomUUID(), description: '', quantity: 1, unit_price: 0 }]
});

const selectCls = "bg-gray-50 border border-slate-300 text-gray-900 text-[11px] font-black uppercase tracking-widest rounded-2xl focus:ring-brand-red focus:border-brand-red block w-full p-2.5 appearance-none pr-8 transition-all cursor-pointer hover:bg-white";

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [invoicesPerPage] = useState(8);
  const [customers, setCustomers] = useState([]);
  const [togglingId, setTogglingId] = useState(null);

  // — Filtering & Sorting State —
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortBy, setSortBy] = useState('created_at:desc');

  // — Create modal —
  const [showModal, setShowModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState(genDefaultForm);

  // — View modal —
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState(null);

  // — Edit modal —
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    fetchInvoices();
    fetchCustomers();
  }, []);

  // ─── Fetch ─────────────────────────────────────────────────────────────────
  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, invoice_items(*)')
        .order('created_at', { ascending: false });

      if (error) {
        if (error.message.includes('relation "public.invoices" does not exist')) {
          setInvoices([]);
        } else {
          throw error;
        }
      } else {
        setInvoices(data || []);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      showAlert('Error', 'Failed to load invoices', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, first_name, last_name')
        .order('first_name');
      if (!error) setCustomers(data || []);
    } catch (e) {
      console.error('Error loading customers:', e);
    }
  };

  // ─── Filter + Pagination ────────────────────────────────────────────────
  const processedInvoices = useMemo(() => {
    let list = [...invoices];

    // 1. Search filter
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(inv =>
        (inv.customer_name?.toLowerCase() || '').includes(q) ||
        (inv.reference?.toLowerCase() || '').includes(q) ||
        (inv.service?.toLowerCase() || '').includes(q)
      );
    }

    // 2. Status filter
    if (filterStatus !== 'All') {
      list = list.filter(inv => inv.status === filterStatus);
    }

    // 4. Sorting
    const [field, dir] = sortBy.split(':');
    list.sort((a, b) => {
      let vA, vB;

      if (field === 'amount') {
        vA = Number(a.total_amount || 0);
        vB = Number(b.total_amount || 0);
      } else if (field === 'due_date' || field === 'created_at') {
        vA = new Date(a[field] || 0);
        vB = new Date(b[field] || 0);
      } else {
        vA = (a[field] || '').toString().toLowerCase();
        vB = (b[field] || '').toString().toLowerCase();
      }

      if (vA < vB) return dir === 'asc' ? -1 : 1;
      if (vA > vB) return dir === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [invoices, searchTerm, filterStatus, sortBy]);

  const hasActiveFilters = searchTerm !== '' || filterStatus !== 'All';

  const clearFilters = () => {
    setSearchTerm('');
    setFilterStatus('All');
    setSortBy('created_at:desc');
    setCurrentPage(1);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  const indexOfLastInvoice = currentPage * invoicesPerPage;
  const indexOfFirstInvoice = indexOfLastInvoice - invoicesPerPage;
  const currentInvoices = processedInvoices.slice(indexOfFirstInvoice, indexOfLastInvoice);
  const totalPages = Math.ceil(processedInvoices.length / invoicesPerPage);

  const formatDate = (d) => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // ─── Create ─────────────────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'customer_id') {
      const c = customers.find(c => c.id === value);
      setFormData(prev => ({
        ...prev,
        customer_id: value,
        customer_name: c ? `${c.first_name} ${c.last_name}` : ''
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const addFormItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { id: crypto.randomUUID(), description: '', quantity: 1, unit_price: 0 }]
    }));
  };

  const removeFormItem = (id) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.length > 1 ? prev.items.filter(item => item.id !== id) : prev.items
    }));
  };

  const handleItemChange = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  const calculateTotal = (items) => {
    return items.reduce((sum, item) => sum + (item.quantity * (parseFloat(item.unit_price) || 0)), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    const totalAmount = calculateTotal(formData.items);

    try {
      // 1. Create Invoice
      const { data: invoice, error: invError } = await supabase
        .from('invoices')
        .insert([{
          customer_id: formData.customer_id,
          customer_name: formData.customer_name,
          amount: totalAmount,
          status: formData.status,
          reference: formData.reference,
          due_date: formData.due_date,
          service: formData.items[0].description // Primary service for legacy views
        }])
        .select()
        .single();

      if (invError) throw invError;

      // 2. Create Invoice Items
      const invoiceItems = formData.items.map(it => ({
        invoice_id: invoice.id,
        item_description: it.description,
        quantity: parseInt(it.quantity) || 1,
        unit_price: parseFloat(it.unit_price) || 0
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(invoiceItems);

      if (itemsError) throw itemsError;

      showAlert('Success', 'Multi-item invoice generated successfully');
      setShowModal(false);
      setFormData(genDefaultForm());
      fetchInvoices();
    } catch (error) {
      showAlert('Error', error.message || 'Error creating invoice', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  // ─── View ────────────────────────────────────────────────────────────────
  const openViewModal = (invoice) => {
    setViewingInvoice(invoice);
    setShowViewModal(true);
  };

  // ─── Edit ────────────────────────────────────────────────────────────────
  const openEditModal = (invoice) => {
    setEditingInvoice(invoice);
    setEditFormData({
      customer_name: invoice.customer_name || '',
      service: invoice.service || '',
      amount: invoice.amount || '',
      status: invoice.status || 'Pending',
      due_date: invoice.due_date ? invoice.due_date.split('T')[0] : ''
    });
    setShowEditModal(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      const { error } = await supabase
        .from('invoices')
        .update({
          customer_name: editFormData.customer_name,
          service: editFormData.service,
          amount: parseFloat(editFormData.amount) || 0,
          status: editFormData.status,
          due_date: editFormData.due_date,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingInvoice.id);

      if (error) throw error;
      showAlert('Updated', 'Invoice updated successfully');
      setShowEditModal(false);
      fetchInvoices();
    } catch (err) {
      showAlert('Error', err.message || 'Failed to update invoice', 'error');
    } finally {
      setEditLoading(false);
    }
  };

  // ─── Quick Mark as Paid ──────────────────────────────────────────────────
  const togglePaid = async (invoice) => {
    const nextStatus = invoice.status === 'Paid' ? 'Pending' : 'Paid';
    setTogglingId(invoice.id);
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq('id', invoice.id);

      if (error) throw error;
      setInvoices(prev =>
        prev.map(inv => inv.id === invoice.id ? { ...inv, status: nextStatus } : inv)
      );
    } catch (e) {
      void e;
      showAlert('Error', 'Could not update invoice status', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  // ─── Download / Print ─────────────────────────────────────────────────────
  const handleDownload = (invoice) => {
    const content = `
INVOICE

Reference : ${invoice.reference || '—'}
Customer  : ${invoice.customer_name || '—'}
Service   : ${invoice.service || '—'}
Amount    : Rs ${Number(invoice.amount || 0).toFixed(2)}
Status    : ${invoice.status || '—'}
Issued    : ${formatDate(invoice.created_at)}
Due Date  : ${formatDate(invoice.due_date)}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${invoice.reference || 'invoice'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── Send (mark as Sent) ──────────────────────────────────────────────────
  const handleSendInvoice = async (invoice) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ status: 'Pending', updated_at: new Date().toISOString() })
        .eq('id', invoice.id);

      if (error) throw error;
      showAlert('Sent', `Invoice ${invoice.reference} marked as sent to ${invoice.customer_name}.`, 'success');
      fetchInvoices();
    } catch (e) {
      void e;
      showAlert('Error', 'Failed to update send status', 'error');
    }
  };

  // ─── Delete ───────────────────────────────────────────────────────────────
  const deleteInvoice = async (id) => {
    const result = await showConfirm(
      'Delete Invoice?',
      'This will permanently remove this invoice from the database.'
    );
    if (!result.isConfirmed) return;

    try {
      const { error } = await supabase.from('invoices').delete().eq('id', id);
      if (error) throw error;
      showAlert('Deleted', 'Invoice removed successfully');
      setInvoices(prev => prev.filter(inv => inv.id !== id));
    } catch (e) {
      void e;
      showAlert('Error', 'Failed to delete invoice', 'error');
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Invoice Management</h1>
          <p className="text-gray-400 text-sm font-medium">Bespoke financial tracking and premium billing services</p>
        </div>
        <div className="flex items-center gap-2">
          {/* <Button
  variant="outline"
  onClick={fetchInvoices}
  className="text-gray-500 border-slate-300 flex items-center gap-2"
  disabled={loading}
>
  <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
  Sync
</Button> */}
          <Link to="/invoices/create">
            <Button className="bg-brand-red hover:opacity-90 text-white flex items-center gap-2 shadow-lg shadow-red-100 font-bold">
              <Plus size={16} />
              Create Invoice
            </Button>
          </Link>
        </div>
      </div>

      <Card className="border border-slate-300 shadow-xl shadow-gray-200/50 rounded-3xl overflow-hidden">
        <CardHeader className="border-b border-slate-300 pb-4 bg-white px-8 pt-8">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="relative flex-1 min-w-0 max-w-md">
                <Search className="absolute left-3 top-2.5 text-gray-300" size={16} />
                <input
                  type="text"
                  placeholder="Locate financial records…"
                  className="pl-9 pr-9 py-2.5 w-full border border-slate-300 bg-gray-50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all font-medium"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[140px]">
                  <select
                    className={selectCls}
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="All">All Statuses</option>
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Overdue">Overdue</option>
                    <option value="Cancelled">Cancelled</option>
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
                    <option value="due_date:asc">Due Soonest</option>
                    <option value="amount:desc">Highest Amount</option>
                    <option value="amount:asc">Lowest Amount</option>
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
                  {processedInvoices.length} Registered Invoices
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
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Compiling Ledger Data...</p>
              </div>
            ) : currentInvoices.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-50">
                <thead className="bg-gray-50/30">
                  <tr>
                    <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Billing Ref & Entity</th>
                    <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Timeline</th>
                    <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Valuation & Status</th>
                    <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {currentInvoices.map((invoice) => (
                    <tr key={invoice.id} className="even:bg-gray-100/40 hover:bg-gray-100/60 transition-colors">
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="text-xs font-black text-gray-900 tracking-tighter font-mono mb-1">
                          {invoice.reference}
                        </div>
                        <div className="text-sm font-black text-gray-900 leading-tight mb-1">
                          {invoice.customer_name || 'NO IDENTITY'}
                        </div>
                        <div className="text-[10px] font-bold text-gray-400 truncate max-w-[150px]" title={invoice.service}>
                          {invoice.service || '—'}
                        </div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="flex items-center text-[11px] font-bold text-gray-400 uppercase mb-2">
                          <Clock className="text-gray-300 mr-2" size={12} />
                          <span className="mr-2">Issued:</span>
                          <span className="text-gray-600">{formatDate(invoice.created_at)}</span>
                        </div>
                        <div className="flex items-center text-[11px] font-bold text-gray-400 uppercase">
                          <Calendar className="text-gray-300 mr-2" size={12} />
                          <span className="mr-2">Maturity:</span>
                          <span className={`${new Date(invoice.due_date) < new Date() && invoice.status !== 'Paid' ? 'text-red-500' : 'text-gray-600'}`}>{formatDate(invoice.due_date)}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap text-right">
                        <div className="text-sm font-black text-gray-900 tracking-tight mb-2">
                          MUR {Number(invoice.amount || 0).toFixed(2)}
                        </div>
                        <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border ${statusBadge(invoice.status)}`}>
                          {invoice.status || 'Pending'}
                        </span>
                      </td>

                      <td className="px-8 py-5 whitespace-nowrap text-right">
                        <div className="flex justify-end items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); openViewModal(invoice); }}
                            className="p-2 text-gray-400 hover:text-brand-red hover:bg-red-50 rounded-xl transition-all"
                            title="X-Ray View"
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); openEditModal(invoice); }}
                            className="p-2 text-gray-400 hover:text-brand-red hover:bg-red-50 rounded-xl transition-all"
                            title="Registry Modification"
                          >
                            <Edit2 size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); togglePaid(invoice); }}
                            disabled={togglingId === invoice.id}
                            className="p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-xl transition-all disabled:opacity-40"
                            title={invoice.status === 'Paid' ? 'Revert to Pending' : 'Mark as Paid'}
                          >
                            {togglingId === invoice.id
                              ? <Loader2 size={16} className="animate-spin" />
                              : <CheckCircle size={16} className={invoice.status === 'Paid' ? 'text-green-500' : ''} />
                            }
                          </button>

                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleDownload(invoice); }}
                            className="p-2 text-gray-400 hover:text-purple-500 hover:bg-purple-50 rounded-xl transition-all"
                            title="Export Artifact"
                          >
                            <Download size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleSendInvoice(invoice); }}
                            className="p-2 text-gray-400 hover:text-sky-500 hover:bg-sky-50 rounded-xl transition-all"
                            title="Dispatch to Client"
                          >
                            <Send size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); deleteInvoice(invoice.id); }}
                            className="p-2 text-gray-400 hover:text-brand-red hover:bg-red-50 rounded-xl transition-all"
                            title="Terminate Invoice"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="bg-gray-50 p-6 rounded-full mb-4">
                  <FileText className="text-gray-300" size={48} />
                </div>
                <h3 className="text-lg font-bold text-gray-900">No invoices found</h3>
                <p className="text-gray-500 max-w-xs mt-2 mx-auto">
                  Bill your customers professionally. Generate, track, and send invoices.
                </p>
                <Button
                  onClick={() => { setFormData(genDefaultForm()); setShowModal(true); }}
                  className="mt-6 bg-brand-red text-white"
                >
                  Create Your First Invoice
                </Button>
              </div>
            )}
          </div>

          {/* Pagination */}
          {/* {processedInvoices.length > invoicesPerPage && ( */}
          {processedInvoices.length > 0 && (
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
                  className="p-3 bg-white border border-slate-300 rounded-xl disabled:opacity-30 shadow-sm hover:border-slate-300 transition-all font-bold text-xs"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════════════
          VIEW Invoice Modal
      ═══════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Invoice Details"
        size="lg"
      >
        {viewingInvoice && (
          <div className="space-y-4">

            {/* Header strip */}
            <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4 border border-slate-300">
              <div>
                <p className="text-lg font-black text-gray-900 font-mono">{viewingInvoice.reference}</p>
                <p className="text-xs text-gray-400 mt-0.5">Issued {formatDate(viewingInvoice.created_at)}</p>
              </div>
              <span className={`px-3 py-1 text-[11px] font-bold rounded-full border ${statusBadge(viewingInvoice.status)}`}>
                {viewingInvoice.status || 'Pending'}
              </span>
            </div>

            {/* Detail grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3 border border-slate-300">
                <div className="flex items-center text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  <User size={10} className="mr-1" /> Customer
                </div>
                <p className="text-sm font-bold text-gray-800">{viewingInvoice.customer_name || '—'}</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-3 border border-slate-300">
                <div className="flex items-center text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  <CreditCard size={10} className="mr-1" /> Total Amount
                </div>
                <p className="text-lg font-black text-gray-900 text-brand-red">
                  MUR {Number(viewingInvoice.amount || 0).toFixed(2)}
                </p>
              </div>

              {/* Line Items Breakdown */}
              <div className="bg-white rounded-2xl p-5 border border-slate-300 col-span-2 shadow-sm">
                <div className="flex items-center text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                  <Hash size={12} className="mr-2" /> Line Item Specification
                </div>
                <div className="space-y-3">
                  {viewingInvoice.invoice_items && viewingInvoice.invoice_items.length > 0 ? (
                    viewingInvoice.invoice_items.map((it, idx) => (
                      <div key={it.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded bg-gray-50 flex items-center justify-center text-[10px] font-black text-gray-400">
                            {idx + 1}
                          </div>
                          <div>
                            <p className="text-xs font-black text-gray-900">{it.item_description}</p>
                            <p className="text-[10px] text-gray-400">Qty: {it.quantity} x MUR {Number(it.unit_price).toFixed(2)}</p>
                          </div>
                        </div>
                        <p className="text-xs font-black text-gray-900">MUR {Number(it.amount).toFixed(2)}</p>
                      </div>
                    ))
                  ) : (
                    <div className="py-2 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded bg-gray-50 flex items-center justify-center text-[10px] font-black text-gray-400">
                          1
                        </div>
                        <div>
                          <p className="text-xs font-black text-gray-900">{viewingInvoice.service}</p>
                          <p className="text-[10px] text-gray-400">Standard Service Provisioning</p>
                        </div>
                        <div className="ml-auto">
                          <p className="text-xs font-black text-gray-900">MUR {Number(viewingInvoice.amount).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-3 border border-slate-300">
                <div className="flex items-center text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  <Calendar size={10} className="mr-1" /> Due Date
                </div>
                <p className="text-sm font-semibold text-gray-700">{formatDate(viewingInvoice.due_date)}</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-3 border border-slate-300">
                <div className="flex items-center text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  <Clock size={10} className="mr-1" /> Issuance Date
                </div>
                <p className="text-xs text-gray-500">
                  {viewingInvoice.created_at ? new Date(viewingInvoice.created_at).toLocaleString() : '—'}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-50">
              <button
                onClick={() => handleDownload(viewingInvoice)}
                className="px-4 py-2 text-sm font-bold text-purple-600 bg-purple-50 border border-purple-100 rounded-xl hover:bg-purple-100 transition-all flex items-center gap-1.5"
              >
                <Download size={14} /> Download
              </button>
              <button
                onClick={() => { setShowViewModal(false); openEditModal(viewingInvoice); }}
                className="px-4 py-2 text-sm font-bold text-amber-600 bg-amber-50 border border-amber-100 rounded-xl hover:bg-amber-100 transition-all flex items-center gap-1.5"
              >
                <Edit2 size={14} /> Edit
              </button>
              <button
                onClick={() => setShowViewModal(false)}
                className="px-5 py-2 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-xl transition-all"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════
          EDIT Invoice Modal
      ═══════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Invoice"
        size="md"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">

          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Customer Name
            </label>
            <input
              type="text"
              name="customer_name"
              required
              className="w-full px-4 py-2.5 bg-gray-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red transition-all font-medium"
              value={editFormData.customer_name || ''}
              onChange={handleEditChange}
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Service / Description
            </label>
            <input
              type="text"
              name="service"
              required
              placeholder="e.g. VIP Lounge Access"
              className="w-full px-4 py-2.5 bg-gray-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red transition-all font-medium"
              value={editFormData.service || ''}
              onChange={handleEditChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Amount (Rs)</label>
              <input
                type="number"
                name="amount"
                required
                step="0.01"
                className="w-full px-4 py-2.5 bg-gray-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red transition-all font-bold"
                value={editFormData.amount || ''}
                onChange={handleEditChange}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Status</label>
              <select
                name="status"
                className="w-full px-4 py-2.5 bg-gray-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red transition-all appearance-none font-bold text-sm text-gray-700"
                value={editFormData.status || 'Pending'}
                onChange={handleEditChange}
              >
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
                <option value="Overdue">Overdue</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Due Date</label>
            <input
              type="date"
              name="due_date"
              className="w-full px-4 py-2.5 bg-gray-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red transition-all"
              value={editFormData.due_date || ''}
              onChange={handleEditChange}
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-50">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="px-6 py-2.5 text-sm font-bold text-gray-400 hover:text-gray-600 transition-all"
            >
              Cancel
            </button>
            <Button
              type="submit"
              disabled={editLoading}
              className="bg-brand-red text-white px-8 py-2.5 rounded-xl shadow-lg shadow-red-100 flex items-center font-bold"
            >
              {editLoading && <Loader2 className="animate-spin mr-2" size={16} />}
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════
          CREATE Invoice Modal
      ═══════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create New Invoice"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Reference #</label>
              <input
                type="text"
                name="reference"
                required
                readOnly
                className="w-full px-4 py-2.5 bg-gray-100 border border-slate-300 rounded-xl focus:outline-none font-mono text-sm"
                value={formData.reference}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Due Date</label>
              <input
                type="date"
                name="due_date"
                required
                className="w-full px-4 py-2.5 bg-gray-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red transition-all"
                value={formData.due_date}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Customer Selection</label>
            <select
              name="customer_id"
              required
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red transition-all appearance-none font-bold text-sm text-gray-700"
              value={formData.customer_id}
              onChange={handleInputChange}
            >
              <option value="">Select identity...</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest">Financial Line Items</label>
              <button
                type="button"
                onClick={addFormItem}
                className="text-brand-red text-xs font-black flex items-center gap-1 uppercase tracking-tighter hover:opacity-80 transition-opacity"
              >
                <Plus size={14} /> Add Service
              </button>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {formData.items.map((item) => (
                <div key={item.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 relative animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-6">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Service Description</label>
                      <input
                        type="text"
                        required
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-brand-red outline-none"
                        value={item.description}
                        onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                        placeholder="e.g. Flight Booking"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Qty</label>
                      <input
                        type="number"
                        required
                        min="1"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-brand-red outline-none"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Unit Price</label>
                      <input
                        type="number"
                        required
                        step="0.01"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-brand-red outline-none"
                        value={item.unit_price}
                        onChange={(e) => handleItemChange(item.id, 'unit_price', e.target.value)}
                      />
                    </div>
                    <div className="col-span-1 flex justify-center pb-2">
                      <button
                        type="button"
                        onClick={() => removeFormItem(item.id)}
                        disabled={formData.items.length === 1}
                        className="text-gray-300 hover:text-brand-red disabled:opacity-30 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-brand-red/5 rounded-2xl border border-brand-red/10 flex items-center justify-between">
            <span className="text-[10px] font-black text-brand-red uppercase tracking-widest leading-none">Total Valuation</span>
            <span className="text-xl font-black text-brand-red tracking-tight leading-none">
              MUR {calculateTotal(formData.items).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-xl transition-all"
            >
              Cancel
            </button>
            <Button
              type="submit"
              disabled={formLoading}
              className="bg-brand-red text-white px-8 py-2.5 rounded-xl shadow-lg shadow-red-100 flex items-center font-bold"
            >
              {formLoading && <Loader2 className="animate-spin mr-2" size={16} />}
              Generate Invoice
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Invoices;
