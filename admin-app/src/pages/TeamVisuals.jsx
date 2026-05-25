import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Users, ImageIcon, Save, Loader2, ArrowLeft,
    Heading, FileText, Image as LucideImage, Sparkles
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/Button';
import { Card, CardContent } from '../components/Card';
import { showAlert } from '../utils/swal';
import ImageUpload from '../components/ImageUpload';
import RichTextEditor from '../components/RichTextEditor';

const TeamVisuals = () => {
    const navigate = useNavigate();
    
    // States for Hero block
    const [heroId, setHeroId] = useState(null);
    const [heroBadge, setHeroBadge] = useState('Our People');
    const [heroTitle, setHeroTitle] = useState('Meet the <br />Experts.');
    const [heroDescription, setHeroDescription] = useState('A dedicated team of IATA-certified professionals committed to making your world-wide travel dreams a reality.');
    const [heroImage, setHeroImage] = useState('/assets/heroes/hero-about.png');
    
    // States for Team Image block
    const [teamImageId, setTeamImageId] = useState(null);
    const [teamImage, setTeamImage] = useState('/assets/team/team3.jpg');
    
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchVisuals();
    }, []);

    const fetchVisuals = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('content_blocks')
                .select('*')
                .eq('page_slug', 'team');

            if (error) throw error;

            if (data && data.length > 0) {
                // Find Hero block
                const heroBlock = data.find(b => b.section_key === 'hero');
                if (heroBlock) {
                    setHeroId(heroBlock.id);
                    if (heroBlock.content) {
                        setHeroBadge(heroBlock.content.badge || 'Our People');
                        setHeroTitle(heroBlock.content.title || 'Meet the <br />Experts.');
                        setHeroDescription(heroBlock.content.description || '');
                        setHeroImage(heroBlock.content.image || heroBlock.content.image_url || '/assets/heroes/hero-about.png');
                    }
                }

                // Find Team Image block
                const teamImageBlock = data.find(b => b.section_key === 'team_image');
                if (teamImageBlock) {
                    setTeamImageId(teamImageBlock.id);
                    if (teamImageBlock.content) {
                        setTeamImage(teamImageBlock.content.image || '/assets/team/team3.jpg');
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching team visuals:', error);
            showAlert('Error', 'Failed to retrieve page visuals configuration', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        setIsSaving(true);

        try {
            // 1. Save Hero Block
            const heroContent = {
                badge: heroBadge.trim(),
                title: heroTitle.trim(),
                description: heroDescription.trim(),
                image: heroImage.trim()
            };

            if (heroId) {
                const { error: heroError } = await supabase
                    .from('content_blocks')
                    .update({ 
                        content: heroContent,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', heroId);
                if (heroError) throw heroError;
            } else {
                const { data: newHero, error: heroError } = await supabase
                    .from('content_blocks')
                    .insert([{
                        page_slug: 'team',
                        section_key: 'hero',
                        content: heroContent
                    }])
                    .select();
                if (heroError) throw heroError;
                if (newHero && newHero.length > 0) {
                    setHeroId(newHero[0].id);
                }
            }

            // 2. Save Team Image Block
            const teamImageContent = {
                image: teamImage.trim()
            };

            if (teamImageId) {
                const { error: teamImgError } = await supabase
                    .from('content_blocks')
                    .update({ 
                        content: teamImageContent,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', teamImageId);
                if (teamImgError) throw teamImgError;
            } else {
                const { data: newTeamImg, error: teamImgError } = await supabase
                    .from('content_blocks')
                    .insert([{
                        page_slug: 'team',
                        section_key: 'team_image',
                        content: teamImageContent
                    }])
                    .select();
                if (teamImgError) throw teamImgError;
                if (newTeamImg && newTeamImg.length > 0) {
                    setTeamImageId(newTeamImg[0].id);
                }
            }

            showAlert('Success', 'Team page visuals updated successfully', 'success');
        } catch (error) {
            console.error('Error saving team visuals:', error);
            showAlert('Error', 'Failed to save visuals configuration', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => navigate('/team')}
                        className="p-3 bg-white border border-slate-200 text-slate-600 rounded-2xl shadow-sm hover:bg-slate-50 transition-all hover:scale-105 active:scale-95"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3 uppercase">
                            <Sparkles className="text-red-600 animate-pulse" size={24} />
                            Team Page Visuals
                        </h1>
                        <p className="text-slate-400 text-[11px] font-black uppercase tracking-widest mt-1">
                            Configure the banner, headings, and group photo for the public team page
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button 
                        onClick={handleSave}
                        disabled={isSaving || loading}
                        className="px-10 bg-red-600 text-white font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-red-600/20 flex items-center gap-3 py-3 rounded-2xl hover:scale-105 active:scale-95 transition-all"
                    >
                        {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        {isSaving ? 'Processing' : 'Commit Changes'}
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="py-40 flex flex-col items-center justify-center">
                    <Loader2 className="animate-spin text-red-600 mb-6" size={60} strokeWidth={1} />
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.6em]">Loading Configuration...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column: Hero Banner settings */}
                    <div className="lg:col-span-7 space-y-6">
                        <Card className="border border-slate-200 bg-white rounded-[2.5rem] shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-50 flex items-center gap-3">
                                <div className="p-2.5 bg-red-50 text-red-600 rounded-xl">
                                    <ImageIcon size={18} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Hero Banner Configuration</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Visual top section of the team page</p>
                                </div>
                            </div>
                            
                            <CardContent className="p-6 space-y-6">
                                <ImageUpload 
                                    label="Hero Banner Image"
                                    value={heroImage}
                                    onChange={setHeroImage}
                                    folder="banners/team"
                                    aspectRatio="aspect-[21/9]"
                                    showUrlInput={true}
                                    placeholder="Upload banner image or paste direct URL"
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                            <Sparkles size={12} className="text-red-500" />
                                            Promotional Badge
                                        </label>
                                        <input 
                                            type="text"
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-red-600/30 focus:bg-white focus:outline-none transition-all font-bold text-slate-900 text-sm"
                                            value={heroBadge}
                                            onChange={(e) => setHeroBadge(e.target.value)}
                                            placeholder="e.g. Our People"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                            <Heading size={12} className="text-red-500" />
                                            Hero Heading (HTML allowed)
                                        </label>
                                        <input 
                                            type="text"
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-red-600/30 focus:bg-white focus:outline-none transition-all font-bold text-slate-900 text-sm"
                                            value={heroTitle}
                                            onChange={(e) => setHeroTitle(e.target.value)}
                                            placeholder="e.g. Meet the <br />Experts."
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <FileText size={12} className="text-red-500" />
                                        Hero Description
                                    </label>
                                    <RichTextEditor 
                                        value={heroDescription}
                                        onChange={setHeroDescription}
                                        placeholder="Enter hero description..."
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Team Group Photo Settings */}
                    <div className="lg:col-span-5 space-y-6">
                        <Card className="border border-slate-200 bg-white rounded-[2.5rem] shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-50 flex items-center gap-3">
                                <div className="p-2.5 bg-red-50 text-red-600 rounded-xl">
                                    <LucideImage size={18} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Team Group Photo</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Main group photo of travel specialists</p>
                                </div>
                            </div>

                            <CardContent className="p-6 space-y-6">
                                <ImageUpload 
                                    label="Group Photo Image"
                                    value={teamImage}
                                    onChange={setTeamImage}
                                    folder="team"
                                    aspectRatio="aspect-[21/9]"
                                    showUrlInput={true}
                                    placeholder="Upload team group photo or paste direct URL"
                                />

                                <div className="bg-slate-50 border border-slate-100 rounded-3xl p-5 text-slate-500 text-xs leading-relaxed font-bold uppercase tracking-tight">
                                    <p className="mb-2 text-slate-700 font-black">Group Photo Optimization Guidelines:</p>
                                    <ul className="list-disc pl-5 space-y-1.5 text-[10px]">
                                        <li>Recommended Aspect Ratio: 21:7 or 16:9 landscape.</li>
                                        <li>Recommended Resolution: Minimum 1600px width for crystal-clear clarity.</li>
                                        <li>Ensure the team members are centered for ideal layout rendering on different screens.</li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamVisuals;
