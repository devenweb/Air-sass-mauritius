import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '../components/Card';
import { Button } from '../components/Button';
import { Search, Plus, Edit, Trash2, Mail, Phone, MapPin, Loader2, UserCheck, UserPlus, Eye, ChevronDown, ArrowUpDown, Printer } from 'lucide-react';
import { supabase } from '../lib/supabase';
import logo from '../assets/logo.png';
import Modal from '../components/Modal';
import { showAlert, showConfirm } from '../utils/swal';

const selectCls = "bg-gray-50 border border-slate-300 text-gray-900 text-[11px] font-black uppercase tracking-widest rounded-2xl focus:ring-brand-red focus:border-brand-red block w-full p-2.5 appearance-none pr-8 transition-all cursor-pointer hover:bg-white";

const Customers = () => {
    const navigate = useNavigate();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [customersPerPage] = useState(10);
    const [showModal, setShowModal] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [formLoading, setFormLoading] = useState(false);

    // Filter & Sort states
    const [filterSubscriber, setFilterSubscriber] = useState('all');
    const [filterStatus, setFilterStatus] = useState('All');
    const [sortBy, setSortBy] = useState('created_at:desc');

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        country: '',
        is_subscriber: false,
        status: 'Active'
    });

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('customers')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                if (error.message.includes('relation "public.customers" does not exist')) {

                    setCustomers([]);
                } else {
                    throw error;
                }
            } else {
                setCustomers(data || []);
            }
        } catch (error) {
            console.error('Error fetching customers:', error);
            showAlert('Database Error', 'Failed to load customers from database', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const deleteCustomer = async (id) => {
        const result = await showConfirm(
            'Delete Customer?',
            'This will permanently remove the customer and all their associated bookings.'
        );

        if (!result.isConfirmed) return;

        try {
            const { error } = await supabase
                .from('customers')
                .delete()
                .eq('id', id);

            if (error) throw error;

            showAlert('Success', 'Customer deleted successfully');
            setCustomers(customers.filter(c => c.id !== id));
        } catch (error) {
            showAlert('Action Failed', 'Error deleting customer record', 'error');
            console.error(error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);

        try {
            if (editingCustomer) {
                const { error } = await supabase
                    .from('customers')
                    .update({
                        first_name: formData.first_name,
                        last_name: formData.last_name,
                        phone: formData.phone,
                        country: formData.country,
                        is_subscriber: formData.is_subscriber,
                        status: formData.status,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', editingCustomer.id);

                if (error) throw error;
                showAlert('Updated', 'Customer profile updated successfully');
            } else {
                const { error } = await supabase
                    .from('customers')
                    .insert([{
                        ...formData,
                        newsletter_opt_in_date: formData.is_subscriber ? new Date().toISOString() : null
                    }]);

                if (error) throw error;
                showAlert('Success', 'New customer registered successfully');
            }

            closeModal();
            fetchCustomers();
        } catch (error) {
            showAlert('Upload Failed', error.message || 'Error saving customer data', 'error');
        } finally {
            setFormLoading(false);
        }
    };

    const processedCustomers = useMemo(() => {
        let list = [...customers];

        // 1. Search filter
        if (searchTerm) {
            const q = searchTerm.toLowerCase();
            list = list.filter(c =>
                `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) ||
                (c.email?.toLowerCase() || '').includes(q) ||
                (c.phone?.includes(searchTerm) || '')
            );
        }

        // 2. Subscriber filter
        if (filterSubscriber !== 'all') {
            const isSub = filterSubscriber === 'yes';
            list = list.filter(c => c.is_subscriber === isSub);
        }

        // 3. Status filter
        if (filterStatus !== 'All') {
            list = list.filter(c => c.status === filterStatus);
        }

        // 4. Sorting
        const [field, dir] = sortBy.split(':');
        list.sort((a, b) => {
            let vA = a[field] || '', vB = b[field] || '';

            if (field === 'created_at') {
                vA = new Date(vA);
                vB = new Date(vB);
            } else if (typeof vA === 'string') {
                vA = vA.toLowerCase();
                vB = vB.toLowerCase();
            }

            if (vA < vB) return dir === 'asc' ? -1 : 1;
            if (vA > vB) return dir === 'asc' ? 1 : -1;
            return 0;
        });

        return list;
    }, [customers, searchTerm, filterSubscriber, filterStatus, sortBy]);

    const hasActiveFilters = searchTerm !== '' || filterSubscriber !== 'all' || filterStatus !== 'All';

    const clearFilters = () => {
        setSearchTerm('');
        setFilterSubscriber('all');
        setFilterStatus('All');
        setSortBy('created_at:desc');
        setCurrentPage(1);
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterSubscriber, filterStatus]);

    const indexOfLastCustomer = currentPage * customersPerPage;
    const indexOfFirstCustomer = indexOfLastCustomer - customersPerPage;
    const currentCustomers = processedCustomers.slice(indexOfFirstCustomer, indexOfLastCustomer);
    const totalPages = Math.ceil(processedCustomers.length / customersPerPage);

    const openEditModal = (customer) => {
        setEditingCustomer(customer);
        setFormData({
            first_name: customer.first_name || '',
            last_name: customer.last_name || '',
            email: customer.email || '',
            phone: customer.phone || '',
            country: customer.country || '',
            is_subscriber: customer.is_subscriber || false,
            status: customer.status || 'Active'
        });
        setShowModal(true);
    };

    const openCreateModal = () => {
        setEditingCustomer(null);
        setFormData({
            first_name: '',
            last_name: '',
            email: '',
            phone: '',
            country: '',
            is_subscriber: false,
            status: 'Active'
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingCustomer(null);
    };

    return (
        <div>
            {/* Print Header */}
            <div className="hidden print-only mb-8 border-b-2 border-brand-red pb-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Customer Audit Registry</h1>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">Royal Travel Agency Official Document | {new Date().toLocaleDateString()}</p>
                    </div>
                    <img src={logo} alt="Royal Travel Agency" className="h-12 object-contain" />
                </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 no-print">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Customer Management</h1>
                    <p className="text-gray-400 text-sm font-medium">Coordinate global relationships and luxury clientele data</p>
                </div>
                <div className="flex items-center gap-2">
                    {/* <Button
                        variant="outline"
                        onClick={fetchCustomers}
                        className="text-gray-500 border-slate-300 flex items-center gap-2"
                        disabled={loading}
                    >
                        <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                        Sync
                    </Button> */}
                    <Button
                        variant="outline"
                        onClick={() => window.print()}
                        className="text-gray-500 border-slate-300 flex items-center gap-2"
                    >
                        <Printer size={15} />
                        Print List
                    </Button>
                    <Link to="/customers/create">
                        <Button className="bg-brand-red hover:opacity-90 text-white flex items-center gap-2 shadow-lg shadow-red-100 font-bold">
                            <Plus size={16} />
                            Add Customer
                        </Button>
                    </Link>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 no-print">
                <Card className="border border-slate-300 shadow-lg shadow-gray-100 rounded-3xl overflow-hidden bg-white">
                    <CardContent className="flex items-center p-6">
                        <div className="p-4 bg-red-50 text-brand-red rounded-2xl mr-4">
                            <UserCheck size={28} />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Subscribers</p>
                            <h3 className="text-3xl font-black text-gray-900 tracking-tight">{customers.filter(c => c.is_subscriber).length}</h3>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border border-slate-300 shadow-lg shadow-gray-100 rounded-3xl overflow-hidden bg-white">
                    <CardContent className="flex items-center p-6">
                        <div className="p-4 bg-gray-50 text-gray-400 rounded-2xl mr-4">
                            <UserPlus size={28} />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Total Registry</p>
                            <h3 className="text-3xl font-black text-gray-900 tracking-tight">{customers.length}</h3>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border border-slate-300 shadow-lg shadow-gray-100 rounded-3xl overflow-hidden bg-white">
                    <CardContent className="flex items-center p-6">
                        <div className="p-4 bg-red-50 text-brand-red rounded-2xl mr-4">
                            <Mail size={28} />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Prospect Leads</p>
                            <h3 className="text-3xl font-black text-gray-900 tracking-tight">{customers.filter(c => c.status === 'Lead').length}</h3>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border border-slate-300 shadow-xl shadow-gray-200/50 rounded-3xl overflow-hidden">
                <CardHeader className="border-b border-slate-300 pb-4 bg-white px-4 pt-8">
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div className="relative flex-1 min-w-0 max-w-xs">
                                <Search className="absolute left-3 top-2.5 text-gray-300" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search registers..."
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
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                        <option value="Lead">Lead</option>
                                    </select>
                                    <ChevronDown size={12} className="absolute right-2.5 top-3.5 text-gray-400 pointer-events-none" />
                                </div>

                                <div className="relative min-w-[140px]">
                                    <select
                                        className={selectCls}
                                        value={filterSubscriber}
                                        onChange={(e) => setFilterSubscriber(e.target.value)}
                                    >
                                        <option value="all">Every State</option>
                                        <option value="yes">Subscriber</option>
                                        <option value="no">Unlinked Or Prospect</option>
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
                                        <option value="first_name:asc">Name A-Z</option>
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
                                    {processedCustomers.length} Global Accounts
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
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Scanning Customer Cryptos...</p>
                            </div>
                        ) : currentCustomers.length > 0 ? (
                            <table className="min-w-full divide-y divide-gray-50">
                                <thead className="bg-gray-50/30">
                                    <tr>
                                        <th className="px-4 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Client Identity/ID</th>
                                        <th className="px-4 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Communications</th>
                                        <th className="px-4 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Profile & Status</th>
                                        <th className="px-4 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest no-print">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {currentCustomers.map((customer) => (
                                        <tr 
                                            key={customer.id} 
                                            onClick={() => navigate(`/customers/${customer.id}`)}
                                            className="group even:bg-gray-100/40 hover:bg-gray-100/60 transition-colors cursor-pointer"
                                        >
                                            <td className="px-4 py-5 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-2xl bg-gray-50 border border-slate-300 flex items-center justify-center text-sm font-black text-gray-400 shrink-0 group-hover:border-brand-red group-hover:text-brand-red transition-all">
                                                        {customer.first_name?.charAt(0)}{customer.last_name?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-black text-gray-900 leading-tight group-hover:text-brand-red transition-colors">{customer.first_name} {customer.last_name}</div>
                                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">#{customer.id?.slice(0, 8)}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-5">
                                                <div className="flex items-center text-xs font-black text-gray-900 mb-1.5 leading-tight tracking-tight">
                                                    <Mail size={12} className="mr-2 text-gray-300 shrink-0 group-hover:text-brand-red/50 transition-colors" />
                                                    {customer.email}
                                                </div>
                                                <div className="flex items-center text-[10px] font-bold text-gray-400 leading-tight">
                                                    <Phone size={12} className="mr-2 text-gray-300 shrink-0 group-hover:text-brand-red/50 transition-colors" />
                                                    {customer.phone || 'NO VOX DATA'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-5">
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <MapPin size={12} className="text-gray-300 shrink-0 group-hover:text-brand-red/50 transition-colors" />
                                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{customer.country || 'GLOBAL'}</span>
                                                        {customer.is_subscriber ? (
                                                            <span className="px-2 py-0.5 text-[8px] font-black uppercase tracking-widest bg-green-50 text-green-600 rounded-lg border border-green-100">
                                                                Sub
                                                            </span>
                                                        ) : (
                                                            <span className="px-2 py-0.5 text-[8px] font-black uppercase tracking-widest bg-gray-50 text-gray-400 rounded-lg border border-gray-100">
                                                                Unlinked
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border w-fit ${customer.status === 'Active' ? 'bg-red-50 text-brand-red border-red-100' :
                                                        customer.status === 'Lead' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                                            'bg-gray-100 text-gray-400 border-gray-100'
                                                        }`}>
                                                        {customer.status}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-5 whitespace-nowrap text-right no-print">
                                                <div className="flex justify-end items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                                    <Link to={`/customers/${customer.id}`}>
                                                        <button
                                                            className="p-2.5 text-gray-400 hover:text-brand-red hover:bg-red-50 rounded-xl transition-all"
                                                            title="Historical Inspection"
                                                        >
                                                            <Eye size={18} />
                                                        </button>
                                                    </Link>
                                                    <button
                                                        onClick={() => openEditModal(customer)}
                                                        className="p-2.5 text-gray-400 hover:text-brand-red hover:bg-red-50 rounded-xl transition-all"
                                                        title="Modify Registry"
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteCustomer(customer.id)}
                                                        className="p-2.5 text-gray-400 hover:text-brand-red hover:bg-red-50 rounded-xl transition-all"
                                                        title="Archive Identity"
                                                    >
                                                        <Trash2 size={18} />
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
                                    <UserPlus className="text-gray-300" size={48} />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">No customers found</h3>
                                <p className="text-gray-500 max-w-xs mt-2 mx-auto">
                                    Build your global customer base. Every booking and newsletter signup will appear here.
                                </p>
                                <Button
                                    onClick={openCreateModal}
                                    className="mt-6 bg-brand-red text-white"
                                >
                                    Create Your First Customer
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {/* ORIGINAL:
                    {processedCustomers.length > customersPerPage && (
                    */}
                    {processedCustomers.length > 0 && (
                        <div className="flex items-center justify-between px-4 py-6 bg-gray-50/50 border-t border-slate-300">
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
                isOpen={showModal}
                onClose={closeModal}
                title={editingCustomer ? 'Modify Customer Profile' : 'Register New Customer'}
            >
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">First Name</label>
                            <input
                                type="text"
                                name="first_name"
                                required
                                className="w-full px-4 py-2.5 bg-gray-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent transition-all"
                                value={formData.first_name}
                                onChange={handleInputChange}
                                placeholder="Emma"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Last Name</label>
                            <input
                                type="text"
                                name="last_name"
                                required
                                className="w-full px-4 py-2.5 bg-gray-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent transition-all"
                                value={formData.last_name}
                                onChange={handleInputChange}
                                placeholder="Johnson"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Email Address</label>
                        <input
                            type="email"
                            name="email"
                            required
                            disabled={editingCustomer}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red disabled:opacity-50 transition-all font-medium"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="customer@example.com"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Phone Number</label>
                            <input
                                type="text"
                                name="phone"
                                className="w-full px-4 py-2.5 bg-gray-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red transition-all"
                                value={formData.phone}
                                onChange={handleInputChange}
                                placeholder="+230 ..."
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Country</label>
                            <input
                                type="text"
                                name="country"
                                className="w-full px-4 py-2.5 bg-gray-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red transition-all"
                                value={formData.country}
                                onChange={handleInputChange}
                                placeholder="Mauritius"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-slate-300">
                        <div>
                            <h4 className="text-sm font-bold text-gray-900">Newsletter Subscription</h4>
                            <p className="text-[10px] text-gray-500">Send marketing and seasonal offers</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                name="is_subscriber"
                                className="sr-only peer"
                                checked={formData.is_subscriber}
                                onChange={handleInputChange}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-red"></div>
                        </label>
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Global Status</label>
                        <select
                            name="status"
                            className="w-full px-4 py-2.5 bg-gray-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red transition-all appearance-none font-bold text-sm text-gray-700"
                            value={formData.status}
                            onChange={handleInputChange}
                        >
                            <option value="Active">Active Customer</option>
                            <option value="Lead">Potential Lead</option>
                            <option value="Inactive">Inactive</option>
                            <option value="Blocked">Blocked</option>
                        </select>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={closeModal}
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
                            {editingCustomer ? 'Update Profile' : 'Register Customer'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Customers;
