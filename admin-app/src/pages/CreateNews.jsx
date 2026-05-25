import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
    Save, 
    ArrowLeft,
    Image as ImageIcon,
    Loader2,
    Type,
    FileText,
    Tag,
    Globe
} from 'lucide-react';
import { showAlert } from '../utils/swal';
import { Button } from '../components/Button.jsx';
import ImageUpload from '../components/ImageUpload.jsx';
import RichTextEditor from '../components/RichTextEditor.jsx';

const CreateNews = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = !!id;

    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    
    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        featured_image: '',
        tags: '',
        status: 'draft'
    });

    useEffect(() => {
        if (isEdit) {
            fetchPost();
        }
    }, [id]);

    const fetchPost = async () => {
        try {
            const { data, error } = await supabase
                .from('editorial_posts')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            if (data) {
                setFormData({
                    title: data.title || '',
                    slug: data.slug || '',
                    excerpt: data.excerpt || '',
                    content: data.content || '',
                    featured_image: data.featured_image || '',
                    tags: data.tags ? data.tags.join(', ') : '',
                    status: data.status || 'draft'
                });
            }
        } catch (error) {
            console.error('Error fetching post:', error);
            showAlert('Error', 'Could not load article details', 'error');
            navigate('/news');
        } finally {
            setLoading(false);
        }
    };

    const generateSlug = (text) => {
        return text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')        // Replace spaces with -
            .replace(/[^\w-]+/g, '')     // Remove all non-word chars
            .replace(/--+/g, '-')        // Replace multiple - with single -
            .substring(0, 50);           // Limit length
    };

    const handleTitleChange = (e) => {
        const title = e.target.value;
        setFormData(prev => ({
            ...prev,
            title,
            // Auto-generate slug only if we are creating a new post and haven't manually edited the slug
            slug: !isEdit && !prev.slug ? generateSlug(title) : prev.slug
        }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            // Process tags into an array
            const tagsArray = formData.tags
                .split(',')
                .map(t => t.trim())
                .filter(t => t.length > 0);

            const postData = {
                title: formData.title,
                slug: formData.slug || generateSlug(formData.title),
                excerpt: formData.excerpt,
                content: formData.content,
                featured_image: formData.featured_image,
                tags: tagsArray,
                status: formData.status,
                updated_at: new Date().toISOString()
            };

            if (formData.status === 'published' && !isEdit) {
                 postData.published_at = new Date().toISOString();
            }

            if (isEdit) {
                const { error } = await supabase
                    .from('editorial_posts')
                    .update(postData)
                    .eq('id', id);
                if (error) throw error;
                showAlert('Success', 'Article updated successfully', 'success');
            } else {
                const { error } = await supabase
                    .from('editorial_posts')
                    .insert([postData]);
                if (error) throw error;
                showAlert('Success', 'Article created successfully', 'success');
            }
            navigate('/news');
        } catch (error) {
            console.error('Error saving post:', error);
            if (error.code === '23505') {
                 showAlert('Error', 'That slug is already in use by another article. Please change the slug.', 'error');
            } else {
                 showAlert('Error', error.message || 'Could not save article', 'error');
            }
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-slate-400">
                    <Loader2 size={40} className="animate-spin text-brand-red" />
                    <p className="font-bold tracking-widest uppercase text-xs">Loading Editor...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button 
                    onClick={() => navigate('/news')}
                    className="p-3 text-slate-400 hover:text-slate-900 bg-white rounded-xl shadow-sm hover:shadow transition-all group"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                </button>
                <div>
                    <h1 className="text-3xl font-black text-slate-900">
                        {isEdit ? 'Edit Article' : 'New Article'}
                    </h1>
                    <p className="text-slate-500 mt-1">
                        {isEdit ? 'Update existing news post' : 'Draft a new post for your travel blog'}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8 space-y-8">
                    {/* Basic Info */}
                    <div className="space-y-6">
                        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                            <Type size={18} className="text-brand-red"/> Primary Details
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-wider text-slate-500">Title</label>
                                <input
                                    type="text"
                                    name="title"
                                    required
                                    value={formData.title}
                                    onChange={handleTitleChange}
                                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-red/20 transition-all font-medium"
                                    placeholder="e.g. 10 Best Beaches in Mauritius"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-wider text-slate-500">URL Slug</label>
                                <div className="relative">
                                    <Globe size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
                                    <input
                                        type="text"
                                        name="slug"
                                        required
                                        value={formData.slug}
                                        onChange={handleChange}
                                        className="w-full bg-slate-50 border-none rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-brand-red/20 transition-all font-medium font-mono text-sm text-slate-600"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-wider text-slate-500">Short Excerpt</label>
                            <RichTextEditor
                                value={formData.excerpt}
                                onChange={(val) => setFormData(p => ({ ...p, excerpt: val }))}
                                placeholder="A brief summary of the article..."
                            />
                        </div>
                    </div>

                    <hr className="border-slate-100" />

                    {/* Content */}
                    <div className="space-y-6">
                        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                            <FileText size={18} className="text-brand-red"/> Article Body
                        </h2>
                        <div className="space-y-4">
                            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                                <RichTextEditor
                                    value={formData.content}
                                    onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                                    placeholder="Compose your article with rich formatting, images, and structure..."
                                />
                            </div>
                        </div>
                    </div>

                    <hr className="border-slate-100" />

                    {/* Media & Meta */}
                    <div className="space-y-6">
                        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                            <ImageIcon size={18} className="text-brand-red"/> Media & Classification
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                             <div className="space-y-6">
                                <ImageUpload
                                    label="Featured Image"
                                    value={formData.featured_image}
                                    onChange={(url) => setFormData(prev => ({ ...prev, featured_image: url }))}
                                    folder="news"
                                    bucket="bucket"
                                    aspectRatio="aspect-[16/9]"
                                    placeholder="Upload featured image from PC"
                                />

                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1"><Tag size={12}/> Tags (comma separated)</label>
                                    <input
                                        type="text"
                                        name="tags"
                                        value={formData.tags}
                                        onChange={handleChange}
                                        className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-red/20 transition-all font-medium"
                                        placeholder="travel, beach, tips"
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-wider text-slate-500">Publishing Status</label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-red/20 transition-all font-medium text-slate-700"
                                    >
                                        <option value="draft">Draft</option>
                                        <option value="published">Published</option>
                                        <option value="archived">Archived</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-end gap-4 mt-8 pb-10">
                    <button
                        type="button"
                        onClick={() => navigate('/news')}
                        className="px-8 py-3 text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all font-black"
                    >
                        Cancel
                    </button>
                    <Button
                        type="submit"
                        disabled={saving}
                        className="bg-brand-red text-white px-12 py-4 rounded-2xl shadow-xl shadow-red-100 flex items-center gap-3 font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all focus:ring-0"
                    >
                        {saving ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save size={16} />
                                {isEdit ? 'Update Article' : 'Create Article'}
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default CreateNews;
