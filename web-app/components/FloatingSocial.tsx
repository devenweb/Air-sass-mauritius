'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Instagram, Facebook, Mail, Share2, X } from 'lucide-react';
import { useBrand } from '@/lib/brand';

export default function FloatingSocial() {
  const { isLeisure, email, whatsapp, instagram, facebook } = useBrand();
  const [isOpen, setIsOpen] = useState(true);

  const socialLinks = [
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      href: `https://wa.me/${whatsapp}`,
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600'
    },
    {
      name: 'Instagram',
      icon: Instagram,
      href: `https://www.instagram.com/${instagram}`,
      color: 'bg-pink-600',
      hoverColor: 'hover:bg-pink-700'
    },
    {
      name: 'Facebook',
      icon: Facebook,
      href: `https://facebook.com/${facebook}`,
      color: 'bg-blue-600',
      hoverColor: 'hover:bg-blue-700'
    },
    {
      name: 'Email',
      icon: Mail,
      href: `mailto:${email}`,
      color: 'bg-indigo-600',
      hoverColor: 'hover:bg-indigo-700'
    }
  ];

  return (
    <div className="fixed bottom-24 right-4 z-[100] flex flex-col items-end gap-1.5">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.8 }}
            className="flex flex-col gap-1.5 mb-1"
          >
            {socialLinks.map((social, index) => (
              <motion.a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center justify-center p-0.5 rounded-xl shadow-lg backdrop-blur-md bg-white/90 dark:bg-slate-800/90 border border-slate-100 dark:border-slate-700 group transition-all hover:scale-110 active:scale-95`}
                title={social.name}
              >
                <div className={`${social.color} ${social.hoverColor} p-1.5 rounded-lg text-white shadow-md transition-colors`}>
                  <social.icon size={16} />
                </div>
              </motion.a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.90 }}
        className={`p-2.5 rounded-full shadow-xl transition-all flex items-center justify-center ${
          isOpen 
            ? 'bg-slate-900 text-white rotate-90' 
            : 'bg-primary text-white shadow-primary/20'
        }`}
        aria-label="Social media menu"
      >
        {isOpen ? <X size={18} /> : <Share2 size={18} />}
      </motion.button>
    </div>
  );
}
