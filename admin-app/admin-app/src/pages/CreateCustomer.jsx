import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { Button } from '../components/Button';
import { ArrowLeft, UserPlus, Mail, Phone, Globe, Shield, Loader2, UserCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { showAlert } from '../utils/swal';

const CreateCustomer = () => {
    const navigate = useNavigate();
    const [formLoading, setFormLoading] = useState(false);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        country: '',
        is_subscriber: false,
        status: 'Active'
    });

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);

        try {
            const { error } = await supabase
                .from('customers')
                .insert([{
                    ...formData,
                    newsletter_opt_in_date: formData.is_subscriber ? new Date().toISOString() : null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }]);

            if (error) throw error;

            showAlert('Success', 'Customer records have been synchronized and created successfully.', 'success');
            navigate('/customers');
        } catch (error) {
            console.error('Create Customer Error:', error);
            showAlert('Action Failed', error.message || 'Could not register new customer', 'error');
        } finally {
            setFormLoading(false);
        }
    };

    return (
        <div className="w-full h-full min-h-[calc(100vh-64px)] animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-6">
                <div className="flex items-center gap-6">
                    <Link
                        to="/customers"
                        className="p-3 bg-white hover:bg-gray-50 border border-slate-300 rounded-2xl transition-all text-gray-400 hover:text-brand-red shadow-sm"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Register New Customer</h1>
                        <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">Global Traveler Database Entry</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                <div className="xl:col-span-8">
                    <Card className="border border-slate-300 shadow-2xl shadow-gray-200/50 rounded-3xl overflow-hidden bg-white">
                        <div className="h-2 bg-gradient-to-r from-brand-red to-red-600 w-full"></div>
                        <CardHeader className="pt-10 px-10">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-red-50 text-brand-red rounded-3xl">
                                    <UserPlus size={28} />
                                </div>
                                <CardTitle className="text-xl font-black text-gray-900 uppercase tracking-tight">Identity Information</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-10">
                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-3">
                                        <label className="block text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">First Name</label>
                                        <input
                                            type="text"
                                            name="first_name"
                                            required
                                            className="w-full px-6 py-4 bg-gray-50/50 border-2 border-slate-300 focus:border-brand-red/10 rounded-3xl focus:outline-none focus:ring-4 focus:ring-brand-red/5 transition-all font-bold text-gray-700 placeholder:text-gray-300"
                                            value={formData.first_name}
                                            onChange={handleInputChange}
                                            placeholder="e.g. Emma"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="block text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Last Name</label>
                                        <input
                                            type="text"
                                            name="last_name"
                                            required
                                            className="w-full px-6 py-4 bg-gray-50/50 border-2 border-slate-300 focus:border-brand-red/10 rounded-3xl focus:outline-none focus:ring-4 focus:ring-brand-red/5 transition-all font-bold text-gray-700 placeholder:text-gray-300"
                                            value={formData.last_name}
                                            onChange={handleInputChange}
                                            placeholder="e.g. Johnson"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="block text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Universal Email Address</label>
                                    <div className="relative group">
                                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 transition-colors group-focus-within:text-brand-red">
                                            <Mail size={18} />
                                        </span>
                                        <input
                                            type="email"
                                            name="email"
                                            required
                                            className="w-full pl-14 pr-6 py-4 bg-gray-50/50 border-2 border-slate-300 focus:border-brand-red/10 rounded-3xl focus:outline-none focus:ring-4 focus:ring-brand-red/5 transition-all font-bold text-gray-700 placeholder:text-gray-300"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            placeholder="customer@travellounge.mu"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-3">
                                        <label className="block text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Contact Phone</label>
                                        <div className="relative group">
                                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 transition-colors group-focus-within:text-brand-red">
                                                <Phone size={18} />
                                            </span>
                                            <input
                                                type="text"
                                                name="phone"
                                                className="w-full pl-14 pr-6 py-4 bg-gray-50/50 border-2 border-slate-300 focus:border-brand-red/10 rounded-3xl focus:outline-none focus:ring-4 focus:ring-brand-red/5 transition-all font-bold text-gray-700 placeholder:text-gray-300"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                placeholder="+230 5..."
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="block text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Primary Residence</label>
                                        <div className="relative group">
                                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 transition-colors group-focus-within:text-brand-red">
                                                <Globe size={18} />
                                            </span>
                                            <input
                                                type="text"
                                                name="country"
                                                className="w-full pl-14 pr-6 py-4 bg-gray-50/50 border-2 border-slate-300 focus:border-brand-red/10 rounded-3xl focus:outline-none focus:ring-4 focus:ring-brand-red/5 transition-all font-bold text-gray-700 placeholder:text-gray-300"
                                                value={formData.country}
                                                onChange={handleInputChange}
                                                placeholder="Mauritius"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-8 bg-red-50/30 rounded-[32px] border-2 border-red-50">
                                    <div className="flex gap-4">
                                        <div className="p-3 bg-white rounded-2xl shadow-sm text-brand-red">
                                            <Mail size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-red-900 mb-0.5">Marketing Concierge</h4>
                                            <p className="text-[10px] text-red-600/60 font-black uppercase tracking-widest">Enable newsletter & special offers</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="is_subscriber"
                                            className="sr-only peer"
                                            checked={formData.is_subscriber}
                                            onChange={handleInputChange}
                                        />
                                        <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-7 peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                                    </label>
                                </div>

                                <div className="pt-10 flex items-center justify-between border-t border-gray-50">
                                    <div className="flex gap-4 w-full md:w-auto">
                                        <Link to="/customers" className="flex-1 md:flex-none">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="w-full px-8 py-4 border-slate-300 text-gray-400 font-bold rounded-3xl hover:bg-gray-50 transition-all uppercase tracking-widest text-[10px]"
                                            >
                                                Cancel
                                            </Button>
                                        </Link>
                                        <Button
                                            type="submit"
                                            disabled={formLoading}
                                            className="flex-1 md:flex-none bg-brand-red hover:bg-red-700 text-white px-12 py-4 rounded-3xl flex items-center justify-center shadow-2xl shadow-red-600/20 transition-all font-black uppercase tracking-[0.15em] text-xs hover:scale-[1.02] active:scale-[0.98]"
                                        >
                                            {formLoading ? (
                                                <>
                                                    <Loader2 className="animate-spin mr-3" size={18} />
                                                    Processing...
                                                </>
                                            ) : (
                                                <>
                                                    <UserPlus size={20} className="mr-3" />
                                                    Register records
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                <div className="xl:col-span-4 space-y-8">
                    <Card className="border border-slate-300 shadow-xl shadow-gray-100 rounded-3xl overflow-hidden bg-brand-charcoal text-white">
                        <CardHeader className="pt-8 px-8">
                            <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                                <Shield size={16} className="text-brand-red" /> Lead Management
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-8 pb-8 space-y-8">
                            <div className="space-y-4">
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">Initial Status</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['Active', 'Lead', 'Inactive', 'Blocked'].map((status) => (
                                        <button
                                            key={status}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, status }))}
                                            className={`py-3 px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${formData.status === status
                                                ? 'bg-red-600 border-red-600 text-white'
                                                : 'bg-white/5 border-transparent text-gray-400 hover:border-white/10'
                                                }`}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-8 border-t border-white/5 space-y-4">
                                <div className="flex gap-4 items-center">
                                    <div className="w-10 h-10 rounded-xl bg-red-600/20 flex items-center justify-center text-brand-red">
                                        <UserCheck size={20} />
                                    </div>
                                    <div>
                                        <h5 className="text-xs font-black uppercase tracking-wider text-white">Customer Sync</h5>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Active Database Level</p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-[10px] font-bold">
                                        <span className="text-gray-400">Marketing Profile</span>
                                        <span className={formData.is_subscriber ? 'text-green-500' : 'text-orange-500'}>
                                            {formData.is_subscriber ? 'ACTIVE' : 'INACTIVE'}
                                        </span>
                                    </div>
                                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-red-600 transition-all duration-500"
                                            style={{ width: formData.first_name && formData.last_name && formData.email ? '100%' : '40%' }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="p-8 bg-red-50 rounded-[40px] border border-red-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 text-red-100 translate-x-4 -translate-y-4 transition-transform group-hover:scale-110">
                            <Globe size={120} />
                        </div>
                        <div className="relative">
                            <h4 className="text-sm font-black text-red-900 mb-2 uppercase tracking-widest underline decoration-red-200 decoration-4 underline-offset-4">Global Reach</h4>
                            <p className="text-xs text-red-700/80 font-bold leading-relaxed">
                                By adding this customer, you expand our global traveler outreach.
                                Ensure data accuracy for localized itineraries and currency calculations.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateCustomer;
