import React, { useState, useEffect, useMemo } from 'react';
import { 
    HelpCircle, Plus, Search, Edit2, Trash2, Loader2, X, Check,
    Eye, EyeOff
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader } from '../components/Card';
import { Button } from '../components/Button';
import { showAlert, showConfirm } from '../utils/swal';
import RichTextEditor from '../components/RichTextEditor';

const FAQs = () => {
    const [faqs, setFaqs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentFaq, setCurrentFaq] = useState(null);
    const [formLoading, setFormLoading] = useState(false);

    const [formData, setFormData] = useState({
        question: '',
        answer: '',
        category: 'General',
        order_index: 0,
        is_published: true
    });

    useEffect(() => {
        fetchFaqs();
    }, []);

    const fetchFaqs = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('faqs')
                .select('*')
                .order('order_index', { ascending: true });

            if (error) {
                // If table doesn't exist yet, we'll handle it gracefully in the UI
                if (error.code === '42P01') {
                    setFaqs([]);
                } else {
                    throw error;
                }
            } else {
                setFaqs(data || []);
            }
        } catch (error) {
            console.error('Error fetching FAQs:', error);
            showAlert('Error', 'Failed to load FAQs', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (faq = null) => {
        if (faq) {
            setCurrentFaq(faq);
            setFormData({
                question: faq.question || '',
                answer: faq.answer || '',
                category: faq.category || 'General',
                order_index: faq.order_index || 0,
                is_published: faq.is_published !== false
            });
        } else {
            setCurrentFaq(null);
            setFormData({
                question: '',
                answer: '',
                category: 'General',
                order_index: faqs.length,
                is_published: true
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);

        try {
            if (currentFaq) {
                const { error } = await supabase
                    .from('faqs')
                    .update(formData)
                    .eq('id', currentFaq.id);
                if (error) throw error;
                showAlert('Success', 'FAQ updated successfully', 'success');
            } else {
                const { error } = await supabase
                    .from('faqs')
                    .insert([formData]);
                if (error) throw error;
                showAlert('Success', 'New FAQ added', 'success');
            }
            setIsModalOpen(false);
            fetchFaqs();
        } catch (error) {
            console.error('Error saving FAQ:', error);
            showAlert('Error', error.message || 'Failed to save FAQ. Does the table exist?', 'error');
        } finally {
            setFormLoading(false);
        }
    };

    const deleteFaq = async (id) => {
        const result = await showConfirm(
            'Delete FAQ?',
            'Are you sure you want to remove this FAQ? Information will be lost.'
        );

        if (!result.isConfirmed) return;

        try {
            const { error } = await supabase
                .from('faqs')
                .delete()
                .eq('id', id);

            if (error) throw error;
            showAlert('Deleted', 'FAQ removed successfully', 'success');
            fetchFaqs();
        } catch (error) {
            console.error('Error deleting FAQ:', error);
            showAlert('Error', 'Failed to delete FAQ', 'error');
        }
    };

    const stripHtml = (html) => {
        if (!html) return '';
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent || "";
    };

    const processedFaqs = useMemo(() => {
        return faqs.filter(faq =>
            faq.question?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            faq.answer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            faq.category?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [faqs, searchTerm]);

    const categories = Array.from(new Set(faqs.map(f => f.category))).filter(Boolean);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Help Center Management</h1>
                    <p className="text-gray-400 text-sm font-medium">Configure and update the Frequently Asked Questions</p>
                </div>
                <div className="flex items-center gap-2">
{/* 
                    <Button
                        onClick={fetchFaqs}
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
                        <Plus size={16} /> Add FAQ
                    </Button>
                </div>
            </div>

            <Card className="border border-slate-300 shadow-xl shadow-gray-200/50 rounded-3xl overflow-hidden bg-white">
                <CardHeader className="border-b border-gray-50 pb-4 px-8 pt-8">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-2.5 text-gray-300" size={16} />
                        <input
                            type="text"
                            placeholder="Search questions or categories..."
                            className="pl-9 pr-4 py-2.5 w-full border border-slate-300 bg-gray-50 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-red transition-all font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        {loading ? (
                            <div className="py-20 flex flex-col items-center">
                                <Loader2 className="animate-spin text-brand-red mb-4" size={48} />
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Negotiating with Knowledge Base...</p>
                            </div>
                        ) : faqs.length === 0 ? (
                            <div className="py-20 text-center flex flex-col items-center gap-4">
                                <HelpCircle size={48} className="text-gray-200" />
                                <p className="text-gray-400 font-bold text-lg">No FAQs found</p>
                                <p className="text-gray-300 text-sm max-w-xs mx-auto mb-4">You might need to initialize the &apos;faqs&apos; table in your Supabase database first.</p>
                                <Button onClick={() => handleOpenModal()} variant="outline">Create Initial FAQ</Button>
                            </div>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-100">
                                <thead className="bg-gray-50/50">
                                    <tr>
                                        <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Order</th>
                                        <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">FAQ Content</th>
                                        <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</th>
                                        <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                        <th className="px-8 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {processedFaqs.map((faq) => (
                                        <tr key={faq.id} className="hover:bg-gray-50/80 transition-colors group">
                                            <td className="px-8 py-4">
                                                <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-50 border border-slate-300 text-xs font-black text-gray-600">
                                                    {faq.order_index}
                                                </div>
                                            </td>
                                            <td className="px-8 py-4">
                                                <div className="max-w-md">
                                                    <h3 className="text-sm font-black text-gray-900 leading-tight mb-1">{faq.question}</h3>
                                                    <p className="text-xs text-gray-500 font-medium line-clamp-2">{stripHtml(faq.answer)}</p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-4">
                                                <span className="bg-red-50 text-brand-red text-[8px] font-black px-2 py-0.5 rounded-full uppercase border border-red-100">
                                                    {faq.category}
                                                </span>
                                            </td>
                                            <td className="px-8 py-4">
                                                {faq.is_published ? (
                                                    <span className="flex items-center gap-1.5 text-green-600 font-black text-[9px] uppercase tracking-widest bg-green-50 px-2 py-1 rounded-lg border border-green-100">
                                                        <Eye size={10} /> Published
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1.5 text-gray-400 font-black text-[9px] uppercase tracking-widest bg-gray-50 px-2 py-1 rounded-lg border border-slate-300">
                                                        <EyeOff size={10} /> Draft
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-8 py-4 text-right">
                                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleOpenModal(faq)}
                                                        className="p-2 text-gray-400 hover:text-brand-red hover:bg-red-50 rounded-xl transition-all"
                                                        title="Edit FAQ"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteFaq(faq.id)}
                                                        className="p-2 text-gray-400 hover:text-brand-red hover:bg-red-50 rounded-xl transition-all"
                                                        title="Delete FAQ"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-charcoal/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-300 flex flex-col">
                        <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-center justify-between z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-red-50 text-brand-red rounded-2xl">
                                    <HelpCircle size={20} />
                                </div>
                                <h2 className="text-xl font-black text-gray-900 tracking-tight">{currentFaq ? 'Modify FAQ' : 'New Intelligence Piece'}</h2>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2.5 text-gray-400 hover:text-brand-red hover:bg-red-50 rounded-2xl transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
                                    <div className="relative group">
                                        <input
                                            required
                                            list="faq-categories"
                                            type="text"
                                            className="w-full px-5 py-3.5 bg-gray-50 border-2 border-slate-300 rounded-2xl focus:border-brand-red focus:outline-none transition-all font-bold text-gray-800"
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            placeholder="e.g. Booking, Payment, General"
                                        />
                                        <datalist id="faq-categories">
                                            {categories.map(cat => <option key={cat} value={cat} />)}
                                            <option value="Booking" />
                                            <option value="Payment" />
                                            <option value="Travel" />
                                            <option value="Account" />
                                        </datalist>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Question</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full px-5 py-3.5 bg-gray-50 border-2 border-slate-300 rounded-2xl focus:border-brand-red focus:outline-none transition-all font-bold text-gray-800"
                                        value={formData.question}
                                        onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Detailed Answer</label>
                                    <div className="bg-white rounded-2xl border-2 border-slate-300 overflow-hidden">
                                        <RichTextEditor
                                            value={formData.answer}
                                            onChange={(content) => setFormData({ ...formData, answer: content })}
                                            placeholder="Provide a detailed answer to the question..."
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Display Order</label>
                                        <input
                                            type="number"
                                            className="w-full px-5 py-3.5 bg-gray-50 border-2 border-slate-300 rounded-2xl focus:border-brand-red focus:outline-none transition-all font-bold text-gray-800"
                                            value={formData.order_index}
                                            onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) })}
                                        />
                                    </div>
                                    <div className="flex items-end pb-1">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, is_published: !formData.is_published })}
                                            className={`flex items-center gap-3 w-full p-3.5 rounded-2xl border-2 transition-all ${formData.is_published
                                                ? 'bg-green-50/50 border-green-200 text-green-700'
                                                : 'bg-gray-50 border-slate-300 text-gray-400'
                                                }`}
                                        >
                                            <div className={`w-8 h-4 rounded-full relative transition-colors ${formData.is_published ? 'bg-green-500' : 'bg-gray-300'}`}>
                                                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${formData.is_published ? 'right-1' : 'left-1'}`}></div>
                                            </div>
                                            <span className="font-black text-[9px] uppercase tracking-widest">
                                                {formData.is_published ? 'Published' : 'Hidden'}
                                            </span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-gray-100 flex items-center justify-end gap-3">
                                <Button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    variant="outline"
                                    className="px-6 py-3 border-slate-300 text-gray-400 font-bold rounded-2xl uppercase tracking-widest text-[10px]"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={formLoading}
                                    className="bg-brand-red hover:bg-red-700 text-white px-8 py-3 rounded-2xl flex items-center shadow-lg shadow-red-100 transition-all font-black uppercase tracking-widest text-xs"
                                >
                                    {formLoading ? (
                                        <Loader2 className="animate-spin mr-2" size={18} />
                                    ) : (
                                        <Check className="mr-2" size={18} />
                                    )}
                                    {currentFaq ? 'Commit Update' : 'Initialize FAQ'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FAQs;
