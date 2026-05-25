import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users, UserPlus, Search, Edit2, Trash2, Mail, Globe,
    Linkedin, Loader2, LayoutGrid, List, ChevronLeft, ChevronRight,
    ArrowUpDown, ChevronDown, Sparkles
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader } from '../components/Card';
import { Button } from '../components/Button';
import { resolveImageUrl } from '../utils/image';
import { showAlert, showConfirm } from '../utils/swal';
import { stripTags } from '../utils/sanitize';


const roles = [
    { value: 'super_admin', label: 'Global Systems Administrator' },
    { value: 'admin', label: 'Universal Root Administrator' },
    { value: 'director', label: 'Managing Director' },
    { value: 'manager', label: 'Operations Manager' },
    { value: 'staff', label: 'Standard Staff' },
    { value: 'receptionist', label: 'Receptionist' },
    { value: 'editor', label: 'Content Manager' },
    { value: 'sales', label: 'Sales Consultant' },
    { value: 'sales_corporate_sr', label: 'Senior Corporate Sales' },
    { value: 'sales_corporate', label: 'Corporate Sales' },
    { value: 'consultant', label: 'Travel Consultant' },
    { value: 'accountant', label: 'Account Representative' }
];

const Team = () => {
    const navigate = useNavigate();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('list');

    // — Filtering & Sorting State —
    const [filterRole, setFilterRole] = useState('All');
    const [sortBy, setSortBy] = useState('name:asc');

    const selectCls = "bg-gray-50 border border-slate-300 text-gray-900 text-[11px] font-black uppercase tracking-widest rounded-2xl focus:ring-brand-red focus:border-brand-red block w-full p-2.5 appearance-none pr-8 transition-all cursor-pointer hover:bg-white";

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const perPage = 8;

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('admins')
                .select('*')
                .order('display_order', { ascending: true })
                .order('name', { ascending: true });

            if (error) throw error;
            setMembers(data || []);
        } catch (error) {
            console.error('Error fetching staff:', error);
            showAlert('Error', 'Failed to load staff members', 'error');
        } finally {
            setLoading(false);
        }
    };

    const deleteMember = async (id) => {
        const res = await showConfirm(
            'Remove Member?',
            'Are you sure you want to remove this profile from the team?',
            'Yes, remove'
        );
        if (!res.isConfirmed) return;

        try {
            const { error: delError } = await supabase
                .from('admins')
                .delete()
                .eq('id', id);
            if (delError) throw delError;
            showAlert('Deleted', 'Staff member removed successfully', 'success');
            fetchMembers();
        } catch (err) {
            console.error('Delete error:', err);
            showAlert('Error', 'Failed to remove staff member', 'error');
        }
    };

    const openCreate = () => navigate('/team/create');
    const openEdit = (member) => navigate(`/team/edit/${member.id}`);

    // Filter & Search
    const processed = useMemo(() => {
        let list = [...members];

        // 1. Search filter
        if (searchTerm) {
            const q = searchTerm.toLowerCase();
            list = list.filter(m =>
                (m.name || '').toLowerCase().includes(q) ||
                (m.username || '').toLowerCase().includes(q) ||
                (m.role || '').toLowerCase().includes(q) ||
                (m.email || '').toLowerCase().includes(q)
            );
        }

        // 2. Role filter
        if (filterRole !== 'All') {
            list = list.filter(m => m.role === filterRole);
        }

        // 3. Sorting
        const [field, dir] = sortBy.split(':');
        list.sort((a, b) => {
            let vA = (a[field] || '').toString().toLowerCase();
            let vB = (b[field] || '').toString().toLowerCase();

            if (field === 'display_order') {
                vA = Number(a[field] || 0);
                vB = Number(b[field] || 0);
            }

            if (vA < vB) return dir === 'asc' ? -1 : 1;
            if (vA > vB) return dir === 'asc' ? 1 : -1;
            return 0;
        });

        return list;
    }, [members, searchTerm, filterRole, sortBy]);

    const hasActiveFilters = searchTerm !== '' || filterRole !== 'All';

    const clearFilters = () => {
        setSearchTerm('');
        setFilterRole('All');
        setSortBy('name:asc');
        setCurrentPage(1);
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterRole]);

    // Pagination logic
    const totalPages = Math.ceil(processed.length / perPage);
    const handlePageChange = (p) => setCurrentPage(Math.max(1, Math.min(p, totalPages)));
    const currentItems = processed.slice((currentPage - 1) * perPage, currentPage * perPage);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Team Profiles</h1>
                    <p className="text-gray-400 text-sm font-medium">Manage your boutique team and public website profiles</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button 
                        onClick={() => navigate('/team/visuals')} 
                        variant="outline"
                        className="border-slate-300 text-slate-700 flex items-center gap-2 px-6 py-2.5 rounded-xl hover:scale-105 active:scale-95 transition-all font-bold group bg-white"
                    >
                        <Sparkles size={18} className="text-red-600 group-hover:animate-pulse" /> Edit Page Visuals
                    </Button>
                    <Button onClick={openCreate} className="bg-brand-red text-white flex items-center gap-2 px-6 py-2.5 rounded-xl shadow-lg shadow-red-100 hover:scale-105 active:scale-95 transition-all font-bold group">
                        <UserPlus size={18} className="group-hover:rotate-12 transition-transform" /> Add Team Member
                    </Button>
                </div>
            </div>

            <Card className="border border-slate-300 shadow-sm overflow-hidden bg-white rounded-3xl">
                <CardHeader className="bg-white border-b border-gray-50 p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search by name, role or email..."
                                className="pl-10 pr-4 py-2.5 w-full border border-slate-300 bg-gray-50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all font-medium"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <div className="relative min-w-[140px]">
                                <select
                                    className={selectCls}
                                    value={filterRole}
                                    onChange={(e) => setFilterRole(e.target.value)}
                                >
                                    <option value="All">All Roles</option>
                                    <option value="super_admin">Super Admin</option>
                                    <option value="admin">Admin</option>
                                    <option value="director">Director</option>
                                    <option value="manager">Manager</option>
                                    <option value="sales">Sales</option>
                                </select>
                                <ChevronDown size={12} className="absolute right-2.5 top-3.5 text-gray-400 pointer-events-none" />
                            </div>

                            <div className="relative min-w-[140px]">
                                <select
                                    className={selectCls}
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                >
                                    <option value="name:asc">Name A-Z</option>
                                    <option value="display_order:asc">Display Order</option>
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

                            <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-slate-300 gap-1">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-brand-red' : 'text-gray-400'}`}
                                >
                                    <List size={18} />
                                </button>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-brand-red' : 'text-gray-400'}`}
                                >
                                    <LayoutGrid size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24">
                            <Loader2 className="animate-spin text-brand-red mb-3" size={36} />
                            <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Synchronizing staff data...</p>
                        </div>
                    ) : currentItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="bg-gray-50 p-6 rounded-3xl mb-4 text-gray-200">
                                <Users size={56} />
                            </div>
                            <h3 className="text-lg font-black text-gray-900">No team members found</h3>
                            <p className="text-gray-400 text-sm mt-1 max-w-xs font-medium">Add your first team member to display them on the website.</p>
                            <Button onClick={openCreate} className="mt-6 bg-red-50 text-brand-red hover:bg-red-100 border border-red-100 font-black text-[10px] uppercase tracking-widest px-8">Add Member</Button>
                        </div>
                    ) : viewMode === 'list' ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50/50">
                                    <tr>
                                        <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Team Member & Role</th>
                                        <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Public Contact</th>
                                        <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {currentItems.map((member) => (
                                        <tr 
                                            key={member.id} 
                                            onClick={() => openEdit(member)}
                                            className="group even:bg-gray-100/40 hover:bg-gray-100/60 transition-colors cursor-pointer"
                                        >
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 border border-slate-300 shrink-0">
                                                        {member.photo_url ? (
                                                            <img 
                                                                src={resolveImageUrl(member.photo_url)} 
                                                                alt={member.name} 
                                                                className="w-full h-full object-cover" 
                                                                onError={(e) => {
                                                                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || 'U')}&size=100&background=F3F4F6&color=9CA3AF`;
                                                                }}
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                                <Globe size={16} />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="flex items-center text-sm font-black text-gray-900 leading-none mb-1">
                                                            {member.name}
                                                            {member.show_on_front_page && <Globe size={12} className="text-brand-red ml-2" title="Visible on Front Page" />}
                                                        </p>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`px-2.5 py-1 inline-flex text-[8px] font-black uppercase tracking-widest rounded-lg border-2 ${
                                                                (member.role === 'admin' || member.role === 'super_admin') ? 'bg-brand-red text-white border-brand-red' :
                                                                member.role === 'director' ? 'bg-slate-900 text-white border-slate-900' :
                                                                member.role === 'manager' ? 'bg-slate-800 text-white border-slate-800' :
                                                                    'bg-brand-red text-white border-brand-red'
                                                                }`}>
                                                                {member.title || roles.find(r => r.value === member.role)?.label || member.role?.replace('_', ' ')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex flex-col gap-2">
                                                    <div className="text-sm text-gray-500 font-bold flex items-center gap-2">
                                                        <Mail size={12} className="text-gray-300" />
                                                        {member.email}
                                                    </div>
                                                    <span className={`inline-flex px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-lg border w-fit ${member.is_active ? 'bg-green-50 text-green-600 border-green-100' : 'bg-gray-50 text-gray-400 border-gray-100'
                                                        }`}>
                                                        {member.is_active ? 'ACTIVE' : 'REVOKED'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex justify-end items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                                    <button onClick={() => openEdit(member)} className="p-2.5 text-gray-400 hover:text-brand-red hover:bg-red-50 rounded-xl transition-all" title="Edit Profile">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button onClick={() => deleteMember(member.id)} className="p-2.5 text-gray-400 hover:text-brand-red hover:bg-red-50 rounded-xl transition-all" title="Remove Access">
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
                        <div className="p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {currentItems.map((member) => (
                                <div key={member.id} className="bg-white border border-slate-300 rounded-[2rem] overflow-hidden group hover:shadow-2xl hover:border-transparent transition-all duration-500 flex flex-col">
                                    <div className="relative h-48 overflow-hidden bg-gray-50">
                                        {member.photo_url ? (
                                            <img 
                                                src={resolveImageUrl(member.photo_url)} 
                                                alt={member.name} 
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                                onError={(e) => {
                                                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || 'U')}&size=200&background=F3F4F6&color=9CA3AF`;
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-200">
                                                <Users size={48} />
                                            </div>
                                        )}
                                        <div className="absolute top-4 right-4 flex flex-col gap-2 transition-all translate-x-4 group-hover:translate-x-0">
                                            <button onClick={() => openEdit(member)} className="bg-white shadow-xl p-3 rounded-2xl text-gray-400 hover:text-brand-red transition-all hover:scale-110 active:scale-95">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => deleteMember(member.id)} className="bg-white shadow-xl p-3 rounded-2xl text-gray-400 hover:text-brand-red transition-all hover:scale-110 active:scale-95">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="p-6 flex flex-col flex-1">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border-2 ${
                                                (member.role === 'admin' || member.role === 'super_admin') ? 'bg-brand-red text-white border-brand-red' :
                                                member.role === 'director' ? 'bg-slate-900 text-white border-slate-900' :
                                                member.role === 'manager' ? 'bg-slate-800 text-white border-slate-800' :
                                                'bg-brand-red text-white border-brand-red'
                                            }`}>
                                                {member.title || member.role?.replace('_', ' ')}
                                            </span>
                                            {member.show_on_front_page && <Globe size={14} className="text-brand-red" title="Visible on Front Page" />}
                                        </div>
                                        <h3 className="text-lg font-black text-gray-900 leading-tight mb-1">
                                            {member.name}
                                        </h3>
                                        <p className="text-gray-400 text-xs font-bold mb-4">{member.email}</p>

                                        {member.bio && (
                                            <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed mb-6 flex-1 font-medium italic">
                                                &quot;{stripTags(member.bio)}&quot;
                                            </p>
                                        )}

                                        <div className="flex items-center gap-3 pt-4 border-t border-slate-300 mt-auto">
                                            <a href={`mailto:${member.email}`} className="p-2 text-gray-300 hover:text-brand-red hover:bg-red-50 rounded-xl transition-all" title={member.email}>
                                                <Mail size={16} />
                                            </a>
                                            {member.linkedin_url && (
                                                <a href={member.linkedin_url} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-300 hover:text-brand-red hover:bg-red-50 rounded-xl transition-all">
                                                    <Linkedin size={16} />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>

                {/* {processed.length > perPage && ( */}
                {processed.length > 0 && (
                    <CardContent className="bg-white border-t border-slate-300 p-6">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Page {currentPage} of {totalPages}</span>

                            <div className="flex items-center gap-2">
                                <button
                                    disabled={currentPage === 1}
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    className="p-3 border border-slate-300 rounded-2xl disabled:opacity-30 hover:bg-gray-50 transition-all text-gray-400"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <button
                                    disabled={currentPage === totalPages}
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    className="p-3 border border-slate-300 rounded-2xl disabled:opacity-30 hover:bg-gray-50 transition-all text-gray-400"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    </CardContent>
                )}
            </Card>
        </div>
    );
};

export default Team;
