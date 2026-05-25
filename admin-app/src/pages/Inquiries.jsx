import React, { useState, useEffect, useMemo } from 'react';
import { 
    Mail, Search, Trash2, Loader2,
    User, Calendar, Phone, MessageSquare,
    AlertCircle, Inbox, ChevronLeft, ChevronRight
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader } from '../components/Card';
import { Button } from '../components/Button';
import { showAlert, showConfirm } from '../utils/swal';
import { sanitize } from '../utils/sanitize';

const Inquiries = () => {
    const [transmissions, setTransmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [viewingTransmission, setViewingTransmission] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const perPage = 6;

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch standard inquiries
            const { data: inquiriesData, error: inqError } = await supabase
                .from('inquiries')
                .select('*')
                .order('created_at', { ascending: false });

            if (inqError) throw inqError;

            // Fetch subscribers
            const { data: subscribersData, error: subError } = await supabase
                .from('subscribers')
                .select('*')
                .order('created_at', { ascending: false });

            if (subError) throw subError;

            // Transform subscribers to match transmission shape
            const transformedSubscribers = (subscribersData || []).map(sub => ({
                id: sub.id,
                name: 'Newsletter Subscriber',
                email: sub.email,
                subject: 'New Subscription',
                message: `User subscribed to newsletter with email: ${sub.email}`,
                status: sub.status === 'active' ? 'read' : 'unread', // Newsletter signups are usually "read" but we can treat them as unread if new
                created_at: sub.created_at,
                type: 'newsletter'
            }));

            const combined = [
                ...(inquiriesData || []).map(i => ({ ...i, type: 'inquiry' })),
                ...transformedSubscribers
            ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            setTransmissions(combined);
        } catch (error) {
            console.error('Error fetching data:', error);
            showAlert('Error', 'Failed to load inbox data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (item) => {
        if (item.type !== 'inquiry') return;
        try {
            const { error } = await supabase
                .from('inquiries')
                .update({ status: 'read' })
                .eq('id', item.id);

            if (error) throw error;
            setTransmissions(prev => prev.map(i => i.id === item.id ? { ...i, status: 'read' } : i));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const deleteItem = async (item) => {
        const result = await showConfirm(
            `Delete ${item.type === 'inquiry' ? 'Inquiry' : 'Subscriber'}?`,
            'Are you sure you want to remove this record?'
        );

        if (!result.isConfirmed) return;

        try {
            const table = item.type === 'inquiry' ? 'inquiries' : 'subscribers';
            const { error } = await supabase
                .from(table)
                .delete()
                .eq('id', item.id);

            if (error) throw error;
            showAlert('Deleted', 'Removed successfully', 'success');
            fetchData();
            if (viewingTransmission?.id === item.id) setViewingTransmission(null);
        } catch (error) {
            console.error('Error deleting:', error);
            showAlert('Error', 'Failed to delete record', 'error');
        }
    };

    const processedItems = useMemo(() => {
        return transmissions.filter(item => {
            const matchesSearch = 
                item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.message?.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
            
            return matchesSearch && matchesStatus;
        });
    }, [transmissions, searchTerm, statusFilter]);

    const totalPages = Math.ceil(processedItems.length / perPage);
    const paginatedItems = useMemo(() => {
        return processedItems.slice((currentPage - 1) * perPage, currentPage * perPage);
    }, [processedItems, currentPage]);

    const handleViewDetails = (item) => {
        setViewingTransmission(item);
        if (item.status === 'unread' && item.type === 'inquiry') {
            markAsRead(item);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Inbox</h1>
                    <p className="text-gray-400 text-sm font-medium">Manage customer inquiries and newsletter subscribers</p>
                </div>
                <div className="flex items-center gap-2">
                    {/* <Button
                        onClick={fetchData}
                        variant="outline"
                        className="text-gray-500 border-slate-300 flex items-center gap-2"
                    >
                        <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Sync
                    </Button> */}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Inquiry List */}
                <Card className="lg:col-span-1 border border-slate-300 shadow-xl shadow-gray-200/50 rounded-3xl overflow-hidden bg-white flex flex-col h-[700px]">
                    <CardHeader className="border-b border-gray-50 p-6 space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-gray-300" size={16} />
                            <input
                                type="text"
                                placeholder="Search inbox..."
                                className="pl-9 pr-4 py-2.5 w-full border border-slate-300 bg-gray-50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all font-medium"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            {['all', 'unread', 'read'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all flex-1 ${
                                        statusFilter === status 
                                        ? 'bg-brand-red text-white border-brand-red shadow-lg shadow-red-100' 
                                        : 'bg-white text-gray-400 border-gray-100 hover:bg-gray-50 text-center'
                                    }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </CardHeader>

                    <CardContent className="p-0 overflow-y-auto flex-1">
                        {loading ? (
                            <div className="py-20 flex flex-col items-center">
                                <Loader2 className="animate-spin text-brand-red mb-4" size={32} />
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Opening Secure Comms...</p>
                            </div>
                        ) : transmissions.length === 0 ? (
                            <div className="py-20 text-center flex flex-col items-center gap-4 px-6">
                                <Inbox size={48} className="text-gray-100" />
                                <p className="text-gray-400 font-bold">Your inbox is clear</p>
                                <p className="text-gray-300 text-xs">When customers interact with the site, their queries will appear here.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {/* ORIGINAL:
                                {processedItems.map((item) => (
                                */}
                                {paginatedItems.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => handleViewDetails(item)}
                                        className={`w-full text-left p-6 hover:bg-gray-50 transition-all flex flex-col gap-2 relative ${
                                            viewingTransmission?.id === item.id ? 'bg-red-50/30' : ''
                                        }`}
                                    >
                                        {item.status === 'unread' && (
                                            <div className="absolute top-6 right-6 w-2 h-2 bg-brand-red rounded-full shadow-lg shadow-red-200" />
                                        )}
                                        <div className="flex justify-between items-start pr-4">
                                            <div className="flex flex-col gap-1">
                                                <h3 className="text-sm font-black text-gray-900 truncate">{item.name}</h3>
                                                <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full w-fit ${
                                                    item.type === 'inquiry' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                                                }`}>
                                                    {item.type}
                                                </span>
                                            </div>
                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">
                                                {new Date(item.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-xs font-bold text-brand-red truncate uppercase tracking-tight">{item.subject}</p>
                                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{item.message}</p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </CardContent>
                    
                    {/* Pagination Footer */}
                    {processedItems.length > 0 && (
                        <div className="p-4 border-t border-slate-100 flex items-center justify-between gap-4 bg-slate-50/50 flex-shrink-0">
                            <span className="text-[10px] text-slate-500 font-bold">
                                Page {currentPage} of {totalPages || 1}
                            </span>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="p-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-all text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft size={14} />
                                </button>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                    className="p-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-all text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight size={14} />
                                </button>
                            </div>
                        </div>
                    )}
                </Card>

                {/* Details */}
                <Card className="lg:col-span-2 border border-slate-300 shadow-xl shadow-gray-200/50 rounded-[2.5rem] bg-white overflow-hidden flex flex-col h-[700px]">
                    {viewingTransmission ? (
                        <>
                            <CardHeader className="p-8 border-b border-gray-50 bg-gray-50/30">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex items-center gap-4">
                                        <div className="h-14 w-14 rounded-2xl bg-white border-2 border-white shadow-xl flex items-center justify-center text-brand-red">
                                            <User size={24} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black text-gray-900">{viewingTransmission.name}</h2>
                                            <div className="flex items-center gap-4 text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">
                                                <span className="flex items-center gap-1.5"><Mail size={12} className="text-brand-red" /> {viewingTransmission.email}</span>
                                                {viewingTransmission.phone && <span className="flex items-center gap-1.5"><Phone size={12} className="text-brand-red" /> {viewingTransmission.phone}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            onClick={() => deleteItem(viewingTransmission)}
                                            variant="outline"
                                            className="text-gray-400 hover:text-brand-red border-slate-300 p-3 h-auto rounded-xl"
                                        >
                                            <Trash2 size={18} />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-10 flex-1 overflow-y-auto space-y-8">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <AlertCircle size={16} className="text-brand-red" />
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Subject</span>
                                    </div>
                                    <h3 className="text-2xl font-black text-gray-900">{viewingTransmission.subject}</h3>
                                </div>

                                <div className="p-8 bg-gray-50/50 rounded-[2rem] border border-gray-100 relative">
                                    <MessageSquare size={40} className="absolute -top-4 -right-4 text-gray-100 rotate-12" />
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} className="text-gray-400" />
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Received {new Date(viewingTransmission.created_at).toLocaleString()}</span>
                                        </div>
                                        <div 
                                            className="text-gray-700 leading-relaxed font-medium whitespace-pre-wrap"
                                            dangerouslySetInnerHTML={{ __html: sanitize(viewingTransmission.message) }}
                                        />
                                    </div>
                                </div>

                                {viewingTransmission.type === 'inquiry' && (
                                    <div className="pt-8 border-t border-gray-50">
                                        <a 
                                            href={`mailto:${viewingTransmission.email}?subject=RE: ${viewingTransmission.subject}`}
                                            className="inline-flex items-center gap-3 bg-slate-950 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all shadow-xl shadow-slate-200"
                                        >
                                            <Mail size={16} /> Reply via Email
                                        </a>
                                    </div>
                                )}
                            </CardContent>
                        </>
                    ) : (
                        <CardContent className="p-20 flex flex-col items-center justify-center gap-6 h-full text-center">
                            <div className="w-24 h-24 bg-gray-50 rounded-[2.5rem] flex items-center justify-center text-gray-200 border border-gray-100">
                                <Inbox size={40} />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Select a message</h3>
                                <p className="text-gray-400 text-sm max-w-xs mx-auto">Select an item from the list to view the full details and respond.</p>
                            </div>
                        </CardContent>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default Inquiries;
