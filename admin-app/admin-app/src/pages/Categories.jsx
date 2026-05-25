import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '../components/Card';
import { Button } from '../components/Button';
import {
    Loader2, Plus, Search, Edit2, Trash2, Eye,
    ToggleLeft, ToggleRight, ArrowUp, ArrowDown, ChevronDown, ArrowUpDown,
    Layers, Link as LinkIcon, Hash, FileText, Home, Hotel,
    Activity, Users, Sun, Ship, Map, LayoutGrid, List
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import Modal from '../components/Modal';
import { showAlert, showConfirm } from '../utils/swal';
import ImageUpload from '../components/ImageUpload';
import { resolveImageUrl } from '../utils/image';
import RichTextEditor from '../components/RichTextEditor';

const slugify = (str) =>
    str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const categoryIcons = {
    'hotels': <Hotel size={18} strokeWidth={2.5} className="text-brand-red" />,
    'activities': <Activity size={18} strokeWidth={2.5} className="text-brand-red" />,
    'group tours': <Users size={18} strokeWidth={2.5} className="text-brand-red" />,
    'day packages': <Sun size={18} strokeWidth={2.5} className="text-brand-red" />,
    'cruises': <Ship size={18} strokeWidth={2.5} className="text-brand-red" />,
    'rodrigues': <Map size={18} strokeWidth={2.5} className="text-brand-red" />,
};

const getCategoryIcon = (name) => {
    return categoryIcons[name?.toLowerCase()] || <Layers size={18} strokeWidth={2.5} className="text-gray-300" />;
};

const defaultForm = () => ({
    name: '',
    slug: '',
    icon: '',
    description: '',
    image_url: '',
    link: '',
    display_order: '',
    is_active: true,
    show_on_home: false,
});

const Categories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [togglingId, setTogglingId] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterActive, setFilterActive] = useState('All');
    const [sortBy, setSortBy] = useState('display_order:asc');
    const [viewMode, setViewMode] = useState('list');

    const selectCls = "bg-gray-50 border border-slate-300 text-gray-900 text-[11px] font-black uppercase tracking-widest rounded-2xl focus:ring-brand-red focus:border-brand-red block w-full p-2.5 appearance-none pr-8 transition-all cursor-pointer hover:bg-white";

    const [showFormModal, setShowFormModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [viewingCat, setViewingCat] = useState(null);
    const [editingCat, setEditingCat] = useState(null);
    const [formData, setFormData] = useState(defaultForm);
    const [formLoading, setFormLoading] = useState(false);

    useEffect(() => { fetchCategories(); }, []);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('display_order', { ascending: true });

            if (error) throw error;
            setCategories(data || []);
        } catch (e) {
            void e;
            showAlert('Error', 'Failed to load categories', 'error');
        } finally {
            setLoading(false);
        }
    };

    const processed = useMemo(() => {
        let list = [...categories];

        if (searchTerm) {
            const q = searchTerm.toLowerCase();
            list = list.filter(c =>
                (c.name || '').toLowerCase().includes(q) ||
                (c.slug || '').toLowerCase().includes(q) ||
                (c.description || '').toLowerCase().includes(q)
            );
        }

        if (filterActive === 'Active') list = list.filter(c => c.is_active);
        if (filterActive === 'Inactive') list = list.filter(c => !c.is_active);

        const [field, dir] = sortBy.split(':');
        list.sort((a, b) => {
            let va = a[field], vb = b[field];
            if (field === 'display_order') { va = Number(va); vb = Number(vb); }
            if (va < vb) return dir === 'asc' ? -1 : 1;
            if (va > vb) return dir === 'asc' ? 1 : -1;
            return 0;
        });

        return list;
    }, [categories, searchTerm, filterActive, sortBy]);

    const hasActiveFilters = searchTerm !== '' || filterActive !== 'All' || sortBy !== 'display_order:asc';

    const clearFilters = () => {
        setSearchTerm('');
        setFilterActive('All');
        setSortBy('display_order:asc');
    };

    const openCreateModal = () => {
        setEditingCat(null);
        setFormData(defaultForm());
        setShowFormModal(true);
    };

    const openEditModal = (cat) => {
        setEditingCat(cat);
        setFormData({
            name: cat.name || '',
            slug: cat.slug || '',
            icon: cat.icon || '',
            description: cat.description || '',
            image_url: cat.image_url || '',
            link: cat.link || '',
            display_order: cat.display_order ?? '',
            is_active: cat.is_active ?? true,
            show_on_home: cat.show_on_home ?? false,
        });
        setShowFormModal(true);
    };

    const openViewModal = (cat) => {
        setViewingCat(cat);
        setShowViewModal(true);
    };

    const closeFormModal = () => { setShowFormModal(false); setEditingCat(null); };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => {
            const updated = { ...prev, [name]: type === 'checkbox' ? checked : value };
            if (name === 'name' && !editingCat) updated.slug = slugify(value);
            return updated;
        });
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        try {
            const payload = {
                name: formData.name,
                slug: formData.slug || slugify(formData.name),
                icon: formData.icon || null,
                description: formData.description || null,
                image_url: formData.image_url || null,
                link: formData.link || null,
                display_order: formData.display_order !== '' ? parseInt(formData.display_order, 10) : null,
                is_active: formData.is_active,
                show_on_home: formData.show_on_home,
                updated_at: new Date().toISOString(),
            };

            if (editingCat) {
                const { error } = await supabase.from('categories').update(payload).eq('id', editingCat.id);
                if (error) throw error;
                showAlert('Updated', 'Category updated successfully');
            } else {
                const { error } = await supabase.from('categories').insert([payload]);
                if (error) throw error;
                showAlert('Created', 'Category created successfully');
            }

            closeFormModal();
            fetchCategories();
        } catch (e) {
            void e;
            showAlert('Error', 'Failed to save category', 'error');
        } finally {
            setFormLoading(false);
        }
    };

    const deleteCategory = async (id) => {
        const result = await showConfirm(
            'Delete Category?',
            'This will permanently remove this category and all its service associations. This action cannot be undone.'
        );
        if (!result.isConfirmed) return;

        setLoading(true);
        try {
            // 1. Manually cascade the junction table associations
            await supabase.from('service_categories').delete().eq('category_id', id);

            // 2. Delete the category itself
            const { error } = await supabase.from('categories').delete().eq('id', id);

            if (error) {
                // Check if it's a foreign key error (Postgres code 23503)
                if (error.code === '23503') {
                    throw new Error('This category is still being used by other sections (e.g., Blogs or Content Blocks). Please reassign those items before deleting.');
                }
                throw error;
            }

            showAlert('Deleted', 'Category removed successfully');
            setCategories(prev => prev.filter(c => c.id !== id));
        } catch (e) {
            console.error('Delete error:', e);
            showAlert('Deletion Failed', e.message || 'An unexpected error occurred.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const toggleActive = async (cat) => {
        setTogglingId(cat.id);
        const next = !cat.is_active;
        try {
            const { error } = await supabase
                .from('categories')
                .update({ is_active: next, updated_at: new Date().toISOString() })
                .eq('id', cat.id);
            if (error) throw error;
            setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, is_active: next } : c));
        } catch (e) {
            void e;
            showAlert('Error', 'Failed to update status', 'error');
        } finally {
            setTogglingId(null);
        }
    };

    const shiftOrder = async (cat, direction) => {
        const newOrder = (cat.display_order || 0) + direction;
        try {
            const { error } = await supabase
                .from('categories')
                .update({ display_order: newOrder, updated_at: new Date().toISOString() })
                .eq('id', cat.id);
            if (error) throw error;
            setCategories(prev =>
                prev.map(c => c.id === cat.id ? { ...c, display_order: newOrder } : c)
            );
        } catch (e) {
            void e;
            showAlert('Error', 'Failed to reorder', 'error');
        }
    };



    return (
        <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Categories</h1>
                    <p className="text-gray-400 text-sm font-medium">Manage your agency services and rental inventory categories</p>
                </div>
                <div className="flex items-center gap-2">
                    {/* <Button
                        variant="outline"
                        onClick={fetchCategories}
                        disabled={loading}
                        className="text-gray-500 border-slate-300 flex items-center gap-2"
                    >
                        <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                        Sync
                    </Button> */}
                    <Button
                        onClick={openCreateModal}
                        className="bg-brand-red hover:opacity-90 text-white flex items-center gap-2 shadow-lg shadow-red-100 font-bold"
                    >
                        <Plus size={16} />
                        Add Category
                    </Button>
                </div>
            </div>

            <Card className="border border-slate-300 shadow-xl shadow-gray-200/50 rounded-3xl overflow-hidden">
                {/* Toolbar */}
                <CardHeader className="border-b border-slate-300 pb-3 bg-white px-6 pt-6">
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div className="relative flex-1 min-w-0 max-w-md">
                                <Search className="absolute left-3 top-2.5 text-gray-300" size={16} />
                                <input
                                    type="text"
                                    placeholder="Locate node identifiers..."
                                    className="pl-9 pr-9 py-2.5 w-full border border-slate-300 bg-gray-50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all font-medium"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="relative min-w-[140px]">
                                    <select
                                        className={selectCls}
                                        value={filterActive}
                                        onChange={(e) => setFilterActive(e.target.value)}
                                    >
                                        <option value="All">All Statuses</option>
                                        <option value="Active">Active Only</option>
                                        <option value="Inactive">Inactive Only</option>
                                    </select>
                                    <ChevronDown size={12} className="absolute right-2.5 top-3.5 text-gray-400 pointer-events-none" />
                                </div>

                                <div className="relative min-w-[140px]">
                                    <select
                                        className={selectCls}
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                    >
                                        <option value="display_order:asc">Display Order</option>
                                        <option value="name:asc">Name A-Z</option>
                                        <option value="name:desc">Name Z-A</option>
                                    </select>
                                    <ArrowUpDown size={12} className="absolute right-2.5 top-3.5 text-gray-400 pointer-events-none" />
                                </div>

                                {hasActiveFilters && (
                                    <button
                                        type="button"
                                        onClick={clearFilters}
                                        className="text-brand-red text-[10px] font-black uppercase tracking-widest px-4 py-2 hover:bg-red-50 rounded-xl transition-colors"
                                    >
                                        Clear Engine
                                    </button>
                                )}

                                <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-slate-300 gap-1 ml-2">
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-brand-red' : 'text-gray-400 hover:text-gray-600'}`}
                                        title="List View"
                                    >
                                        <List size={16} />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-brand-red' : 'text-gray-400 hover:text-gray-600'}`}
                                        title="Grid View"
                                    >
                                        <LayoutGrid size={16} />
                                    </button>
                                </div>

                                <span className="ml-auto text-[10px] text-gray-400 font-black uppercase tracking-widest shrink-0">
                                    {processed.length} Node Identifiers
                                </span>
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0 bg-white">
                    {loading ? (
                        <div className="py-32 flex flex-col items-center">
                            <Loader2 className="animate-spin text-brand-red mb-4" size={48} />
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Syncing with Registry...</p>
                        </div>
                    ) : processed.length === 0 ? (
                        <div className="py-32 text-center text-gray-300 font-black uppercase tracking-widest text-xs flex flex-col items-center gap-4">
                            <Layers size={56} className="opacity-20" />
                            No matching specifications found
                        </div>
                    ) : viewMode === 'list' ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50/50">
                                    <tr>
                                        <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Category Asset</th>
                                        <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Configuration</th>
                                        <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Lifecycle</th>
                                        <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {processed.map((cat) => (
                                        <tr key={cat.id} className="even:bg-gray-100/40 hover:bg-gray-100/60 transition-colors">
                                            {/* Category Asset (Name + Icon + Slug) */}
                                            <td className="px-6 py-3 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="w-10 h-10 rounded-2xl bg-red-50/50 border border-red-100/50 flex items-center justify-center text-brand-red mr-4 shrink-0 shadow-sm overflow-hidden">
                                                        {cat.image_url ? (
                                                            <img src={resolveImageUrl(cat.image_url)} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            getCategoryIcon(cat.name)
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-black text-gray-900 mb-0.5 tracking-tight">{cat.name}</div>
                                                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-mono">/{cat.slug}</div>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-8 py-5">
                                                <div className="text-[11px] font-bold text-gray-400 leading-relaxed mb-1.5 max-w-[200px] line-clamp-2" title={cat.description}>
                                                    {cat.description || 'No description provided.'}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black text-gray-300 uppercase">Sort Order:</span>
                                                    <span className="text-[11px] font-black text-gray-900 border-b-2 border-brand-red/20">{cat.display_order ?? '—'}</span>
                                                    <button type="button" onClick={() => shiftOrder(cat, -1)}
                                                        className="p-1.5 text-gray-400 hover:text-brand-red hover:bg-red-50 rounded-xl transition-all" title="Move up">
                                                        <ArrowUp size={14} />
                                                    </button>
                                                    <button type="button" onClick={() => shiftOrder(cat, 1)}
                                                        className="p-1.5 text-gray-400 hover:text-brand-red hover:bg-red-50 rounded-xl transition-all" title="Move down">
                                                        <ArrowDown size={14} />
                                                    </button>
                                                </div>
                                            </td>

                                            {/* Show on home */}
                                            <td className="px-8 py-5 text-center">
                                                {cat.show_on_home
                                                    ? <span className="inline-flex items-center gap-1.5 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-green-600 bg-green-50 border border-green-100 rounded-lg"><Home size={10} /> Homepage</span>
                                                    : <span className="text-[10px] text-gray-300 font-black uppercase tracking-widest italic pt-1 inline-block">— Hidden</span>
                                                }
                                            </td>

                                            {/* Active toggle */}
                                            <td className="px-8 py-5 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleActive(cat)}
                                                    disabled={togglingId === cat.id}
                                                    className="inline-flex items-center justify-center transition-opacity disabled:opacity-40"
                                                    title={cat.is_active ? 'Deactivate' : 'Activate'}
                                                >
                                                    {togglingId === cat.id
                                                        ? <Loader2 size={20} className="animate-spin text-gray-400" />
                                                        : cat.is_active
                                                            ? <ToggleRight size={28} className="text-brand-red" />
                                                            : <ToggleLeft size={28} className="text-gray-200" />
                                                    }
                                                </button>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-6 py-3 text-right">
                                                <div className="flex justify-end items-center gap-1">
                                                    <button type="button"
                                                        onClick={(e) => { e.stopPropagation(); openViewModal(cat); }}
                                                        className="p-2.5 text-gray-400 hover:text-brand-red hover:bg-red-50 rounded-xl transition-all" title="View Specification">
                                                        <Eye size={16} />
                                                    </button>
                                                    <button type="button"
                                                        onClick={(e) => { e.stopPropagation(); openEditModal(cat); }}
                                                        className="p-2.5 text-gray-400 hover:text-brand-red hover:bg-red-50 rounded-xl transition-all" title="Edit Specification">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button type="button"
                                                        onClick={(e) => { e.stopPropagation(); deleteCategory(cat.id); }}
                                                        className="p-2.5 text-gray-400 hover:text-brand-red hover:bg-red-50 rounded-xl transition-all" title="Archive Listing">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-8 bg-gray-50/30">
                            {processed.map((cat) => (
                                <div key={cat.id} className="group relative bg-white border border-slate-300 rounded-3xl p-5 shadow-sm hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 flex flex-col h-full">
                                    {/* Icon/Image & Status */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-brand-red shadow-inner group-hover:scale-110 transition-transform duration-500 overflow-hidden">
                                            {cat.image_url ? (
                                                <img src={resolveImageUrl(cat.image_url)} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                getCategoryIcon(cat.name)
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => toggleActive(cat)}
                                            disabled={togglingId === cat.id}
                                            className="transition-opacity disabled:opacity-40"
                                        >
                                            {togglingId === cat.id
                                                ? <Loader2 size={24} className="animate-spin text-gray-400" />
                                                : cat.is_active
                                                    ? <ToggleRight size={32} className="text-brand-red" />
                                                    : <ToggleLeft size={32} className="text-gray-200" />
                                            }
                                        </button>
                                    </div>

                                    <div className="flex-1">
                                        <h3 className="text-lg font-black text-gray-900 tracking-tight mb-1 group-hover:text-brand-red transition-colors">{cat.name}</h3>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 font-mono">/{cat.slug}</p>
                                        <p className="text-xs text-gray-500 font-medium leading-relaxed line-clamp-3 mb-4 h-12">
                                            {cat.description || 'No specialized mission defined.'}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between py-3 border-t border-gray-50 mb-4 mt-auto">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Order:</span>
                                            <div className="flex items-center bg-gray-50 rounded-lg px-2 py-1 gap-1">
                                                <button onClick={() => shiftOrder(cat, -1)} className="text-gray-400 hover:text-brand-red"><ArrowUp size={10} /></button>
                                                <span className="text-[10px] font-black text-gray-900 min-w-[12px] text-center">{cat.display_order ?? '0'}</span>
                                                <button onClick={() => shiftOrder(cat, 1)} className="text-gray-400 hover:text-brand-red"><ArrowDown size={10} /></button>
                                            </div>
                                        </div>
                                        {cat.show_on_home && (
                                            <span className="flex items-center gap-1.5 px-2 py-1 text-[8px] font-black uppercase tracking-widest text-green-600 bg-green-50 rounded-lg">
                                                <Home size={10} /> Home
                                            </span>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-3 gap-2">
                                        <button
                                            onClick={() => openViewModal(cat)}
                                            className="flex items-center justify-center py-2.5 bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-brand-red rounded-xl transition-all"
                                            title="View Details"
                                        >
                                            <Eye size={16} />
                                        </button>
                                        <button
                                            onClick={() => openEditModal(cat)}
                                            className="flex items-center justify-center py-2.5 bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-brand-red rounded-xl transition-all"
                                            title="Edit Category"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => deleteCategory(cat.id)}
                                            className="flex items-center justify-center py-2.5 bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-brand-red rounded-xl transition-all"
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title="Category Details" size="md">
                {viewingCat && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 bg-gray-50 rounded-xl p-4 border border-slate-300">
                            <div className="h-12 w-12 rounded-2xl bg-red-50/50 border border-red-100/50 flex items-center justify-center text-2xl shadow-sm">
                                {getCategoryIcon(viewingCat.name)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-black text-gray-900">{viewingCat.name}</p>
                                <code className="text-xs font-mono text-gray-400">/{viewingCat.slug}</code>
                            </div>
                            <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border shrink-0 ${viewingCat.is_active ? 'bg-green-50 text-green-700 border-green-100' : 'bg-gray-100 text-gray-400 border-gray-100'}`}>
                                {viewingCat.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gray-50 rounded-xl p-3 border border-slate-300">
                                <div className="flex items-center text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1"><Hash size={10} className="mr-1" /> Display Order</div>
                                <p className="text-lg font-black text-gray-900">{viewingCat.display_order ?? '—'}</p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-3 border border-slate-300">
                                <div className="flex items-center text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1"><Home size={10} className="mr-1" /> Show on Home</div>
                                <p className="text-lg font-black text-gray-900">{viewingCat.show_on_home ? '✅ Yes' : '—'}</p>
                            </div>

                            {viewingCat.description && (
                                <div className="col-span-2 bg-gray-50 rounded-xl p-3 border border-slate-300">
                                    <div className="flex items-center text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1"><FileText size={10} className="mr-1" /> Description</div>
                                    <p className="text-sm text-gray-700 leading-relaxed">{viewingCat.description}</p>
                                </div>
                            )}

                            {viewingCat.link && (
                                <div className="col-span-2 bg-gray-50 rounded-xl p-3 border border-slate-300">
                                    <div className="flex items-center text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1"><LinkIcon size={10} className="mr-1" /> Link</div>
                                    <p className="text-xs font-mono text-red-600 truncate">{viewingCat.link}</p>
                                </div>
                            )}

                            <div className="col-span-2 bg-gray-50 rounded-xl p-3 border border-slate-300">
                                <div className="flex items-center text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1"><Layers size={10} className="mr-1" /> ID</div>
                                <p className="text-xs font-mono text-gray-500">{viewingCat.id}</p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-1 border-t border-gray-50">
                            <button type="button"
                                onClick={() => { setShowViewModal(false); openEditModal(viewingCat); }}
                                className="px-4 py-2 text-sm font-bold text-amber-600 bg-amber-50 border border-amber-100 rounded-xl hover:bg-amber-100 transition-all flex items-center gap-1.5">
                                <Edit2 size={13} /> Edit
                            </button>
                            <button type="button" onClick={() => setShowViewModal(false)}
                                className="px-5 py-2 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-xl transition-all">
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal isOpen={showFormModal} onClose={closeFormModal} title={editingCat ? 'Edit Category' : 'Add New Category'} size="md">
                <form onSubmit={handleSubmit} className="space-y-4">

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Name *</label>
                            <input type="text" name="name" required
                                placeholder="e.g. Hotels"
                                className="w-full px-4 py-2.5 bg-gray-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red transition-all font-medium text-sm"
                                value={formData.name} onChange={handleInputChange}
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">System Icon</label>
                            <div className="w-full px-4 py-2.5 bg-gray-100 border border-gray-50 rounded-xl text-center text-brand-red flex items-center justify-center">
                                {getCategoryIcon(formData.name)}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Slug *</label>
                        <div className="flex items-center">
                            <span className="px-3 py-2.5 bg-gray-100 border border-r-0 border-gray-100 rounded-l-xl text-sm text-gray-400 font-mono">/</span>
                            <input type="text" name="slug" required
                                placeholder="hotels"
                                className="flex-1 px-4 py-2.5 bg-gray-50 border border-slate-300 rounded-r-xl focus:outline-none focus:ring-2 focus:ring-brand-red transition-all font-mono text-sm"
                                value={formData.slug} onChange={handleInputChange}
                            />
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">Auto-generated from name. Must be URL-safe (lowercase, hyphens only).</p>
                    </div>

                    <div>
                        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Description</label>
                        <RichTextEditor
                            value={formData.description}
                            onChange={(val) => setFormData(p => ({ ...p, description: val }))}
                            placeholder="Brief description of this category…"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Link (optional)</label>
                            <input type="text" name="link"
                                placeholder="/categories/hotels"
                                className="w-full px-4 py-2.5 bg-gray-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red transition-all font-mono text-sm"
                                value={formData.link} onChange={handleInputChange}
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Display Order</label>
                            <input type="number" name="display_order" min="1"
                                className="w-full px-4 py-2.5 bg-gray-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red transition-all font-bold text-sm"
                                value={formData.display_order} onChange={handleInputChange}
                            />
                        </div>
                    </div>

                    <ImageUpload
                        label="Category Image"
                        value={formData.image_url}
                        onChange={(url) => setFormData(prev => ({ ...prev, image_url: url }))}
                        folder="categories"
                        aspectRatio="aspect-video"
                    />

                    <div className="flex items-center gap-6 pt-1">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleInputChange} className="accent-brand-red w-4 h-4" />
                            <span className="text-sm font-semibold text-gray-700">Active</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input type="checkbox" name="show_on_home" checked={formData.show_on_home} onChange={handleInputChange} className="accent-brand-red w-4 h-4" />
                            <span className="text-sm font-semibold text-gray-700">Show on Homepage</span>
                        </label>
                    </div>

                    <div className="flex justify-end gap-3 pt-3 border-t border-gray-50">
                        <button type="button" onClick={closeFormModal}
                            className="px-6 py-2.5 text-sm font-bold text-gray-400 hover:text-gray-600 transition-all">
                            Cancel
                        </button>
                        <Button type="submit" disabled={formLoading}
                            className="bg-brand-red text-white px-8 py-2.5 rounded-xl shadow-lg shadow-red-100 flex items-center font-bold">
                            {formLoading && <Loader2 className="animate-spin mr-2" size={15} />}
                            {editingCat ? 'Save Changes' : 'Create Category'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Categories;
