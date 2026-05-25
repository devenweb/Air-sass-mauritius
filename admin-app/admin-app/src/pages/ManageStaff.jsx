import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Linkedin, Loader2, ArrowLeft, Save, Info, CheckCircle, XCircle, Upload, User, Eye, EyeOff
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Card, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { showAlert } from '../utils/swal';
import RichTextEditor from '../components/RichTextEditor';
import { optimizeImage, resolveImageUrl } from '../utils/image';

const BUCKET = 'bucket';
const FOLDER = 'staff';

const ManageStaff = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [pageLoading, setPageLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    const isEdit = !!id;

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


    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        role: 'staff',
        title: 'Sales Consultant',
        name: '',
        bio: '',
        photo_url: '',
        linkedin_url: '',
        is_active: true,
        show_on_front_page: true,
        display_order: 0
    });    useEffect(() => {
        if (isEdit) {
            fetchMember();
        }
    }, [id]);


    const fetchMember = async () => {
        setPageLoading(true);
        try {
            const { data, error } = await supabase
                .from('admins')
                .select('id, username, email, role, title, name, bio, photo_url, linkedin_url, is_active, show_on_front_page, display_order')
                .eq('id', id)
                .single();

            if (error) throw error;
            if (data) {
                setFormData({
                    username: data.username || '',
                    email: data.email || '',
                    password: '',
                    role: data.role || 'staff',
                    title: data.title || '',
                    name: data.name || data.username || '',
                    bio: data.bio || '',
                    photo_url: data.photo_url || '',
                    linkedin_url: data.linkedin_url || '',
                    is_active: data.is_active ?? true,
                    show_on_front_page: data.show_on_front_page ?? true,
                    display_order: data.display_order || 0
                });
            }
        } catch (error) {
            console.error('Error fetching staff member:', error);
            showAlert('Error', 'Failed to load staff identity', 'error');
            navigate('/team');
        } finally {
            setPageLoading(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            let fileToUpload = file;
            
            // Auto-optimize images if over 1.5MB or just to be safe
            if (file.size > 1.5 * 1024 * 1024) {
                const optimized = await optimizeImage(file);
                if (optimized) {
                    fileToUpload = optimized;
                    // console.log(`Optimized profile photo from ${(file.size / 1024 / 1024).toFixed(2)}MB to ${(fileToUpload.size / 1024 / 1024).toFixed(2)}MB`);
                }
            }

            const ext = fileToUpload.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
            const filePath = `${FOLDER}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from(BUCKET)
                .upload(filePath, fileToUpload);

            if (uploadError) throw uploadError;

            // Save the relative path (including folder) instead of full URL for database consistency
            setFormData(prev => ({ ...prev, photo_url: filePath }));
            showAlert('Success', 'Profile photo updated', 'success');
        } catch (error) {
            console.error('Upload error:', error);
            showAlert('Upload Failed', error.message || 'Error uploading photo', 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            // Role Mapping Logic based on Title
            const finalTitle = formData.title;
            let calculatedRole = formData.role || 'staff';
            if (finalTitle === 'Managing Director' || finalTitle === 'Director') {
                calculatedRole = 'director';
            } else if (finalTitle === 'Manager') {
                calculatedRole = 'manager';
            } else if (finalTitle === 'Sales Consultant') {
                calculatedRole = 'sales';
            } else if (finalTitle === 'Accountant') {
                calculatedRole = 'accountant';
            }

            // Filter non-database fields from formData
            const { password, ...payloadData } = formData;
            const payload = { 
                ...payloadData, 
                title: finalTitle,
                email: formData.email || `${formData.name.toLowerCase().replace(/\s+/g, '.')}@travellounge.mu`,
                role: calculatedRole,
                updated_at: new Date().toISOString() 
            };

            // console.log('Saving staff payload:', payload);

            if (isEdit) {
                const { error } = await supabase
                    .from('admins')
                    .update(payload)
                    .eq('id', id);
                if (error) throw error;
                showAlert('Success', 'Staff identity has been updated', 'success');
            } else {
                // Auto-generate username for new staff
                const finalPayload = {
                    ...payload,
                    username: payload.username || payload.email?.split('@')[0] || `user_${Math.random().toString(36).substring(7)}`,
                    created_at: new Date().toISOString()
                };

                const { error } = await supabase
                    .from('admins')
                    .insert([finalPayload]);
                if (error) throw error;
                showAlert('Success', 'New staff member has been added to the team', 'success');
            }
            navigate('/team');
        } catch (error) {
            console.error('Error saving staff:', error);
            showAlert('Operation Failed', error.message || 'Failed to save staff identity. This may be due to permission restrictions or data conflicts.', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (pageLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-brand-red mb-4" size={48} />
                <p className="text-gray-500 font-bold animate-pulse uppercase tracking-[0.2em] text-xs">Synchronizing Identity Data...</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigate('/team')}
                    className="group flex items-center gap-3 text-gray-400 hover:text-brand-red transition-all font-black uppercase tracking-widest text-[10px]"
                >
                    <div className="p-2 border border-slate-300 rounded-xl group-hover:bg-red-50 group-hover:border-red-100 transition-all">
                        <ArrowLeft size={16} />
                    </div>
                    Back to Team Portal
                </button>
                <div className="text-right">
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                        {isEdit ? 'Edit Identity' : 'Provision New Staff'}
                    </h1>
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">
                        {isEdit ? `Employee UID: ${id.slice(0, 8)}...` : 'Global Identity Registry'}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-brand-red to-red-400 rounded-3xl blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
                    <Card className="relative bg-white border border-slate-300 shadow-xl shadow-gray-200/50 rounded-3xl overflow-hidden">
                        <div className="h-32 bg-brand-charcoal relative overflow-hidden">
                            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                            <div className="absolute inset-0 bg-gradient-to-r from-brand-red/20 to-transparent"></div>
                        </div>
                        <CardContent className="px-10 pb-10 relative">
                            <div className="flex flex-col md:flex-row items-end gap-8 -mt-16">
                                <div className="relative">
                                    <div className="w-40 h-40 rounded-3xl border-[6px] border-white shadow-2xl bg-gray-100 overflow-hidden group/photo relative">
                                        {formData.photo_url ? (
                                            <img
                                                src={resolveImageUrl(formData.photo_url)}
                                                alt={formData.name}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover/photo:scale-110"
                                                onError={(e) => {
                                                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || 'U')}&size=200&background=F3F4F6&color=9CA3AF`;
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                                                <User size={48} />
                                                <span className="text-[8px] font-black uppercase mt-2">No Photo</span>
                                            </div>
                                        )}
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="absolute inset-0 bg-black/40 opacity-0 group-hover/photo:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer"
                                        >
                                            <Upload size={24} className="mb-2" />
                                            <span className="text-[8px] font-black uppercase">Change Photo</span>
                                        </div>
                                        {uploading && (
                                            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                                <Loader2 size={24} className="animate-spin text-brand-red" />
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleFileUpload}
                                        />
                                    </div>
                                    <div className={`absolute bottom-2 -right-2 p-1.5 rounded-2xl shadow-lg border-4 border-white ${formData.is_active ? 'bg-green-500' : 'bg-gray-400'}`}>
                                        {formData.is_active ? <CheckCircle size={14} className="text-white" /> : <XCircle size={14} className="text-white" />}
                                    </div>
                                </div>

                                <div className="flex-1 pb-2">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">{formData.name || "Untitled Identity"}</h2>
                                        <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border ${formData.role === 'director' ? 'bg-red-50 text-brand-red border-red-100' : 'bg-gray-50 text-gray-500 border-slate-300'}`}>
                                            {roles.find(r => r.value === formData.role)?.label || formData.role}
                                        </span>
                                    </div>
                                    <p className="text-gray-400 font-bold text-sm italic">{formData.email || 'No email assigned'}</p>
                                </div>

                                <div className="flex gap-3 pb-2">
                                    <Button
                                        type="submit"
                                        disabled={saving || uploading}
                                        className="bg-brand-red text-white px-8 py-3 rounded-2xl shadow-xl shadow-red-100 flex items-center gap-2 font-black uppercase tracking-widest text-[10px] hover:scale-105 active:scale-95 transition-all outline-none border-none ring-0 focus:ring-0 active:ring-0"
                                    >
                                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                        {isEdit ? 'Update Identity' : 'Provision Staff'}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                    <div className="lg:col-span-3 space-y-8">
                        <section className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-300 space-y-8">
                            <h3 className="flex items-center gap-2 text-xs font-black text-gray-900 uppercase tracking-[0.2em] mb-4">
                                <User size={16} className="text-brand-red" /> Professional Narrative
                            </h3>
                            <div className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Full Legal Name</label>
                                            <input
                                                type="text" required
                                                className="w-full px-6 py-4 bg-gray-50 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-red transition-all font-black text-xl text-gray-900"
                                                value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                placeholder="Full Name"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Professional Email</label>
                                            <input
                                                type="email"
                                                className="w-full px-6 py-4 bg-gray-50 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-red transition-all font-bold text-sm text-gray-900"
                                                value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                placeholder="Auto-generated if left blank"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Professional Title</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full px-6 py-4 bg-gray-50 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-red transition-all font-black text-xl text-gray-900"
                                            value={formData.title} 
                                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                                            placeholder="e.g. Sales Executive"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">LinkedIn Profile</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-red transition-all font-bold text-sm text-gray-900"
                                                value={formData.linkedin_url} onChange={e => setFormData({ ...formData, linkedin_url: e.target.value })}
                                                placeholder="linkedin.com/in/..."
                                            />
                                            <Linkedin size={18} className="absolute left-4 top-4 text-red-600" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Organization Priority Order</label>
                                        <input
                                            type="number"
                                            className="w-full px-6 py-4 bg-gray-50 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-red transition-all font-bold text-sm text-gray-900"
                                            value={formData.display_order} onChange={e => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, show_on_front_page: !formData.show_on_front_page })}
                                        className={`flex items-center justify-between px-6 py-4 rounded-2xl border transition-all ${formData.show_on_front_page
                                            ? 'bg-red-50 border-red-200 text-brand-red'
                                            : 'bg-gray-50 border-slate-200 text-gray-400 opacity-60'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            {formData.show_on_front_page ? <Eye size={18} /> : <EyeOff size={18} />}
                                            <span className="text-[10px] font-black uppercase tracking-widest">Show on Public Team Page</span>
                                        </div>
                                        {formData.show_on_front_page ? <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div> : <div className="w-2 h-2 rounded-full bg-gray-400"></div>}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                                        className={`flex items-center justify-between px-6 py-4 rounded-2xl border transition-all ${formData.is_active
                                            ? 'bg-green-50 border-green-200 text-green-700'
                                            : 'bg-gray-50 border-slate-200 text-gray-400 opacity-60'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            {formData.is_active ? <CheckCircle size={18} /> : <XCircle size={18} />}
                                            <span className="text-[10px] font-black uppercase tracking-widest">Active Profile Status</span>
                                        </div>
                                        <span className="text-[8px] font-black uppercase tracking-widest opacity-60">
                                            {formData.is_active ? 'ACTIVE' : 'INACTIVE'}
                                        </span>
                                    </button>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">Professional Bio / Mission</label>
                                    <RichTextEditor
                                        value={formData.bio}
                                        onChange={(content) => setFormData({ ...formData, bio: content })}
                                        placeholder="A detailed narrative about the employee's role and contributions..."
                                    />
                                </div>
                            </div>
                        </section>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <section className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-300 space-y-6">
                                <h3 className="flex items-center gap-2 text-xs font-black text-gray-900 uppercase tracking-[0.2em] mb-4">
                                    <CheckCircle size={16} className="text-brand-red" /> Recent Activity
                                </h3>
                                <StaffActivities adminId={id} />
                            </section>

                            <section className="bg-red-50 p-8 rounded-[2rem] border border-red-100 flex items-start gap-4 h-fit">
                                <div className="p-3 bg-white rounded-2xl text-brand-red shadow-sm shrink-0">
                                    <Info size={20} />
                                </div>
                                <div className="font-black">
                                    <h4 className="text-[10px] text-red-900 uppercase tracking-widest mb-1">Profile Integrity</h4>
                                    <p className="text-[10px] text-red-700 leading-relaxed">
                                        Staff profiles are published immediately to the boutique website. Use the &apos;Show on Public Team Page&apos; toggle to hide sensitive or incomplete profiles.
                                    </p>
                                </div>
                            </section>
                        </div>
                    </div>

                <div className="flex justify-end gap-4 p-8 bg-gray-50/50 rounded-3xl border border-slate-300 border-dashed">
                    <button
                        type="button"
                        onClick={() => navigate('/team')}
                        className="px-8 py-3 text-[10px] uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-all font-black"
                    >
                        Cancel
                    </button>
                    <Button
                        type="submit"
                        disabled={saving || uploading}
                        className="bg-brand-red text-white px-12 py-4 rounded-2xl shadow-xl shadow-red-100 flex items-center gap-3 font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all outline-none border-none ring-0 focus:ring-0 active:ring-0"
                    >
                        {saving && <Loader2 size={16} className="animate-spin" />}
                        {isEdit ? 'Update Staff' : 'Create Staff'}
                    </Button>
                </div>
            </form>
        </div>
    );
};

const StaffActivities = ({ adminId }) => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (adminId) fetchActivities();
    }, [adminId]);

    const fetchActivities = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('editorial_posts')
                .select('id, title, status, created_at')
                .eq('author_id', adminId)
                .order('created_at', { ascending: false })
                .limit(5);

            if (!error) setActivities(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="flex items-center gap-2 text-gray-400 text-[10px] font-black uppercase"><Loader2 size={12} className="animate-spin" /> Fetching Log...</div>;
    
    if (activities.length === 0) return <div className="text-gray-400 text-[10px] font-black uppercase italic">No documented system activities found for this identity.</div>;

    return (
        <div className="space-y-3">
            {activities.map(act => (
                <div key={act.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-slate-300 border-dashed">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-xl text-brand-red shadow-sm border border-red-50">
                            <Save size={14} />
                        </div>
                        <div>
                            <p className="text-xs font-black text-gray-900 line-clamp-1">{act.title}</p>
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Authored Editorial Post • {new Date(act.created_at).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-lg border ${act.status === 'published' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                        {act.status}
                    </span>
                </div>
            ))}
        </div>
    );
};

export default ManageStaff;
