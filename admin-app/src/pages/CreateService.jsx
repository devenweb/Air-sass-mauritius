import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
    Card, CardContent
} from '../components/Card';
import { Button } from '../components/Button';
import {
    ArrowLeft, Tag,
    Loader2, Info, Camera,
    Save, Plus, X, Calendar,
    ChevronDown, ChevronRight, Grip, Sparkles,
    Hotel, Activity
} from 'lucide-react';
import { supabase } from '../lib/supabase';
// import { generateAIContent } from '../lib/ollama';
import { resolveImageUrl } from '../utils/image';
import { showAlert } from '../utils/swal';
import ImageUpload from '../components/ImageUpload';
import RichTextEditor from '../components/RichTextEditor';
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
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableSection = ({ id, children, isCollapsed, onToggle, title, icon: Icon, extraAction }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        position: 'relative',
    };

    return (
        <section
            ref={setNodeRef}
            style={style}
            className={`admin-section-boutique ${isDragging ? 'opacity-50 scale-[1.02] shadow-2xl border-brand-red' : ''}`}
        >
            <div 
                className="flex items-center justify-between group/header mb-0"
            >
                <div className="flex items-center gap-4">
                    <div 
                        {...attributes} 
                        {...listeners}
                        className="p-2.5 rounded-2xl bg-slate-100 text-slate-400 hover:text-brand-red hover:bg-red-50 cursor-grab active:cursor-grabbing transition-all border border-slate-300 group-hover/header:border-brand-red/20 shadow-sm"
                    >
                        <Grip size={18} />
                    </div>
                    <div 
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={onToggle}
                    >
                        <h3 className="flex items-center gap-2 text-xs font-black text-gray-900 uppercase tracking-[0.2em]">
                            <Icon size={16} className="text-brand-red" /> {title}
                        </h3>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    {extraAction}
                    <div 
                        className="p-2 rounded-xl bg-gray-50 cursor-pointer group-hover/header:bg-red-50 text-gray-400 group-hover/header:text-brand-red transition-all"
                        onClick={onToggle}
                    >
                        {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                    </div>
                </div>
            </div>

            {!isCollapsed && (
                <div className="mt-6 animate-in fade-in slide-in-from-top-2 duration-300">
                    {children}
                </div>
            )}
        </section>
    );
};

