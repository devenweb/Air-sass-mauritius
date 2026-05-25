'use client'

import React, { useState, useRef, useEffect } from 'react';
import { Mic, Send, MessageSquare, X, Loader2, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '@/contexts/SettingsContext';
import { cn } from '@/lib/utils';
import { useBrand } from '@/lib/brand';

export default function AIConcierge() {
    const { generalConfig: config } = useSettings();
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [recognition, setRecognition] = useState<any>(null);
    const { whatsapp } = useBrand();
    const whatsappNumber = whatsapp;

    useEffect(() => {
        if (typeof window !== 'undefined' && ('WebkitSpeechRecognition' in window || 'speechRecognition' in window)) {
            const SpeechRecognition = (window as any).WebkitSpeechRecognition || (window as any).speechRecognition;
            const rec = new SpeechRecognition();
            rec.continuous = false;
            rec.interimResults = false;
            rec.lang = 'en-US';

            rec.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setMessage(prev => (prev ? `${prev} ${transcript}` : transcript));
                setIsListening(false);
            };

            rec.onerror = () => {
                setIsListening(false);
            };

            rec.onend = () => {
                setIsListening(false);
            };

            setRecognition(rec);
        }
    }, []);

    const toggleListening = () => {
        if (!recognition) {
            alert('Voice recognition is not supported in your browser.');
            return;
        }

        if (isListening) {
            recognition.stop();
        } else {
            setIsListening(true);
            recognition.start();
        }
    };

    const handleSend = () => {
        if (!message.trim()) return;
        
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/\s+/g, '').replace('+', '')}?text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank');
        setMessage('');
        setIsOpen(false);
    };

    return (
        <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: 20, scale: 0.95, filter: 'blur(10px)' }}
                        className="mb-4 w-[350px] md:w-[400px] bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="bg-slate-900 p-6 text-white relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-red-600 rounded-full blur-3xl -mr-16 -mt-16 opacity-30"></div>
                            <div className="relative flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-red-600 flex items-center justify-center">
                                        <MessageSquare size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black uppercase tracking-widest">AI Booking Bot</h3>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Online & Ready</span>
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setIsOpen(false)}
                                    className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-6 bg-slate-50/50">
                            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm mb-4">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">How can I help?</p>
                                <p className="text-sm font-medium text-slate-900 leading-relaxed italic">
                                    &quot;I want to book a flight to Mauritius for 2 adults on June 15th...&quot;
                                </p>
                            </div>

                            <div className="relative group">
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Type or use the microphone..."
                                    className="w-full h-32 px-5 py-4 bg-white border-2 border-slate-100 rounded-3xl focus:border-red-600 outline-none font-bold text-sm text-slate-900 transition-all resize-none shadow-inner pr-12"
                                />
                                <button
                                    onClick={toggleListening}
                                    className={cn(
                                        "absolute right-4 bottom-4 w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                                        isListening ? "bg-red-600 text-white animate-pulse shadow-lg shadow-red-600/30" : "bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                    )}
                                >
                                    {isListening ? <Volume2 size={18} /> : <Mic size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-white border-t border-slate-50 flex gap-3">
                            <button
                                onClick={handleSend}
                                disabled={!message.trim()}
                                className="flex-1 py-4 bg-slate-950 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-red-600 transition-all disabled:opacity-30 shadow-xl shadow-slate-900/10 active:scale-[0.98]"
                            >
                                <Send size={14} />
                                Start AI Booking
                            </button>
                        </div>
                        <div className="px-6 py-3 bg-slate-50 flex items-center justify-center gap-2">
                             <div className="w-4 h-4">
                                <svg viewBox="0 0 24 24" className="w-full h-full fill-slate-400">
                                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.31.045-.698.059-1.126-.069-.258-.077-.585-.181-1.026-.363-1.871-.774-3.076-2.67-3.169-2.793-.093-.123-.756-.998-.756-1.996 0-.998.514-1.488.698-1.69.144-.158.389-.234.619-.234.072 0 .137.004.195.006.166.006.252.015.36.26.137.31.468 1.134.508 1.22.04.086.065.187.007.303-.058.115-.086.187-.173.288-.086.1-.18.223-.259.3-.086.086-.176.18-.076.353.1.173.443.731.95 1.182.653.581 1.203.761 1.375.847.173.086.273.072.374-.043.101-.115.432-.504.547-.677.115-.173.23-.144.389-.086.158.058 1.008.475 1.181.562.173.086.288.13.331.202.043.072.043.418-.101.823z"/>
                                </svg>
                             </div>
                             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Connects to WhatsApp Business</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-16 h-16 rounded-[2rem] flex items-center justify-center text-white shadow-2xl transition-all duration-500",
                    isOpen ? "bg-slate-900 rotate-90" : "bg-red-600 hover:bg-slate-950"
                )}
            >
                {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
                {!isOpen && (
                    <span className="absolute right-full mr-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                        AI Booking Bot
                    </span>
                )}
                {!isOpen && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: [0, 1.2, 1] }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center"
                    >
                         <div className="w-1 h-1 bg-white rounded-full animate-ping"></div>
                    </motion.div>
                )}
            </motion.button>
        </div>
    );
}
