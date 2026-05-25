import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '../components/Card';
import { Button } from '../components/Button';
import {
  Search, Plus, Trash2, Eye, Calendar, MapPin, Loader2,
  Star, Coffee, Plane, Sun, Edit2, CheckCircle, XCircle,
  Hash, Tag, CreditCard, Clock, DollarSign, ArrowUpDown, ChevronDown
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import Modal from '../components/Modal';
import { showAlert, showConfirm } from '../utils/swal';

const selectCls = "bg-gray-50 border border-slate-300 text-gray-900 text-[11px] font-black uppercase tracking-widest rounded-2xl focus:ring-brand-red focus:border-brand-red block w-full p-2.5 appearance-none pr-8 transition-all cursor-pointer hover:bg-white";

const Bookings = () => {
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [bookingsPerPage] = useState(8);

  const { data: bookings = [], isLoading: loading, refetch: refetchBookings } = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          customers (
            first_name,
            last_name,
            email
          ),
          booking_items (
            *,
            services (
              image_url
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.message.includes('relation "public.bookings" does not exist')) return [];
        throw error;
      }
      return data || [];
    }
  });

  const [filterStatus, setFilterStatus] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [sortBy, setSortBy] = useState('created_at:desc');

  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingBooking, setViewingBooking] = useState(null);

  useEffect(() => {
    if (bookings.length > 0 && location.state?.highlightId) {
      const target = bookings.find(b => b.id === location.state.highlightId);
      if (target) {
        setViewingBooking(target);
        setShowViewModal(true);
      }
    }
  }, [bookings, location.state]);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [editFormData, setEditFormData] = useState({
    service_type: '',
    service_name: '',
    check_in_date: '',
    amount: '',
    status: ''
  });
  const [editLoading, setEditLoading] = useState(false);

  const [togglingId, setTogglingId] = useState(null);

  const getActivityIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'lounge': return <Coffee size={14} className="text-amber-500" />;
      case 'hotel': return <Star size={14} className="text-red-500" />;
      case 'tour': return <MapPin size={14} className="text-green-500" />;
      case 'cruise': return <Plane size={14} className="text-sky-500" />;
      default: return <Sun size={14} className="text-orange-500" />;
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'Confirmed') return 'bg-green-50 text-green-700 border-green-100';
    if (status === 'Pending') return 'bg-yellow-50 text-yellow-700 border-yellow-100';
    return 'bg-red-50 text-red-700 border-red-100';
  };

  const openViewModal = (booking) => {
    setViewingBooking(booking);
    setShowViewModal(true);
  };

  const openEditModal = (booking) => {
    setEditingBooking(booking);
    setEditFormData({
      service_type: booking.service_type || 'Lounge',
      service_name: booking.service_name || booking.lounge_name || '',
      check_in_date: booking.check_in_date || '',
      amount: booking.total_price || booking.amount || '',
      status: booking.status || 'Pending'
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
        .from('bookings')
        .update({
          service_type: editFormData.service_type,
          service_name: editFormData.service_name,
          check_in_date: editFormData.check_in_date,
          amount: parseFloat(editFormData.amount) || 0,
          total_price: parseFloat(editFormData.amount) || 0,
          status: editFormData.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingBooking.id);

      if (error) throw error;

      showAlert('Updated', 'Booking updated successfully');
      setShowEditModal(false);
      refetchBookings();
    } catch (error) {
      console.error('Update error:', error);
      showAlert('Update Failed', error.message || 'Error updating booking', 'error');
    } finally {
      setEditLoading(false);
    }
  };

  const cycleStatus = async (booking) => {
    const next = {
      Pending: 'Confirmed',
      Confirmed: 'Cancelled',
      Cancelled: 'Pending'
    };
    const nextStatus = next[booking.status] || 'Pending';

    setTogglingId(booking.id);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq('id', booking.id);

      if (error) throw error;
      refetchBookings();
    } catch (error) {
      console.error('Status toggle error:', error);
      showAlert('Error', 'Could not update booking status', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const deleteBooking = async (id) => {
    const result = await showConfirm(
      'Delete Booking?',
      'This will permanently cancel and remove this booking from the global database.'
    );

    if (!result.isConfirmed) return;

    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      showAlert('Success', 'Booking deleted successfully');
      refetchBookings();
    } catch (error) {
      console.error('Delete error:', error);
      showAlert('Error', 'Failed to delete order', 'error');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const filteredBookings = useMemo(() => {
    let list = [...bookings];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(b => {
        const customerName = b.customers
          ? `${b.customers.first_name} ${b.customers.last_name}`.toLowerCase()
          : (b.customer?.toLowerCase() || 'guest');
        return customerName.includes(term) ||
          (b.service_name?.toLowerCase() || '').includes(term) ||
          (b.id?.toString() || '').includes(term);
      });
    }

    if (filterStatus !== 'All') {
      list = list.filter(b => b.status === filterStatus);
    }

    if (filterType !== 'All') {
      list = list.filter(b => b.service_type === filterType);
    }

    const [field, dir] = sortBy.split(':');
    list.sort((a, b) => {
      let vA, vB;

      if (field === 'amount') {
        vA = Number(a.total_price || a.amount || 0);
        vB = Number(b.total_price || b.amount || 0);
      } else if (field === 'check_in_date') {
        vA = new Date(a.check_in_date || a.date || a.created_at);
        vB = new Date(b.check_in_date || b.date || b.created_at);
      } else {
        vA = a[field] || '';
        vB = b[field] || '';
        if (field === 'created_at') {
          vA = new Date(vA);
          vB = new Date(vB);
        }
      }

      if (vA < vB) return dir === 'asc' ? -1 : 1;
      if (vA > vB) return dir === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [bookings, searchTerm, filterStatus, filterType, sortBy]);

  const hasActiveFilters = searchTerm !== '' || filterStatus !== 'All' || filterType !== 'All';

  const clearFilters = () => {
    setSearchTerm('');
    setFilterStatus('All');
    setFilterType('All');
    setSortBy('created_at:desc');
    setCurrentPage(1);
  };

  const indexOfLastBooking = currentPage * bookingsPerPage;
  const indexOfFirstBooking = indexOfLastBooking - bookingsPerPage;
  const currentBookings = filteredBookings.slice(indexOfFirstBooking, indexOfLastBooking);
  const totalPages = Math.ceil(filteredBookings.length / bookingsPerPage);

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Bookings Management</h1>
          <p className="text-gray-400 text-sm font-medium">Manage your customer bookings and travel plans</p>
        </div>
        <div className="flex items-center gap-2">
          {/* <Button
            variant="outline"
            onClick={() => refetchBookings()}
            className="text-gray-500 border-slate-300 flex items-center gap-2"
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Sync
          </Button> */}
          <Link to="/bookings/create">
            <Button className="bg-brand-red hover:opacity-90 text-white flex items-center gap-2 shadow-lg shadow-red-100 font-bold">
              <Plus size={16} />
              Add Booking
            </Button>
          </Link>
        </div>
      </div>

      <Card className="border border-slate-300 shadow-xl shadow-gray-200/50 rounded-3xl overflow-hidden">
        <CardHeader className="border-b border-slate-300 pb-3 bg-white px-6 pt-6">
          <div className="flex flex-col gap-4">
            <div className="relative flex-1 min-w-0 max-w-md">
              <Search className="absolute left-3 top-2.5 text-gray-300" size={16} />
              <input
                type="text"
                placeholder="Query global reservations…"
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
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
                <ChevronDown size={12} className="absolute right-2.5 top-3.5 text-gray-400 pointer-events-none" />
              </div>

              <div className="relative min-w-[140px]">
                <select
                  className={selectCls}
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="All">All Types</option>
                  <option value="Lounge">Lounge</option>
                  <option value="Hotel">Hotel</option>
                  <option value="Tour">Tour</option>
                  <option value="Cruise">Cruise</option>
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
                  <option value="check_in_date:asc">Upcoming</option>
                  <option value="amount:desc">Highest Rate</option>
                  <option value="amount:asc">Lowest Rate</option>
                </select>
                <ArrowUpDown size={12} className="absolute right-2.5 top-3.5 text-gray-400 pointer-events-none" />
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-brand-red text-[10px] font-black uppercase tracking-widest px-4 py-2 hover:bg-red-50 rounded-xl transition-colors"
                >
                  Clear Filters
                </button>
              )}

              <span className="ml-auto text-[10px] text-gray-400 font-black uppercase tracking-widest">
                {filteredBookings.length} Entries Found
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 bg-white">
          <div className="overflow-x-auto min-h-[400px] -mx-4 sm:mx-0 px-4 sm:px-0">
            {loading ? (
              <div className="py-32 flex flex-col items-center">
                <Loader2 className="animate-spin text-brand-red mb-4" size={48} />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Syncing with Registry...</p>
              </div>
            ) : currentBookings.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50/30">
                  <tr>
                    <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Start Date</th>
                    <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</th>
                    <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Booking Details</th>
                    <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Price & Status</th>
                    <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                   {currentBookings.map((booking) => (
                    <tr 
                      key={booking.id} 
                      onClick={() => openViewModal(booking)}
                      className="group even:bg-gray-100/40 hover:bg-gray-100/60 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-3 whitespace-nowrap">
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">#{booking.id?.toString().slice(0, 8)}</div>
                        <div className="flex items-center text-[10px] font-semibold text-gray-500">
                          <Clock className="text-gray-300 mr-1" size={12} />
                          {formatDate(booking.check_in_date || booking.date || booking.created_at)}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center text-left gap-3">
                          <div className="h-8 w-8 rounded-xl bg-gray-50 border border-slate-300 flex items-center justify-center text-[10px] font-black text-gray-400 shrink-0">
                            {booking.customers?.first_name?.charAt(0) || 'G'}
                          </div>
                          <div className="text-left">
                            <div className="text-sm font-black text-gray-900 leading-tight">
                              {booking.customers
                                ? `${booking.customers.first_name} ${booking.customers.last_name}`
                                : (booking.customer || 'Guest User')}
                            </div>
                            <div className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">{booking.customers?.email || 'No registry entry'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap text-left">
                        <div className="flex items-center text-sm font-black text-gray-900 leading-tight mb-1">
                          <span className="mr-1.5 shrink-0">{getActivityIcon(booking.service_type)}</span>
                          <span className="truncate max-w-[150px]">
                            {booking.booking_items && booking.booking_items.length > 1
                              ? `${booking.booking_items[0].service_name} (+${booking.booking_items.length - 1})`
                              : (booking.service_name || booking.lounge_name || 'Generic')}
                          </span>
                        </div>
                        <div className="text-[9px] text-gray-400 font-black uppercase tracking-widest flex items-center gap-2">
                          <span>{booking.service_type || 'Unknown'}</span>
                          <span className="text-gray-300">•</span>
                          <span>{booking.pax_adults || 0}A, {booking.pax_teens || 0}T, {booking.pax_children || 0}C, {booking.pax_infants || 0}I</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap text-left">
                        <div className="text-sm font-black text-brand-red mb-1.5">Rs {(booking.total_price || booking.amount || 0).toLocaleString()}</div>
                        <span className={`px-2 py-0.5 inline-flex text-[8px] font-black uppercase tracking-widest rounded-lg border ${getStatusBadge(booking.status)}`}>
                          {booking.status || 'Pending'}
                        </span>
                      </td>

                      <td className="px-6 py-3 whitespace-nowrap text-right">
                        <div className="flex justify-end items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => openViewModal(booking)}
                            className="p-2.5 text-gray-400 hover:text-brand-red hover:bg-red-50 rounded-xl transition-all"
                            title="View Reservation Details"
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            onClick={() => openEditModal(booking)}
                            className="p-2.5 text-gray-400 hover:text-brand-red hover:bg-red-50 rounded-xl transition-all"
                            title="Edit Reservation"
                          >
                            <Edit2 size={16} />
                          </button>

                          <button
                            onClick={() => cycleStatus(booking)}
                            disabled={togglingId === booking.id}
                            className="p-2.5 text-gray-400 hover:text-brand-red hover:bg-red-50 rounded-xl transition-all disabled:opacity-40"
                            title={`Toggle status → ${booking.status === 'Pending' ? 'Confirmed' : booking.status === 'Confirmed' ? 'Cancelled' : 'Pending'}`}
                          >
                            {togglingId === booking.id
                              ? <Loader2 size={16} className="animate-spin" />
                              : booking.status === 'Confirmed'
                                ? <XCircle size={16} />
                                : <CheckCircle size={16} />
                            }
                          </button>

                          <button
                            onClick={() => deleteBooking(booking.id)}
                            className="p-2.5 text-gray-400 hover:text-brand-red hover:bg-red-50 rounded-xl transition-all"
                            title="Archive Reservation"
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
                  <Calendar className="text-gray-300" size={48} />
                </div>
                <h3 className="text-lg font-bold text-gray-900">No bookings found</h3>
                <p className="text-gray-500 max-w-xs mt-2 mx-auto">
                  Sync with the database to see live bookings across all activities.
                </p>
                <Button
                  variant="outline"
                  className="mt-6 border-slate-300 hover:bg-gray-50"
                  onClick={() => refetchBookings()}
                >
                  Refresh Database
                </Button>
              </div>
            )}
          </div>

          {/* ORIGINAL:
          {filteredBookings.length > bookingsPerPage && (
          */}
          {filteredBookings.length > 0 && (
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

      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Booking Details"
        size="lg"
      >
        {viewingBooking && (
          <div className="space-y-5">
            <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4 border border-slate-300">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white border border-slate-300 flex items-center justify-center text-sm font-black text-gray-500 shadow-sm">
                  {viewingBooking.customers?.first_name?.charAt(0) || 'G'}
                </div>
                <div>
                  <p className="text-sm font-black text-gray-900">
                    {viewingBooking.customers
                      ? `${viewingBooking.customers.first_name} ${viewingBooking.customers.last_name}`
                      : viewingBooking.customer || 'Guest User'}
                  </p>
                  <p className="text-[11px] text-gray-400">{viewingBooking.customers?.email || viewingBooking.customer_email || '—'}</p>
                </div>
              </div>
              <span className={`px-3 py-1 text-[11px] font-bold rounded-full border ${getStatusBadge(viewingBooking.status)}`}>
                {viewingBooking.status || 'Pending'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">

              <div className="bg-gray-50 rounded-xl p-3 border border-slate-300">
                <div className="flex items-center text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  <Hash size={10} className="mr-1" /> Booking ID
                </div>
                <p className="text-xs font-mono text-gray-700">{viewingBooking.id?.toString().slice(0, 8) || '—'}</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-3 border border-slate-300">
                <div className="flex items-center text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  <Tag size={10} className="mr-1" /> Activity Type
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                  {getActivityIcon(viewingBooking.service_type)}
                  {viewingBooking.service_type || 'Unknown'}
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-3 border border-slate-300 col-span-2">
                <div className="flex items-center text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  <Sun size={10} className="mr-1" /> Activity / Service
                </div>
                <p className="text-sm font-bold text-gray-800">
                  {viewingBooking.service_name || viewingBooking.lounge_name || 'Generic Booking'}
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-3 border border-slate-300">
                <div className="flex items-center text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  <Calendar size={10} className="mr-1" /> Start Date
                </div>
                <p className="text-xs font-semibold text-gray-700">
                  {formatDate(viewingBooking.check_in_date || viewingBooking.date || viewingBooking.created_at)}
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-3 border border-slate-300">
                <div className="flex items-center text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  <CreditCard size={10} className="mr-1" /> Amount
                </div>
                <p className="text-sm font-black text-gray-900">
                  Rs {(viewingBooking.total_price || viewingBooking.amount || 0).toFixed(2)}
                </p>
              </div>

              <div className="bg-brand-red/5 rounded-xl p-4 border border-brand-red/10 col-span-2">
                <div className="flex items-center text-[10px] font-black text-brand-red uppercase tracking-widest mb-3">
                   Guest Breakdown
                </div>
                <div className="grid grid-cols-4 gap-4">
                   <div className="text-center">
                      <p className="text-[10px] font-black text-gray-400 uppercase">Adults</p>
                      <p className="text-lg font-black text-gray-900">{viewingBooking.pax_adults || 0}</p>
                   </div>
                   <div className="text-center">
                      <p className="text-[10px] font-black text-gray-400 uppercase">Teens</p>
                      <p className="text-lg font-black text-gray-900">{viewingBooking.pax_teens || 0}</p>
                   </div>
                   <div className="text-center">
                      <p className="text-[10px] font-black text-gray-400 uppercase">Children</p>
                      <p className="text-lg font-black text-gray-900">{viewingBooking.pax_children || 0}</p>
                   </div>
                   <div className="text-center">
                      <p className="text-[10px] font-black text-gray-400 uppercase">Infants</p>
                      <p className="text-lg font-black text-gray-900">{viewingBooking.pax_infants || 0}</p>
                   </div>
                </div>
              </div>

              {viewingBooking.booking_items && viewingBooking.booking_items.length > 0 && (
                <div className="bg-white rounded-2xl p-6 border border-slate-300 col-span-2 shadow-sm">
                  <div className="flex items-center text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                    <Tag size={12} className="mr-2" /> Detailed Booking Items
                  </div>
                  <div className="space-y-4">
                    {viewingBooking.booking_items.map((it) => (
                      <div key={it.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                            {it.services?.image_url ? (
                              <img src={it.services.image_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="text-[10px] font-black text-gray-300">N/A</div>
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-black text-gray-900">{it.service_name}</p>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{it.service_category}</p>
                          </div>
                        </div>
                        <p className="text-xs font-black text-gray-900 italic">MUR {Number(it.amount).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {viewingBooking.start_time && (
                <div className="bg-gray-50 rounded-xl p-3 border border-slate-300 col-span-2">
                  <div className="flex items-center text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    <Clock size={10} className="mr-1" /> Time Slot
                  </div>
                  <p className="text-xs font-semibold text-gray-700">
                    {viewingBooking.start_time} – {viewingBooking.end_time || 'Open'}
                  </p>
                </div>
              )}

              <div className="bg-gray-50 rounded-xl p-3 border border-slate-300 col-span-2">
                <div className="flex items-center text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  <Clock size={10} className="mr-1" /> Created
                </div>
                <p className="text-xs text-gray-500">
                  {viewingBooking.created_at ? new Date(viewingBooking.created_at).toLocaleString() : '—'}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-50">
              <button
                onClick={() => { setShowViewModal(false); openEditModal(viewingBooking); }}
                className="px-5 py-2 text-sm font-bold text-amber-600 bg-amber-50 border border-amber-100 rounded-xl hover:bg-amber-100 transition-all flex items-center gap-1.5"
              >
                <Edit2 size={14} /> Edit Booking
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

      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Booking"
        size="md"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Activity Type</label>
              <select
                name="service_type"
                className="w-full px-4 py-2.5 bg-gray-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red transition-all appearance-none font-medium text-sm text-gray-800"
                value={editFormData.service_type}
                onChange={handleEditChange}
              >
                <option value="Lounge">Lounge Access</option>
                <option value="Hotel">Hotel / Resort</option>
                <option value="Activity">Local Activity</option>
                <option value="Tour">Guided Tour</option>
                <option value="Cruise">Ocean Cruise</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Status</label>
              <select
                name="status"
                className="w-full px-4 py-2.5 bg-gray-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red transition-all appearance-none font-medium text-sm text-gray-800"
                value={editFormData.status}
                onChange={handleEditChange}
              >
                <option value="Pending">Pending Payment</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center">
              <Sun size={12} className="mr-1" /> Activity / Service Name
            </label>
            <input
              type="text"
              name="service_name"
              required
              placeholder="e.g. Premium Executive Lounge"
              className="w-full px-4 py-2.5 bg-gray-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red transition-all"
              value={editFormData.service_name}
              onChange={handleEditChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center">
                <Calendar size={12} className="mr-1" /> Start Date
              </label>
              <input
                type="date"
                name="check_in_date"
                className="w-full px-4 py-2.5 bg-gray-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red transition-all"
                value={editFormData.check_in_date}
                onChange={handleEditChange}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center">
                <DollarSign size={12} className="mr-1" /> Amount (Rs)
              </label>
              <input
                type="number"
                name="amount"
                required
                placeholder="0.00"
                step="0.01"
                className="w-full px-4 py-2.5 bg-gray-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red transition-all"
                value={editFormData.amount}
                onChange={handleEditChange}
              />
            </div>
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

    </div >
  );
};

export default Bookings;
