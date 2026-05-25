import React, { useState, useEffect, useMemo } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    rectSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    Video, Plus, Search, Edit2, Trash2, Loader2, X,
    Layout, AlignLeft, AlignCenter, AlignRight, Check, ImageIcon,
    GripVertical
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader } from '../components/Card';
import { Button } from '../components/Button';
import { showAlert, showConfirm } from '../utils/swal';
import { resolveImageUrl } from '../utils/image';
import RichTextEditor from '../components/RichTextEditor';
import ImageUpload from '../components/ImageUpload';

// --- Sortable Item Components ---

const SortableTableRow = ({ slide, handleOpenModal, deleteSlide }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: slide.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : 'auto',
    };

    return (
        <tr 
            ref={setNodeRef} 
            style={style} 
            className={`even:bg-gray-50/50 hover:bg-gray-100/50 transition-colors group ${isDragging ? 'shadow-2xl bg-white z-[60]' : ''}`}
        >
            <td className="px-8 py-4">
                <div className="flex items-center gap-4">
                    <div 
                        {...attributes} 
                        {...listeners} 
                        className="cursor-grab active:cursor-grabbing p-1 text-gray-300 hover:text-brand-red transition-colors"
                    >
                        <GripVertical size={16} />
                    </div>
                    <div className="h-16 w-28 rounded-xl overflow-hidden bg-gray-100 border border-slate-300 relative shrink-0">
                        {slide.media_type === 'video' ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-brand-charcoal">
                                <Video size={16} className="text-white opacity-50" />
                            </div>
                        ) : (
                            <img
                                src={resolveImageUrl(slide.image_url)}
                                alt=""
                                className="h-full w-full object-cover"
                                onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1544084471-507c8cc38662?q=80&w=300'}
                            />
                        )}
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-sm font-black text-gray-900 leading-tight truncate">{slide.title}</h3>
                        <p className="text-xs text-gray-400 font-medium truncate mt-0.5">{slide.subtitle}</p>
                    </div>
                </div>
            </td>
            <td className="px-8 py-4">
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-50 border border-slate-300 text-xs font-black text-gray-600">
                    {slide.order_index}
                </div>
            </td>
            <td className="px-8 py-4">
                <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border ${slide.is_active
                    ? 'bg-green-50 text-green-700 border-green-100'
                    : 'bg-red-50 text-red-700 border-red-100'
                    }`}>
                    {slide.is_active ? 'Active' : 'Hidden'}
                </span>
            </td>
            <td className="px-8 py-4 text-right">
                <div className="flex justify-end gap-1 transition-opacity">
                    <button
                        onClick={() => handleOpenModal(slide)}
                        className="p-2 text-gray-400 hover:text-brand-red hover:bg-red-50 rounded-xl transition-all"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button
                        onClick={() => deleteSlide(slide.id)}
                        className="p-2 text-gray-400 hover:text-brand-red hover:bg-red-50 rounded-xl transition-all"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </td>
        </tr>
    );
};

const SortableGridItem = ({ slide, handleOpenModal, deleteSlide }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: slide.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
    };

    return (
        <div 
            ref={setNodeRef} 
            style={style} 
            className="bg-white border border-slate-300 rounded-[2rem] overflow-hidden group hover:shadow-2xl hover:border-transparent transition-all duration-500 flex flex-col relative"
        >
            <div 
                {...attributes} 
                {...listeners} 
                className="absolute top-4 left-4 z-20 cursor-grab active:cursor-grabbing bg-white/20 backdrop-blur-md p-1.5 rounded-full text-white border border-white/20 hover:bg-white/40 transition-all"
            >
                <GripVertical size={16} />
            </div>
            
            <div className="aspect-video bg-gray-50 relative overflow-hidden">
                {slide.media_type === 'video' ? (
                    <video src={resolveImageUrl(slide.video_url || slide.image_url)} className="w-full h-full object-cover" muted loop />
                ) : (
                    <img src={resolveImageUrl(slide.image_url)} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                )}
                <div className="absolute top-4 right-4 flex flex-col gap-2 transition-all">
                    <button onClick={() => handleOpenModal(slide)} className="bg-white shadow-xl p-3 rounded-2xl text-gray-400 hover:text-brand-red transition-all hover:scale-110 active:scale-95">
                        <Edit2 size={16} />
                    </button>
                    <button onClick={() => deleteSlide(slide.id)} className="bg-white shadow-xl p-3 rounded-2xl text-gray-400 hover:text-brand-red transition-all hover:scale-110 active:scale-95">
                        <Trash2 size={16} />
                    </button>
                </div>
                <div className="absolute bottom-4 right-4">
                    <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border backdrop-blur-md ${slide.is_active
                        ? 'bg-green-500/80 text-white border-transparent'
                        : 'bg-red-500/80 text-white border-transparent'
                        }`}>
                        {slide.is_active ? 'Active' : 'Hidden'}
                    </span>
                </div>
            </div>
            <div className="p-6 flex flex-col flex-1">
                <div className="flex items-center gap-2 mb-3">
                    <span className="bg-gray-100 text-gray-400 text-[8px] font-black px-1.5 py-0.5 rounded uppercase border border-slate-300">
                        {slide.alignment}
                    </span>
                    {slide.media_type === 'video' && (
                        <span className="bg-red-50 text-red-600 text-[8px] font-black px-1.5 py-0.5 rounded uppercase border border-red-100">Motion Asset</span>
                    )}
                </div>
                <h3 className="text-sm font-black text-gray-900 leading-snug mb-2 line-clamp-1">{slide.title}</h3>
                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-4 flex-1 font-medium">
                    {slide.subtitle}
                </p>
                <div className="pt-4 border-t border-gray-50 flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-1.5 text-[9px] font-black text-brand-red uppercase tracking-widest">
                        <Layout size={12} />
                        Order: {slide.order_index}
                    </div>
                </div>
            </div>
        </div>
    );
};

