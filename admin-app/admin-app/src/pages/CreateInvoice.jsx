import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { Button } from '../components/Button';
import { ArrowLeft, FileText, Users, Calendar, DollarSign, Loader2, CheckCircle2, Hash, ShieldCheck, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { showAlert } from '../utils/swal';

const CreateInvoice = () => {
    const navigate = useNavigate();
    const [formLoading, setFormLoading] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [formData, setFormData] = useState({
        customer_id: '',
        customer_name: '',
        amount: '',
        status: 'Pending',
        service: '',
        reference: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
        due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const { data, error } = await supabase
                .from('customers')
                .select('id, first_name, last_name')
                .order('first_name');
            if (!error) setCustomers(data || []);
        } catch {
            console.error('Error loading customers for invoices');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        if (name === 'customer_id') {
            const customer = customers.find(c => c.id === value);
            setFormData(prev => ({
                ...prev,
                customer_id: value,
                customer_name: customer ? `${customer.first_name} ${customer.last_name}` : ''
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);

        if (!formData.customer_id) {
            showAlert('Invoicing Error', 'Please select a recipient for this financial statement.', 'error');
            setFormLoading(false);
            return;
        }

        try {
            const { error } = await supabase
                .from('invoices')
                .insert([{
                    ...formData,
                    amount: parseFloat(formData.amount) || 0,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }]);

            if (error) throw error;

            showAlert('Success', 'Financial record initiated and invoice generated.', 'success');
            navigate('/invoices');
        } catch (error) {
            console.error('Create Invoice Error:', error);
            showAlert('Generation Failed', error.message || 'Could not generate financial document', 'error');
        } finally {
            setFormLoading(false);
        }
    };

    return (
        <div className="w-full h-full min-h-[calc(100vh-64px)] animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-6">
                <div className="flex items-center gap-6">
                    <Link
                        to="/invoices"
                        className="p-3 bg-white hover:bg-gray-50 border border-slate-300 rounded-2xl transition-all text-gray-400 hover:text-brand-red shadow-sm"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Generate Financial Statement</h1>
                        <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">Global Billing & Audit Controller</p>
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
                                    <FileText size={28} />
                                </div>
                                <CardTitle className="text-xl font-black text-gray-900 uppercase tracking-tight">Invoice Authentication</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-10">
                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-3">
                                        <label className="block text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Reference ID</label>
                                        <div className="relative group">
                                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 transition-colors group-focus-within:text-brand-red">
                                                <Hash size={18} />
                                            </span>
                                            <input
                                                type="text"
                                                name="reference"
                                                required
                                                readOnly
                                                className="w-full pl-14 pr-6 py-4 bg-gray-100 border-2 border-slate-300 transition-all font-black text-gray-500 rounded-3xl cursor-not-allowed font-mono text-sm"
                                                value={formData.reference}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="block text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Payment Maturity</label>
                                        <div className="relative group">
                                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 transition-colors group-focus-within:text-brand-red">
                                                <Calendar size={18} />
                                            </span>
                                            <input
                                                type="date"
                                                name="due_date"
                                                required
                                                className="w-full pl-14 pr-6 py-4 bg-gray-50/50 border-2 border-slate-300 focus:border-brand-red/10 rounded-3xl focus:outline-none focus:ring-4 focus:ring-brand-red/5 transition-all font-bold text-gray-700"
                                                value={formData.due_date}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="block text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Recipient Identity</label>
                                    <div className="relative group">
                                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 transition-colors group-focus-within:text-brand-red">
                                            <Users size={18} />
                                        </span>
                                        <select
                                            name="customer_id"
                                            required
                                            className="w-full pl-14 pr-10 py-4 bg-gray-50/50 border-2 border-slate-300 focus:border-brand-red/10 rounded-3xl focus:outline-none focus:ring-4 focus:ring-brand-red/5 transition-all font-bold text-gray-700 appearance-none"
                                            value={formData.customer_id}
                                            onChange={handleInputChange}
                                        >
                                            <option value="">Select traveler for billing...</option>
                                            {customers.map(customer => (
                                                <option key={customer.id} value={customer.id}>
                                                    {customer.first_name} {customer.last_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="block text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Professional Service / Itemization</label>
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            name="service"
                                            required
                                            className="w-full px-6 py-4 bg-gray-50/50 border-2 border-slate-300 focus:border-brand-red/10 rounded-3xl focus:outline-none focus:ring-4 focus:ring-brand-red/5 transition-all font-bold text-gray-700 placeholder:text-gray-300"
                                            value={formData.service}
                                            onChange={handleInputChange}
                                            placeholder="e.g. Premium Executive Lounge Access + Limousine Transfer"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-3">
                                        <label className="block text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Statement Total (MUR)</label>
                                        <div className="relative group">
                                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 transition-colors group-focus-within:text-brand-red">
                                                <DollarSign size={18} />
                                            </span>
                                            <input
                                                type="number"
                                                name="amount"
                                                required
                                                step="0.01"
                                                className="w-full pl-14 pr-6 py-4 bg-gray-50/50 border-2 border-slate-300 focus:border-brand-red/10 rounded-3xl focus:outline-none focus:ring-4 focus:ring-brand-red/5 transition-all font-bold text-gray-700 font-mono"
                                                value={formData.amount}
                                                onChange={handleInputChange}
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="block text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Auditor Status</label>
                                        <select
                                            name="status"
                                            className="w-full px-6 py-4 bg-gray-50/50 border-2 border-slate-300 focus:border-brand-red/10 rounded-3xl focus:outline-none focus:ring-4 focus:ring-brand-red/5 transition-all font-bold text-gray-700 appearance-none"
                                            value={formData.status}
                                            onChange={handleInputChange}
                                        >
                                            <option value="Pending">Pending / Unpaid</option>
                                            <option value="Paid">Processed / Paid</option>
                                            <option value="Overdue">Warning / Overdue</option>
                                            <option value="Cancelled">Void / Cancelled</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="pt-10 flex items-center justify-between border-t border-gray-50">
                                    <div className="flex gap-4 w-full md:w-auto">
                                        <Link to="/invoices" className="flex-1 md:flex-none">
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
                                                    Finalizing...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle2 size={20} className="mr-3" />
                                                    Commit Statement
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
                                <ShieldCheck size={16} className="text-brand-red" /> Fiscal Security
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-8 pb-8 space-y-8">
                            <div className="space-y-4">
                                <div className="flex gap-4 items-center">
                                    <div className="w-10 h-10 rounded-xl bg-red-600/20 flex items-center justify-center text-brand-red">
                                        <CheckCircle2 size={20} />
                                    </div>
                                    <div>
                                        <h5 className="text-xs font-black uppercase tracking-wider text-white">Anti-Fraud Layer</h5>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Global Audit Ready</p>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-400 leading-relaxed font-medium">
                                    Financial statements generated here are compliant with international travel commerce regulations. Automated backup hashes are stored in the fiscal ledger.
                                </p>
                            </div>

                            <div className="pt-8 border-t border-white/5 space-y-6">
                                <div>
                                    <h6 className="text-[10px] font-black text-brand-red uppercase tracking-widest mb-3">Instant Distribution</h6>
                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-4">
                                        <Mail className="text-gray-400" size={18} />
                                        <div className="text-[10px] font-bold text-gray-400 decoration-dotted underline">AUTO-MAIL ON COMMIT</div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="p-8 bg-red-50 rounded-[40px] border border-red-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 text-red-100 translate-x-4 -translate-y-4 transition-transform group-hover:scale-110">
                            <FileText size={120} />
                        </div>
                        <div className="relative">
                            <h4 className="text-sm font-black text-red-900 mb-2 uppercase tracking-widest underline decoration-red-200 decoration-4 underline-offset-4">Audit Hub</h4>
                            <p className="text-xs text-red-700/80 font-bold leading-relaxed">
                                Connect monetary ledger entries with specific traveler services. This record is immutable once the status is marked &apos;Processed&apos;.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateInvoice;
