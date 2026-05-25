import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { Button } from '../components/Button';
import Modal from '../components/Modal';
import {
    ArrowLeft, Mail, Phone, MapPin, Calendar, Activity,
    Clock, Loader2, Edit, Trash2, Printer, ChevronDown
} from 'lucide-react';
import { showAlert, showConfirm } from '../utils/swal';
import logo from '../assets/logo.png';

const selectCls = "bg-gray-50 border border-slate-300 text-gray-900 text-[11px] font-black uppercase tracking-widest rounded-2xl focus:ring-brand-red focus:border-brand-red block w-full p-2.5 appearance-none pr-8 transition-all cursor-pointer hover:bg-white";

const ViewCustomer = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [customer, setCustomer] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        phone: '',
        country: '',
        is_subscriber: false,
        status: 'Active'
    });

    useEffect(() => {
        fetchCustomerData();
    }, [id]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);

        try {
            const { error } = await supabase
                .from('customers')
                .update({
                    ...formData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;
            
            showAlert('Updated', 'Customer profile updated successfully', 'success');
            setShowEditModal(false);
            fetchCustomerData();
        } catch (error) {
            showAlert('Update Failed', error.message || 'Error saving changes', 'error');
        } finally {
            setFormLoading(false);
        }
    };

    const openEditModal = () => {
        setFormData({
            first_name: customer.first_name || '',
            last_name: customer.last_name || '',
            phone: customer.phone || '',
            country: customer.country || '',
            is_subscriber: customer.is_subscriber || false,
            status: customer.status || 'Active'
        });
        setShowEditModal(true);
    };

    const deleteCustomer = async () => {
        const result = await showConfirm(
            'Remove Customer?',
            'This action is permanent and will delete all historical data associated with this identity.'
        );

        if (!result.isConfirmed) return;

        setDeleting(true);
        try {
            const { error } = await supabase
                .from('customers')
                .delete()
                .eq('id', id);

            if (error) throw error;

            showAlert('Success', 'Customer registry has been cleared.', 'success');
            navigate('/customers');
        } catch (error) {
            console.error('Delete Error:', error);
            showAlert('Action Failed', 'Could not delete customer record.', 'error');
        } finally {
            setDeleting(false);
        }
    };

    const fetchCustomerData = async () => {
        setLoading(true);
        try {
            // Fetch Customer Profile
            const { data: customerData, error: customerError } = await supabase
                .from('customers')
                .select('id, first_name, last_name, email, phone, country, is_subscriber, status, created_at')
                .eq('id', id)
                .single();

            if (customerError) throw customerError;
            setCustomer(customerData);

            // Fetch Related Bookings
            const { data: bookingsData, error: bookingsError } = await supabase
                .from('bookings')
                .select('id, service_type, service_name, amount, check_in_date, status')
                .eq('customer_id', id)
            if (bookingsError) {
                console.error("Error fetching bookings:", bookingsError);
            } else {
                setBookings(bookingsData || []);
            }

        } catch (error) {
            console.error('Error fetching customer data:', error);
            showAlert('Error', 'Failed to load customer details or history', 'error');
            navigate('/customers');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="animate-spin text-brand-red mb-4" size={40} />
                <p className="text-gray-500 font-medium">Fetching customer history...</p>
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold text-gray-900">Customer Not Found</h2>
                <Button onClick={() => navigate('/customers')} className="mt-4">Back to Customers</Button>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-6 no-print">
                <div className="flex items-center">
                    <button
                        onClick={() => navigate('/customers')}
                        className="mr-4 p-2 z-10 bg-white border border-slate-300 text-gray-600 rounded-full hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold italic tracking-tighter uppercase">Customer Profile</h1>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">ID Reference: {customer.id}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button 
                        variant="outline" 
                        onClick={() => window.print()}
                        className="text-gray-500 border-slate-300 flex items-center gap-2 h-10 px-4 rounded-xl font-bold text-xs uppercase tracking-widest shadow-sm"
                    >
                        <Printer size={16} /> Print
                    </Button>
                    <Button 
                        variant="outline"
                        onClick={openEditModal}
                        className="text-gray-500 border-slate-300 flex items-center gap-2 h-10 px-4 rounded-xl font-bold text-xs uppercase tracking-widest shadow-sm"
                        title="Modify Registry"
                    >
                        <Edit size={16} /> Edit
                    </Button>
                    <Button 
                        onClick={deleteCustomer}
                        disabled={deleting}
                        className="bg-brand-red text-white flex items-center gap-2 h-10 px-4 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-red-100"
                    >
                        {deleting ? 'Removing...' : <><Trash2 size={16} /> Delete</>}
                    </Button>
                </div>
            </div>

            {/* Print Only Header */}
            <div className="hidden print-only mb-10 border-b-2 border-brand-red pb-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">Customer Dossier</h1>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">Travel Lounge Confidential Record | Generated: {new Date().toLocaleDateString()}</p>
                    </div>
                    <img src={logo} alt="Travel Lounge" className="h-14 object-contain" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

                {/* Profile Card */}
                <div className="lg:col-span-1 border border-slate-300 shadow-sm rounded-xl overflow-hidden bg-white">
                    <div className="h-24 bg-gradient-to-r from-red-600 to-red-400"></div>
                    <div className="relative px-6 pb-6">
                        <div className="absolute -top-12 left-6 bg-white p-1 rounded-full shadow-md">
                            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center text-2xl font-bold text-brand-red border border-red-200">
                                {customer.first_name?.charAt(0)}{customer.last_name?.charAt(0)}
                            </div>
                        </div>

                        <div className="mt-12 text-right absolute right-6 top-4">
                            <span className={`px-3 py-1 text-xs font-bold rounded-full ${customer.status === 'Active' ? 'bg-red-50 text-red-600 border border-red-100' :
                                customer.status === 'Lead' ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                                    'bg-gray-100 text-gray-400 border border-gray-100'
                                }`}>
                                {customer.status}
                            </span>
                        </div>

                        <div className="pt-14">
                            <h2 className="text-xl font-bold text-gray-900">{customer.first_name} {customer.last_name}</h2>
                            <p className="text-sm text-gray-500 mb-6 font-medium">Customer since {new Date(customer.created_at).toLocaleDateString()}</p>

                            <div className="space-y-4">
                                <div className="flex items-center text-sm">
                                    <Mail className="text-gray-400 mr-3" size={18} />
                                    <span className="text-gray-700">{customer.email}</span>
                                </div>
                                <div className="flex items-center text-sm">
                                    <Phone className="text-gray-400 mr-3" size={18} />
                                    <span className="text-gray-700">{customer.phone || 'N/A'}</span>
                                </div>
                                <div className="flex items-center text-sm">
                                    <MapPin className="text-gray-400 mr-3" size={18} />
                                    <span className="text-gray-700">{customer.country || 'International'}</span>
                                </div>
                                <div className="flex items-center text-sm">
                                    <Activity className="text-gray-400 mr-3" size={18} />
                                    <span className="text-gray-700">{customer.is_subscriber ? 'Newsletter Subscribed' : 'Not Subscribed'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* History Cards */}
                <div className="lg:col-span-2 space-y-6">

                    <Card>
                        <CardHeader className="bg-gray-50/50 border-b border-slate-300">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-lg flex items-center">
                                    <Calendar className="mr-2 text-brand-red" size={20} />
                                    Booking History
                                </CardTitle>
                                <span className="bg-red-100 text-brand-red text-xs px-2 py-1 rounded-full font-bold">{bookings.length} Bookings</span>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {bookings.length > 0 ? (
                                <div className="divide-y divide-gray-200">
                                    {bookings.map((booking) => (
                                        <div key={booking.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <span className="text-xs font-bold text-gray-400 tracking-wider uppercase">{booking.service_type}</span>
                                                    <h3 className="text-sm font-bold text-gray-900">{booking.service_name}</h3>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-sm font-black text-gray-900 font-mono">${booking.amount}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center text-xs text-gray-500 justify-between">
                                                <div className="flex items-center">
                                                    <Clock size={12} className="mr-1" />
                                                    {new Date(booking.check_in_date).toLocaleDateString()}
                                                </div>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${booking.status === 'Confirmed' ? 'bg-green-50 text-green-600' :
                                                    booking.status === 'Pending' ? 'bg-orange-50 text-orange-600' :
                                                        'bg-gray-100 text-gray-500'
                                                    }`}>
                                                    {booking.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-sm text-gray-500">
                                    No bookings found for this customer.
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Bookings are now the primary transaction record */}

                </div>
            </div>
            <Modal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                title="Modify Customer Profile"
            >
                <form onSubmit={handleEditSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">First Name</label>
                            <input
                                type="text"
                                name="first_name"
                                required
                                className="w-full px-4 py-3 bg-gray-50 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all font-bold text-sm"
                                value={formData.first_name}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Last Name</label>
                            <input
                                type="text"
                                name="last_name"
                                required
                                className="w-full px-4 py-3 bg-gray-50 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all font-bold text-sm"
                                value={formData.last_name}
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Phone</label>
                            <input
                                type="text"
                                name="phone"
                                className="w-full px-4 py-3 bg-gray-50 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all font-bold text-sm"
                                value={formData.phone}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Country</label>
                            <input
                                type="text"
                                name="country"
                                className="w-full px-4 py-3 bg-gray-50 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all font-bold text-sm"
                                value={formData.country}
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <div>
                            <p className="text-sm font-bold text-gray-900 leading-tight">Newsletter Subscription</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Marketing Communications</p>
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
                        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Global Status</label>
                        <div className="relative">
                            <select
                                name="status"
                                className={selectCls}
                                value={formData.status}
                                onChange={handleInputChange}
                            >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                                <option value="Lead">Lead</option>
                                <option value="Blocked">Blocked</option>
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setShowEditModal(false)}
                            className="rounded-xl font-bold"
                        >
                            Dismiss
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={formLoading}
                            className="bg-brand-red text-white px-8 rounded-xl font-bold shadow-lg shadow-red-100"
                        >
                            {formLoading ? 'Synchronizing...' : 'Save Registry'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default ViewCustomer;
