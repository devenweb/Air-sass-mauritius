'use client'

import React from 'react'
import { Share2, Facebook, Twitter, Linkedin, Mail, Link as LinkIcon, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from './ui/Button'

type SocialShareProps = {
    url: string
    title: string
    description?: string
}

export default function SocialShare({ url, title, description }: SocialShareProps) {
    const [isOpen, setIsOpen] = React.useState(false)

    function copyLink() {
        navigator.clipboard.writeText(url)
        toast.success('Link copied to clipboard!')
        setIsOpen(false)
    }

    function shareOnFacebook() {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank')
    }

    function shareOnTwitter() {
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, '_blank')
    }

    function shareOnLinkedIn() {
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank')
    }

    function shareViaEmail() {
        window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(description || '')}%0A%0A${encodeURIComponent(url)}`
    }

    return (
        <div className="relative">
            <Button
                variant="outline"
                size="md"
                onClick={() => setIsOpen(!isOpen)}
                className="gap-2"
                aria-haspopup="true"
                aria-expanded={isOpen}
                aria-label="Open share menu"
            >
                <Share2 size={16} />
                Share
            </Button>

            {isOpen && (
                <>
                    <button
                        className="fixed inset-0 z-40 bg-black/5 cursor-default"
                        onClick={() => setIsOpen(false)}
                        aria-label="Close share menu"
                    />
                    <div className="absolute right-0 mt-3 w-72 bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 z-50 animate-in">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">Share this</h3>
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                                aria-label="Close menu"
                            >
                                <X size={14} />
                            </button>
                        </div>
                        <div className="space-y-3">
                            <button
                                onClick={shareOnFacebook}
                                className="w-full flex items-center gap-4 px-5 py-4 bg-[#1877F2] text-white rounded-2xl hover:opacity-90 transition-all font-bold text-xs"
                                aria-label="Share on Facebook"
                            >
                                <Facebook size={18} />
                                Facebook
                            </button>
                            <button
                                onClick={shareOnTwitter}
                                className="w-full flex items-center gap-4 px-5 py-4 bg-[#1DA1F2] text-white rounded-2xl hover:opacity-90 transition-all font-bold text-xs"
                                aria-label="Share on Twitter"
                            >
                                <Twitter size={18} />
                                Twitter (X)
                            </button>
                            <button
                                onClick={shareOnLinkedIn}
                                className="w-full flex items-center gap-4 px-5 py-4 bg-[#0A66C2] text-white rounded-2xl hover:opacity-90 transition-all font-bold text-xs"
                                aria-label="Share on LinkedIn"
                            >
                                <Linkedin size={18} />
                                LinkedIn
                            </button>
                            <button
                                onClick={shareViaEmail}
                                className="w-full flex items-center gap-4 px-5 py-4 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-600 transition-all font-bold text-xs"
                                aria-label="Share via Email"
                            >
                                <Mail size={18} />
                                Email
                            </button>
                            <button
                                onClick={copyLink}
                                className="w-full flex items-center gap-4 px-5 py-4 bg-red-600 text-white rounded-2xl hover:bg-slate-900 transition-all font-bold text-xs"
                                aria-label="Copy link to clipboard"
                            >
                                <LinkIcon size={18} />
                                Copy Link
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