const CreateService = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [pageLoading, setPageLoading] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [categories, setCategories] = useState([]);

    const [formData, setFormData] = useState({
        name: '',
        category_ids: [],
        short_description: '',
        description: '',
        image_url: '',
        secondary_image_url: '',
        banner_url: '',
        amenities: [],
        itinerary: [],
        region: '',
        service_type: 'tour',
        service_fee: 0,
        location: '',
        featured: false,
        priority: 0,
        max_group_size: '',
        meta_title: '',
        meta_description: '',
        is_seasonal_deal: false,
        deal_note: 'Limited Time',
        is_active: true,
        is_coming_soon: false,
        gallery_images: [],
        highlights: [],
        included: [],
        not_included: [],
        meal_plans: [],
        cancellation_policy: '',
        terms_and_conditions: '',
        activity_type: '',
        service_type_override: null // Optional: to manually force a type if auto-derivation fails
    });

    const [previewImage, setPreviewImage] = useState(null);

    /* HIDE AI GENERATION AS PER USER REQUEST
149:     const handleAIGenerate = async () => {
150:         if (!formData.name) {
151:             showAlert('Wait!', 'Enter a service name first so the AI has context.', 'warning');
152:             return;
153:         }
154: 
155:         setAiLoading(true);
156:         try {
157:             const prompt = `Create a luxury, evocative description for a ${formData.service_type} named "${formData.name}" located in ${formData.location || formData.region}. Focus on unique selling points, luxury standards, and high-end guest experiences. Keep it under 150 words.`;
158:             const result = await generateAIContent(prompt);
159:             setFormData(prev => ({ ...prev, description: result }));
160:             showAlert('Success', 'AI has crafted your description!', 'success');
161:         } catch (error) {
162:             showAlert('AI Offline', 'Could not connect to local Ollama. Ensure it is running on port 11434.', 'error');
163:         } finally {
164:             setAiLoading(false);
165:         }
166:     };
    */

    const [collapsedSections, setCollapsedSections] = useState({
        identity: false,
        narrative: false,
        visibility: false,
        policies: false,
        promotional: false,
        gallery: false,
        accommodation: false,
        itinerary: false,
        meal_plans: false
    });

    const [sectionOrder, setSectionOrder] = useState([
        'identity',
        'visibility',
        'promotional',
        'gallery',
        'narrative',
        'itinerary',
        'meal_plans',
        'policies'
    ]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setSectionOrder((items) => {
                const oldIndex = items.indexOf(active.id);
                const newIndex = items.indexOf(over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const toggleSection = (section) => {
        setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const renderSectionContent = (id) => {
        switch (id) {
            case 'identity':
                return (
                    <SortableSection
                        id="identity"
                        title="Service Identity"
                        icon={Tag}
                        isCollapsed={collapsedSections.identity}
                        onToggle={() => toggleSection('identity')}
                    >
                        <div className="space-y-8">
                            {/* Top row: Title and Categories */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Full Listing Title</label>
                                    <input
                                        type="text"
                                        name="name"
                                        required
                                        className="w-full px-6 py-5 bg-gray-50 border border-slate-300 rounded-3xl focus:outline-none focus:ring-2 focus:ring-brand-red transition-all font-black text-xl"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Premium VIP Lounge Access"
                                    />
                                </div>
                                <div className="lg:col-span-1">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Categories</label>
                                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto p-5 bg-gray-50 border border-slate-300 rounded-3xl custom-scrollbar shadow-inner">
                                        {categories.map(cat => (
                                            <label key={cat.id} className="flex items-center gap-3 cursor-pointer group">
                                                <div className="relative flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        className="peer h-5 w-5 appearance-none border-2 border-slate-300 rounded-lg checked:bg-brand-red checked:border-brand-red transition-all cursor-pointer"
                                                        checked={formData.category_ids.includes(cat.id)}
                                                        onChange={() => handleCategoryToggle(cat.id)}
                                                    />
                                                    <Save size={10} className="absolute left-1.25 top-1.25 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
                                                </div>
                                                <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${formData.category_ids.includes(cat.id) ? 'text-brand-red' : 'text-gray-400 group-hover:text-gray-600'}`}>
                                                    {cat.name}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Pricing Engine Architecture Selector */}
                            <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
                                <div>
                                    <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-1">Pricing Engine Architecture</p>
                                    <p className="text-[9px] text-gray-400 font-bold uppercase">Choose the engine model used to calculate quotes and rates</p>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Hotel Model Card */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFormData(prev => ({
                                                ...prev,
                                                service_type: 'hotel',
                                                service_type_override: 'hotel'
                                            }));
                                        }}
                                        className={`p-5 rounded-2xl border-2 text-left transition-all flex items-start gap-4 ${
                                            formData.service_type === 'hotel'
                                                ? 'bg-red-50/50 border-brand-red shadow-md scale-[1.01]'
                                                : 'bg-white border-slate-200 hover:border-brand-red/30'
                                        }`}
                                    >
                                        <div className={`p-3 rounded-xl ${formData.service_type === 'hotel' ? 'bg-brand-red text-white' : 'bg-slate-100 text-slate-500'}`}>
                                            <Hotel size={20} />
                                        </div>
                                        <div>
                                            <p className={`text-xs font-black uppercase tracking-wider ${formData.service_type === 'hotel' ? 'text-brand-red' : 'text-slate-700'}`}>
                                                Hotel Model
                                            </p>
                                            <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-1">
                                                Room occupancy-based pricing (per room/night). Ideal for hotels, villas, and guesthouses.
                                            </p>
                                        </div>
                                    </button>

                                    {/* Activity/Tour Model Card */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFormData(prev => {
                                                // If we have a previously saved/derived service_type that is not hotel, keep it.
                                                // Otherwise, default to 'tour'.
                                                // const existingType = prev.service_type && prev.service_type !== 'hotel' ? prev.service_type : 'tour';
                                                // FIX: Clear service_type_override so auto-derivation can run based on selected categories.
                                                // This ensures selecting an 'activity' category correctly sets service_type to 'activity'.
                                                const existingType = prev.service_type && prev.service_type !== 'hotel' ? prev.service_type : 'tour';
                                                return {
                                                    ...prev,
                                                    service_type: existingType,
                                                    service_type_override: null // Clear override → allow auto-derivation from categories
                                                };
                                            });
                                        }}
                                        className={`p-5 rounded-2xl border-2 text-left transition-all flex items-start gap-4 ${
                                            formData.service_type !== 'hotel'
                                                ? 'bg-red-50/50 border-brand-red shadow-md scale-[1.01]'
                                                : 'bg-white border-slate-200 hover:border-brand-red/30'
                                        }`}
                                    >
                                        <div className={`p-3 rounded-xl ${formData.service_type !== 'hotel' ? 'bg-brand-red text-white' : 'bg-slate-100 text-slate-500'}`}>
                                            <Activity size={20} />
                                        </div>
                                        <div>
                                            <p className={`text-xs font-black uppercase tracking-wider ${formData.service_type !== 'hotel' ? 'text-brand-red' : 'text-slate-700'}`}>
                                                Activity / Tours Model
                                            </p>
                                            <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-1">
                                                Per person pricing (Adult, Teen, Child, Infant). Perfect for excursions, cruises, day packages, and transfers.
                                            </p>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Middle row: Image Assets */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-0 border-t border-slate-100">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Hero Banner Image (Top Header)</label>
                                    <ImageUpload
                                        value={formData.banner_url}
                                        onChange={(url) => setFormData(prev => ({ ...prev, banner_url: url }))}
                                        folder="services"
                                        aspectRatio="aspect-[21/9]"
                                        placeholder="Service Banner"
                                        showUrlInput={false}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Secondary Image Vector (Optional)</label>
                                    <ImageUpload
                                        value={formData.secondary_image_url}
                                        onChange={(url) => setFormData(prev => ({ ...prev, secondary_image_url: url }))}
                                        folder="services"
                                        aspectRatio="aspect-[3/1]"
                                        placeholder="Secondary Image"
                                        showUrlInput={false}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="md:col-span-1">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Geographic Region</label>
                                    <input
                                        type="text"
                                        name="region"
                                        className="w-full px-6 py-4 bg-gray-50 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-red transition-all font-bold text-sm"
                                        value={formData.region}
                                        onChange={handleInputChange}
                                        placeholder="e.g. North Coast, Mauritius"
                                        list="region-options"
                                    />
                                    <datalist id="region-options">
                                        <option value="North Coast" />
                                        <option value="South Coast" />
                                        <option value="East Coast" />
                                        <option value="West Coast" />
                                        <option value="Central" />
                                        <option value="International" />
                                        <option value="Mauritius" />
                                        <option value="Rodrigues" />
                                    </datalist>
                                </div>
                                <div className="md:col-span-1">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Service Fee (%)</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            name="service_fee"
                                            step="0.1"
                                            min="0"
                                            className="w-full px-6 py-4 bg-gray-50 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-red transition-all font-bold text-sm pr-12"
                                            value={formData.service_fee}
                                            onChange={handleInputChange}
                                            placeholder="0.0"
                                        />
                                        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 font-black text-xs">%</div>
                                    </div>
                                </div>
                                <div className="md:col-span-1">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Specific Location / Area</label>
                                    <input
                                        type="text"
                                        name="location"
                                        className="w-full px-6 py-4 bg-gray-50 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-red transition-all font-bold text-sm"
                                        value={formData.location}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Grand Baie, North"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                <div className="md:col-span-1">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Card Badge Overide (e.g. ABROAD)</label>
                                    <input
                                        type="text"
                                        name="badge_text"
                                        className="w-full px-6 py-4 bg-gray-50 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-red transition-all font-bold text-sm"
                                        value={formData.badge_text}
                                        onChange={handleInputChange}
                                        placeholder="Overrides default tags like 'HOTEL' or 'ABROAD'"
                                    />
                                </div>
                            </div>

                            {/* Activity Classification: show for all non-hotel (Activity/Tours model) services */}
                            {/* Previously: formData.service_type === 'activity' — but that was too narrow; */}
                            {/* clicking Activity/Tours card sets type to 'tour' by default, never 'activity'. */}
                            {formData.service_type !== 'hotel' && (
                                <div className="animate-in fade-in slide-in-from-top-2 duration-500">
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Activity Classification</label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {['Land', 'Sea' /*, 'Air', 'Evening' */].map((type) => (
                                            <button
                                                key={type}
                                                type="button"
                                                // onClick={() => setFormData(prev => ({ ...prev, activity_type: type }))}
                                                onClick={() => setFormData(prev => ({ ...prev, activity_type: type, service_type: 'activity' }))}
                                                className={`py-4 px-6 rounded-2xl border-2 transition-all font-black text-[10px] uppercase tracking-widest ${
                                                    formData.activity_type === type
                                                        ? 'bg-brand-red border-brand-red text-white shadow-lg shadow-red-200'
                                                        : 'bg-gray-50 border-slate-200 text-slate-400 hover:border-brand-red/30'
                                                }`}
                                            >
                                                {type} {type === 'Evening' ? 'Package' : 'Activity'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <div className="flex items-center justify-between mb-1.5 ml-1">
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Card Teaser (Short Description)</label>
                                        <button 
                                            type="button" 
                                            onClick={() => {
                                                const cleanText = (formData.short_description || '').replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim();
                                                setFormData(p => ({ ...p, short_description: cleanText }));
                                                import('../utils/swal').then(({ showAlert }) => showAlert('Success', 'Text formatting cleaned!', 'success'));
                                            }}
                                            className="text-[10px] font-bold text-brand-red uppercase tracking-widest hover:text-red-700 flex items-center gap-1"
                                        >
                                            <Sparkles size={12} /> Clean Formatting
                                        </button>
                                    </div>
                                    <textarea
                                        className="w-full px-6 py-4 bg-gray-50 border border-slate-300 rounded-3xl focus:outline-none focus:ring-2 focus:ring-brand-red transition-all font-medium text-sm min-h-[120px] resize-y custom-scrollbar"
                                        value={formData.short_description}
                                        onChange={(e) => setFormData(p => ({ ...p, short_description: e.target.value }))}
                                        placeholder="Catchy one-liner for search results and cards..."
                                    />
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-1.5 ml-1">
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Detailed Narrative</label>
                                        {/* AI generation hidden per user request */}
                                    </div>
                                    <div className="bg-white rounded-3xl border border-slate-300 overflow-hidden shadow-sm">
                                        <RichTextEditor
                                            value={formData.description}
                                            onChange={(content) => setFormData(prev => ({ ...prev, description: content }))}
                                            placeholder="Describe the inclusions, terms, and luxury standards of this service..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">Service Amenities (Add Tags)</label>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {(formData.amenities || []).map(amenity => (
                                        <span key={amenity} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-brand-red border border-red-100 rounded-xl text-[10px] font-black uppercase tracking-widest animate-in zoom-in-95 duration-200">
                                            {amenity}
                                            <button type="button" onClick={() => toggleListValue('amenities', amenity)} className="hover:text-red-700 transition-colors">
                                                <X size={12} />
                                            </button>
                                        </span>
                                    ))}
                                    {formData.amenities.length === 0 && (
                                        <span className="text-[10px] font-bold text-gray-300 uppercase italic">No amenities listed yet...</span>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        id="new_amenity"
                                        placeholder="e.g. Free WiFi, Infinity Pool"
                                        className="grow px-6 py-3 bg-gray-50 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-red transition-all text-xs font-bold"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                toggleListValue('amenities', e.target.value);
                                                e.target.value = '';
                                            }
                                        }}
                                    />
                                    <Button
                                        type="button"
                                        onClick={() => {
                                            const input = document.getElementById('new_amenity');
                                            toggleListValue('amenities', input.value);
                                            input.value = '';
                                        }}
                                        className="bg-brand-charcoal text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform"
                                    >
                                        Add
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </SortableSection>
                );
            case 'visibility':
                return (
                    <SortableSection
                        id="visibility"
                        title="Visibility & Status"
                        icon={Sparkles}
                        isCollapsed={collapsedSections.visibility}
                        onToggle={() => toggleSection('visibility')}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="p-6 bg-gray-50 border border-slate-300 rounded-3xl flex items-center justify-between group hover:border-brand-red transition-all">
                                <div>
                                    <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest leading-none mb-1">Featured Status</p>
                                    <p className="text-[8px] text-gray-400 font-bold uppercase">Show in Hero Section</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFormData(p => ({ ...p, featured: !p.featured }))}
                                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${formData.featured ? 'bg-brand-red' : 'bg-slate-200'}`}
                                >
                                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${formData.featured ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>

                            <div className="p-6 bg-gray-50 border border-slate-300 rounded-3xl flex items-center justify-between group hover:border-brand-red transition-all">
                                <div>
                                    <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest leading-none mb-1">Active Listing</p>
                                    <p className="text-[8px] text-gray-400 font-bold uppercase">Visible to Customers</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFormData(p => ({ ...p, is_active: !p.is_active }))}
                                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${formData.is_active ? 'bg-green-500' : 'bg-slate-200'}`}
                                >
                                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${formData.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>

                            <div className="p-6 bg-gray-50 border border-slate-300 rounded-3xl flex items-center justify-between group hover:border-brand-red transition-all">
                                <div>
                                    <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest leading-none mb-1">Coming Soon Label</p>
                                    <p className="text-[8px] text-gray-400 font-bold uppercase">Disable Reservations</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFormData(p => ({ ...p, is_coming_soon: !p.is_coming_soon }))}
                                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${formData.is_coming_soon ? 'bg-amber-500' : 'bg-slate-200'}`}
                                >
                                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${formData.is_coming_soon ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </div>
                    </SortableSection>
                );

            case 'policies':
                return (
                    <SortableSection
                        id="policies"
                        title="Policies & Legal"
                        icon={Info}
                        isCollapsed={collapsedSections.policies}
                        onToggle={() => toggleSection('policies')}
                    >
                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Cancellation Policy</label>
                                <div className="bg-white rounded-2xl border border-slate-300 overflow-hidden shadow-sm">
                                    <RichTextEditor
                                        value={formData.cancellation_policy}
                                        onChange={(content) => setFormData(prev => ({ ...prev, cancellation_policy: content }))}
                                        placeholder="Outline the rules for refund and cancellation..."
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Terms & Conditions (Service Specific)</label>
                                <div className="bg-white rounded-2xl border border-slate-300 overflow-hidden shadow-sm">
                                    <RichTextEditor
                                        value={formData.terms_and_conditions}
                                        onChange={(content) => setFormData(prev => ({ ...prev, terms_and_conditions: content }))}
                                        placeholder="Specify specific conditions for this service (e.g. age restrictions, dress code)..."
                                    />
                                </div>
                            </div>
                        </div>
                    </SortableSection>
                );
            case 'promotional':
                return (
                    <SortableSection
                        id="promotional"
                        title="Promotional Strategy"
                        icon={Tag}
                        isCollapsed={collapsedSections.promotional}
                        onToggle={() => toggleSection('promotional')}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="p-6 bg-red-50/50 rounded-2xl border border-red-100 flex items-center justify-between group">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-brand-red uppercase tracking-widest leading-none">Promotional Deal</p>
                                    <p className="text-[9px] text-gray-400 font-bold">Feature in Homepage Deals Carousel</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFormData(p => ({ ...p, is_seasonal_deal: !p.is_seasonal_deal }))}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${formData.is_seasonal_deal ? 'bg-brand-red' : 'bg-gray-300'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.is_seasonal_deal ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>

                            <div className={`transition-all duration-500 ${formData.is_seasonal_deal ? 'opacity-100 translate-y-0' : 'opacity-40 pointer-events-none'}`}>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Promo Badge Note</label>
                                <input
                                    type="text"
                                    name="deal_note"
                                    className="w-full px-6 py-4 bg-gray-50 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-red transition-all font-bold text-sm"
                                    value={formData.deal_note}
                                    onChange={handleInputChange}
                                    placeholder="e.g. Limited Time, 20% OFF"
                                    disabled={!formData.is_seasonal_deal}
                                />
                            </div>
                        </div>
                    </SortableSection>
                );

            case 'gallery':
                return (
                    <SortableSection
                        id="gallery"
                        title="Multi-Image Experience Gallery"
                        icon={Camera}
                        isCollapsed={collapsedSections.gallery}
                        onToggle={() => toggleSection('gallery')}
                        extraAction={
                            <div className="text-[10px] text-gray-300 font-black uppercase tracking-widest">{formData.gallery_images?.length || 0} / 10 ASSETS</div>
                        }
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <ImageUpload
                                    label="Push to Gallery"
                                    value=""
                                    onChange={addGalleryImage}
                                    folder="services"
                                    aspectRatio="aspect-video"
                                    placeholder="Click or Drop to Add Gallery Photo"
                                    showUrlInput={false}
                                />
                                <div className="p-4 bg-gray-50 border border-slate-300 border-dashed rounded-2xl">
                                    <p className="text-[9px] text-gray-400 font-bold leading-relaxed uppercase tracking-widest text-center">
                                        Images will be used in the premium carousel for this service.
                                    </p>
                                </div>
                            </div>

                            <div className="overflow-y-auto max-h-[250px] pr-2 custom-scrollbar">
                                <div className="grid grid-cols-2 gap-4">
                                    {(formData.gallery_images || []).map((img, i) => (
                                        <div key={i} className="relative group/gal aspect-video rounded-2xl overflow-hidden border border-slate-300 shadow-sm cursor-zoom-in" onClick={() => setPreviewImage(resolveImageUrl(img))}>
                                            <img src={resolveImageUrl(img)} alt={`Gallery ${i}`} className="w-full h-full object-cover transition-transform group-hover/gal:scale-110 duration-500" />
                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/gal:opacity-100 transition-opacity" />
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeGalleryImage(img);
                                                }}
                                                className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-lg opacity-0 group-hover/gal:opacity-100 transition-opacity hover:bg-red-700"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    {(!formData.gallery_images || formData.gallery_images.length === 0) && (
                                        <div className="col-span-2 py-10 flex flex-col items-center justify-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100 text-gray-300">
                                            <Camera size={32} className="opacity-20 mb-2" />
                                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Empty Portfolio</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </SortableSection>
                );
            case 'narrative':
                return (
                    <SortableSection
                        id="narrative"
                        title="Narrative & Inclusions"
                        icon={Info}
                        isCollapsed={collapsedSections.narrative}
                        onToggle={() => toggleSection('narrative')}
                    >
                        <div className="space-y-8">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 ml-1">Key Experience Highlights</label>
                                <div className="space-y-3">
                                    {(formData.highlights || []).map((highlight, idx) => (
                                        <div key={idx} className="flex gap-2 group/h">
                                            <input
                                                type="text"
                                                className="grow px-6 py-3 bg-gray-50 border border-slate-300 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-brand-red transition-all"
                                                value={highlight}
                                                onChange={(e) => {
                                                    const updated = [...formData.highlights];
                                                    updated[idx] = e.target.value;
                                                    setFormData(prev => ({ ...prev, highlights: updated }));
                                                }}
                                            />
                                            <button 
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, highlights: prev.highlights.filter((_, i) => i !== idx) }))}
                                                className="p-3 text-slate-300 hover:text-brand-red transition-all"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    ))}
                                    <Button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, highlights: [...prev.highlights, ''] }))}
                                        className="w-full py-4 border-2 border-dashed border-slate-200 text-slate-400 hover:text-brand-red hover:border-brand-red/20 transition-all text-[10px] font-black uppercase tracking-widest rounded-2xl bg-slate-50/30"
                                    >
                                        <Plus size={14} className="inline mr-2" /> Add Highlight Point
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 ml-1">Included in Package</label>
                                    <div className="space-y-3">
                                        {(formData.included || []).map((item, idx) => (
                                            <div key={idx} className="flex gap-2">
                                                <input
                                                    type="text"
                                                    className="grow px-6 py-3 bg-green-50/30 border border-green-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-green-500 transition-all placeholder:text-green-200"
                                                    value={item}
                                                    onChange={(e) => {
                                                        const updated = [...formData.included];
                                                        updated[idx] = e.target.value;
                                                        setFormData(prev => ({ ...prev, included: updated }));
                                                    }}
                                                />
                                                <button 
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, included: prev.included.filter((_, i) => i !== idx) }))}
                                                    className="p-3 text-slate-300 hover:text-brand-red transition-all"
                                                >
                                                    <X size={18} />
                                                </button>
                                            </div>
                                        ))}
                                        <Button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, included: [...prev.included, ''] }))}
                                            className="w-full py-4 border-2 border-dashed border-green-100 text-green-400 hover:text-green-600 transition-all text-[10px] font-black uppercase tracking-widest rounded-2xl"
                                        >
                                            <Plus size={14} className="inline mr-2" /> Add Inclusion
                                        </Button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 ml-1">Excluded (Not Included)</label>
                                    <div className="space-y-3">
                                        {(formData.not_included || []).map((item, idx) => (
                                            <div key={idx} className="flex gap-2">
                                                <input
                                                    type="text"
                                                    className="grow px-6 py-3 bg-red-50/30 border border-red-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-brand-red transition-all placeholder:text-red-200"
                                                    value={item}
                                                    onChange={(e) => {
                                                        const updated = [...formData.not_included];
                                                        updated[idx] = e.target.value;
                                                        setFormData(prev => ({ ...prev, not_included: updated }));
                                                    }}
                                                />
                                                <button 
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, not_included: prev.not_included.filter((_, i) => i !== idx) }))}
                                                    className="p-3 text-slate-300 hover:text-brand-red transition-all"
                                                >
                                                    <X size={18} />
                                                </button>
                                            </div>
                                        ))}
                                        <Button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, not_included: [...prev.not_included, ''] }))}
                                            className="w-full py-4 border-2 border-dashed border-red-100 text-red-400 hover:text-red-600 transition-all text-[10px] font-black uppercase tracking-widest rounded-2xl"
                                        >
                                            <Plus size={14} className="inline mr-2" /> Add Exclusion
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </SortableSection>
                );
            case 'itinerary': {
                return (
                    <SortableSection
                        id="itinerary"
                        title="Itinerary & Schedule"
                        icon={Calendar}
                        isCollapsed={collapsedSections.itinerary}
                        onToggle={() => toggleSection('itinerary')}
                        extraAction={
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    addItineraryDay();
                                }}
                                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-red hover:text-red-700 transition-colors"
                            >
                                <Plus size={14} /> Add Day/Stop
                            </button>
                        }
                    >
                        <div className="space-y-4">
                            {formData.itinerary.length === 0 ? (
                                <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-3xl text-gray-300">
                                    <Calendar size={48} className="mb-2 opacity-20" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">No itinerary defined</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {formData.itinerary.map((it, idx) => (
                                        <div key={idx} className="p-6 bg-gray-50/50 rounded-2xl border border-slate-300 flex gap-6 relative group/it">
                                            <button
                                                type="button"
                                                onClick={() => removeItineraryDay(idx)}
                                                className="absolute top-4 right-4 text-gray-300 hover:text-brand-red transition-colors opacity-0 group-hover/it:opacity-100"
                                            >
                                                <X size={16} />
                                            </button>

                                            <div className="w-24 shrink-0">
                                                <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Label</label>
                                                <input
                                                    type="text"
                                                    placeholder="Day 1"
                                                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-[10px] font-black uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-brand-red"
                                                    value={it.day}
                                                    onChange={e => updateItineraryDay(idx, 'day', e.target.value)}
                                                />
                                            </div>

                                            <div className="flex-1 space-y-4">
                                                <div className="flex flex-col md:flex-row gap-4">
                                                    <div className="flex-1">
                                                        <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Stop Title / Highlight</label>
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="text"
                                                                placeholder="e.g. Arrival at Blue Bay Marine Park"
                                                                className="grow px-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-brand-red"
                                                                value={it.title}
                                                                onChange={e => updateItineraryDay(idx, 'title', e.target.value)}
                                                            />
                                                            <div className="w-40 shrink-0">
                                                                <input
                                                                    type="text"
                                                                    placeholder="Date or Time (e.g. 25/05/26)"
                                                                    className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-brand-red"
                                                                    value={it.time || ''}
                                                                    onChange={e => updateItineraryDay(idx, 'time', e.target.value)}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="w-full md:w-48 h-20">
                                                        <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Stop Illustration</label>
                                                        <ImageUpload
                                                            value={it.image_url}
                                                            onChange={url => updateItineraryDay(idx, 'image_url', url)}
                                                            folder="itineraries"
                                                            aspectRatio="aspect-video"
                                                            showUrlInput={false}
                                                            placeholder="Add Image"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Stop Description</label>
                                                    <RichTextEditor
                                                        value={it.description}
                                                        onChange={(val) => updateItineraryDay(idx, 'description', val)}
                                                        placeholder="Details about the stop, highlights, or inclusions..."
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </SortableSection>
                );
            }
            /* 
            case 'meal_plans':
                if (!formData.category_ids.some(id => {
                    const cat = categories.find(c => c.id === id);
                    return cat && (
                        cat.name.includes('Package') || 
                        cat.name.includes('Evening') ||
                        cat.name.includes('Hotel') || 
                        cat.name.includes('Cruise')
                    );
                })) return null;
                const availableMealPlans = [
                    { id: 'room_only', label: 'Room Only' },
                    { id: 'breakfast', label: 'Bed & Breakfast' },
                    { id: 'half_board', label: 'Half Board' },
                    { id: 'full_board', label: 'Full Board' }
                ];
                return (
                    <SortableSection
                        id="meal_plans"
                        title="Meal Plans & Inclusions"
                        icon={Utensils}
                        isCollapsed={collapsedSections.meal_plans}
                        onToggle={() => toggleSection('meal_plans')}
                    >
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {availableMealPlans.map(plan => (
                                <button
                                    key={plan.id}
                                    type="button"
                                    onClick={() => toggleListValue('meal_plans', plan.label)}
                                    className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${
                                        formData.meal_plans.includes(plan.label)
                                            ? 'bg-red-50 border-brand-red text-brand-red shadow-lg scale-105'
                                            : 'bg-white border-slate-200 text-slate-400 hover:border-brand-red/30'
                                    }`}
                                >
                                    <Utensils size={24} />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-center leading-tight">{plan.label}</span>
                                </button>
                            ))}
                        </div>
                    </SortableSection>
                );
            */
            default:
                return null;
        }
    };

    const isEdit = !!id;

    useEffect(() => {
        const initialize = async () => {
            setPageLoading(true);
            await fetchCategories();
            if (isEdit) {
                await fetchService();
            }
            setPageLoading(false);
        };
        initialize();
    }, [id]);

    /* ORIGINAL AUTO-DERIVATION EFFECT (COMMENTED OUT AS PER USER RULE: Never remove any code, instead comment it)
    // Auto-derive service_type (and activity_type) from selected categories
    useEffect(() => {
        if (!categories || !categories.length || !formData.category_ids || !formData.category_ids.length) return;
        
        // ⚠️ Safeguard: If the administrator manually set or edited the type, do not auto-override!
        if (formData.service_type_override) return;
        
        const selectedCats = categories.filter(c => formData.category_ids.includes(c.id));
        const names = selectedCats.map(c => (c.name || '').toLowerCase());
        
        let derivedType = 'tour';
        let derivedActivityType = null; // auto-set activity_type when category implies it
        
        const isRodrigues = names.some(n => n.includes('rodrigues'));
        const isHotel = names.some(n => n.includes('hotel') || n.includes('resort') || n.includes('accommodation'));

        if (isHotel || isRodrigues) {
            derivedType = 'hotel';
        } else if (names.some(n => n.includes('travel package'))) derivedType = 'tour';
        else if (names.some(n => n.includes('day package'))) derivedType = 'day_package';
        else if (names.some(n => n.includes('evening package'))) derivedType = 'evening_package';
        else if (names.some(n => n.includes('package'))) derivedType = 'tour';
        else if (names.some(n => n.includes('cruise'))) derivedType = 'tour';
        else if (names.some(n => n.includes('tour'))) derivedType = 'tour';
        else if (names.some(n => n.includes('flight'))) derivedType = 'tour';
        else if (names.some(n => n.includes('transfer'))) derivedType = 'transfer';
        // Specific activity sub-categories — set activity_type automatically
        else if (names.some(n => n.includes('land activit'))) { derivedType = 'activity'; derivedActivityType = 'Land'; }
        else if (names.some(n => n.includes('sea activit'))) { derivedType = 'activity'; derivedActivityType = 'Sea'; }
        // else if (names.some(n => n.includes('activity'))) derivedType = 'tour'; // old (wrong)
        else if (names.some(n => n.includes('activity'))) derivedType = 'activity';
        
        setFormData(prev => ({
            ...prev,
            service_type: derivedType !== prev.service_type ? derivedType : prev.service_type,
            // Only auto-set activity_type if a specific sub-category drives it and user hasn't set it
            activity_type: derivedActivityType !== null ? derivedActivityType : prev.activity_type,
        }));
    }, [formData.category_ids, categories]);
    */

    // Updated auto-derive service_type (and activity_type) from selected categories
    // This effect runs whenever category_ids, categories, or service_type_override change.
    useEffect(() => {
        // console.log('[Auto-Derivation] Running auto-derivation effect');
        if (!categories || !categories.length || !formData.category_ids || !formData.category_ids.length) {
            // console.log('[Auto-Derivation] No categories or category_ids found');
            return;
        }
        
        // ⚠️ Safeguard: If the administrator manually set or edited the type, do not auto-override!
        if (formData.service_type_override) {
            // console.log('[Auto-Derivation] Safeguard triggered: service_type_override is set:', formData.service_type_override);
            return;
        }
        
        const selectedCats = categories.filter(c => formData.category_ids.includes(c.id));
        const names = selectedCats.map(c => (c.name || '').toLowerCase());
        
        let derivedType = 'tour';
        let derivedActivityType = null; // auto-set activity_type when category implies it
        
        const isRodrigues = names.some(n => n.includes('rodrigues'));
        const isHotel = names.some(n => n.includes('hotel') || n.includes('resort') || n.includes('accommodation'));

        if (isHotel || isRodrigues) {
            derivedType = 'hotel';
        } else if (formData.activity_type === 'Land' || formData.activity_type === 'Sea') {
            derivedType = 'activity';
        } else if (names.some(n => n.includes('travel package'))) derivedType = 'tour';
        else if (names.some(n => n.includes('day package'))) derivedType = 'day_package';
        else if (names.some(n => n.includes('evening package'))) derivedType = 'evening_package';
        else if (names.some(n => n.includes('package'))) derivedType = 'tour';
        else if (names.some(n => n.includes('cruise'))) derivedType = 'tour';
        else if (names.some(n => n.includes('tour'))) derivedType = 'tour';
        else if (names.some(n => n.includes('flight'))) derivedType = 'tour';
        else if (names.some(n => n.includes('transfer'))) derivedType = 'transfer';
        // Specific activity sub-categories — set activity_type automatically
        else if (names.some(n => n.includes('land activit'))) { derivedType = 'activity'; derivedActivityType = 'Land'; }
        else if (names.some(n => n.includes('sea activit'))) { derivedType = 'activity'; derivedActivityType = 'Sea'; }
        else if (names.some(n => n.includes('activity'))) derivedType = 'activity';
        
        // console.log('[Auto-Derivation] Derived type:', derivedType, 'Derived activity type:', derivedActivityType);
        
        setFormData(prev => {
            const nextServiceType = derivedType !== prev.service_type ? derivedType : prev.service_type;
            const nextActivityType = derivedActivityType !== null ? derivedActivityType : prev.activity_type;
            // console.log('[Auto-Derivation] Updating state. service_type:', nextServiceType, 'activity_type:', nextActivityType);
            return {
                ...prev,
                service_type: nextServiceType,
                // Only auto-set activity_type if a specific sub-category drives it and user hasn't set it
                activity_type: nextActivityType,
            };
        });
    }, [formData.category_ids, categories, formData.service_type_override, formData.activity_type]);

    const fetchCategories = async () => {
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('id, name')
                .eq('is_active', true)
                .order('display_order', { ascending: true });

            if (error) throw error;
            setCategories(data || []);
        } catch (e) {
            console.error('Error fetching categories:', e);
        }
    };

    const fetchService = async () => {
        try {
            const { data, error } = await supabase
                .from('services')
                .select('*, service_categories(category_id)')
                .eq('id', id)
                .single();

            if (error) throw error;
            if (data) {
                setFormData({
                    name: data.name || '',
                    category_ids: data.service_categories?.map(pc => pc.category_id) || [],
                    short_description: data.short_description || '',
                    description: data.description || '',
                    image_url: data.image_url || '',
                    secondary_image_url: data.secondary_image_url || '',
                    banner_url: data.banner_url || '',
                    amenities: data.amenities || [],
                    itinerary: data.itinerary || [],
                    region: data.region || '',
                    service_type: data.service_type || 'tour',
                    service_fee: data.service_fee || 0,
                    location: data.location || '',
                    featured: data.featured || false,
                    priority: data.priority || 0,
                    max_group_size: data.max_group_size || '',
                    meta_title: data.meta_title || '',
                    meta_description: data.meta_description || '',
                    is_seasonal_deal: data.is_seasonal_deal || false,
                    deal_note: data.deal_note || 'Limited Time',
                    is_active: data.is_active ?? true,
                    is_coming_soon: data.is_coming_soon ?? false,
                    gallery_images: data.gallery_images || [],
                    highlights: data.highlights || [],
                    included: data.included || [],
                    not_included: data.not_included || [],
                    cancellation_policy: data.cancellation_policy || '',
                    terms_and_conditions: data.terms_and_conditions || '',
                    meal_plans: data.meal_plans || [],
                    activity_type: data.activity_type || '',
                    badge_text: data.badge_text || '',
                    // FIX: Only lock the override for hotel records.
                    // For all other types (tour, activity, etc.), clear the override so
                    // auto-derivation from selected categories can correct legacy mismatches
                    // (e.g. an activity saved as 'tour' before the bug was fixed).
                    // service_type_override: data.service_type || 'tour'
                    service_type_override: data.service_type === 'hotel' ? 'hotel' : null
                });
            }
        } catch (e) {
            console.error('Error fetching service:', e);
            showAlert('Error', 'Failed to load service details', 'error');
            navigate('/services');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    /* 
    Legacy Pricing Logic - Removed in favor of Price Manager
    */

    const addItineraryDay = () => {
        setFormData(prev => ({
            ...prev,
            itinerary: [...prev.itinerary, { day: `Day ${prev.itinerary.length + 1}`, time: '', title: '', description: '', image_url: '' }]
        }));
    };

    const removeItineraryDay = (idx) => {
        setFormData(prev => ({
            ...prev,
            itinerary: prev.itinerary.filter((_, i) => i !== idx)
        }));
    };

    const updateItineraryDay = (idx, field, value) => {
        setFormData(prev => {
            const updated = [...prev.itinerary];
            updated[idx] = { ...updated[idx], [field]: value };
            return { ...prev, itinerary: updated };
        });
    };

    const handleCategoryToggle = (catId) => {
        setFormData(prev => {
            const current = prev.category_ids;
            if (current.includes(catId)) {
                return { ...prev, category_ids: current.filter(id => id !== catId) };
            } else {
                return { ...prev, category_ids: [...current, catId] };
            }
        });
    };

    const addGalleryImage = (url) => {
        if (!url) return;
        setFormData(prev => ({
            ...prev,
            gallery_images: [...(prev.gallery_images || []), url].slice(0, 10)
        }));
    };

    const removeGalleryImage = (url) => {
        setFormData(prev => ({
            ...prev,
            gallery_images: (prev.gallery_images || []).filter(img => img !== url)
        }));
    };

    const toggleListValue = (field, value) => {
        if (!value) return;
        setFormData(prev => {
            const current = [...(prev[field] || [])];
            if (current.includes(value)) {
                return { ...prev, [field]: current.filter(v => v !== value) };
            } else {
                return { ...prev, [field]: [...current, value] };
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);

        try {
            const serviceData = {
                name: formData.name,
                short_description: formData.short_description,
                description: formData.description,
                image_url: formData.image_url,
                secondary_image_url: formData.secondary_image_url,
                banner_url: formData.banner_url,
                amenities: formData.amenities || [],
                itinerary: formData.itinerary || [],
                region: formData.region || null,
                service_type: formData.service_type,
                service_fee: parseFloat(formData.service_fee) || 0,
                location: formData.location || null,
                featured: formData.featured,
                priority: parseInt(formData.priority) || 0,
                max_group_size: parseInt(formData.max_group_size) || null,
                meta_title: formData.meta_title,
                meta_description: formData.meta_description,
                is_active: formData.is_active,
                gallery_images: formData.gallery_images || [],
                highlights: formData.highlights || [],
                included: formData.included || [],
                not_included: formData.not_included || [],
                cancellation_policy: formData.cancellation_policy || null,
                terms_and_conditions: formData.terms_and_conditions || null,
                meal_plans: formData.meal_plans || [],
                activity_type: formData.activity_type || null,
                is_seasonal_deal: formData.is_seasonal_deal || false,
                deal_note: formData.deal_note || null,
                badge_text: formData.badge_text || null,
                updated_at: new Date().toISOString()
            };

            let serviceId = id;

            if (isEdit) {
                const { error } = await supabase
                    .from('services')
                    .update(serviceData)
                    .eq('id', id);
                if (error) throw error;
            } else {
                const { data, error } = await supabase
                    .from('services')
                    .insert([{ ...serviceData, created_at: new Date().toISOString() }])
                    .select()
                    .single();
                if (error) throw error;
                serviceId = data.id;
            }

            const { error: deleteError } = await supabase
                .from('service_categories')
                .delete()
                .eq('service_id', serviceId);
            if (deleteError) throw deleteError;

            if (formData.category_ids.length > 0) {
                const associations = formData.category_ids.map(catId => ({
                    service_id: serviceId,
                    category_id: catId
                }));
                const { error: insertError } = await supabase
                    .from('service_categories')
                    .insert(associations);
                if (insertError) throw insertError;
            }

            showAlert('Success', isEdit ? 'Service updated successfully.' : 'Service listed successfully.', 'success');
            
            // Invalidate queries to ensure latest data is fetched immediately
            await queryClient.invalidateQueries({ queryKey: ['services'] });
            
            navigate('/services');
        } catch (error) {
            console.error('Save Error:', error);
            showAlert('Action Failed', error.message || 'Could not save service', 'error');
        } finally {
            setFormLoading(false);
        }
    };

    if (pageLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-brand-red mb-4" size={48} />
                <p className="text-gray-400 font-black uppercase tracking-widest text-xs">Loading Catalog Workspace...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Top Navigation Header */}
            <div className="bg-white border-b border-slate-200 px-8 py-6 mb-8 sticky top-0 z-30 shadow-sm backdrop-blur-md bg-white/90">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex flex-col gap-4">
                        <button
                            onClick={() => navigate('/services')}
                            className="group flex items-center gap-3 text-slate-400 hover:text-brand-red transition-all font-black uppercase tracking-widest text-[10px] w-fit"
                        >
                            <div className="p-2 border border-slate-300 rounded-xl group-hover:bg-red-50 group-hover:border-red-100 transition-all bg-white shadow-sm">
                                <ArrowLeft size={16} />
                            </div>
                            Back to Catalog
                        </button>
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-none">
                                {isEdit ? 'Edit Excellence' : 'List New Service'}
                            </h1>
                            <p className="text-gray-400 text-[10px] uppercase font-black tracking-[0.2em] mt-2">
                                {isEdit ? `Modifying ID: ${id}` : 'Catalog Expansion & Inventory Initialization'}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <Button 
                            variant="outline" 
                            onClick={() => navigate('/services')}
                            className="flex-1 md:flex-none border-slate-300 text-slate-500 font-bold px-6 py-3 h-12 rounded-2xl"
                        >
                            Discard
                        </Button>
                        <Button 
                            onClick={handleSubmit} 
                            disabled={formLoading}
                            className="flex-1 md:flex-none bg-brand-red hover:opacity-90 text-white font-black px-8 py-3 h-12 rounded-2xl shadow-xl shadow-red-200 flex items-center justify-center gap-2"
                        >
                            {formLoading ? (
                                <Loader2 className="animate-spin" size={18} />
                            ) : (
                                <>
                                    <Save size={18} />
                                    <span>{isEdit ? 'Sync Changes' : 'Deploy Listing'}</span>
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto w-full px-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700 flex-1">

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-brand-red to-red-400 rounded-3xl blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
                    <Card className="relative bg-white border border-slate-300 shadow-xl shadow-gray-200/50 rounded-3xl overflow-hidden">
                        <div className="h-40 bg-brand-charcoal relative overflow-hidden">
                            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                            <div className="absolute inset-0 bg-gradient-to-r from-brand-red/20 to-transparent"></div>
                        </div>
                        <CardContent className="px-10 pb-10 relative">
                            <div className="flex flex-col md:flex-row items-end gap-8 -mt-20">
                                <div className="relative group/photo flex-shrink-0">
                                    <div className="w-56 h-56 rounded-3xl border-[6px] border-white shadow-2xl bg-gray-50 overflow-hidden relative">
                                        <ImageUpload
                                            value={formData.image_url}
                                            onChange={(url) => setFormData(prev => ({ ...prev, image_url: url }))}
                                            folder="services"
                                            aspectRatio="aspect-square"
                                            showUrlInput={false}
                                            placeholder="Service Photo"
                                        />
                                    </div>
                                    <div className={`absolute bottom-4 -right-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg border-2 border-white z-10 ${formData.status === 'In Stock' ? 'bg-green-500 text-white' :
                                        formData.status === 'Low Stock' ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'
                                        }`}>
                                        {formData.status}
                                    </div>
                                </div>

                                <div className="flex-1 pb-2 font-black">
                                    <h2 className="text-3xl text-gray-900 tracking-tight truncate max-w-md">
                                        {formData.name || "Untitled Specification"}
                                    </h2>
                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                        {formData.category_ids.length > 0 ? (
                                            formData.category_ids.map(id => {
                                                const cat = categories.find(c => c.id === id);
                                                return cat ? (
                                                    <span key={id} className="px-2.5 py-1 text-[9px] uppercase tracking-widest rounded-lg bg-red-50 text-brand-red border border-red-100">
                                                        {cat.name}
                                                    </span>
                                                ) : null;
                                            })
                                        ) : (
                                            <span className="px-2.5 py-1 text-[9px] uppercase tracking-widest rounded-lg bg-gray-50 text-gray-500 border border-gray-100">
                                                Unassigned
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="pb-2">
                                    <Button
                                        type="submit"
                                        disabled={formLoading}
                                        className="bg-brand-red text-white px-10 py-4 rounded-2xl shadow-xl shadow-red-100 flex items-center gap-3 font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all"
                                    >
                                        {formLoading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                        {isEdit ? 'Update Specification' : 'Publish Service'}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-8">
                    <div className="space-y-8">
                        <DndContext 
                            sensors={sensors} 
                            collisionDetection={closestCenter} 
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext items={sectionOrder} strategy={verticalListSortingStrategy}>
                                <div className="space-y-8">
                                    {sectionOrder.map(sectionId => renderSectionContent(sectionId))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    </div>
                </div>

                <div className="flex justify-end gap-4 p-8 bg-gray-50/50 rounded-3xl border border-slate-300 border-dashed">
                    <button
                        type="button"
                        onClick={() => navigate('/services')}
                        className="px-8 py-3 text-[10px] uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-all font-black"
                    >
                        Cancel
                    </button>
                    <Button
                        type="submit"
                        disabled={formLoading}
                        className="bg-brand-red text-white px-12 py-4 rounded-2xl shadow-xl shadow-red-100 flex items-center gap-3 font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all"
                    >
                        {formLoading && <Loader2 size={16} className="animate-spin" />}
                        {isEdit ? 'Update Service' : 'Create Service'}
                    </Button>
                </div>
            </form>

            {/* Premium Image Preview Modal */}
            {previewImage && (
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 bg-brand-charcoal/95 backdrop-blur-md animate-in fade-in duration-300"
                    onClick={() => setPreviewImage(null)}
                >
                    <button 
                        className="absolute top-8 right-8 p-3 bg-white/10 text-white hover:bg-white/20 rounded-full transition-all border border-white/20"
                        onClick={() => setPreviewImage(null)}
                    >
                        <X size={24} />
                    </button>
                    <img 
                        src={previewImage} 
                        className="max-w-full max-h-full object-contain rounded-3xl shadow-2xl animate-in zoom-in-95 duration-500" 
                        alt="Preview" 
                    />
                </div>
            )}
        </div>
    </div>
);
};

export default CreateService;
