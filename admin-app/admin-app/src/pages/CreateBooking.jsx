import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { Button } from '../components/Button';
import { ArrowLeft, Calendar, Users, MapPin, Loader2, Info, CheckCircle2, Clock, PlusCircle, Trash2, Plane } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { showAlert } from '../utils/swal';
import { sanitizeInput } from '../utils/sanitize';

const CreateBooking = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [formLoading, setFormLoading] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [services, setServices] = useState([]);
    const [formData, setFormData] = useState({
        customer_id: '',
        check_in_date: '',
        status: 'Pending',
        pax_adults: 1,
        pax_children: 0
    });

    const [items, setItems] = useState([
        { id: crypto.randomUUID(), type: 'Lounge', name: '', amount: '', isManual: false }
    ]);

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
        } catch {
            console.error('Error loading services for bookings');
        }
    };

    const fetchCustomers = async () => {
        try {
            const { data, error } = await supabase
                .from('customers')
                .select('id, first_name, last_name, email')
                .order('first_name');
            if (!error) setCustomers(data || []);
        } catch {
            console.error('Error loading customers for bookings');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const addItem = () => {
        setItems([...items, { id: crypto.randomUUID(), type: 'Hotel', name: '', amount: '', isManual: false }]);
    };

    const removeItem = (id) => {
        if (items.length > 1) {
            setItems(items.filter(item => item.id !== id));
        }
    };

    const handleItemChange = (id, field, value) => {
        setItems(prev => prev.map(item => {
            if (item.id !== id) return item;

            let updated = { ...item, [field]: value };

            if (field === 'type') {
                updated.name = '';
                updated.amount = '';
                updated.isManual = false;
            }

            if (field === 'name') {
                if (value === 'Other') {
                    updated.isManual = true;
                    updated.name = '';
                } else {
                    const service = services.find(p => p.name === value);
                    if (service) {
                        updated.amount = service.lowestPrice || 0;
                    }
                }
            }

            return updated;
        }));
    };

    const toggleManual = (id) => {
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, isManual: !item.isManual, name: '' } : item
        ));
    };

    const calculateTotal = () => {
        return items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);

        if (!formData.customer_id) {
            showAlert('Selection Required', 'Please associate this booking with a verified customer.', 'error');
            setFormLoading(false);
            return;
        }

        const totalAmount = calculateTotal();
        if (totalAmount <= 0) {
            showAlert('Invalid Total', 'The booking total must be greater than zero.', 'error');
            setFormLoading(false);
            return;
        }

        try {
            const bookingData = {
                customer_id: formData.customer_id,
                check_in_date: formData.check_in_date,
                status: formData.status,
                pax_adults: parseInt(formData.pax_adults),
                pax_children: parseInt(formData.pax_children),
                amount: totalAmount,
                total_price: totalAmount,
                service_type: items[0].type,
                service_name: sanitizeInput(items.length > 1 ? `${items[0].name} (+${items.length - 1} more)` : items[0].name),
                created_at: new Date().toISOString()
            };

            const itemsData = items.map(it => ({
                service_id: services.find(s => s.name === it.name)?.id || null,
                service_name: sanitizeInput(it.name),
                service_category: it.type,
                amount: parseFloat(it.amount) || 0
            }));

            const { error } = await supabase.rpc('create_booking_v1', {
                p_booking_data: bookingData,
                p_items_data: itemsData
            });

            if (error) throw error;

            await queryClient.invalidateQueries({ queryKey: ['bookings'] });
            showAlert('Success', 'Multi-itinerary booking created and synced.', 'success');
            navigate('/bookings');
        } catch (error) {
            console.error('Create Booking Error:', error);
            showAlert('Reservation Failed', error.message || 'Could not create multi-service booking', 'error');
        } finally {
            setFormLoading(false);
        }
    };


    return (
        <div className="w-full h-full min-h-[calc(100vh-64px)] animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between mb-8 border-b border-slate-300 pb-6">
                <div className="flex items-center gap-6">
                    <Link
                        to="/bookings"
                        className="p-3 bg-white hover:bg-gray-50 border border-slate-300 rounded-2xl transition-all text-gray-400 hover:text-brand-red shadow-sm"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">New Booking</h1>
                        <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">Global Travel Planner / Manual Entry</p>
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
                                    <Plane size={24} />
                                </div>
                                <CardTitle className="text-xl font-black text-gray-900 uppercase tracking-tight">Service Itinerary Overview</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-10">
                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="space-y-3">
                                    <label className="block text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Associated Traveler</label>
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
                                            <option value="">Search customer profile...</option>
                                            {customers.map(c => (
                                                <option key={c.id} value={c.id}>
                                                    {c.first_name} {c.last_name} ({c.email})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-3">
                                        <label className="block text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Start Date</label>
                                        <div className="relative group">
                                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 transition-colors group-focus-within:text-brand-red">
                                                <Calendar size={18} />
                                            </span>
                                            <input
                                                type="date"
                                                name="check_in_date"
                                                required
                                                className="w-full pl-14 pr-6 py-4 bg-gray-50/50 border-2 border-slate-300 focus:border-brand-red/10 rounded-3xl focus:outline-none focus:ring-4 focus:ring-brand-red/5 transition-all font-bold text-gray-700"
                                                value={formData.check_in_date}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="block text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Adults</label>
                                        <input
                                            type="number"
                                            name="pax_adults"
                                            min="1"
                                            className="w-full px-6 py-4 bg-gray-50/50 border-2 border-slate-300 focus:border-brand-red/10 rounded-3xl focus:outline-none transition-all font-bold text-gray-700"
                                            value={formData.pax_adults}
                                            onChange={handleInputChange}
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <label className="block text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Children</label>
                                        <input
                                            type="number"
                                            name="pax_children"
                                            min="0"
                                            className="w-full px-6 py-4 bg-gray-50/50 border-2 border-slate-300 focus:border-brand-red/10 rounded-3xl focus:outline-none transition-all font-bold text-gray-700"
                                            value={formData.pax_children}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-slate-300">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Reserved Services</h3>
                                        <Button
                                            type="button"
                                            onClick={addItem}
                                            className="bg-gray-900 hover:bg-black text-white px-6 py-2 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-xl"
                                        >
                                            <PlusCircle size={14} /> Add Service
                                        </Button>
                                    </div>

                                    <div className="space-y-6">
                                        {items.map((item, index) => (
                                            <div key={item.id} className="p-8 bg-gray-50/50 rounded-[2.5rem] border border-slate-300 relative group/item hover:bg-white hover:shadow-xl transition-all duration-500">
                                                <div className="absolute -top-3 -left-3 w-8 h-8 bg-white border border-slate-300 rounded-full flex items-center justify-center text-[10px] font-black text-gray-400">
                                                    {index + 1}
                                                </div>

                                                {items.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeItem(item.id)}
                                                        className="absolute top-6 right-6 p-2 text-gray-300 hover:text-brand-red hover:bg-red-50 rounded-xl transition-all"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    <div className="space-y-3">
                                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
                                                        <select
                                                            className="w-full px-6 py-3 bg-white border-2 border-slate-300 focus:border-brand-red/20 rounded-2xl focus:outline-none transition-all font-bold text-gray-700 appearance-none"
                                                            value={item.type}
                                                            onChange={(e) => handleItemChange(item.id, 'type', e.target.value)}
                                                        >
                                                            <option value="Lounge">Lounge Access</option>
                                                            <option value="Hotel">Hotel / Resort</option>
                                                            <option value="Activity">Local Activity</option>
                                                            <option value="Tour">Guided Tour</option>
                                                            <option value="Cruise">Ocean Cruise</option>
                                                        </select>
                                                    </div>

                                                    <div className="space-y-3">
                                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Destination</label>
                                                        <div className="flex gap-2">
                                                            {item.isManual ? (
                                                                <input
                                                                    type="text"
                                                                    required
                                                                    className="w-full px-6 py-3 bg-white border-2 border-slate-300 focus:border-brand-red/20 rounded-2xl focus:outline-none transition-all font-bold text-gray-700"
                                                                    value={item.name}
                                                                    onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                                                                    placeholder="Custom destination..."
                                                                />
                                                            ) : (
                                                                <select
                                                                    required
                                                                    className="w-full px-6 py-3 bg-white border-2 border-slate-300 focus:border-brand-red/20 rounded-2xl focus:outline-none transition-all font-bold text-gray-700 appearance-none"
                                                                    value={item.name}
                                                                    onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                                                                >
                                                                    <option value="">Select service...</option>
                                                                    {services
                                                                        .filter(p => {
                                                                            if (item.type === 'Hotel') return p.service_type === 'hotel';
                                                                            if (item.type === 'Activity') return p.service_type === 'activity';
                                                                            if (item.type === 'Tour') return p.service_type === 'tour';
                                                                            if (item.type === 'Cruise') return p.service_type === 'cruise';
                                                                            if (item.type === 'Lounge') return p.service_type === 'lounge';
                                                                            return true;
                                                                        })
                                                                        .map(p => (
                                                                            <option key={p.id} value={p.name}>{p.name}</option>
                                                                        ))
                                                                    }
                                                                    <option value="Other">+ Manual Entry</option>
                                                                </select>
                                                            )}
                                                            {item.isManual && (
                                                                <button type="button" onClick={() => toggleManual(item.id)} className="px-3 text-xs font-black text-gray-400 underline">List</button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="space-y-3">
                                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Price (MUR)</label>
                                                        <div className="relative">
                                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 font-bold">MUR</span>
                                                            <input
                                                                type="number"
                                                                required
                                                                className="w-full pl-14 pr-6 py-3 bg-white border-2 border-slate-300 focus:border-brand-red/20 rounded-2xl focus:outline-none transition-all font-bold text-gray-700"
                                                                value={item.amount}
                                                                onChange={(e) => handleItemChange(item.id, 'amount', e.target.value)}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="flex items-end pb-1">
                                                        <div className="w-full p-4 bg-gray-50 rounded-2xl border border-slate-300 flex items-center justify-between">
                                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Service Item Total</span>
                                                            <span className="text-sm font-black text-gray-900">MUR {Number(item.amount || 0).toLocaleString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-8 bg-red-50/50 rounded-[2.5rem] border-2 border-dashed border-red-300 flex items-center justify-between">
                                    <div>
                                        <h4 className="text-[10px] font-black text-brand-red uppercase tracking-widest mb-1">Total Booking Revenue</h4>
                                        <p className="text-xs text-black/50 font-bold uppercase tracking-tight">Consolidated Multi-Service Net</p>
                                    </div>
                                    <div className="text-3xl font-black text-brand-red italic">
                                        MUR {calculateTotal().toLocaleString()}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="block text-[11px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Itinerary Status</label>
                                    <select
                                        name="status"
                                        className="w-full px-6 py-4 bg-gray-50/50 border-2 border-slate-300 focus:border-brand-red/10 rounded-3xl focus:outline-none focus:ring-4 focus:ring-brand-red/5 transition-all font-bold text-gray-700 appearance-none"
                                        value={formData.status}
                                        onChange={handleInputChange}
                                    >
                                        <option value="Pending">Pending Confirmation</option>
                                        <option value="Confirmed">Confirmed / Active</option>
                                        <option value="Cancelled">Cancelled / Void</option>
                                    </select>
                                </div>

                                <div className="pt-10 flex items-center justify-between border-t border-slate-300">
                                    <div className="flex gap-4 w-full md:w-auto">
                                        <Link to="/bookings" className="flex-1 md:flex-none">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="w-full px-8 py-4 border-slate-300 text-gray-400 font-bold rounded-3xl hover:bg-gray-50 transition-all uppercase tracking-widest text-[10px]"
                                            >
                                                Abort
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
                                                    Reserving...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle2 size={20} className="mr-3" />
                                                    Confirm Booking
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
                                    <Info size={16} className="text-brand-red" /> Travel Guide
                                </CardTitle>
                        </CardHeader>
                        <CardContent className="px-8 pb-8 space-y-8">
                            <div className="space-y-4">
                                <div className="flex gap-4 items-center">
                                    <div className="w-10 h-10 rounded-xl bg-red-600/20 flex items-center justify-center text-brand-red">
                                        <Clock size={20} />
                                    </div>
                                    <div>
                                        <h5 className="text-xs font-black uppercase tracking-wider text-white">Real-time Scheduler</h5>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Global Master Plan</p>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-400 leading-relaxed font-medium">
                                    Manual bookings are synchronized with our automated travel network. Confirm availability before finalizing the reservation in this hub.
                                </p>
                            </div>

                            <div className="pt-8 border-t border-white/5">
                                <div className="p-8 bg-red-600/10 rounded-[40px] border border-white/5 relative overflow-hidden text-center">
                                    <h4 className="text-[10px] font-black text-brand-red uppercase tracking-[0.2em]">Sync Status</h4>
                                    <div className="text-2xl font-black text-white italic">SYNCHRONIZED</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="p-8 bg-red-50 rounded-[40px] border border-red-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 text-red-100 translate-x-4 -translate-y-4 transition-transform group-hover:scale-110">
                            <MapPin size={120} />
                        </div>
                        <div className="relative">
                            <h4 className="text-sm font-black text-red-900 mb-2 uppercase tracking-widest underline decoration-red-200 decoration-4 underline-offset-4">Location Finder</h4>
                            <p className="text-xs text-red-700/80 font-bold leading-relaxed">
                                Localized itineraries automatically update based on the geolocation of the selected activity service.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateBooking;
