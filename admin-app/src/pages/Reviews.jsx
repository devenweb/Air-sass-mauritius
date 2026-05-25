import React, { useState, useEffect, useMemo } from 'react';
import {
    Star, Search, Check, X, Trash2,
    RefreshCw, Loader2, MessageSquare,
    User, Calendar, List, LayoutGrid,
    Eye, Edit3, Save, ChevronLeft, ChevronRight
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader } from '../components/Card';
import { Button } from '../components/Button';
import Modal from '../components/Modal';
import { showAlert, showConfirm } from '../utils/swal';
import RichTextEditor from '../components/RichTextEditor';

const Reviews = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [viewMode, setViewMode] = useState('list');
    const [actionLoading, setActionLoading] = useState(null);
    const [selectedReview, setSelectedReview] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editData, setEditData] = useState({ rating: 5, comment: '', customer_name: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const perPage = 6;

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter]);

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('reviews')
                .select('*, services(name)')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setReviews(data || []);
        } catch (error) {
            console.error('Error fetching reviews:', error);
            showAlert('Error', 'Failed to load reviews', 'error');
        } finally {
            setLoading(false);
        }
    };

    const updateReviewStatus = async (id, status) => {
        setActionLoading(id);
        try {
            const { error } = await supabase
                .from('reviews')
                .update({ status })
                .eq('id', id);

            if (error) throw error;
            
            setReviews(prev => prev.map(r => r.id === id ? { ...r, status } : r));
            showAlert('Success', `Review ${status} successfully`, 'success');
        } catch (error) {
            console.error('Error updating review:', error);
            showAlert('Error', 'Failed to update review status', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const deleteReview = async (id) => {
        const result = await showConfirm(
            'Delete Review?',
            'This action cannot be undone. Are you sure?'
        );

        if (!result.isConfirmed) return;

        setActionLoading(id);
        try {
            const { error } = await supabase
                .from('reviews')
                .delete()
                .eq('id', id);

            if (error) throw error;
            
            setReviews(prev => prev.filter(r => r.id !== id));
            showAlert('Deleted', 'Review removed successfully', 'success');
        } catch (error) {
            console.error('Error deleting review:', error);
            showAlert('Error', 'Failed to delete review', 'error');
        } finally {
            setActionLoading(null);
        }
    };
    
    const saveReview = async () => {
        if (!selectedReview) return;
        setActionLoading(selectedReview.id);
        try {
            const { error } = await supabase
                .from('reviews')
                .update({
                    rating: editData.rating,
                    comment: editData.comment,
                    customer_name: editData.customer_name
                })
                .eq('id', selectedReview.id);

            if (error) throw error;
            
            setReviews(prev => prev.map(r => r.id === selectedReview.id ? { 
                ...r, 
                rating: editData.rating,
                comment: editData.comment,
                customer_name: editData.customer_name
            } : r));
            showAlert('Success', 'Review updated successfully', 'success');
            setIsEditModalOpen(false);
        } catch (error) {
            console.error('Error saving review:', error);
            showAlert('Error', 'Failed to save review changes', 'error');
        } finally {
            setActionLoading(null);
        }
    };

    const handleView = (review) => {
        setSelectedReview(review);
        setIsViewModalOpen(true);
    };

    const handleEdit = (review) => {
        setSelectedReview(review);
        setEditData({
            rating: review.rating,
            comment: review.comment,
            customer_name: review.customer_name
        });
        setIsEditModalOpen(true);
    };

    const processedReviews = useMemo(() => {
        return reviews.filter(review => {
            const matchesSearch = 
                (review.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (review.comment || '').toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesStatus = statusFilter === 'all' || review.status === statusFilter;
            
            return matchesSearch && matchesStatus;
        });
    }, [reviews, searchTerm, statusFilter]);

    const paginatedReviews = useMemo(() => {
        return processedReviews.slice((currentPage - 1) * perPage, currentPage * perPage);
    }, [processedReviews, currentPage, perPage]);

    const totalPages = useMemo(() => {
        return Math.ceil(processedReviews.length / perPage);
    }, [processedReviews, perPage]);

    const stats = useMemo(() => ({
        total: reviews.length,
        pending: reviews.filter(r => r.status === 'pending').length,
        approved: reviews.filter(r => r.status === 'approved').length,
    }), [reviews]);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Review Moderation</h1>
                    <p className="text-gray-400 text-sm font-medium">Manage and curate customer experiences and social proof</p>
                </div>
                <div className="flex items-center gap-2">
{/* 
                    <Button
                        onClick={fetchReviews}
                        variant="outline"
                        className="text-gray-500 border-slate-300 flex items-center gap-2"
                    >
                        <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Sync
                    </Button>
                    */}
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-white border border-slate-300 shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
                            <MessageSquare size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Reviews</p>
                            <p className="text-xl font-black text-gray-900">{stats.total}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white border border-slate-300 shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 bg-yellow-50 text-yellow-600 rounded-2xl">
                            <RefreshCw size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pending</p>
                            <p className="text-xl font-black text-gray-900">{stats.pending}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white border border-slate-300 shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-3 bg-green-50 text-green-600 rounded-2xl">
                            <Check size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Approved</p>
                            <p className="text-xl font-black text-gray-900">{stats.approved}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border border-slate-300 shadow-xl shadow-gray-200/50 rounded-3xl overflow-hidden bg-white">
                <CardHeader className="border-b border-gray-50 pb-4 px-8 pt-8">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                            <div className="relative w-full max-w-md">
                                <Search className="absolute left-3 top-2.5 text-gray-300" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search by customer or comment..."
                                    className="pl-9 pr-4 py-2.5 w-full border border-slate-300 bg-gray-50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all font-medium"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center bg-gray-50 rounded-2xl p-1 gap-1 border border-gray-100 shrink-0">
                                <button type="button" onClick={() => setViewMode('list')} className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white text-brand-red shadow-sm' : 'text-gray-400'}`}><List size={18} /></button>
                                <button type="button" onClick={() => setViewMode('grid')} className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white text-brand-red shadow-sm' : 'text-gray-400'}`}><LayoutGrid size={18} /></button>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                            {['all', 'pending', 'approved', 'rejected'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${
                                        statusFilter === status 
                                        ? 'bg-brand-red text-white border-brand-red shadow-lg shadow-red-100' 
                                        : 'bg-white text-gray-400 border-slate-300 hover:bg-gray-50'
                                    }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    <div className="overflow-x-auto min-h-[400px]">
                        {loading ? (
                            <div className="py-20 flex flex-col items-center">
                                <Loader2 className="animate-spin text-brand-red mb-4" size={48} />
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Querying Cloud Registry...</p>
                            </div>
                        ) : processedReviews.length === 0 ? (
                            <div className="py-20 text-center flex flex-col items-center gap-4">
                                <MessageSquare size={48} className="text-gray-200" />
                                <p className="text-gray-400 font-bold">No matching reviews found</p>
                            </div>
                        ) : viewMode === 'list' ? (
                            <table className="min-w-full divide-y divide-gray-100">
                                <thead className="bg-gray-50/50">
                                    <tr>
                                        <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</th>
                                        <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Rating & Comment</th>
                                        <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Service</th>
                                        <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                                        <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                        <th className="px-8 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {/* ORIGINAL:
                                    {processedReviews.map((review) => (
                                    */}
                                    {paginatedReviews.map((review) => (
                                        <tr key={review.id} className="even:bg-gray-100/40 hover:bg-gray-100/60 transition-colors group">
                                            <td className="px-8 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 border border-slate-300">
                                                        <User size={18} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h3 className="text-sm font-black text-gray-900 leading-tight truncate">{review.customer_name}</h3>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest truncate">Verified User</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-4">
                                                <div className="max-w-xs">
                                                    <div className="flex items-center gap-0.5 mb-1.5">
                                                        {[1, 2, 3, 4, 5].map(star => (
                                                            <Star 
                                                                key={star} 
                                                                size={12} 
                                                                className={star <= review.rating ? 'text-amber-500 fill-amber-500' : 'text-gray-200'} 
                                                            />
                                                        ))}
                                                    </div>
                                                    <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed italic">
                                                        &quot;{review.comment}&quot;
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-gray-700 capitalize">{review.services?.name || review.service_type}</span>
                                                    <span className="text-[10px] text-gray-400 font-medium">#{review.service_id?.substring(0, 8)}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2 text-gray-500">
                                                    <Calendar size={14} className="text-gray-300" />
                                                    <span className="text-xs font-bold">{new Date(review.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-4">
                                                <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border flex items-center gap-1.5 w-fit ${
                                                    review.status === 'approved' ? 'bg-green-50 text-green-700 border-green-100' :
                                                    review.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                                                    'bg-red-50 text-red-700 border-red-100'
                                                }`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${
                                                        review.status === 'approved' ? 'bg-green-500' :
                                                        review.status === 'pending' ? 'bg-yellow-500' :
                                                        'bg-red-500'
                                                    }`} />
                                                    {review.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-4 text-right">
                                                <div className="flex justify-end gap-1">
                                                    <button
                                                        onClick={() => handleView(review)}
                                                        className="p-2 text-gray-500 hover:text-brand-charcoal hover:bg-gray-50 rounded-xl transition-all"
                                                        title="View Details"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEdit(review)}
                                                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                                        title="Edit Review"
                                                    >
                                                        <Edit3 size={16} />
                                                    </button>
                                                    {review.status !== 'approved' && (
                                                        <button
                                                            onClick={() => updateReviewStatus(review.id, 'approved')}
                                                            disabled={actionLoading === review.id}
                                                            className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all"
                                                            title="Approve Review"
                                                        >
                                                            {actionLoading === review.id ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                                        </button>
                                                    )}
                                                    {review.status !== 'rejected' && (
                                                        <button
                                                            onClick={() => updateReviewStatus(review.id, 'rejected')}
                                                            disabled={actionLoading === review.id}
                                                            className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                            title="Reject Review"
                                                        >
                                                            {actionLoading === review.id ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => deleteReview(review.id)}
                                                        disabled={actionLoading === review.id}
                                                        className="p-2 text-gray-500 hover:text-brand-red hover:bg-red-50 rounded-xl transition-all"
                                                        title="Delete Permanently"
                                                    >
                                                        {actionLoading === review.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {/* ORIGINAL:
                                {processedReviews.map((review) => (
                                */}
                                {paginatedReviews.map((review) => (
                                    <div key={review.id} className="bg-white border border-slate-300 rounded-[2rem] overflow-hidden group hover:shadow-2xl hover:border-transparent transition-all duration-500 flex flex-col p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-12 w-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100">
                                                    <User size={20} />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-black text-gray-900 leading-tight">{review.customer_name}</h3>
                                                    <div className="flex items-center gap-0.5 mt-1">
                                                        {[1, 2, 3, 4, 5].map(star => (
                                                            <Star key={star} size={10} className={star <= review.rating ? 'text-amber-500 fill-amber-500' : 'text-gray-200'} />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-1 transition-all scale-90 group-hover:scale-100">
                                                <button onClick={() => handleView(review)} className="p-2 text-gray-300 hover:text-brand-charcoal bg-gray-50 rounded-xl transition-all" title="View Details"><Eye size={14} /></button>
                                                <button onClick={() => handleEdit(review)} className="p-2 text-gray-300 hover:text-blue-600 bg-gray-50 rounded-xl transition-all" title="Edit Review"><Edit3 size={14} /></button>
                                                <button onClick={() => deleteReview(review.id)} className="p-2 text-gray-300 hover:text-brand-red bg-gray-50 rounded-xl transition-all" title="DeletePermanently"><Trash2 size={14} /></button>
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs text-gray-600 leading-relaxed italic mb-4">
                                                &quot;{review.comment}&quot;
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-auto">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">{review.services?.name || review.service_type || 'General'}</span>
                                                <span className="text-[9px] text-gray-400 font-bold">{new Date(review.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {review.status === 'pending' && (
                                                    <>
                                                        <button onClick={() => updateReviewStatus(review.id, 'approved')} className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-all"><Check size={14} /></button>
                                                        <button onClick={() => updateReviewStatus(review.id, 'rejected')} className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all"><X size={14} /></button>
                                                    </>
                                                )}
                                                {review.status === 'approved' && (
                                                    <span className="px-2 py-0.5 bg-green-50 text-green-700 text-[8px] font-black uppercase tracking-widest rounded-lg border border-green-100">Approved</span>
                                                )}
                                                {review.status === 'rejected' && (
                                                    <span className="px-2 py-0.5 bg-red-50 text-red-700 text-[8px] font-black uppercase tracking-widest rounded-lg border border-red-100">Rejected</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    {/* Pagination Footer */}
                    {/* ORIGINAL:
                    {totalPages > 1 && (
                    */}
                    {processedReviews.length > 0 && (
                        <div className="p-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
                            <span className="text-sm text-slate-500 font-bold">
                                Showing <span className="text-slate-900 font-black">{Math.min(processedReviews.length, (currentPage - 1) * perPage + 1)}</span> to{' '}
                                <span className="text-slate-900 font-black">{Math.min(processedReviews.length, currentPage * perPage)}</span> of{' '}
                                <span className="text-slate-900 font-black">{processedReviews.length}</span> entries
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 transition-all text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <span className="text-sm font-black text-slate-900 px-2">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 transition-all text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
            {/* View Details Modal */}
            <Modal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title="Review Details"
                size="lg"
            >
                {selectedReview && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
                            <div className="h-16 w-16 rounded-3xl bg-gray-50 flex items-center justify-center text-gray-400 border border-slate-200">
                                <User size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-gray-900">{selectedReview.customer_name}</h3>
                                <div className="flex items-center gap-1 mt-1">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <Star key={star} size={14} className={star <= selectedReview.rating ? 'text-amber-500 fill-amber-500' : 'text-gray-200'} />
                                    ))}
                                    <span className="ml-2 text-xs font-bold text-gray-400 uppercase tracking-widest leading-none translate-y-px">{selectedReview.rating} / 5 Rating</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Service Name</p>
                                <p className="text-sm font-bold text-gray-900 capitalize">{selectedReview.services?.name || selectedReview.service_type || 'N/A'}</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Submission Date</p>
                                <p className="text-sm font-bold text-gray-900">{new Date(selectedReview.created_at).toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-900 text-white rounded-[2rem] relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                                <MessageSquare size={64} />
                            </div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Customer Experience Narrative</p>
                            <p className="text-lg font-medium leading-relaxed italic relative z-10">
                                &quot;{selectedReview.comment}&quot;
                            </p>
                        </div>

                        {selectedReview.service_id && (
                            <div className="p-4 bg-red-50 text-red-700 rounded-2xl border border-red-100">
                                <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">Service ID Reference</p>
                                <p className="text-xs font-mono font-bold tracking-tight">{selectedReview.service_id}</p>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                            <Button
                                variant="outline"
                                onClick={() => setIsViewModalOpen(false)}
                                className="px-8 border-slate-300"
                            >
                                Close View
                            </Button>
                            <Button
                                onClick={() => {
                                    setIsViewModalOpen(false);
                                    handleEdit(selectedReview);
                                }}
                                className="px-8 bg-brand-charcoal text-white"
                            >
                                Edit Selection
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Edit Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Update Customer Feedback"
                size="md"
            >
                <div className="space-y-6">
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Display Name</label>
                        <input
                            type="text"
                            value={editData.customer_name}
                            onChange={(e) => setEditData({ ...editData, customer_name: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border border-slate-300 rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent transition-all"
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Overall Rating</label>
                        <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-2xl border border-slate-300">
                            {[1, 2, 3, 4, 5].map(star => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setEditData({ ...editData, rating: star })}
                                    className="p-1 hover:scale-110 transition-transform"
                                >
                                    <Star 
                                        size={24} 
                                        className={star <= editData.rating ? 'text-amber-500 fill-amber-500' : 'text-gray-300'} 
                                    />
                                </button>
                            ))}
                            <span className="ml-4 font-black text-gray-900 text-lg">{editData.rating}</span>
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Review Comment</label>
                        <RichTextEditor
                            value={editData.comment}
                            onChange={(content) => setEditData({ ...editData, comment: content })}
                            placeholder="Enter the updated review comment..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <Button
                            variant="outline"
                            onClick={() => setIsEditModalOpen(false)}
                            className="px-6 border-slate-300"
                        >
                            Discard
                        </Button>
                        <Button
                            onClick={saveReview}
                            disabled={actionLoading !== null}
                            className="px-8 bg-brand-red text-white flex items-center gap-2 shadow-lg shadow-red-200"
                        >
                            {actionLoading === selectedReview?.id ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save size={18} />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Reviews;
