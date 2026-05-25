import React, { useState, useEffect, useMemo } from 'react';
import { 
    ImageIcon, Save, Loader2, Search,
    Layout, ExternalLink, 
    Edit3, X, AlertCircle, Building2, 
    Compass, Globe, Info, Home, Phone, Anchor, MapPin, Moon, Wine, FileText, ShieldCheck, Layers, BookOpen, Users, Plane
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/Button';
import { Card, CardContent } from '../components/Card';
import { showAlert, showConfirm } from '../utils/swal';
import { resolveImageUrl } from '../utils/image';
import ImageUpload from '../components/ImageUpload';
import RichTextEditor from '../components/RichTextEditor';

const PAGE_REGISTRY = [
    { slug: 'home', name: 'Home / Landing', icon: <Home size={18} /> },
    { slug: 'about', name: 'About Agency', icon: <Info size={18} /> },
    { slug: 'about/our-story', name: 'Our Story', icon: <BookOpen size={18} /> },
    { slug: 'about/team', name: 'Our Team', icon: <Users size={18} /> },
    { slug: 'activities', name: 'Activities', icon: <Wine size={18} /> },
    { slug: 'contact', name: 'Contact Us', icon: <Phone size={18} /> },
    { slug: 'cruises', name: 'Cruises', icon: <Anchor size={18} /> },
    { slug: 'day-packages', name: 'Day Packages', icon: <MapPin size={18} /> },
    { slug: 'evening-packages', name: 'Evening Packages', icon: <Moon size={18} /> },
    { slug: 'destinations', name: 'All Destinations', icon: <Compass size={18} /> },
    { slug: 'destinations/mauritius', name: 'Mauritius Focus', icon: <MapPin size={18} /> },
    { slug: 'destinations/rodrigues', name: 'Rodrigues Focus', icon: <MapPin size={18} /> },
    { slug: 'destinations/international', name: 'International Focus', icon: <Globe size={18} /> },
    { slug: 'faq', name: 'FAQs / Support', icon: <Compass size={18} /> },
    { slug: 'flights', name: 'Flights', icon: <Plane size={18} /> },
    { slug: 'hotels', name: 'Hotels', icon: <Building2 size={18} /> },
    { slug: 'hotel-packages', name: 'Hotel Packages', icon: <Layers size={18} /> },
    { slug: 'hotel-day-packages', name: 'Hotel Day Packages', icon: <Layers size={18} /> },
    { slug: 'news', name: 'News & Blog', icon: <FileText size={18} /> },
    { slug: 'packages', name: 'Packages', icon: <Layers size={18} /> },
    { slug: 'privacy-policy', name: 'Privacy Policy', icon: <ShieldCheck size={18} /> },
    { slug: 'plan-my-trip', name: 'Plan My Trip', icon: <Compass size={18} /> },
    { slug: 'restaurants', name: 'Restaurants', icon: <Wine size={18} /> },
    { slug: 'rodrigue-hotels', name: 'Rodrigues Hotels', icon: <Building2 size={18} /> },
    { slug: 'safety', name: 'Safety & Security', icon: <ShieldCheck size={18} /> },
    { slug: 'spa', name: 'Spa & Wellness', icon: <Users size={18} /> },
    { slug: 'tailormade', name: 'Tailor-Made', icon: <Edit3 size={18} /> },
    { slug: 'terms-conditions', name: 'Terms of Service', icon: <BookOpen size={18} /> },
    { slug: 'tours', name: 'Tours', icon: <Compass size={18} /> },
    { slug: 'transfers', name: 'Transfers', icon: <Plane size={18} /> },
    { slug: 'visa-services', name: 'Visa Services', icon: <FileText size={18} /> },
].map(p => ({ ...p, icon: React.cloneElement(p.icon || <Layout size={18} />) }));

// Icons for the registry
const HelpfulSearch = (props) => <Compass {...props} />;

const PageBanners = () => {
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [selectedBanner, setSelectedBanner] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchBanners();
    }, []);

    const fetchBanners = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('content_blocks')
                .select('*')
                .eq('section_key', 'section_1_hero')
                .order('page_slug', { ascending: true });

            if (error) throw error;
            setBanners(data || []);
        } catch (error) {
            console.error('Error fetching banners:', error);
            showAlert('Error', 'Failed to retrieve page banners', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (banner) => {
        setSelectedBanner({ ...banner });
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('content_blocks')
                .update({ 
                    content: selectedBanner.content,
                    updated_at: new Date().toISOString()
                })
                .eq('id', selectedBanner.id);

            if (error) throw error;
            
            setBanners(prev => prev.map(b => b.id === selectedBanner.id ? selectedBanner : b));
            setIsModalOpen(false);
            showAlert('Success', 'Banner updated successfully', 'success');
        } catch (error) {
            console.error('Error saving banner:', error);
            showAlert('Error', 'Failed to save banner', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleInject = async (page) => {
        const result = await showConfirm(
            'Inject Banner?',
            `Would you like to initialize a dynamic banner for ${page.name}?`
        );

        if (!result.isConfirmed) return;

        try {
            const initialContent = {
                badge: "Explore",
                title: page.name,
                subtitle: "Experience the extraordinary",
                description: `Discover everything about ${page.name.toLowerCase()} with Royal Travel.`,
                image: "https://images.unsplash.com/photo-1544084471-507c8cc38662"
            };

            const { data, error } = await supabase
                .from('content_blocks')
                .insert([{
                    page_slug: page.slug,
                    section_key: 'section_1_hero',
                    content: initialContent
                }])
                .select();

            if (error) throw error;
            
            setBanners(prev => [...prev, data[0]]);
            handleEdit(data[0]);
        } catch (error) {
            console.error('Error injecting banner:', error);
            showAlert('Error', 'Failed to initialize banner', 'error');
        }
    };

    const filteredBanners = useMemo(() => {
        return banners.filter(b => 
            b.page_slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (b.content?.title || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [banners, searchTerm]);

    const missingBanners = useMemo(() => {
        const existingSlugs = new Set(banners.map(b => b.page_slug));
        return PAGE_REGISTRY.filter(p => !existingSlugs.has(p.slug));
    }, [banners]);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3 uppercase">
                        <ImageIcon className="text-red-600" />
                        Global Page Banners
                    </h1>
                    <p className="text-slate-400 text-[11px] font-black uppercase tracking-widest mt-1">
                        Synchronize visual identity across the entire ecosystem
                    </p>
                </div>
                <div className="flex items-center gap-2">
{/* 
                    <Button
                        onClick={fetchBanners}
                        variant="outline"
                        className="text-slate-500 border-slate-300 flex items-center gap-2"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        Sync Registry
                    </Button>
                    */}
                </div>
            </div>

            {/* Stats & Search */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-red-600 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search by page or title..."
                        className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-3xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-red-600/5 transition-all shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="bg-slate-900 rounded-3xl p-4 flex items-center justify-between text-white shadow-xl shadow-slate-900/10">
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">System Coverage</p>
                        <h4 className="text-2xl font-black">{banners.length} / {PAGE_REGISTRY.length}</h4>
                    </div>
                    <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center">
                        <Globe size={20} className="text-red-500" />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="py-40 flex flex-col items-center justify-center">
                    <Loader2 className="animate-spin text-red-600 mb-6" size={60} strokeWidth={1} />
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.6em]">Scanning Architectural Layers...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {/* Existing Banners */}
                    {filteredBanners.map((banner) => (
                        <Card key={banner.id} className="group overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white hover:border-red-600/20 hover:shadow-2xl hover:shadow-red-600/5 transition-all duration-500">
                            <CardContent className="p-0 flex flex-col h-full">
                                <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                                    <img 
                                        src={resolveImageUrl(banner.content?.image)} 
                                        alt="" 
                                        className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700"
                                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800'; }}
                                    />
                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent p-6 pt-12">
                                        <span className="bg-red-600 text-white px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest mb-2 inline-block">
                                            {banner.page_slug}
                                        </span>
                                        <h3 className="text-white text-lg font-black leading-tight line-clamp-1">{banner.content?.title || 'Untitled Banner'}</h3>
                                    </div>
                                    <div className="absolute top-4 right-4 flex flex-col gap-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                        <button 
                                            onClick={() => handleEdit(banner)}
                                            className="p-3 bg-white text-slate-900 rounded-2xl shadow-xl hover:bg-red-600 hover:text-white transition-all"
                                        >
                                            <Edit3 size={16} />
                                        </button>
                                        <a 
                                            href={`https://royaltravel.mu${banner.page_slug === 'home' ? '' : `/${banner.page_slug}`}`} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="p-3 bg-white text-slate-900 rounded-2xl shadow-xl hover:bg-slate-900 hover:text-white transition-all"
                                        >
                                            <ExternalLink size={16} />
                                        </a>
                                    </div>
                                </div>
                                <div className="p-6 flex-1 flex flex-col">
                                    {banner.content?.subtitle && (
                                        <p className="text-slate-400 text-xs font-bold line-clamp-2 leading-relaxed mb-4 italic">
                                            &quot;{banner.content?.subtitle}&quot;
                                        </p>
                                    )}
                                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-50">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Architectural</span>
                                        </div>
                                        <button 
                                            onClick={() => handleEdit(banner)}
                                            className="text-[9px] font-black text-red-600 uppercase tracking-widest hover:underline"
                                        >
                                            Modify Visual
                                        </button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {/* Missing Pages Prompt */}
                    {missingBanners.map((page) => (
                        <div 
                            key={page.slug}
                            className="group flex flex-col items-center justify-center p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] hover:border-red-600/30 hover:bg-red-50/10 transition-all duration-500 text-center"
                        >
                            <div className="w-16 h-16 rounded-3xl bg-slate-200 flex items-center justify-center text-slate-400 mb-6 group-hover:bg-red-600 group-hover:text-white group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                                {page.icon}
                            </div>
                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tighter mb-2">{page.name}</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">Static Route Identified</p>
                            <button 
                                onClick={() => handleInject(page)}
                                className="px-6 py-2.5 bg-white border border-slate-200 rounded-2xl text-[9px] font-black text-slate-600 uppercase tracking-widest shadow-sm hover:border-red-600 hover:text-red-600 transition-all"
                            >
                                Inject Banner
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Edit Modal */}
            {isModalOpen && selectedBanner && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
                    
                    <div className="relative w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-full border border-slate-200">
                        {/* Modal Header */}
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-white relative z-10 shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-red-600 text-white rounded-2xl shadow-xl shadow-red-600/20">
                                    <ImageIcon size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Banner Configuration</h2>
                                    <p className="text-[10px] font-black text-red-600 uppercase tracking-[0.3em] mt-1 italic">Route: /{selectedBanner.page_slug}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="p-3 text-slate-300 hover:text-slate-900 hover:bg-slate-50 rounded-2xl transition-all"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                {/* Left Side: Media */}
                                <div className="space-y-6">
                                    <h3 className="text-[11px] font-black text-slate-300 uppercase tracking-[0.4em] border-b border-slate-100 pb-2">Visual Core</h3>
                                    
                                    <div className="space-y-4">
                                        <ImageUpload 
                                            label="Primary Hero Graphic"
                                            value={selectedBanner.content.image}
                                            onChange={(url) => setSelectedBanner(prev => ({
                                                ...prev,
                                                content: { ...prev.content, image: url }
                                            }))}
                                            folder={`banners/${selectedBanner.page_slug}`}
                                            aspectRatio="aspect-[21/9]"
                                            showUrlInput={true}
                                        />
                                        
                                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                            <div className="flex items-center gap-3 mb-4">
                                                <AlertCircle size={16} className="text-red-500" />
                                                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Optimized Resolution</h4>
                                            </div>
                                            <p className="text-[10px] leading-relaxed text-slate-500 font-bold uppercase tracking-tight">
                                                For peak architectural performance, utilize 16:9 images with a minimum width of 1920px. Ensure focal points are centered to maintain mobile responsiveness.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Identity */}
                                <div className="space-y-8">
                                    <h3 className="text-[11px] font-black text-slate-300 uppercase tracking-[0.4em] border-b border-slate-100 pb-2">Narrative Metadata</h3>
                                    
                                    <div className="space-y-6">
                                        {/* Badge */}
                                        <div className="space-y-2 group/field">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within/field:text-red-600 transition-colors">Promotional Badge</label>
                                            <input 
                                                type="text"
                                                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-red-600/30 focus:bg-white focus:outline-none transition-all font-bold text-slate-900"
                                                value={selectedBanner.content.badge || ''}
                                                onChange={(e) => setSelectedBanner(prev => ({
                                                    ...prev,
                                                    content: { ...prev.content, badge: e.target.value }
                                                }))}
                                                placeholder="e.g. SUMMER 2026"
                                            />
                                        </div>

                                        {/* Title */}
                                        <div className="space-y-2 group/field">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within/field:text-red-600 transition-colors">Hero Heading</label>
                                            <input 
                                                type="text"
                                                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-red-600/30 focus:bg-white focus:outline-none transition-all font-bold text-slate-900"
                                                value={selectedBanner.content.title || ''}
                                                onChange={(e) => setSelectedBanner(prev => ({
                                                    ...prev,
                                                    content: { ...prev.content, title: e.target.value }
                                                }))}
                                            />
                                        </div>

                                        {/* Subtitle */}
                                        <div className="space-y-2 group/field">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within/field:text-red-600 transition-colors">Subheading Segment</label>
                                            <RichTextEditor 
                                                value={selectedBanner.content.subtitle || ''}
                                                onChange={(content) => setSelectedBanner(prev => ({
                                                    ...prev,
                                                    content: { ...prev.content, subtitle: content }
                                                }))}
                                                placeholder="Enter subtitle..."
                                            />
                                        </div>

                                        {/* Description */}
                                        <div className="space-y-2 group/field">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within/field:text-red-600 transition-colors">SEO Narrative (Internal Only)</label>
                                            <RichTextEditor 
                                                value={selectedBanner.content.description || ''}
                                                onChange={(content) => setSelectedBanner(prev => ({
                                                    ...prev,
                                                    content: { ...prev.content, description: content }
                                                }))}
                                                placeholder="Enter description..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-8 border-t border-slate-50 flex items-center justify-end gap-3 bg-white relative z-10 shrink-0">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setIsModalOpen(false)}
                                className="px-8 border-slate-200 text-slate-400 font-black uppercase tracking-widest text-[10px]"
                            >
                                Cancel
                            </Button>
                            <Button 
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-10 bg-red-600 text-white font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-red-600/20 flex items-center gap-3"
                            >
                                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                {isSaving ? 'Processing' : 'Commit Changes'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PageBanners;
