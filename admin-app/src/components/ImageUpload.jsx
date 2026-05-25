import React, { useState, useRef } from 'react';
import { Upload, Camera, X, Link as LinkIcon, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { resolveImageUrl, optimizeImage } from '../utils/image';
import { showAlert } from '../utils/swal';

/**
 * ImageUpload Component
 */
const ImageUpload = ({ 
    value, 
    onChange, 
    label, 
    folder = 'uploads', 
    bucket = 'bucket',
    aspectRatio = 'aspect-video',
    showUrlInput = true,
    placeholder = "Click to upload from PC or drag and drop"
}) => {
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileUpload = async (e) => {
        let file = e.target.files[0];
        if (!file) return;

        // Validation: File Type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
            showAlert('Invalid Type', 'Please upload a valid image (JPEG, PNG, or WEBP).', 'error');
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        setUploading(true);
        try {
            // AUTHORITATIVE OPTIMIZATION: Ensure files stay well below 2MB (Supabase limit)
            // We optimize if file > 1MB or always for consistency if requested
            const maxSize = 1 * 1024 * 1024; // 1MB threshold for optimization
            if (file.size > maxSize) {
                // Higher compression and slightly smaller max dimensions for reliability
                file = await optimizeImage(file, { maxWidth: 1600, quality: 0.7 });
            }

            const ext = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
            const filePath = `${folder}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // We return the storage path (including bucket) for consistency with our resolution utility
            onChange(filePath);
            showAlert('Success', 'Image uploaded and optimized successfully', 'success');
        } catch (error) {
            console.error('Upload error:', error);
            showAlert('Upload Failed', error.message || 'Error uploading image', 'error');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-4">
            {label && (
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    {label}
                </label>
            )}
            
            <div className="flex flex-col gap-4">
                <div 
                    className={`relative group/image w-full ${aspectRatio} rounded-2xl bg-gray-50 border border-slate-300 overflow-hidden flex items-center justify-center transition-all hover:border-brand-red/30`}
                >
                    {value ? (
                        <>
                            <img 
                                src={resolveImageUrl(value)} 
                                alt="Preview" 
                                className="w-full h-full object-cover transition-transform duration-500 group-hover/image:scale-105" 
                                onError={(e) => {
                                    e.target.src = "https://placehold.co/600x400/f3f4f6/9ca3af?text=Invalid+Image+URL";
                                }}
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/image:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                                <button 
                                    type="button" 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="mb-2 p-2 bg-white/20 hover:bg-white/40 rounded-full backdrop-blur-md transition-all active:scale-90"
                                >
                                    <Upload size={20} />
                                </button>
                                <span className="text-[10px] font-black uppercase tracking-widest">Update Image</span>
                            </div>
                            <button 
                                type="button" 
                                onClick={() => onChange('')}
                                className="absolute top-3 right-3 p-1.5 bg-red-600/90 text-white rounded-lg opacity-0 group-hover/image:opacity-100 transition-opacity hover:bg-red-700 active:scale-90"
                            >
                                <X size={14} />
                            </button>
                        </>
                    ) : (
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full h-full flex flex-col items-center justify-center text-gray-300 cursor-pointer hover:bg-gray-100 transition-colors group/upload"
                        >
                            <Camera size={40} className="mb-2 group-hover/upload:text-brand-red/40 transition-colors" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-center px-8 text-gray-400">
                                {placeholder}
                            </span>
                        </div>
                    )}
                    
                    {uploading && (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-20">
                            <Loader2 className="animate-spin text-brand-red" size={24} />
                        </div>
                    )}
                </div>

                {showUrlInput && (
                    <div className="relative">
                        <label className="block text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1.5 ml-1">
                            Or paste a direct URL
                        </label>
                        <div className="relative">
                            <input 
                                type="text"
                                placeholder="https://..."
                                className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red transition-all text-xs font-mono"
                                value={value} 
                                onChange={(e) => onChange(e.target.value)}
                            />
                            <LinkIcon size={14} className="absolute right-3.5 top-3 text-gray-300" />
                        </div>
                    </div>
                )}
            </div>

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileUpload}
            />
        </div>
    );
};

export default ImageUpload;