const HeroSlider = () => {
    const [slides, setSlides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('list');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(null);
    const [formLoading, setFormLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        subtitle: '',
        description: '',
        image_url: '',
        video_url: '',
        media_type: 'image',
        cta_text: 'Explore',
        cta_link: '/search',
        order_index: 0,
        is_active: true,
        alignment: 'center',
        overlay_opacity: 0.4,
        animation_type: 'fade',
        duration: 6000,
        start_date: '',
        end_date: '',
        mobile_image_url: '',
        badge_text: '',
        badge_color: '#EF4444'
    });

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        fetchSlides();
    }, []);

    const fetchSlides = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('hero_slides')
                .select('*')
                .order('order_index', { ascending: true });

            if (error) throw error;
            setSlides(data || []);
        } catch (error) {
            console.error('Error fetching slides:', error);
            showAlert('Error', 'Failed to load hero slides', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (slide = null) => {
        if (slide) {
            setCurrentSlide(slide);
            setFormData({
                title: slide.title || '',
                subtitle: slide.subtitle || '',
                description: slide.description || '',
                image_url: slide.image_url || '',
                video_url: slide.video_url || '',
                media_type: slide.media_type || 'image',
                cta_text: slide.cta_text || 'Explore',
                cta_link: slide.cta_link || '/search',
                order_index: slide.order_index || 0,
                is_active: slide.is_active !== false,
                alignment: slide.alignment || 'center',
                overlay_opacity: slide.overlay_opacity || 0.4,
                animation_type: slide.animation_type || 'fade',
                duration: slide.duration || 6000,
                start_date: slide.start_date || '',
                end_date: slide.end_date || '',
                mobile_image_url: slide.mobile_image_url || '',
                badge_text: slide.badge_text || '',
                badge_color: slide.badge_color || '#EF4444'
            });
        } else {
            setCurrentSlide(null);
            setFormData({
                title: '',
                subtitle: '',
                description: '',
                image_url: '',
                video_url: '',
                media_type: 'image',
                cta_text: 'Explore',
                cta_link: '/search',
                order_index: slides.length,
                is_active: true,
                alignment: 'center',
                overlay_opacity: 0.4,
                animation_type: 'fade',
                duration: 6000,
                start_date: '',
                end_date: '',
                mobile_image_url: '',
                badge_text: '',
                badge_color: '#EF4444'
            });
        }
        setIsModalOpen(true);
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);

        const payload = {
            ...formData,
            start_date: formData.start_date || null,
            end_date: formData.end_date || null
        };

        try {
            if (currentSlide) {
                const { error } = await supabase
                    .from('hero_slides')
                    .update(payload)
                    .eq('id', currentSlide.id);
                if (error) throw error;
                showAlert('Success', 'Slide updated successfully', 'success');
            } else {
                const { error } = await supabase
                    .from('hero_slides')
                    .insert([payload]);
                if (error) throw error;
                showAlert('Success', 'New slide added', 'success');
            }
            setIsModalOpen(false);
            fetchSlides();
        } catch (error) {
            console.error('Error saving slide:', error);
            showAlert('Error', error.message || 'Failed to save slide', 'error');
        } finally {
            setFormLoading(false);
        }
    };

    const deleteSlide = async (id) => {
        const result = await showConfirm(
            'Delete Slide?',
            'Are you sure you want to remove this slide? This action cannot be undone.'
        );

        if (!result.isConfirmed) return;

        try {
            const { error } = await supabase
                .from('hero_slides')
                .delete()
                .eq('id', id);

            if (error) throw error;
            showAlert('Deleted', 'Slide removed successfully', 'success');
            fetchSlides();
        } catch (error) {
            console.error('Error deleting slide:', error);
            showAlert('Error', 'Failed to delete slide', 'error');
        }
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            const oldIndex = slides.findIndex((slide) => slide.id === active.id);
            const newIndex = slides.findIndex((slide) => slide.id === over.id);

            const newSlides = arrayMove(slides, oldIndex, newIndex).map((slide, index) => ({
                ...slide,
                order_index: index
            }));

            setSlides(newSlides);

            // Persist to database
            try {
                const updates = newSlides.map(s => ({ id: s.id, order_index: s.order_index }));
                const { error } = await supabase.rpc('reorder_hero_slides', { new_orders: updates });
                if (error) throw error;
            } catch (error) {
                console.error('Error reordering slides:', error);
                showAlert('Error', 'Failed to save new order', 'error');
                fetchSlides(); // Revert on failure
            }
        }
    };

    const processedSlides = useMemo(() => {
        return slides.filter(slide =>
            slide.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            slide.subtitle?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [slides, searchTerm]);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Hero Slider Management</h1>
                    <p className="text-gray-400 text-sm font-medium">Control the visual identity and primary CTA of the website</p>
                </div>
                <div className="flex items-center gap-2">
{/* 
                    <Button
                        onClick={fetchSlides}
                        variant="outline"
                        className="text-gray-500 border-slate-300 flex items-center gap-2"
                    >
                        <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Sync
                    </Button>
                    */}
                    <Button
                        onClick={() => handleOpenModal()}
                        className="bg-brand-red hover:opacity-90 text-white flex items-center gap-2 shadow-lg shadow-red-100 font-bold"
                    >
                        <Plus size={16} /> Add Slide
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
                                placeholder="Search slides..."
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
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Negotiating with Database...</p>
                            </div>
                        ) : (
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={processedSlides.map(p => p.id)}
                                    strategy={viewMode === 'list' ? verticalListSortingStrategy : rectSortingStrategy}
                                >
                                    {viewMode === 'list' ? (
                                        <table className="min-w-full divide-y divide-gray-100">
                                            <thead className="bg-gray-50/50">
                                                <tr>
                                                    <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Slide Preview</th>
                                                    <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Order</th>
                                                    <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                                    <th className="px-8 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-100">
                                                {processedSlides.map((slide) => (
                                                    <SortableTableRow 
                                                        key={slide.id} 
                                                        slide={slide} 
                                                        handleOpenModal={handleOpenModal} 
                                                        deleteSlide={deleteSlide} 
                                                    />
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <div className="p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                            {processedSlides.map((slide) => (
                                                <SortableGridItem 
                                                    key={slide.id} 
                                                    slide={slide} 
                                                    handleOpenModal={handleOpenModal} 
                                                    deleteSlide={deleteSlide} 
                                                />
                                            ))}
                                        </div>
                                    )}
                                </SortableContext>
                            </DndContext>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Modal / Overlay Implementation (Simplified for brevity but functional) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-charcoal/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-slate-300 flex flex-col">
                        <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-center justify-between z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-red-50 text-brand-red rounded-2xl">
                                    {currentSlide ? <Edit2 size={20} /> : <Plus size={20} />}
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 tracking-tight">{currentSlide ? 'Configure Slide' : 'New Visual Identity'}</h2>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Hero Module Editor</p>
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
                                {/* Content Details */}
                                <div className="space-y-6">
                                    <h3 className="text-[11px] font-black text-brand-red uppercase tracking-[0.2em] border-b border-red-100 pb-2">Narrative Strategy</h3>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Hero Title</label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full px-5 py-3.5 bg-gray-50 border-2 border-slate-300 rounded-2xl focus:border-brand-red focus:outline-none transition-all font-bold text-gray-800"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            placeholder="e.g. Elevate Your Journey"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Subtitle</label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full px-5 py-3.5 bg-gray-50 border-2 border-slate-300 rounded-2xl focus:border-brand-red focus:outline-none transition-all font-bold text-gray-800"
                                            value={formData.subtitle}
                                            onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                                            placeholder="e.g. Luxury travel redefined"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Description (Internal Meta)</label>
                                        <RichTextEditor
                                            value={formData.description}
                                            onChange={(val) => setFormData(prev => ({ ...prev, description: val }))}
                                            placeholder="Slide narration content..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">CTA Action Text</label>
                                            <input
                                                type="text"
                                                className="w-full px-5 py-3 bg-gray-50 border-2 border-slate-300 rounded-2xl focus:border-brand-red focus:outline-none transition-all font-bold text-gray-800"
                                                value={formData.cta_text}
                                                onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Redirect Vector (Link)</label>
                                            <input
                                                type="text"
                                                className="w-full px-5 py-3 bg-gray-50 border-2 border-slate-300 rounded-2xl focus:border-brand-red focus:outline-none transition-all font-bold text-gray-800"
                                                value={formData.cta_link}
                                                onChange={(e) => setFormData({ ...formData, cta_link: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <h3 className="text-[11px] font-black text-brand-red uppercase tracking-[0.2em] border-b border-red-100 pb-2 pt-4">Campaign Strategy</h3>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Start Projection (Date)</label>
                                            <input
                                                type="datetime-local"
                                                className="w-full px-5 py-3 bg-gray-50 border-2 border-slate-300 rounded-2xl focus:border-brand-red focus:outline-none transition-all font-bold text-gray-800"
                                                value={formData.start_date ? new Date(formData.start_date).toISOString().slice(0, 16) : ''}
                                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">End Duration (Date)</label>
                                            <input
                                                type="datetime-local"
                                                className="w-full px-5 py-3 bg-gray-50 border-2 border-slate-300 rounded-2xl focus:border-brand-red focus:outline-none transition-all font-bold text-gray-800"
                                                value={formData.end_date ? new Date(formData.end_date).toISOString().slice(0, 16) : ''}
                                                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Promotional Badge</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. SUMMER SALE"
                                                className="w-full px-5 py-3 bg-gray-50 border-2 border-slate-300 rounded-2xl focus:border-brand-red focus:outline-none transition-all font-bold text-gray-800"
                                                value={formData.badge_text}
                                                onChange={(e) => setFormData({ ...formData, badge_text: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Badge Theme ($HEX)</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="color"
                                                    className="w-12 h-12 p-1 bg-gray-50 border-2 border-slate-300 rounded-xl focus:outline-none cursor-pointer"
                                                    value={formData.badge_color}
                                                    onChange={(e) => setFormData({ ...formData, badge_color: e.target.value })}
                                                />
                                                <input
                                                    type="text"
                                                    className="flex-1 px-4 py-3 bg-gray-50 border-2 border-slate-300 rounded-2xl focus:border-brand-red focus:outline-none transition-all font-bold text-gray-800 uppercase"
                                                    value={formData.badge_color}
                                                    onChange={(e) => setFormData({ ...formData, badge_color: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Visual Assets & Configuration */}
                                <div className="space-y-6">
                                    <h3 className="text-[11px] font-black text-brand-red uppercase tracking-[0.2em] border-b border-red-100 pb-2">Visual Architecture</h3>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Media Type</label>
                                            <select
                                                className="w-full px-5 py-3 bg-gray-50 border-2 border-slate-300 rounded-2xl focus:border-brand-red focus:outline-none transition-all font-bold text-gray-800 appearance-none"
                                                value={formData.media_type}
                                                onChange={(e) => setFormData({ ...formData, media_type: e.target.value })}
                                            >
                                                <option value="image">Static Image</option>
                                                <option value="video">Motion Graphic (Video)</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Text Alignment</label>
                                            <div className="flex bg-gray-50 p-1 rounded-2xl border-2 border-slate-300">
                                                {['left', 'center', 'right'].map(align => (
                                                    <button
                                                        key={align}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, alignment: align })}
                                                        className={`flex-1 py-1.5 rounded-xl flex items-center justify-center transition-all ${formData.alignment === align ? 'bg-white text-brand-red shadow-sm' : 'text-gray-300'
                                                            }`}
                                                    >
                                                        {align === 'left' && <AlignLeft size={16} />}
                                                        {align === 'center' && <AlignCenter size={16} />}
                                                        {align === 'right' && <AlignRight size={16} />}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Motion preset</label>
                                            <select
                                                className="w-full px-5 py-3 bg-gray-50 border-2 border-slate-300 rounded-2xl focus:border-brand-red focus:outline-none transition-all font-bold text-gray-800 appearance-none"
                                                value={formData.animation_type}
                                                onChange={(e) => setFormData({ ...formData, animation_type: e.target.value })}
                                            >
                                                <option value="fade">Classic Fade</option>
                                                <option value="ken-burns">Ken Burns (Zoom)</option>
                                                <option value="slide-up">Dynamic Slide Up</option>
                                                <option value="bounce-reveal">Bounce Reveal</option>
                                                <option value="parallax-shift">Parallax Shift</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Playback Duration (MS)</label>
                                            <input
                                                type="number"
                                                step="500"
                                                min="1000"
                                                className="w-full px-5 py-3 bg-gray-50 border-2 border-slate-300 rounded-2xl focus:border-brand-red focus:outline-none transition-all font-bold text-gray-800"
                                                value={formData.duration}
                                                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                                            />
                                        </div>
                                    </div>

                                    <ImageUpload
                                        label={formData.media_type === 'video' ? "Motion Graphic (Video/Image)" : "Primary Identity (Image)"}
                                        value={formData.media_type === 'video' ? formData.video_url : formData.image_url}
                                        onChange={(url) => setFormData(prev => ({ 
                                            ...prev, 
                                            [formData.media_type === 'video' ? 'video_url' : 'image_url']: url 
                                        }))}
                                        folder="hero-slides"
                                        aspectRatio="aspect-video"
                                        placeholder={`Click to upload ${formData.media_type === 'video' ? 'Video' : 'Image'} Asset`}
                                    />

                                    {formData.media_type === 'video' && (
                                        <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                            <div className="flex items-center justify-between ml-1">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Static Fallback (Poster Image)</label>
                                            </div>
                                            <ImageUpload
                                                value={formData.image_url}
                                                onChange={(url) => setFormData(prev => ({ ...prev, image_url: url }))}
                                                folder="hero-slides"
                                                aspectRatio="aspect-video"
                                                showUrlInput={true}
                                                placeholder="Static Poster Identity"
                                            />
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Projected Mobile Asset</label>
                                        <ImageUpload
                                            value={formData.mobile_image_url}
                                            onChange={(url) => setFormData(prev => ({ ...prev, mobile_image_url: url }))}
                                            folder="hero-slides"
                                            aspectRatio="aspect-[9/16]"
                                            showUrlInput={true}
                                            placeholder="Upload Mobile Optimized Identity"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Overlay Opacity (0-1)</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                min="0"
                                                max="1"
                                                className="w-full px-5 py-3 bg-gray-50 border-2 border-slate-300 rounded-2xl focus:border-brand-red focus:outline-none transition-all font-bold text-gray-800"
                                                value={formData.overlay_opacity}
                                                onChange={(e) => setFormData({ ...formData, overlay_opacity: parseFloat(e.target.value) })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Sequence Index (Order)</label>
                                            <input
                                                type="number"
                                                className="w-full px-5 py-3 bg-gray-50 border-2 border-slate-300 rounded-2xl focus:border-brand-red focus:outline-none transition-all font-bold text-gray-800"
                                                value={formData.order_index}
                                                onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) })}
                                            />
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
                                            <span className="font-black text-[10px] uppercase tracking-widest">
                                                {formData.is_active ? 'Stream Online' : 'Offline / Hidden'}
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
                                    {formLoading ? (
                                        <Loader2 className="animate-spin mr-2" size={18} />
                                    ) : (
                                        <Check className="mr-2" size={18} />
                                    )}
                                    {currentSlide ? 'Commit Changes' : 'Initialize Slide'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HeroSlider;
