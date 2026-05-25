'use client'

import React from 'react'
import { MapPin, Phone, Mail, MessageCircle, Send, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import Image from 'next/image'
import { resolveImageUrl } from '@/lib/image'
import { useSettings } from '@/contexts/SettingsContext'
import { usePageContent } from '@/hooks/usePageContent'
import { motion } from 'framer-motion'
import { useBrand } from '@/lib/brand'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

const supabase = createClient()

const sanitizeString = (val: string) => {
    if (!val) return val;
    return val.replace(/<[^>]*>?/gm, '').trim();
}

const contactSchema = z.object({
    name: z.string().transform(sanitizeString).pipe(z.string().min(2, 'Name must be at least 2 characters')),
    email: z.string().email('Please enter a valid email address').transform(s => s.toLowerCase().trim()),
    phone: z.string().transform(sanitizeString).pipe(z.string().min(8, 'Please enter a valid phone number')),
    subject: z.string().transform(sanitizeString).pipe(z.string().min(3, 'Please enter a subject')),
    message: z.string().transform(sanitizeString).pipe(z.string().min(10, 'Message must be at least 10 characters'))
})

type ContactFormData = z.infer<typeof contactSchema>

export default function ContactClient() {
    const { generalConfig: settings } = useSettings()
    const labels = (settings?.ui_labels || {}) as Record<string, string>
    
    const { 
        register, 
        handleSubmit, 
        reset,
        formState: { errors, isSubmitting } 
    } = useForm<ContactFormData>({
        resolver: zodResolver(contactSchema),
        defaultValues: {
            name: '',
            email: '',
            phone: '',
            subject: '',
            message: ''
        }
    })

    const { content: rawContent, loading: cmsLoading } = usePageContent('contact');
    const [content, setContent] = React.useState<any>({})

    React.useEffect(() => {
        if (rawContent && Object.keys(rawContent).length > 0) {
            const raw = rawContent as any;
            setContent({
                hero: raw.section_1_hero,
                info: {
                    offices: raw.section_2_concierge?.offices || raw.directions?.locations,
                    support: raw.section_3_support?.methods
                },
                directions: raw.directions
            })
        }
    }, [rawContent])

    const hero = content?.hero || {
        badge: labels.contact_hero_badge || 'Get In Touch',
        title: `${labels.contact_hero_title_1 || "We're Here To"} <br /><span class="text-red-500 italic">${labels.contact_hero_title_2 || "Help You."}</span>`,
        image: "https://images.unsplash.com/photo-1423666639041-f56000c27a9a"
    }

    async function onSubmit(data: ContactFormData) {
        try {
            const { error } = await supabase
                .from('inquiries')
                .insert([{
                    ...data,
                    status: 'unread'
                }])

            if (error) throw error
            
            try {
                const { notifyInquiryReceived } = await import('@/lib/emailActions')
                await notifyInquiryReceived({
                    email: data.email,
                    customerName: data.name,
                    customerPhone: data.phone,
                    destination: 'General Inquiry',
                    departureDate: 'N/A',
                    adults: 'N/A',
                    children: 'N/A',
                    message: data.message
                })
            } catch (e) {
                console.error('Email notification failed but inquiry saved:', e)
            }

            toast.success(labels.contact_success_message || 'Message sent! We\'ll get back to you soon.')
            reset()
        } catch (error) {
            console.error('Error sending message:', error)
            toast.error(labels.contact_error_message || 'Failed to send message. Please try again.')
        }
    }

    const { whatsappFormatted, contactPhone: brandPhone } = useBrand()
    
    const info = content?.info || {
        offices: [
            { 
                title: settings?.office1Title || 'Port Louis Office (Head Office)', 
                address: settings?.office1Address || 'Ground Floor, Newton Tower, Port Louis, Mauritius' 
            },
            { 
                title: settings?.office2Title || 'Ebene Office', 
                address: settings?.office2Address || 'Ground Floor, 57 Ebene Mews, Cybercity, Ebene, Mauritius' 
            }
        ],
        support: [
            { type: labels.direct_line_label || 'Direct Line', value: brandPhone || settings?.contactPhone || '+230 212 4070', icon: 'phone' },
            { type: labels.whatsapp_concierge_label || 'WhatsApp Concierge', value: whatsappFormatted || settings?.whatsappNumber1 || '+230 5509 7702', icon: 'whatsapp' },
            { type: labels.email_inquiry_label || 'Email Inquiry', value: settings?.contactEmail || 'reservation@travellounge.mu', icon: 'email' }
        ]
    }

    const directions = content?.directions || {
        badge: labels.directions_badge || 'Directions',
        title: labels.directions_title || 'Visit Our Offices',
        description: labels.directions_desc || 'Find us easily with the interactive maps below. We look forward to welcoming you to our premises.'
    }

    const DEFAULT_MAP_PL = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3744.113063529362!2d57.50033107593121!3d-20.161868345719365!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x217c504bb0f6d357%3A0xf69a19c7f9385d56!2sNewton%20Tower%2C%20Port%20Louis!5e0!3m2!1sen!2smu!4v1714721455581!5m2!1sen!2smu'
    const DEFAULT_MAP_EB = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3742.6625807185386!2d57.481177675933!3d-20.24180474771743!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x217c5b1b584a5b1b%3A0x584a5b1b584a5b1b!2sTravel%20Lounge!5e0!3m2!1sen!2smu!4v1714723532151!5m2!1sen!2smu'

    const map1 = settings?.office1MapUrl || DEFAULT_MAP_PL
    const map2 = settings?.office2MapUrl || DEFAULT_MAP_EB

    const getIcon = (iconName: string) => {
        switch (iconName) {
            case 'phone': return <Phone size={24} />
            case 'whatsapp': return <MessageCircle size={24} />
            case 'email': return <Mail size={24} />
            default: return <Phone size={24} />
        }
    }

    const getIconBg = (iconName: string) => {
        switch (iconName) {
            case 'phone': return 'bg-slate-900 group-hover:bg-red-600'
            case 'whatsapp': return 'bg-green-600 group-hover:scale-110'
            case 'email': return 'bg-red-600 group-hover:scale-110'
            default: return 'bg-slate-900'
        }
    }

    return (
        <div className="min-h-screen bg-white">
            <div className="relative py-8 w-full overflow-hidden bg-slate-900">
                <Image
                    src={resolveImageUrl(hero.image)}
                    alt="Contact Us"
                    fill
                    className="object-cover opacity-60"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
                
                <div className="max-w-7xl mx-auto px-6 relative z-10 h-full flex flex-col items-center justify-center text-center">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-4xl"
                    >
                        <h1 
                            className="text-2xl md:text-4xl font-black text-white leading-tight uppercase tracking-tight"
                            dangerouslySetInnerHTML={{ __html: hero.title.replace('<br />', ' ').replace('<br/>', ' ') }}
                        />
                    </motion.div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-6">
                <Breadcrumbs 
                    items={[
                        { label: 'Contact', active: true }
                    ]}
                    className="py-0 mb-6"
                />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <section>
                            <h2 className="text-[10px] font-black text-red-600 uppercase tracking-[0.4em] mb-4">{labels.contact_office_badge || 'Concierge'}</h2>
                            <h3 className="text-3xl font-black text-slate-900 mb-6 leading-tight">{labels.contact_office_title || 'Our Address'}</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {info.offices.map((office: any, idx: number) => (
                                    <div key={idx} className="space-y-3 p-5 bg-slate-50 rounded-[2rem] border border-slate-200">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-red-600 shadow-sm mb-2">
                                            <MapPin size={20} />
                                        </div>
                                        <h4 className="font-black text-lg text-slate-900">{office.title}</h4>
                                        <p className="text-slate-500 font-medium leading-relaxed text-sm">
                                            {office.address}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section>
                            <h2 className="text-[10px] font-black text-red-600 uppercase tracking-[0.4em] mb-4">{labels.contact_support_badge || 'Support'}</h2>
                            <div className="grid grid-cols-1 gap-6">
                                {info.support.map((item: any, idx: number) => {
                                    const href = item.icon === 'email' ? `mailto:${item.value}` : 
                                                 item.icon === 'whatsapp' ? `https://wa.me/${item.value.replace(/\D/g, '')}` : 
                                                 `tel:${item.value}`
                                    
                                    return (
                                        <a key={idx} href={href} className="group flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-all duration-300">
                                            <div className={`w-12 h-12 text-white rounded-xl flex items-center justify-center transition-all ${getIconBg(item.icon)}`}>
                                                {getIcon(item.icon)}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.type}</p>
                                                <p className="text-xl font-black text-slate-900">{item.value}</p>
                                            </div>
                                        </a>
                                    )
                                })}
                            </div>
                        </section>
                    </div>

                    <div>
                        <div className="sticky top-24">
                            <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)]">
                                <h3 className="text-2xl font-black text-slate-900 mb-6 tracking-tight">{labels.contact_form_title || 'Direct Inquiry'}</h3>
                                
                                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                                     <div className="space-y-2">
                                         <Input
                                             label={labels.label_full_name || 'Full Name'}
                                             {...register('name')}
                                             error={errors.name?.message}
                                             placeholder={labels.placeholder_name || 'Enter your name'}
                                         />
                                         {errors.name && (
                                             <p className="text-red-500 text-[10px] font-black uppercase flex items-center gap-1 ml-2">
                                                 <AlertCircle size={10} /> {errors.name.message}
                                             </p>
                                         )}
                                     </div>
                                     
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                         <div className="space-y-2">
                                             <Input
                                                 label={labels.label_email || 'Email Address'}
                                                 type="email"
                                                 {...register('email')}
                                                 error={errors.email?.message}
                                                 placeholder={labels.placeholder_email || 'your@email.com'}
                                             />
                                             {errors.email && (
                                                 <p className="text-red-500 text-[10px] font-black uppercase flex items-center gap-1 ml-2">
                                                     <AlertCircle size={10} /> {errors.email.message}
                                                 </p>
                                             )}
                                         </div>
                                         <div className="space-y-2">
                                             <Input
                                                 label={labels.label_phone || 'Phone Number'}
                                                 type="tel"
                                                 {...register('phone')}
                                                 error={errors.phone?.message}
                                                 placeholder={labels.placeholder_phone || '+230'}
                                             />
                                             {errors.phone && (
                                                 <p className="text-red-500 text-[10px] font-black uppercase flex items-center gap-1 ml-2">
                                                     <AlertCircle size={10} /> {errors.phone.message}
                                                 </p>
                                             )}
                                         </div>
                                     </div>

                                     <div className="space-y-2">
                                         <Input
                                             label={labels.label_subject || 'Subject'}
                                             {...register('subject')}
                                             error={errors.subject?.message}
                                             placeholder={labels.placeholder_subject || 'What can we help you with?'}
                                         />
                                         {errors.subject && (
                                             <p className="text-red-500 text-[10px] font-black uppercase flex items-center gap-1 ml-2">
                                                 <AlertCircle size={10} /> {errors.subject.message}
                                             </p>
                                         )}
                                     </div>

                                     <div className="space-y-2">
                                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">{labels.label_message || 'Message'}</label>
                                          <textarea
                                              {...register('message')}
                                              rows={4}
                                              className={`w-full px-5 py-4 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600/50 focus:bg-white font-bold text-sm transition-all resize-none ${errors.message ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200'}`}
                                              placeholder={labels.placeholder_message || 'Tell us about your travel plans...'}
                                          />
                                         {errors.message && (
                                             <p className="text-red-500 text-[10px] font-black uppercase flex items-center gap-1 ml-2">
                                                 <AlertCircle size={10} /> {errors.message.message}
                                             </p>
                                         )}
                                     </div>

                                     <Button
                                         size="xl"
                                         type="submit"
                                         isLoading={isSubmitting}
                                         className="w-full shadow-2xl shadow-red-600/20"
                                     >
                                         <Send size={18} className="mr-2" /> {labels.button_send_message || 'Send Message'}
                                     </Button>

                                    <p className="text-center text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                                        {labels.contact_response_time || 'Response time: < 24 Hours'}
                                    </p>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 space-y-6">
                    <div className="text-center max-w-2xl mx-auto mb-6">
                        <h2 className="text-[10px] font-black text-red-600 uppercase tracking-[0.4em] mb-4">{directions.badge}</h2>
                        <h3 className="text-3xl font-black text-slate-900 mb-4">{directions.title}</h3>
                        <p className="text-slate-500 font-medium text-base">{directions.description}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div className="bg-slate-50 rounded-[2rem] overflow-hidden border border-slate-200 h-[350px] relative group shadow-xl shadow-slate-200/50">
                                <iframe 
                                    src={map1}
                                    width="100%" 
                                    height="100%" 
                                    style={{ border: 0 }} 
                                    allowFullScreen 
                                    loading="lazy" 
                                    referrerPolicy="no-referrer-when-downgrade"
                                    className="transition-all duration-1000"
                                />
                                <div className="absolute top-6 left-6">
                                    <span className="bg-white/90 backdrop-blur px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">{labels.office1_tag || 'Main Branch'}</span>
                                </div>
                            </div>
                             <div className="px-4">
                                 <h4 className="font-black text-xl text-slate-900 mb-1">{info.offices[0]?.title || ''}</h4>
                                 <p className="text-slate-500 font-medium leading-relaxed text-sm">{info.offices[0]?.address || ''}</p>
                             </div>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-slate-50 rounded-[2rem] overflow-hidden border border-slate-200 h-[350px] relative group shadow-xl shadow-slate-200/50">
                                <iframe 
                                    src={map2}
                                    width="100%" 
                                    height="100%" 
                                    style={{ border: 0 }} 
                                    allowFullScreen 
                                    loading="lazy" 
                                    referrerPolicy="no-referrer-when-downgrade"
                                    className="transition-all duration-1000"
                                />
                                <div className="absolute top-6 left-6">
                                    <span className="bg-white/90 backdrop-blur px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">{labels.office2_tag || 'Cybercity Office'}</span>
                                </div>
                            </div>
                             <div className="px-4">
                                 <h4 className="font-black text-xl text-slate-900 mb-1">{info.offices[1]?.title || ''}</h4>
                                 <p className="text-slate-500 font-medium leading-relaxed text-sm">{info.offices[1]?.address || ''}</p>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
