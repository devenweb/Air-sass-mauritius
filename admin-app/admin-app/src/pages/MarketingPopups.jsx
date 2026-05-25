import React, { useState, useEffect, useMemo } from 'react';
import {
    Video, Plus, Search, Edit2, Trash2,
    Loader2, X,
    AlignLeft, Check, Upload, Image as ImageIcon,
    ExternalLink, Calendar, Bell, Clock, Eye,
    ChevronLeft, ChevronRight
} from 'lucide-react';
import { resolveImageUrl, optimizeImage } from '../utils/image';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader } from '../components/Card';
import { Button } from '../components/Button';
import { showAlert, showConfirm } from '../utils/swal';
import RichTextEditor from '../components/RichTextEditor';

const MarketingPopups = () => {
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('list');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [currentAd, setCurrentAd] = useState(null);
    const [formLoading, setFormLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const perPage = 8;

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        media_url: '',
        media_type: 'image',
        cta_text: 'Learn More',
        cta_link: '',
        is_active: true,
        display_frequency: 'always',
        popup_type: 'standard',
        start_at: '',
        end_at: ''
    });

    useEffect(() => {
        fetchAds();
    }, []);

    const fetchAds = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('popup_ads')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setAds(data || []);
        } catch (error) {
            console.error('Error fetching ads:', error);
            showAlert('Error', 'Failed to load popup ads', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (ad = null) => {
        if (ad) {
            setCurrentAd(ad);
            setFormData({
                title: ad.title || '',
                content: ad.content || '',
                media_url: ad.media_url || '',
                media_type: ad.media_type || 'image',
                cta_text: ad.cta_text || 'Learn More',
                cta_link: ad.cta_link || '',
                is_active: ad.is_active !== false,
                display_frequency: ad.display_frequency || 'once_per_session',
                popup_type: ad.popup_type || 'standard',
                start_at: ad.start_at ? new Date(ad.start_at).toISOString().slice(0, 16) : '',
                end_at: ad.end_at ? new Date(ad.end_at).toISOString().slice(0, 16) : ''
            });
        } else {
            setCurrentAd(null);
            setFormData({
                title: '',
                content: '',
                media_url: '',
                media_type: 'image',
                cta_text: 'Learn More',
                cta_link: '',
                is_active: true,
                display_frequency: 'always',
                popup_type: 'standard',
                start_at: '',
                end_at: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            let fileToUpload = file;
            
            // Auto-optimize images
            if (file.type.startsWith('image/')) {
                const optimized = await optimizeImage(file);
                if (optimized) {
                    fileToUpload = optimized;
                    // console.log(`Optimized image from ${(file.size / 1024 / 1024).toFixed(2)}MB to ${(optimized.size / 1024 / 1024).toFixed(2)}MB`);
                }
            }

            const fileExt = fileToUpload.name.split('.').pop();
            const fileName = `popup-${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
            const filePath = `popups/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('bucket')
                .upload(filePath, fileToUpload);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('bucket')
                .getPublicUrl(filePath);

            setFormData(prev => ({
                ...prev,
                media_url: publicUrl
            }));

            showAlert('Success', 'Media uploaded successfully', 'success');
        } catch (error) {
            console.error('Error uploading file:', error);
            showAlert('Error', error.message || 'Failed to upload media', 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);

        // Process dates to ISO strings or null if empty
        const submissionData = {
            ...formData,
            title: formData.popup_type === 'image_only' && !formData.title ? `Image Ad - ${new Date().toLocaleDateString()}` : formData.title,
            cta_link: formData.popup_type === 'image_only' && !formData.cta_link ? '/search' : formData.cta_link,
            start_at: formData.start_at || null,
            end_at: formData.end_at || null
        };

        try {
            if (currentAd) {
                const { error } = await supabase
                    .from('popup_ads')
                    .update(submissionData)
                    .eq('id', currentAd.id);
                if (error) throw error;
                showAlert('Success', 'Popup updated successfully', 'success');
            } else {
                const { error } = await supabase
                    .from('popup_ads')
                    .insert([submissionData]);
                if (error) throw error;
                showAlert('Success', 'New popup added', 'success');
            }
            setIsModalOpen(false);
            fetchAds();
        } catch (error) {
            console.error('Error saving popup:', error);
            showAlert('Error', error.message || 'Failed to save popup', 'error');
        } finally {
            setFormLoading(false);
        }
    };

    const deleteAd = async (id) => {
        const result = await showConfirm(
            'Delete Popup?',
            'Are you sure you want to remove this advertisement? This action cannot be undone.'
        );

        if (!result.isConfirmed) return;

        try {
            const { error } = await supabase
                .from('popup_ads')
                .delete()
                .eq('id', id);

            if (error) throw error;
            showAlert('Deleted', 'Popup removed successfully', 'success');
            fetchAds();
        } catch (error) {
            console.error('Error deleting popup:', error);
            showAlert('Error', 'Failed to delete popup', 'error');
        }
    };

    const toggleStatus = async (ad) => {
        try {
            const { error } = await supabase
                .from('popup_ads')
                .update({ is_active: !ad.is_active })
                .eq('id', ad.id);
            if (error) throw error;
            fetchAds();
        } catch (err) {
            console.error('Error updating status:', err);
            showAlert('Error', 'Failed to update status', 'error');
        }
    };

    const processedAds = useMemo(() => {
        return ads.filter(ad =>
            ad.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ad.content?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [ads, searchTerm]);

    const paginatedAds = useMemo(() => {
        return processedAds.slice((currentPage - 1) * perPage, currentPage * perPage);
    }, [processedAds, currentPage, perPage]);

    const totalPages = useMemo(() => {
        return Math.ceil(processedAds.length / perPage);
    }, [processedAds, perPage]);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Popup Advertisements</h1>
                    <p className="text-gray-400 text-sm font-medium">Manage promotional overlays and global notices</p>
                </div>
                <div className="flex items-center gap-2">
                    {/* <Button
    onClick={fetchAds}
    variant="outline"
    className="text-gray-500 border-slate-300 flex items-center gap-2"
>
    <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Sync
</Button> */}
                    <Button
                        onClick={() => handleOpenModal()}
                        className="bg-brand-red hover:opacity-90 text-white flex items-center gap-2 shadow-lg shadow-red-100 font-bold"
                    >
                        <Plus size={16} /> Create Popup
                    </Button>
                </div>
            </div>

            <Card className="border border-slate-300 shadow-xl shadow-gray-200/50 rounded-3xl overflow-hidden bg-white">
                <CardHeader className="border-b border-gray-50 pb-4 px-8 pt-8">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full max-w-md">
                            <Search className="absolute left-3 top-2.5 text-gray-300" size={16} />
                            <input
                                type="text"
                                placeholder="Search advertisements..."
                                className="pl-9 pr-4 py-2.5 w-full border border-slate-300 bg-gray-50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all font-medium"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center bg-gray-50 rounded-2xl p-1 gap-1 border border-gray-100 shrink-0">
                            <button 
                                type="button" 
                                onClick={() => setViewMode('list')} 
                                className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white text-brand-red shadow-sm' : 'text-gray-400'}`}
                            >
                                <AlignLeft size={18} />
                            </button>
                            <button 
                                type="button" 
                                onClick={() => setViewMode('grid')} 
                                className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white text-brand-red shadow-sm' : 'text-gray-400'}`}
                            >
                                <ImageIcon size={18} />
                            </button>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        {loading ? (
                            <div className="py-20 flex flex-col items-center">
                                <Loader2 className="animate-spin text-brand-red mb-4" size={48} />
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Fetching Campaigns...</p>
                            </div>
                        ) : processedAds.length === 0 ? (
                            <div className="py-20 text-center flex flex-col items-center gap-4">
                                <Bell size={48} className="text-gray-200" />
                                <p className="text-gray-400 font-bold">No popups configured</p>
                                <Button onClick={() => handleOpenModal()} variant="outline">Schedule Your First Ad</Button>
                            </div>
                        ) : viewMode === 'list' ? (
                            <table className="min-w-full divide-y divide-gray-100">
                                <thead className="bg-gray-50/50">
                                    <tr>
                                        <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Advertisement</th>
                                        <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Frequency</th>
                                        <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Scheduling</th>
                                        <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                        <th className="px-8 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {/* ORIGINAL:
                                    {processedAds.map((ad) => (
                                    */}
                                    {paginatedAds.map((ad) => (
                                        <tr key={ad.id} className="hover:bg-gray-50/80 transition-colors group">
                                            <td className="px-8 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-xl overflow-hidden bg-gray-100 border border-slate-300 relative shrink-0">
                                                        {ad.media_type === 'video' ? (
                                                            <div className="absolute inset-0 flex items-center justify-center bg-brand-charcoal">
                                                                <Video size={16} className="text-white opacity-50" />
                                                            </div>
                                                        ) : ad.media_type === 'image' ? (
                                                            <img
                                                                src={resolveImageUrl(ad.media_url)}
                                                                alt=""
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                <AlignLeft size={16} className="text-gray-300" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h3 className="text-sm font-black text-gray-900 leading-tight truncate">{ad.title}</h3>
                                                        <p className="text-[10px] text-gray-400 font-medium truncate mt-0.5">{ad.cta_link || 'No link set'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-4">
                                                <span className="bg-gray-100 text-gray-600 text-[8px] font-black px-1.5 py-0.5 rounded uppercase border border-slate-300">
                                                    {ad.display_frequency.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td className="px-8 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-gray-400">
                                                        <Calendar size={10} className="text-gray-300" />
                                                        {ad.start_at ? new Date(ad.start_at).toLocaleDateString() : 'Immediate'}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-gray-400">
                                                        <Clock size={10} className="text-gray-300" />
                                                        {ad.end_at ? new Date(ad.end_at).toLocaleDateString() : 'Never expires'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-4">
                                                <button
                                                    onClick={() => toggleStatus(ad)}
                                                    className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border transition-colors ${ad.is_active
                                                        ? 'bg-green-50 text-green-700 border-green-100 hover:bg-green-100'
                                                        : 'bg-red-50 text-red-700 border-red-100 hover:bg-red-100'
                                                        }`}
                                                >
                                                    {ad.is_active ? 'Active' : 'Offline'}
                                                </button>
                                            </td>
                                            <td className="px-8 py-4 text-right">
                                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => {
                                                            setCurrentAd(ad);
                                                            setIsPreviewOpen(true);
                                                        }}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                                        title="Preview Popup"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenModal(ad)}
                                                        className="p-2 text-gray-400 hover:text-brand-red hover:bg-red-50 rounded-xl transition-all"
                                                        title="Edit Popup"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteAd(ad.id)}
                                                        className="p-2 text-gray-400 hover:text-brand-red hover:bg-red-50 rounded-xl transition-all"
                                                        title="Delete Popup"
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
                            <div className="p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                                {/* ORIGINAL:
                                {processedAds.map((ad) => (
                                */}
                                {paginatedAds.map((ad) => (
                                    <div key={ad.id} className="bg-white border border-slate-300 rounded-[2rem] overflow-hidden group hover:shadow-2xl hover:border-transparent transition-all duration-500 flex flex-col">
                                        <div className="h-48 bg-gray-50 relative overflow-hidden">
                                            {ad.media_type === 'video' ? (
                                                <video src={resolveImageUrl(ad.media_url)} className="w-full h-full object-cover" muted loop />
                                            ) : ad.media_type === 'image' ? (
                                                <img src={resolveImageUrl(ad.media_url)} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-200 border-b border-gray-100">
                                                    <AlignLeft size={48} />
                                                </div>
                                            )}
                                            <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                                <button onClick={() => { setCurrentAd(ad); setIsPreviewOpen(true); }} className="bg-white shadow-xl p-3 rounded-2xl text-gray-400 hover:text-red-600 transition-all hover:scale-110 active:scale-95">
                                                    <Eye size={16} />
                                                </button>
                                                <button onClick={() => handleOpenModal(ad)} className="bg-white shadow-xl p-3 rounded-2xl text-gray-400 hover:text-brand-red transition-all hover:scale-110 active:scale-95">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => deleteAd(ad.id)} className="bg-white shadow-xl p-3 rounded-2xl text-gray-400 hover:text-brand-red transition-all hover:scale-110 active:scale-95">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                            <div className="absolute bottom-4 left-4">
                                                <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border backdrop-blur-md ${ad.is_active
                                                    ? 'bg-green-500/80 text-white border-transparent'
                                                    : 'bg-red-500/80 text-white border-transparent'
                                                    }`}>
                                                    {ad.is_active ? 'Active' : 'Offline'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="p-6 flex flex-col flex-1">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest rounded bg-gray-100 text-gray-500 border border-slate-300">
                                                    {ad.display_frequency.replace(/_/g, ' ')}
                                                </span>
                                                <div className="flex items-center gap-1.5 text-[9px] font-bold text-gray-400">
                                                    <Clock size={10} />
                                                    {ad.start_at ? new Date(ad.start_at).toLocaleDateString() : 'Immediate'}
                                                </div>
                                            </div>
                                            <h3 className="text-sm font-black text-gray-900 leading-snug mb-2 line-clamp-2 h-10">{ad.title}</h3>
                                            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-4 flex-1 font-medium">
                                                {ad.content}
                                            </p>
                                            <div className="pt-4 border-t border-gray-50 flex items-center justify-between mt-auto">
                                                <div className="flex items-center gap-1.5 text-[9px] font-black text-brand-red uppercase tracking-widest">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-brand-red animate-pulse" />
                                                    Campaign Engine
                                                </div>
                                                <button onClick={() => toggleStatus(ad)} className="text-[9px] font-black text-gray-400 uppercase tracking-widest hover:text-brand-red transition-colors">
                                                    Toggle Status
                                                </button>
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
                    {processedAds.length > 0 && (
                        <div className="p-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
                            <span className="text-sm text-slate-500 font-bold">
                                Showing <span className="text-slate-900 font-black">{Math.min(processedAds.length, (currentPage - 1) * perPage + 1)}</span> to{' '}
                                <span className="text-slate-900 font-black">{Math.min(processedAds.length, currentPage * perPage)}</span> of{' '}
                                <span className="text-slate-900 font-black">{processedAds.length}</span> entries
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

            {/* Modal / Editor */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-charcoal/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-slate-300 flex flex-col">
                        <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-center justify-between z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-red-50 text-brand-red rounded-2xl">
                                    {currentAd ? <Edit2 size={20} /> : <Plus size={20} />}
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 tracking-tight">{currentAd ? 'Modify Campaign' : 'New Web Overlay'}</h2>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Advertisement Engine</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2.5 text-gray-400 hover:text-brand-red hover:bg-red-50 rounded-2xl transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Configuration */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between border-b border-red-100 pb-2">
                                        <h3 className="text-[11px] font-black text-brand-red uppercase tracking-[0.2em]">Campaign Content</h3>
                                        <div className="flex bg-gray-100 p-1 rounded-xl border border-slate-200">
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, popup_type: 'standard' })}
                                                className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${formData.popup_type === 'standard' ? 'bg-white text-brand-red shadow-sm' : 'text-gray-400'}`}
                                            >
                                                Standard
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, popup_type: 'image_only', media_type: 'image' })}
                                                className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${formData.popup_type === 'image_only' ? 'bg-white text-brand-red shadow-sm' : 'text-gray-400'}`}
                                            >
                                                Image Only
                                            </button>
                                        </div>
                                    </div>

                                    {formData.popup_type === 'standard' ? (
                                        <>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Popup Title</label>
                                                <input
                                                    required={formData.popup_type === 'standard'}
                                                    type="text"
                                                    className="w-full px-5 py-3.5 bg-gray-50 border-2 border-slate-300 rounded-2xl focus:border-brand-red focus:outline-none transition-all font-bold text-gray-800"
                                                    value={formData.title}
                                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                    placeholder="e.g. Exclusive Spring Deals"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Body Text / Message</label>
                                                <RichTextEditor
                                                    value={formData.content}
                                                    onChange={(content) => setFormData({ ...formData, content: content })}
                                                    placeholder="Enter the main message for your visitors..."
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                                            <p className="text-[10px] font-bold text-brand-red uppercase tracking-widest mb-1">Image Only Mode</p>
                                            <p className="text-xs text-red-700 font-medium leading-relaxed">
                                                In this mode, the popup will display only the uploaded image. Clicking the image will redirect to the link specified below.
                                            </p>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Button Text</label>
                                            <input
                                                type="text"
                                                className="w-full px-5 py-3 bg-gray-50 border-2 border-slate-300 rounded-2xl focus:border-brand-red focus:outline-none transition-all font-bold text-gray-800"
                                                value={formData.cta_text}
                                                onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Redirect Link</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    className="w-full px-5 py-3 bg-gray-50 border-2 border-slate-300 rounded-2xl focus:border-brand-red focus:outline-none transition-all font-bold text-gray-800 pr-10"
                                                    value={formData.cta_link}
                                                    onChange={(e) => setFormData({ ...formData, cta_link: e.target.value })}
                                                    placeholder="/services"
                                                />
                                                <ExternalLink size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Display Frequency</label>
                                        <select
                                            className="w-full px-5 py-3 bg-gray-50 border-2 border-slate-300 rounded-2xl focus:border-brand-red focus:outline-none transition-all font-bold text-gray-800 appearance-none"
                                            value={formData.display_frequency}
                                            onChange={(e) => setFormData({ ...formData, display_frequency: e.target.value })}
                                        >
                                            <option value="always">Always Show</option>
                                            <option value="once_per_session">Once Per Session (Recommended)</option>
                                            <option value="once_per_day">Once Per Day</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Creative & Logic */}
                                <div className="space-y-6">
                                    <h3 className="text-[11px] font-black text-brand-red uppercase tracking-[0.2em] border-b border-red-100 pb-2">Creative Assets</h3>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Asset Format</label>
                                        <div className="flex bg-gray-50 p-1 rounded-2xl border-2 border-slate-300">
                                            {['image', 'video', 'none'].map(type => (
                                                <button
                                                    key={type}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, media_type: type })}
                                                    className={`flex-1 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.media_type === type ? 'bg-white text-brand-red shadow-sm' : 'text-gray-300'
                                                        }`}
                                                >
                                                    {type}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {formData.media_type !== 'none' && (
                                        <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                            <div className="flex items-center justify-between ml-1">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Media Source (URL)</label>
                                                <label className="cursor-pointer group flex items-center gap-1.5 text-[9px] font-black text-brand-red uppercase tracking-wider hover:opacity-80 transition-opacity">
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        accept={formData.media_type === 'video' ? "video/*" : "image/*"}
                                                        onChange={handleFileUpload}
                                                        disabled={uploading}
                                                    />
                                                    {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                                                    {uploading ? 'Processing...' : 'Upload Asset'}
                                                </label>
                                            </div>
                                            <div className="relative group">
                                                <input
                                                    type="text"
                                                    className="w-full px-5 py-3 bg-gray-50 border-2 border-slate-300 rounded-2xl focus:border-brand-red focus:outline-none transition-all font-mono text-[10px] text-gray-500 pr-12"
                                                    value={formData.media_url}
                                                    onChange={(e) => setFormData({ ...formData, media_url: e.target.value })}
                                                    placeholder="Paste URL or upload..."
                                                />
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300">
                                                    {formData.media_type === 'video' ? <Video size={16} /> : <ImageIcon size={16} />}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <h3 className="text-[11px] font-black text-brand-red uppercase tracking-[0.2em] border-b border-red-100 pb-2">Scheduling Controls</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Launch At</label>
                                                <input
                                                    type="datetime-local"
                                                    className="w-full px-4 py-3 bg-gray-50 border-2 border-slate-300 rounded-2xl focus:border-brand-red focus:outline-none transition-all font-bold text-gray-800 text-sm"
                                                    value={formData.start_at}
                                                    onChange={(e) => setFormData({ ...formData, start_at: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Terminate At</label>
                                                <input
                                                    type="datetime-local"
                                                    className="w-full px-4 py-3 bg-gray-50 border-2 border-slate-300 rounded-2xl focus:border-brand-red focus:outline-none transition-all font-bold text-gray-800 text-sm"
                                                    value={formData.end_at}
                                                    onChange={(e) => setFormData({ ...formData, end_at: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                                            className={`flex items-center gap-3 w-full p-4 rounded-2xl border-2 transition-all ${formData.is_active
                                                ? 'bg-green-50/50 border-green-200 text-green-700'
                                                : 'bg-red-50/50 border-red-200 text-red-700'
                                                }`}
                                        >
                                            <div className={`w-10 h-6 rounded-full relative transition-colors ${formData.is_active ? 'bg-green-500' : 'bg-red-500'}`}>
                                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.is_active ? 'right-1' : 'left-1'}`}></div>
                                            </div>
                                            <span className="font-black text-[10px] uppercase tracking-widest share">
                                                {formData.is_active ? 'Status: Active / Published' : 'Status: Draft / Offline'}
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-gray-100 flex items-center justify-end gap-3 sticky bottom-0 bg-white/90 backdrop-blur pb-6">
                                <Button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    variant="outline"
                                    className="px-8 py-4 border-slate-300 text-gray-400 font-bold rounded-2xl uppercase tracking-widest text-[10px]"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={formLoading}
                                    className="bg-brand-red hover:bg-red-700 text-white px-12 py-4 rounded-2xl flex items-center shadow-xl shadow-red-100 transition-all font-black uppercase tracking-widest text-xs"
                                >
                                    {formLoading ? <Loader2 className="animate-spin mr-2" size={18} /> : <Check className="mr-2" size={18} />}
                                    {currentAd ? 'Save Campaign' : 'Publish Overlay'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {isPreviewOpen && currentAd && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-charcoal/60 backdrop-blur-md animate-in zoom-in duration-300">
                    <div className="relative w-full max-w-lg bg-white rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/20">
                        <button
                            onClick={() => setIsPreviewOpen(false)}
                            className="absolute top-6 right-6 z-50 p-2.5 bg-black/10 backdrop-blur-md rounded-full text-white hover:bg-brand-red transition-all"
                        >
                            <X size={20} />
                        </button>

                        {currentAd.popup_type === 'image_only' ? (
                            <a 
                                href={currentAd.cta_link || '/search'} 
                                className="block w-full h-full"
                                onClick={(e) => e.preventDefault()}
                            >
                                <img 
                                    src={resolveImageUrl(currentAd.media_url)} 
                                    alt={currentAd.title} 
                                    className="w-full h-auto object-cover" 
                                />
                            </a>
                        ) : (
                            <>
                                {currentAd.media_type !== 'none' && currentAd.media_url && (
                                    <div className="relative aspect-video w-full bg-slate-100">
                                        {currentAd.media_type === 'video' ? (
                                            <video src={resolveImageUrl(currentAd.media_url)} autoPlay loop muted className="w-full h-full object-cover" />
                                        ) : (
                                            <img src={resolveImageUrl(currentAd.media_url)} alt="" className="w-full h-full object-cover" />
                                        )}
                                    </div>
                                )}

                                <div className="p-10 text-center">
                                    <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tight leading-tight uppercase tracking-[0.05em]">
                                        {currentAd.title}
                                    </h3>
                                    {currentAd.content && (
                                        <p className="text-gray-500 mb-8 leading-relaxed font-medium">
                                            {currentAd.content}
                                        </p>
                                    )}
                                    <button className="w-full py-5 bg-brand-red text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-red-100">
                                        {currentAd.cta_text || 'Learn More'}
                                    </button>
                                </div>
                            </>
                        )}
                        <div className="h-1 bg-brand-red" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default MarketingPopups;
