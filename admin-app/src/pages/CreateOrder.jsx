import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { Button } from '../components/Button';
import { ArrowLeft, Package, Users, CreditCard, Loader2, Info, CheckCircle2, ShoppingBag, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { showAlert } from '../utils/swal';

const CreateOrder = () => {
    const navigate = useNavigate();
    const [formLoading, setFormLoading] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [services, setServices] = useState([]);
    const [formData, setFormData] = useState({
        customer_id: '',
        customer_name: '',
        amount: 0,
        status: 'Pending',
        payment_method: 'Credit Card',
        items: [],
        total_items: 0
    });

    useEffect(() => {
        fetchCustomers();
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            const { data, error } = await supabase
                .from('services')
                .select('id, name, service_type, service_pricing(price)')
                .order('name');
            if (!error && data) {
                const enriched = data.map(s => {
                    const prices = (s.service_pricing || []).map(p => Number(p.price)).filter(p => p > 0);
                    return {
                        ...s,
                        lowestPrice: prices.length > 0 ? Math.min(...prices) : 0
                    };
                });
                setServices(enriched);
            }
        } catch (error) {
            console.error('Error loading services', error);
        }
    };

    const fetchCustomers = async () => {
        try {
            const { data, error } = await supabase
                .from('customers')
                .select('id, first_name, last_name')
                .order('first_name');
            if (!error) setCustomers(data || []);
        } catch (error) {
            console.error('Error loading customers for orders', error);
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

    const addItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { service_id: '', service_name: '', quantity: 1, unit_price: 0 }]
        }));
    };

    const removeItem = (index) => {
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData(prev => {
            const totals = calculateTotals(newItems);
            return { ...prev, items: newItems, ...totals };
        });
    };

    const updateItem = (index, field, value) => {
        const newItems = [...formData.items];
        const item = { ...newItems[index] };

        if (field === 'service_id') {
            const prod = services.find(p => p.id === value);
            item.service_id = value;
            item.service_name = prod ? prod.name : '';
            item.unit_price = prod ? prod.lowestPrice : 0;
        } else {
            item[field] = value;
        }

        newItems[index] = item;
        const totals = calculateTotals(newItems);
        setFormData(prev => ({ ...prev, items: newItems, ...totals }));
    };

    const calculateTotals = (items) => {
        const amount = items.reduce((sum, it) => sum + (it.quantity * it.unit_price), 0);
        const total_items = items.reduce((sum, it) => sum + Number(it.quantity), 0);
        return { amount, total_items };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);

        if (!formData.customer_id) {
            showAlert('Selection Error', 'Please choose a customer from the global database.', 'error');
            setFormLoading(false);
            return;
        }

        if (formData.items.length === 0) {
            showAlert('Inventory Error', 'Please specify at least one service for this order.', 'warning');
            setFormLoading(false);
            return;
        }

        try {
            // 1. Insert Order
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .insert([{
                    customer_id: formData.customer_id,
                    customer_name: formData.customer_name,
                    amount: formData.amount,
                    status: formData.status,
                    payment_method: formData.payment_method,
                    total_items: formData.total_items,
                    items: formData.items, // Keep JSONB for legacy compatibility
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }])
                .select()
                .single();

            if (orderError) throw orderError;

            // 2. Insert Order Items
            const itemInserts = formData.items.map(it => ({
                order_id: orderData.id,
                service_id: it.service_id || null,
                service_name: it.service_name,
                quantity: parseInt(it.quantity),
                unit_price: parseFloat(it.unit_price)
            }));

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(itemInserts);

            if (itemsError) throw itemsError;

            showAlert('Success', 'Order processed and recorded successfully.', 'success');
            navigate('/orders');
        } catch (error) {
            console.error('Create Order Error:', error);
            showAlert('Operation Failed', error.message || 'Could not create order', 'error');
        } finally {
            setFormLoading(false);
        }
    };

    return (
        <div className="w-full h-full min-h-[calc(100vh-64px)] animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-6">
                <div className="flex items-center gap-6">
                    <Link
                        to="/orders"
                        className="p-3 bg-white hover:bg-gray-50 border border-slate-300 rounded-2xl transition-all text-gray-400 hover:text-brand-red shadow-sm"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Generate New Order</h1>
                        <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">Order Provisioning System</p>
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
                                    <Package size={28} />
                                </div>
                                <CardTitle className="text-xl font-black text-gray-900 uppercase tracking-tight">Order Identification</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-10">
                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="space-y-3">
                                    <label className="block text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Customer Selection</label>
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
                                            <option value="">Select a registered traveler...</option>
                                            {customers.map(customer => (
                                                <option key={customer.id} value={customer.id}>
                                                    {customer.first_name} {customer.last_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-6 pt-4">
                                    <div className="flex items-center justify-between ml-1">
                                        <label className="block text-[11px] font-black text-gray-500 uppercase tracking-[0.2em]">Inventory Items</label>
                                        <button
                                            type="button"
                                            onClick={addItem}
                                            className="text-[10px] font-black text-brand-red uppercase tracking-widest flex items-center gap-1.5 hover:opacity-70 transition-all"
                                        >
                                            <Plus size={14} /> Add Service
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {formData.items.map((it, idx) => (
                                            <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-gray-50/50 p-6 rounded-[2rem] border border-slate-300">
                                                <div className="md:col-span-5 space-y-2">
                                                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Service</label>
                                                    <select
                                                        className="w-full px-4 py-3 bg-white border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-red font-bold text-gray-700 text-sm appearance-none"
                                                        value={it.service_id}
                                                        onChange={(e) => updateItem(idx, 'service_id', e.target.value)}
                                                        required
                                                    >
                                                        <option value="">Select Service...</option>
                                                        {services.map(p => (
                                                            <option key={p.id} value={p.id}>{p.name} (Rs {p.lowestPrice})</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="md:col-span-2 space-y-2">
                                                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Qty</label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        className="w-full px-4 py-3 bg-white border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-red font-bold text-center"
                                                        value={it.quantity}
                                                        onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                                                        required
                                                    />
                                                </div>
                                                <div className="md:col-span-3 space-y-2">
                                                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Unit Price</label>
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            className="w-full pl-4 pr-10 py-3 bg-white border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-red font-bold"
                                                            value={it.unit_price}
                                                            readOnly
                                                        />
                                                    </div>
                                                </div>
                                                <div className="md:col-span-2 flex justify-end">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeItem(idx)}
                                                        className="p-3 bg-red-50 text-brand-red rounded-2xl hover:bg-red-100 transition-all shadow-sm shadow-red-100"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}

                                        {formData.items.length === 0 && (
                                            <div className="py-12 border-2 border-dashed border-gray-100 rounded-[2.5rem] flex flex-col items-center justify-center text-gray-300">
                                                <ShoppingBag size={40} className="mb-4 opacity-20" />
                                                <p className="text-[11px] font-black uppercase tracking-widest">No services added to cart</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-3">
                                        <label className="block text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Provision Status</label>
                                        <select
                                            name="status"
                                            className="w-full px-6 py-4 bg-gray-50/50 border-2 border-slate-300 focus:border-brand-red/10 rounded-3xl focus:outline-none focus:ring-4 focus:ring-brand-red/5 transition-all font-bold text-gray-700 appearance-none"
                                            value={formData.status}
                                            onChange={handleInputChange}
                                        >
                                            <option value="Pending">Pending / Unpaid</option>
                                            <option value="Processing">Processing / Active</option>
                                            <option value="Shipped">Shipped / Sent</option>
                                            <option value="Completed">Completed / Full Close</option>
                                            <option value="Cancelled">Cancelled / Void</option>
                                        </select>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="block text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Payment Method</label>
                                        <div className="relative group">
                                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 transition-colors group-focus-within:text-brand-red">
                                                <CreditCard size={18} />
                                            </span>
                                            <select
                                                name="payment_method"
                                                className="w-full pl-14 pr-10 py-4 bg-gray-50/50 border-2 border-slate-300 focus:border-brand-red/10 rounded-3xl focus:outline-none focus:ring-4 focus:ring-brand-red/5 transition-all font-bold text-gray-700 appearance-none"
                                                value={formData.payment_method}
                                                onChange={handleInputChange}
                                            >
                                                <option value="Credit Card">Credit Card</option>
                                                <option value="PayPal">PayPal</option>
                                                <option value="Bank Transfer">Bank Transfer</option>
                                                <option value="Cash">Cash / Walk-in</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-10 flex items-center justify-between border-t border-gray-50">
                                    <div className="flex gap-4 w-full md:w-auto">
                                        <Link to="/orders" className="flex-1 md:flex-none">
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
                                                    Create Order
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
                                <Info size={16} className="text-brand-red" /> Executive Protocol
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-8 pb-8 space-y-8">
                            <div className="space-y-4">
                                <div className="flex gap-4 items-center">
                                    <div className="w-10 h-10 rounded-xl bg-red-600/20 flex items-center justify-center text-brand-red">
                                        <CheckCircle2 size={20} />
                                    </div>
                                    <div>
                                        <h5 className="text-xs font-black uppercase tracking-wider text-white">Security Compliance</h5>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">PCI-DSS Verification</p>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-400 leading-relaxed">
                                    Every order processed through this gateway is audited for AML (Anti-Money Laundering) compliance. Ensure the customer identity matches the global records.
                                </p>
                            </div>

                            <div className="pt-8 border-t border-white/5 space-y-4">
                                <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                                    <h6 className="text-[10px] font-black text-brand-red uppercase tracking-widest mb-3">Revenue Projection</h6>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-2xl font-black text-white">Rs {formData.amount || '0.00'}</span>
                                        <span className="text-[10px] text-gray-600 font-bold tracking-widest">NET</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="p-8 bg-red-50 rounded-[40px] border border-red-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 text-red-100 translate-x-4 -translate-y-4 transition-transform group-hover:scale-110">
                            <Package size={120} />
                        </div>
                        <div className="relative">
                            <h4 className="text-sm font-black text-red-900 mb-2 uppercase tracking-widest underline decoration-red-200 decoration-4 underline-offset-4">Transaction Hub</h4>
                            <p className="text-xs text-red-700/80 font-bold leading-relaxed">
                                Seamlessly connect traveler details with monetary transactions. This record will generate automated financial reports.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateOrder;
