import React, { useState, useEffect, useMemo } from 'react';
import { 
    Save, Loader2, Search,
    Home, Info, Phone, HelpCircle, 
    Plane, Building2, Anchor, MapPin, 
    BookOpen, ShieldCheck, Compass, 
    Moon, Wine, Users, FileText, 
    Eye, Edit3, X,
    ChevronRight, Layout,
    ExternalLink, Plus, Trash2,
    RefreshCw
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/Button';
import { showAlert } from '../utils/swal';
import { stripTags } from '../utils/sanitize';
import ImageUpload from '../components/ImageUpload';
import RichTextEditor from '../components/RichTextEditor';
import { cn } from '../utils/cn';


// EXHAUSTIVE PAGE REGISTRY
const PAGE_REGISTRY = [
    { slug: 'home', name: 'Home / Landing', icon: <Home size={18} /> },
    { slug: 'about', name: 'About Agency', icon: <Info size={18} /> },
    { slug: 'contact', name: 'Contact Us', icon: <Phone size={18} /> },
    { slug: 'hotels', name: 'Hotels Listing', icon: <Building2 size={18} /> },
    { slug: 'rodrigue-hotels', name: 'Rodrigues Hotels', icon: <Building2 size={18} /> },
    { slug: 'flights', name: 'Flights', icon: <Plane size={18} /> },
    { slug: 'cruises', name: 'Cruises', icon: <Anchor size={18} /> },
    { slug: 'day-packages', name: 'Day Packages', icon: <MapPin size={18} /> },
    { slug: 'evening-packages', name: 'Evening Packages', icon: <Moon size={18} /> },
    { slug: 'guided-group-tours', name: 'Guided Group Tours', icon: <Compass size={18} /> },
    { slug: 'activities-sea', name: 'Activities (Sea)', icon: <Wine size={18} /> },
    { slug: 'activities-land', name: 'Activities (Land)', icon: <Compass size={18} /> },
    { slug: 'visa-services', name: 'Visa Services', icon: <FileText size={18} /> },
    { slug: 'team', name: 'Our Team', icon: <Users size={18} /> },
    { slug: 'news', name: 'News & Blog', icon: <FileText size={18} /> },
    { slug: 'terms-conditions', name: 'Terms of Service', icon: <BookOpen size={18} /> },
    { slug: 'privacy-policy', name: 'Privacy Policy', icon: <ShieldCheck size={18} /> },
    { slug: 'safety', name: 'Safety & Security', icon: <ShieldCheck size={18} /> },
    { slug: 'faq', name: 'FAQs / Support', icon: <HelpCircle size={18} /> },
    { slug: 'tailormade', name: 'Tailor-Made', icon: <Edit3 size={18} /> },
    { slug: 'mobile-home', name: 'Mobile App Home', icon: <Layout size={18} /> },
];

const CMS_CONFIG = {
    home: {
        section_1_services: { label: 'Our Services', schema: { label: 'text', title: 'richtext', description: 'textarea' } },
        section_2_advantage: { label: 'The TL Advantage', schema: { label: 'text', title: 'richtext', description: 'textarea', stats: 'list:label,value' } },
        section_3_deals: { label: 'Exclusive Offers', schema: { label: 'text', title: 'text' } },
        section_4_partners: { label: 'Partners Section', schema: { label: 'text' } },
        section_5_seo_content: { label: 'SEO/GEO Enrichment', schema: { label: 'text', title: 'richtext', description: 'textarea', points: 'textarea' } },
        section_6_news: { label: 'News & Insights', schema: { label: 'text', title: 'richtext' } }
    },
    about: {
        section_1_hero: { label: 'Hero Section', schema: { badge: 'text', title: 'richtext', description: 'textarea', image: 'image' } },
        section_2_identity: { label: 'Our Identity', schema: { subtitle: 'text', title: 'richtext', description: 'textarea', quote: 'textarea', stats_label: 'text', stats_value: 'text', image_corporate: 'image', image_leisure: 'image' } },
        section_3_mission: { label: 'Mission Section', schema: { title: 'text', content: 'textarea' } }
    },
    contact: {
        section_1_hero: { label: 'Hero Section', schema: { badge: 'text', title: 'richtext', image: 'image' } },
        info: { label: 'Offices & Support', schema: { offices: 'list:title,address', support: 'list:icon,type,value' } },
        directions: { label: 'Directions Section', schema: { badge: 'text', title: 'text', description: 'textarea' } }
    },
    hotels: {
        section_1_hero: { label: 'Hero Section', schema: { title: 'text', subtitle: 'text', image: 'image' } },
        section_2_identity: { label: 'Corporate Identity', schema: { subtitle: 'text', title: 'text', description: 'textarea', quote: 'textarea', stats_label: 'text', stats_value: 'text', image_corporate: 'image', image_leisure: 'image' } }
    },
    'rodrigue-hotels': {
        section_1_hero: { label: 'Hero Section', schema: { title: 'text', subtitle: 'text', image: 'image' } }
    },
    flights: {
        hero: { label: 'Hero Section', schema: { badge: 'text', title: 'text', subtitle: 'text', description: 'textarea', image: 'image' } },
        assistance: { label: 'Concierge Assistance', schema: { badge: 'text', title: 'text', description: 'textarea', cta_primary_label: 'text', cta_primary_link: 'text', cta_secondary_label: 'text', cta_secondary_link: 'text', image: 'image' } }
    },
    cruises: {
        section_1_hero: { label: 'Hero Section', schema: { title: 'text', subtitle: 'text', image: 'image' } }
    },
    'day-packages': {
        section_1_hero: { label: 'Hero Section', schema: { title: 'text', subtitle: 'text', image: 'image' } }
    },
    'evening-packages': {
        section_1_hero: { label: 'Hero Section', schema: { title: 'text', subtitle: 'text', image: 'image' } }
    },
    'guided-group-tours': {
        section_1_hero: { label: 'Hero Section', schema: { title: 'text', subtitle: 'text', image: 'image' } }
    },
    'activities-sea': {
        section_1_hero: { label: 'Hero Section', schema: { title: 'text', subtitle: 'text', image: 'image' } }
    },
    'activities-land': {
        section_1_hero: { label: 'Hero Section', schema: { title: 'text', subtitle: 'text', image: 'image' } }
    },
    'visa-services': {
        hero: { label: 'Hero Section', schema: { badge: 'text', title: 'text', subtitle: 'text', image: 'image' } },
        steps: { label: 'Our Process', schema: { items: 'list:title,description,icon' } },
        cta: { label: 'FAQ CTA', schema: { title: 'text', description: 'textarea', primary_label: 'text', secondary_label: 'text' } },
        sidebar: { label: 'Sidebar Info', schema: { title: 'text', features: 'list:title,desc,icon', notice_title: 'text', notice_content: 'textarea', disclaimer_label: 'text' } }
    },
    team: {
        hero: { label: 'Hero Section', schema: { badge: 'text', title: 'text', description: 'textarea', image: 'image' } },
        team_image: { label: 'Team Group Photo', schema: { image: 'image' } },
        cta: { label: 'Join Team CTA', schema: { title: 'text', subtitle: 'text', button_text: 'text', button_link: 'text' } }
    },
    news: {
        hero: { label: 'Hero Section', schema: { title: 'text', description: 'textarea', image_url: 'image' } }
    },
    faq: {
        hero: { label: 'Hero Section', schema: { badge: 'text', title: 'text', subtitle: 'text', description: 'textarea', image: 'image' } }
    },
    tailormade: {
        section_1_hero: { label: 'Hero Section', schema: { badge: 'text', title: 'text', image: 'image' } }
    }
};

const DEFAULT_CONTENT = {
    home: {
        section_1_services: { label: 'Our Services', title: 'Curated <span>Travel</span> Experiences', description: 'Explore our hand-picked collection of global destinations and bespoke island discoveries.' },
    },
    about: {
        section_1_hero: { badge: 'Since 1995', title: 'Defining the Art of <br/> Boutique Travel', description: "We don't just book trips; we craft legacies. Travel Lounge is Mauritius's premier gateway to extraordinary global experiences and authentic island discoveries." },
        section_2_identity: { subtitle: "Who we are", title: "Mauritius's Most <br/> Trusted Travel Experts", description: "Experience the pinnacle of travel excellence with Travel Lounge. Our dedicated team and global network ensure your journey is seamless and extraordinary.", quote: "Our mission is to transform every journey into a masterpiece of memories.", stats_label: "Years of Excellence", stats_value: "29+", image_corporate: "/assets/about/corporate.png", image_leisure: "/assets/about/leisure.png" }
    },
    contact: {
        section_1_hero: { badge: 'Get In Touch', title: "We're Here To <br /><span class=\"text-red-500 italic\">Help You.</span>", image: "https://images.unsplash.com/photo-1423666639041-f56000c27a9a" },
        info: { 
            offices: [
                { title: 'Port Louis Office (Head Office)', address: 'Ground Floor, Newton Tower, Port Louis, Mauritius' },
                { title: 'Ebene Office', address: 'Ground Floor, 57 Ebene Mews, Cybercity, Ebene, Mauritius' }
            ],
            support: [
                { type: 'Direct Line', value: '+230 212 4070', icon: 'phone' },
                { type: 'WhatsApp Concierge', value: '+230 5940 7701', icon: 'whatsapp' },
                { type: 'Email Inquiry', value: 'reservation@travellounge.mu', icon: 'email' }
            ]
        },
        directions: { badge: 'Directions', title: 'Visit Our Offices', description: 'Find us easily with the interactive maps below. We look forward to welcoming you to our premises.' }
    },
    hotels: {
        section_1_hero: { title: "Exquisite Stays", subtitle: "Discover excellent hospitality in the most stunning locations across Mauritius and beyond.", image: "/assets/heroes/hero-hotels.png" }
    },
    'rodrigue-hotels': {
        section_1_hero: { title: "Island Living, Rodrigues", subtitle: "Experience genuine hospitality in our curated selection of Rodrigues stays. Peace, serenity, and local charm.", image: "/assets/hero/rodrigues_hotels_hero_1773391499243.png" }
    },
    flights: {
        hero: { badge: "GLOBAL CONNECTIONS", title: "Fly to Your <br /><span class=\"text-red-500 italic\">Dream Destination.</span>", subtitle: "Seamless Air Travel Experience", description: "Book your world-class flight experiences across hundreds of premium airlines with our state-of-the-art global search engine and expert consultation.", image: "/assets/heroes/hero-flights.png" },
        assistance: { badge: "PERSONAL CONCIERGE", title: "Need Expert <br /><span class=\"text-red-500 italic\">Assistance?</span>", description: "If you prefer personalized assistance for your bespoke flight arrangements, our elite travel consultants are available 24/7 to assist you.", cta_primary_label: "Contact Consultant", cta_primary_link: "/contact", cta_secondary_label: "WhatsApp Concierge", cta_secondary_link: "https://wa.me/23059407701" }
    },
    cruises: {
        section_1_hero: { title: "Cruise Holidays", subtitle: "Set sail for amazing destinations with our trusted cruise partners.", image: "/assets/heroes/hero-cruises.png" }
    },
    'day-packages': {
        section_1_hero: { title: "Day Packages", subtitle: "Discover the best day passes and resort experiences in Mauritius.", image: "/assets/hero/destinations_hero.png" }
    },
    'evening-packages': {
        section_1_hero: { title: "Evening Packages", subtitle: "Experience the magic of Mauritian nights with our curated evening passes.", image: "/assets/hero/destinations_hero.png" }
    },
    'guided-group-tours': {
        section_1_hero: { title: "Guided Group Travel", subtitle: "Join like-minded people and explore the island with our local experts. Everything is planned so you can relax.", image: "/assets/hero/group_tours_hero_1773391421071.png" }
    },
    'activities-sea': {
        section_1_hero: { title: "Sea Adventures", subtitle: "Explore the crystal clear waters with our premium sea activities and excursions.", image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=2070&auto=format&fit=crop" }
    },
    'activities-land': {
        section_1_hero: { title: "Land Adventures", subtitle: "Discover the landscapes with our premium land activities and excursions.", image: "https://images.unsplash.com/photo-1467377229985-514271ad8182?q=80&w=2070&auto=format&fit=crop" }
    },
    'visa-services': {
        hero: { 
            badge: "Expert Assistance", 
            title: "Seamless <span class=\"text-red-500 italic\">Visa Solutions.</span>", 
            description: "Navigating international travel requirements with precision. Travel Lounge provides expert guidance, document vetting, and end-to-end processing for all major global destinations.", 
            image: "https://images.unsplash.com/photo-1544027993-37dbfe43562a?q=80&w=2070&auto=format&fit=crop" 
        },
        steps: { 
            items: [
                { title: "Consultation", description: "Personalized review of your travel itinerary to determine exact visa requirements for your passport and destination.", icon: "MessageSquare" },
                { title: "Documentation", description: "Comprehensive checklist and guidance on gathering financial proofs, letters of invitation, and professional document vetting.", icon: "FileText" },
                { title: "Submission", description: "Meticulous form filling and submission to embassies, high commissions, or online portals (E-Visas).", icon: "Send" },
                { title: "Biometrics", description: "Scheduling and orientation for your biometrics appointment at VFS Global or respective embassy centers.", icon: "Fingerprint" },
                { title: "Resolution", description: "Real-time tracking of your application and secure collection/delivery of your processed travel documents.", icon: "CheckCircle" }
            ] 
        },
        cta: { 
            title: "Need a Visa for your Next Trip?", 
            description: "Whether it's for the USA, UK, Schengen Area, or Turkey, our specialized visa department is here to ensure a high-success application process.", 
            primary_label: "Contact Visa Expert", 
            secondary_label: "View All Destinations" 
        },
        sidebar: { 
            title: "Why Trust Travel Lounge?", 
            features: [
                { title: "IATA Certified", desc: "Decades of professional excellence in global travel documentation.", icon: "ShieldCheck" },
                { title: "Specialized Desk", desc: "Dedicated experts for USA, Canada, and European visas.", icon: "UserCheck" },
                { title: "End-to-End Support", desc: "From the first inquiry to the final passport collection.", icon: "RefreshCw" }
            ], 
            notice_title: "Important Notice", 
            notice_content: "While we provide expert guidance to maximize your success rate, visa issuance is the sole prerogative of the respective diplomatic missions. Fees are non-refundable regardless of the outcome.", 
            disclaimer_label: "Visa Terms & Conditions" 
        }
    },
    team: {
        hero: { badge: "Our People", title: "Meet the <br />Experts.", description: "A dedicated team of IATA-certified professionals committed to making your world-wide travel dreams a reality.", image: "/assets/heroes/hero-about.png" },
        team_image: { image: "/assets/team/team3.jpg" },
        cta: { title: "Want to Join Our Team?", subtitle: "We're always looking for passionate travel enthusiasts.", button_text: "Send Your CV", button_link: "/contact" }
    },
    news: {
        hero: { title: "Travel Insights", description: "Discover the latest trends, guides, and stories from our local experts.", image_url: "/assets/heroes/hero-news.png" }
    },
    faq: {
        hero: { badge: "HELP CENTER", title: "How Can We <br /><span class=\"text-red-500 italic\">Help You?</span>", subtitle: "Discover Frequently Asked Questions", description: "Find everything you need to know about our luxury travel services, booking processes, and travel policies in one comprehensive guide.", image: "https://images.unsplash.com/photo-1454165833767-027ffea9e612" }
    },
    tailormade: {
        section_1_hero: { badge: 'Tailor-Made', title: 'Tailor-Made Package', image: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2042&auto=format&fit=crop" }
    }
};

const getPageDefaultContent = (slug, sectionKey) => {
    return DEFAULT_CONTENT[slug]?.[sectionKey] || {};
};

// Generic hero schema for other pages
const GENERIC_HERO_SCHEMA = { badge: 'text', title: 'richtext', description: 'textarea', image: 'image' };

const getPageSchema = (slug) => {
    if (CMS_CONFIG[slug]) return CMS_CONFIG[slug];
    
    // Default to a hero section for everything else
    return {
        section_1_hero: { label: 'Hero Section', schema: GENERIC_HERO_SCHEMA }
    };
};

const CMS = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPage, setSelectedPage] = useState(PAGE_REGISTRY[0]);
    const [sections, setSections] = useState([]);
    const [fetchingSections, setFetchingSections] = useState(false);
    
    // Fetch sections for selected page
    useEffect(() => {
        if (selectedPage) {
            fetchSections(selectedPage.slug);
        }
    }, [selectedPage]);

    const fetchSections = async (slug) => {
        setFetchingSections(true);
        try {
            const { data, error } = await supabase
                .from('content_blocks')
                .select('*')
                .eq('page_slug', slug)
                .order('section_key', { ascending: true });

            if (error) throw error;
            
            let finalSections = data || [];
            
            // Merge with Schema for high-fidelity CMS coverage
            const pageConfig = getPageSchema(slug);
            const sectionsConfig = pageConfig.sections || pageConfig;

            Object.keys(sectionsConfig).forEach(key => {
                const existing = finalSections.find(s => s.section_key === key);
                if (!existing) {
                    finalSections.push({
                        id: `ghost-${key}`,
                        page_slug: slug,
                        section_key: key,
                        content: getPageDefaultContent(slug, key), 
                        is_ghost: true
                    });
                }
            });

            setSections(finalSections.sort((a, b) => a.section_key.localeCompare(b.section_key)));
        } catch (error) {
            console.error('CMS_FETCH_ERR:', error);
            showAlert('Fetch Error', 'Failed to retrieve page sections.', 'error');
        } finally {
            setFetchingSections(false);
        }
    };

    const filteredPages = useMemo(() => {
        return PAGE_REGISTRY.filter(p => 
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            p.slug.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm]);

    const groupedPages = useMemo(() => {
        const groups = [
            { id: 'primary', name: 'Primary Core', items: [] },
            { id: 'services', name: 'Vertical Services', items: [] },
            { id: 'packages', name: 'Curated Packages', items: [] },
            { id: 'regional', name: 'Regional & Destinations', items: [] },
            { id: 'support', name: 'Legal & Support', items: [] }
        ];
        
        filteredPages.forEach(p => {
            if (['home', 'about', 'news', 'contact', 'tailormade', 'plan-my-trip', 'visa-services'].includes(p.slug) || p.slug.startsWith('about/')) {
                groups[0].items.push(p);
            } else if (['hotels', 'rodrigue-hotels', 'flights', 'cruises', 'transfers', 'tours', 'spa', 'restaurants', 'activities'].includes(p.slug)) {
                groups[1].items.push(p);
            } else if (p.slug.includes('package')) {
                groups[2].items.push(p);
            } else if (p.slug.includes('destination') || p.slug.startsWith('destinations/')) {
                groups[3].items.push(p);
            } else {
                groups[4].items.push(p);
            }
        });
        return groups.filter(g => g.items.length > 0);
    }, [filteredPages]);

    return (
        <div className="flex h-[calc(100vh-56px)] -mx-4 md:-mx-8 -mt-4 md:-mt-8 bg-white overflow-hidden font-sans">
            {/* MINIMALIST SITEMAP SIDEBAR */}
            <div className="w-80 bg-slate-50 border-r border-slate-300 flex flex-col relative z-20">
                <div className="p-4 pb-2">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-[9px] font-black text-red-600 uppercase tracking-[0.3em] mb-0.5">Architectural</h2>
                            <h1 className="text-lg font-black text-slate-900 tracking-tight uppercase leading-none">Map</h1>
                        </div>
                        {/* <button onClick={() => fetchSections(selectedPage.slug)} className="p-1.5 bg-white rounded-lg border border-slate-200 text-slate-400 hover:text-red-600 transition-colors shadow-sm"> */}
                            <RefreshCw size={12} className={fetchingSections ? "animate-spin" : ""} />
                        {/* </button> */}
                    </div>
                    
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-500 transition-colors" size={14} />
                        <input 
                            type="text"
                            placeholder="Find route code..."
                            className="w-full pl-10 pr-3 py-2 bg-white border border-slate-300 rounded-xl focus:border-red-500/20 focus:outline-none text-[11px] font-bold text-slate-600 transition-all shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-2 py-4 space-y-6 custom-scrollbar">
                    {groupedPages.map(group => (
                        <div key={group.id} className="space-y-1.5">
                            <div className="px-3 mb-2">
                                <h3 className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">{group.name}</h3>
                            </div>
                            <div className="space-y-0.5">
                                {group.items.map(page => (
                                    <button
                                        key={page.slug}
                                        onClick={() => setSelectedPage(page)}
                                        className={cn(
                                            "w-full flex items-center justify-between px-3 py-1.5 rounded-xl transition-all group",
                                            selectedPage?.slug === page.slug 
                                            ? "bg-white text-slate-900 shadow-lg shadow-slate-200/50 border border-slate-300" 
                                            : "text-slate-500 hover:bg-white/50 hover:text-slate-900 border border-transparent"
                                        )}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <div className={cn(
                                                "p-1.5 rounded-lg transition-all",
                                                selectedPage?.slug === page.slug ? "bg-red-600 text-white shadow-md shadow-red-600/20" : "bg-slate-100 text-slate-400 group-hover:bg-red-50 group-hover:text-red-600"
                                            )}>
                                                {React.cloneElement(page.icon, { size: 12 })}
                                            </div>
                                            <div className="text-left">
                                                <span className="text-[10px] font-black uppercase tracking-tight block leading-none">{page.name}</span>
                                                {selectedPage?.slug === page.slug && (
                                                    <span className="text-[7px] font-bold block opacity-40 uppercase tracking-widest text-slate-400 mt-1">/{page.slug}</span>
                                                )}
                                            </div>
                                        </div>
                                        <ChevronRight size={10} className={cn(
                                            "transition-transform",
                                            selectedPage?.slug === page.slug ? "translate-x-0 opacity-100 text-red-600" : "-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-40"
                                        )} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 border-t border-slate-200 bg-white">
                    <div className="flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                         <span className="text-[8px] font-black text-slate-400 uppercase tracking-tight">System Ready for Orchestration</span>
                    </div>
                </div>
            </div>

            {/* HIGH-DENSITY CONTENT CANVAS */}
            <div className="flex-1 overflow-y-auto bg-white custom-scrollbar">
                <div className="p-4 lg:p-8 max-w-full">
                    {/* PAGE HEADER */}
                    <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-4 mb-3">
                                <span className="px-3 py-1 bg-slate-900 text-white rounded-full text-[8px] font-black uppercase tracking-[0.15em] shadow-lg shadow-slate-900/10">Dynamic Segment</span>
                                <a 
                                    href={`https://travellounge.mu${selectedPage.slug === 'home' ? '' : `/${selectedPage.slug}`}`} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="flex items-center gap-2 text-[9px] font-black text-red-600 uppercase tracking-widest hover:underline"
                                >
                                    Preview Route <ExternalLink size={10} />
                                </a>
                            </div>
                            <h1 className="text-lg font-bold text-slate-900 tracking-wider uppercase leading-none mb-2">
                                {selectedPage.name}
                            </h1>
                            <div className="flex items-center gap-4">
                                <p className="text-slate-400 text-[10px] font-bold border-l-2 border-red-600 pl-3 py-0">
                                    /{selectedPage.slug}
                                </p>
                                <div className="flex items-center gap-3 text-[8px] font-black text-slate-300 uppercase tracking-widest">
                                    <span>{sections.length} Modules</span>
                                    <div className="w-1 h-1 rounded-full bg-slate-200" />
                                    <span>Sync: {new Date().toLocaleTimeString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION BLOCKS */}
                    {fetchingSections ? (
                        <div className="py-20 flex flex-col items-center justify-center">
                            <div className="relative">
                                <Loader2 className="animate-spin text-red-600 mb-6" size={48} strokeWidth={1.5} />
                            </div>
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.6em]">Orchestrating Library...</p>
                        </div>
                    ) : sections.length > 0 ? (
                        <div className="space-y-3 mb-10 text-slate-900">
                            {sections.map((section, idx) => (
                                <SectionSegment 
                                    key={section.id} 
                                    section={section} 
                                    index={idx + 1}
                                    pageSlug={selectedPage.slug}
                                    onRefresh={() => fetchSections(selectedPage.slug)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="py-40 text-center bg-slate-50 rounded-[5rem] border-2 border-dashed border-slate-200 transition-all hover:border-red-200 group">
                            <Layout size={80} className="mx-auto text-slate-200 mb-10 group-hover:text-red-100 transition-colors" />
                            <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-6 italic">Route is Currently Static</h3>
                            <p className="max-w-md mx-auto text-slate-400 font-medium mb-12 leading-relaxed text-lg">
                                This page is not yet connected to the architectural modular interface. Would you like to inject a block template?
                            </p>
                            <Button className="bg-red-600 text-white px-12 py-6 rounded-3xl font-black uppercase text-[11px] tracking-widest shadow-2xl shadow-red-600/30 hover:bg-slate-900 transition-all">
                                Inject Initial Module
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

/* --- SUBCOMPONENT: SECTION SEGMENT --- */
const SectionSegment = ({ section, index, pageSlug, onRefresh }) => {
    const [content, setContent] = useState(section.content || {});
    const [isSaving, setIsSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isExpanded, setIsExpanded] = useState(true);

    // Sync local state when prop changes (e.g. switching pages)
    useEffect(() => {
        setContent(section.content || {});
        setHasUnsavedChanges(false);
    }, [section.content, section.id]);

    const isLocked = 
        section.section_key.toLowerCase().includes('inquiry') || 
        section.section_key.toLowerCase().includes('form') ||
        section.section_key.toLowerCase().includes('emergency') ||
        section.section_key.toLowerCase().includes('legal') ||
        section.section_key.toLowerCase().includes('iata');

    const handleSave = async () => {
        setIsSaving(true);

        // Deep trim utility for strings in content objects
        const deepTrim = (obj) => {
            if (typeof obj === 'string') return obj.trim();
            if (typeof obj !== 'object' || obj === null) return obj;

            const newObj = Array.isArray(obj) ? [] : {};
            for (const key in obj) {
                newObj[key] = deepTrim(obj[key]);
            }
            return newObj;
        };

        try {
            const isGhost = section.is_ghost || String(section.id).startsWith('ghost-');
            const trimmedContent = deepTrim(content);

            if (isGhost) {
                const { error } = await supabase
                    .from('content_blocks')
                    .insert([{
                        page_slug: pageSlug,
                        section_key: section.section_key,
                        content: trimmedContent
                    }]);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('content_blocks')
                    .update({ content: trimmedContent, updated_at: new Date().toISOString() })
                    .eq('id', section.id);
                if (error) throw error;
            }

            setHasUnsavedChanges(false);
            showAlert('Synchronization Success', `Block [${section.section_key}] has been updated.`, 'success');
            if (onRefresh) onRefresh();
        } catch (error) {
            console.error('CMS_SAVE_ERR:', error);
            showAlert('Deployment Error', error.message, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleFieldChange = (key, val) => {
        setContent(prev => ({ ...prev, [key]: val }));
        setHasUnsavedChanges(true);
    };

    const formatKey = (key) => {
        return key.split(/[-_]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    };

    return (
        <div className={cn(
            "bg-white rounded-xl border transition-all duration-500 overflow-hidden",
            hasUnsavedChanges ? "border-red-600 ring-4 ring-red-600/5" : "border-slate-300",
            isLocked && "opacity-80"
        )}>
            {/* SEGMENT HEADER */}
            <div className="px-4 py-3 flex items-center justify-between group cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center font-black text-[9px] border transition-colors",
                        isLocked ? "bg-slate-900 border-slate-900 text-white" : "bg-slate-50 border-slate-100 text-slate-300 group-hover:border-red-600"
                    )}>
                        {isLocked ? <ShieldCheck size={12} /> : String(index).padStart(2, '0')}
                    </div>
                    <div>
                        <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                            {formatKey(section.section_key)}
                            {hasUnsavedChanges && <span className="w-1 h-1 bg-red-600 rounded-full animate-pulse" />}
                            {isLocked && <span className="text-[6px] font-black bg-slate-900 text-white px-1 py-0.5 rounded tracking-tighter ml-1">ADMIN ONLY</span>}
                        </h4>
                        <p className="text-[7px] font-bold text-slate-300 uppercase mt-0.5">
                            ID: <span className="opacity-60">{section.id.slice(0, 8)}</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button 
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-1.5 text-slate-200 hover:text-red-600 transition-colors"
                    >
                        {isExpanded ? <X size={14} /> : <Eye size={14} />}
                    </button>
                    {!isLocked && (
                        <Button
                            disabled={!hasUnsavedChanges || isSaving}
                            onClick={handleSave}
                            className={cn(
                                "px-4 py-1.5 rounded-lg text-[8px] font-bold uppercase tracking-wider transition-all",
                                hasUnsavedChanges 
                                ? "bg-red-600 text-white shadow-md hover:scale-[1.01] active:scale-98" 
                                : "bg-slate-50 text-slate-200"
                            )}
                        >
                            {isSaving ? <Loader2 className="animate-spin" size={10} /> : <Save size={10} className="mr-1.5" />}
                            {isSaving ? 'Saving' : 'Save'}
                        </Button>
                    )}
                </div>
            </div>

            {/* SEGMENT CONTENT */}
            {isExpanded && (
                <div className={cn(
                    "px-4 py-4 border-t border-slate-200 space-y-4",
                    isLocked ? "bg-slate-100/30 select-none cursor-not-allowed pointer-events-none grayscale opacity-60" : "bg-white"
                )}>
                    {(() => {
                        const pageConfig = getPageSchema(pageSlug);
                        const sectionsConfig = pageConfig.sections || pageConfig;
                        const sectionConfig = sectionsConfig[section.section_key];
                        const schema = sectionConfig?.schema || {};
                        
                        // Use schema keys first to ensure they appear in the UI
                        const schemaKeys = Object.keys(schema);
                        const contentKeys = Object.keys(content);
                        const allKeys = Array.from(new Set([...schemaKeys, ...contentKeys]));

                        return allKeys.map(key => {
                            const value = content[key];
                            const type = schema[key];
                            
                            return (
                                <SegmentItem 
                                    key={key}
                                    label={formatKey(key)}
                                    fieldKey={key}
                                    value={value}
                                    type={type}
                                    onChange={(val) => !isLocked && handleFieldChange(key, val)}
                                    pageSlug={pageSlug}
                                />
                            );
                        });
                    })()}
                    
                    {/* Block Interaction Metadata */}
                    <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                         <span className="text-[7px] font-bold text-slate-300 uppercase tracking-widest">
                            {isLocked ? 'PROTECTED RECORD' : 'EDITABLE SEGMENT'}
                         </span>
                        <p className="text-[7px] font-black text-slate-200 uppercase tracking-widest">Schema: {section.section_key}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

/* --- GRANULAR ELEMENT: SEGMENT ITEM --- */
const SegmentItem = ({ label, fieldKey, value, onChange, pageSlug, type }) => {
    const isArray = Array.isArray(value);
    const isImage = type === 'image' || (typeof value === 'string' && (value.includes('http') || value.includes('/assets/') || fieldKey.toLowerCase().includes('image') || fieldKey.toLowerCase().includes('logo')));
    const isHtml = typeof value === 'string' && /<[a-z][\s\S]*>/i.test(value);
    const isDescription = type === 'textarea' || type === 'richtext' || isHtml || (typeof value === 'string' && (value.length > 60 || fieldKey.toLowerCase().includes('desc') || fieldKey.toLowerCase().includes('content')));

    if (isArray) {
        return (
            <div className="space-y-3 group/collection">
                <div className="flex items-center justify-between">
                    <h5 className="text-[10px] font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <div className="w-1 h-3 bg-red-600 rounded-full" />
                        {label} [{value.length}]
                    </h5>
                    <button className="flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 rounded-lg text-[8px] font-bold uppercase tracking-wider hover:bg-red-600 hover:text-white transition-all border border-red-100">
                        <Plus size={10} /> Add
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                    {value.map((item, idx) => (
                        <div key={idx} className="bg-slate-50/30 border border-slate-300 rounded-xl p-4 relative group/card transition-all hover:bg-white hover:border-brand-red/30 shadow-sm">
                            <div className="absolute top-3 right-3 flex items-center gap-1">
                                <button className="p-1 text-slate-200 hover:text-red-600 transition-colors opacity-0 group-hover/card:opacity-100 font-bold text-[8px] uppercase">
                                    <Trash2 size={10} />
                                </button>
                            </div>
                            
                            <div className="space-y-3 pt-1">
                                {Object.keys(item).map(subKey => (
                                    <InlineEditField 
                                        key={subKey}
                                        label={subKey.split('_').join(' ')}
                                        value={item[subKey] || ''}
                                        onChange={(val) => {
                                            const newArr = [...value];
                                            newArr[idx] = { ...newArr[idx], [subKey]: val };
                                            onChange(newArr);
                                        }}
                                        compact
                                        pageSlug={pageSlug}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="group/item relative bg-slate-50/30 p-4 rounded-xl border border-transparent hover:border-slate-300 hover:bg-white transition-all shadow-sm">
            <div className="mb-2 px-1">
                <label className="text-[8px] font-bold text-slate-300 uppercase tracking-wider group-focus-within/item:text-red-600 transition-colors">
                    {label}
                </label>
            </div>

            <InlineEditField 
                label=""
                value={value}
                onChange={onChange}
                fieldKey={fieldKey}
                isLarge={isDescription}
                isImage={isImage}
                pageSlug={pageSlug}
                type={type}
            />
        </div>
    );
};

/* --- INLINE EDITING LOGIC --- */
const InlineEditField = ({ label, value, onChange, compact = false, isLarge = false, isImage = false, fieldKey = '', pageSlug, type }) => {
    const [editing, setEditing] = useState(false);

    if (isImage || (typeof value === 'string' && (value.includes('http') || value.includes('/assets/')))) {
        return (
            <div className="relative group/img">
                <ImageUpload 
                    label={label}
                    value={value}
                    onChange={onChange}
                    folder={pageSlug || 'cms'}
                    aspectRatio={fieldKey.includes('hero') || fieldKey.includes('banner') ? 'aspect-[21/9]' : 'aspect-square'}
                    compact={compact}
                />
            </div>
        );
    }

    return (
        <div className="relative group/field">
            {label && <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 block pl-1">{label}</label>}
            
            <div className="relative">
                {isLarge ? (
                    <div className="mt-2 mb-4 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                        <RichTextEditor 
                            value={value || ''}
                            onChange={(content) => onChange(content)}
                            placeholder={`Provide content for ${label}...`}
                        />
                    </div>
                ) : (
                    <div className="space-y-2">
                        <input 
                            type="text"
                            value={value || ''}
                            onChange={(e) => onChange(e.target.value)}
                            onFocus={() => setEditing(true)}
                            onBlur={() => setEditing(false)}
                            className={cn(
                                "w-full bg-transparent border-0 focus:ring-0 p-0 font-bold text-slate-900 transition-all outline-none tracking-tight",
                                compact ? "text-[10px]" : "text-sm",
                                editing ? "opacity-100" : "opacity-90"
                            )}
                            placeholder={`Enter ${label.toLowerCase()}...`}
                        />
                        {value && typeof value === 'string' && value.includes('<') && (
                            <div className="text-[9px] text-red-400 font-bold uppercase tracking-widest mt-1 border-t border-slate-100 pt-1">
                                HTML Preview: <span className="text-slate-900 normal-case font-medium ml-2 italic">{stripTags(value)}</span>
                            </div>
                        )}
                    </div>
                )}
                
                {/* Visual Focus Indicator */}
                <div className={cn(
                    "absolute -bottom-1 left-0 h-[1px] bg-red-600 transition-all duration-300 rounded-full",
                    editing ? "w-8 opacity-100" : "w-0 opacity-0"
                )} />
            </div>

            <div className="absolute top-0 right-0 p-1 opacity-0 group-hover/field:opacity-100 transition-opacity">
                 <Edit3 size={12} className="text-slate-200" />
            </div>
        </div>
    );
};
export default CMS;
