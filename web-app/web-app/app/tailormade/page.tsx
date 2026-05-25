'use client'

import React, { useState } from 'react';
import Image from 'next/image';
import { 
  CheckCircle2,
  Plus,
  Minus,
  Users,
  Calendar,
  Mail,
  Info,
  ShieldOff,
  MapPin,
  MessageSquare,
  Utensils
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { resolveImageUrl } from '@/lib/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { toast } from 'sonner';
import { DatePicker } from '@/components/ui/DatePicker';
import { parseISO, format } from 'date-fns';
import { useSettings } from '@/contexts/SettingsContext';
import { usePageContent } from '@/hooks/usePageContent';
import HeroBanner from '@/components/HeroBanner';
import { useBrand } from '@/lib/brand';

interface PageContent {
    section_1_hero?: {
        badge: string
        title: string
        image: string
    }
}

export default function TailorMadePage() {
  const { generalConfig: settings } = useSettings();
  const { isLeisure, whatsappFormatted, email: brandEmail } = useBrand();
  const labels = (settings?.ui_labels || {}) as Record<string, string>;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const { content, loading } = usePageContent('tailormade')
  const supabase = createClient();

  const getSmartDates = () => {
    const today = new Date()
    const checkInDate = new Date()
    checkInDate.setDate(today.getDate() + (6 - today.getDay()) + 7)
    return format(checkInDate, 'yyyy-MM-dd')
  }

  const getReturnDate = (start: string, n: number) => {
    try {
      const d = new Date(start)
      d.setDate(d.getDate() + n)
      return format(d, 'yyyy-MM-dd')
    } catch (e) {
      return start
    }
  }

  const [mealPlan, setMealPlan] = useState('none');
  const [departureDate, setDepartureDate] = useState(getSmartDates());
  const [nights, setNights] = useState(7);
  const [returnDate, setReturnDate] = useState(getReturnDate(getSmartDates(), 7));

  // Sync nights when start/end dates change
  const syncNights = (start: string, end: string) => {
    try {
      const s = new Date(start)
      const e = new Date(end)
      const diffTime = e.getTime() - s.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      if (diffDays > 0) {
        setNights(diffDays)
      }
    } catch (err) {
      console.error('Date sync failed', err)
    }
  }

  const [adultsCount, setAdultsCount] = useState(1);
  const [teensCount, setTeensCount] = useState(0);
  const [childrenCount, setChildrenCount] = useState(0);
  const [infantsCount, setInfantsCount] = useState(0);
  const [childAges, setChildAges] = useState<string[]>([]);

  const typedContent = content as any
  const hero = typedContent?.section_1_hero || {
    badge: 'Tailor-Made',
    title: labels.tailor_made_hero_title || 'Tailor-Made Package',
    image: settings?.tailorMadeHeroImage || "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2042&auto=format&fit=crop"
  }

  const updateAdults = (delta: number) => {
    setAdultsCount(prev => Math.max(1, Math.min(20, prev + delta)));
  };

  const updateTeens = (delta: number) => {
    setTeensCount(prev => Math.max(0, Math.min(10, prev + delta)));
  };

  const updateChildren = (delta: number) => {
    setChildrenCount(prev => Math.max(0, Math.min(10, prev + delta)));
  };

  const updateInfants = (delta: number) => {
    setInfantsCount(prev => Math.max(0, Math.min(10, prev + delta)));
  };

  const handleAgeChange = (index: number, age: string) => {
    const newAges = [...childAges];
    newAges[index] = age;
    setChildAges(newAges);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    const form = e.currentTarget;
    const formData = new FormData(form);
    const sanitize = (val: string) => (val || '').replace(/<[^>]*>?/gm, '').trim();

    const firstName = sanitize(formData.get('first_name') as string);
    const email = sanitize(formData.get('email') as string).toLowerCase();
    const phone = sanitize(formData.get('phone') as string);

    if (!firstName || !email || !phone) {
        toast.error('Please provide all contact information (Name, Email, Phone)');
        setIsSubmitting(false);
        return;
    }
    const country = sanitize(formData.get('country') as string);
    const departure_date = sanitize(formData.get('departure_date') as string);
    const return_date = sanitize(formData.get('return_date') as string);
    const flexibility = sanitize(formData.get('flexibility') as string);
    const nights_count = sanitize(formData.get('nights') as string);
    const special_requests = sanitize(formData.get('message') as string);
    const hasMarketingOptIn = !!formData.get('marketing');
    
    // Construct rich message from all fields
    const message = `
New Tailor-Made Request:
    
Personal Details:
- Full Name: ${firstName}
- Phone: ${phone}
- Email: ${email}

Trip Details:
- Destination: ${country}
- Start Date: ${departure_date}
- End Date: ${return_date}
- Flexibility: ${flexibility}
- Nights: ${nights_count}

Guests (Adults: ${adultsCount}, Teens: ${teensCount}, Kids: ${childrenCount})

Additional Information:
- Meal Plan: ${mealPlan}
- Child Ages: ${childAges.map(sanitize).join(', ') || 'N/A'}
- Special Requests: ${special_requests}
- Marketing Opt-In: ${hasMarketingOptIn ? 'Yes' : 'No'}
    `.trim();

    const data = {
      name: firstName,
      email: email,
      phone: phone,
      subject: `Tailor-Made Request: ${country || 'Custom'}`,
      message: message,
      status: 'unread'
    };

    try {
      // 1. Save Inquiry
      const { error: inquiryError } = await supabase.from('inquiries').insert([{
        name: firstName,
        email: email,
        phone: phone,
        subject: `Tailor-Made Request: ${country || 'Custom'}`,
        message: message,
        status: 'unread',
        source: 'tailor-made',
        lead_data: {
          country: country,
          departure_date: departure_date,
          return_date: return_date,
          flexibility: flexibility,
          nights: nights_count,
          adults: adultsCount,
          teens: teensCount,
          children: childrenCount,
          infants: infantsCount,
          meal_plan: mealPlan,
          special_requests: special_requests,
          marketing_opt_in: hasMarketingOptIn
        }
      }]);
      if (inquiryError) throw inquiryError;

      // 2. Trigger Email Notification
      try {
        const { notifyInquiryReceived } = await import('@/lib/emailActions');
        await notifyInquiryReceived({
          email: email,
          customerName: firstName,
          customerPhone: phone,
          destination: country || 'Custom Destination',
          departureDate: departure_date || 'TBC',
          adults: String(adultsCount),
          children: String(teensCount + childrenCount), 
          message: message,
          isLocalDeal: isLeisure
        });
      } catch (e) {
        console.error('Email notification failed but inquiry saved:', e);
      }
      
      // 3. Save Marketing Subscriber if checked

      if (hasMarketingOptIn) {
        try {
          // Wrap in a try-catch to prevent RLS/401 policies or existing unique emails from failing the inquiry.
          await supabase.from('customers').insert([{
            email: email,
            first_name: firstName,
            phone: phone,
            is_subscriber: true,
            newsletter_opt_in_date: new Date().toISOString(),
            status: 'Active'
          }]);
          
          await supabase.from('subscribers').insert([{
              email: email,
              status: 'active'
          }]);
        } catch (marketingError) {
          console.warn('Marketing integration deferred due to RLS or existing records.', marketingError);
        }
      }

      setSubmitStatus('success');
      toast.success(labels.tailor_made_success || 'Your request has been sent! Our team will contact you soon.');
      // Reset form
      form.reset();
      setAdultsCount(2);
      setTeensCount(0);
      setChildrenCount(0);
      setInfantsCount(0);
      setChildAges([]);
      setMealPlan('none');
    } catch (error) {
      console.error('Error submitting inquiry:', error);
      setSubmitStatus('error');
      toast.error(labels.tailor_made_error || 'Something went wrong. Please try again or call us.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full px-6 py-4 bg-white text-black border-2 border-slate-200 rounded-2xl focus:border-black focus:ring-4 focus:ring-black/5 outline-none transition-all placeholder:text-slate-300 font-bold text-sm shadow-sm"
  const labelClass = "text-[10px] md:text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-2 block ml-1"
  const sectionClass = "bg-white p-6 md:p-10 lg:p-12 rounded-none md:rounded-[3rem] border-x-0 md:border-x border-y border-slate-100 shadow-xl md:shadow-slate-200/50"

  return (
    <div className="relative">
      <HeroBanner
        badge={hero.badge}
        title={hero.title}
        image={resolveImageUrl(hero.image)}
      />
      <div className="max-w-7xl mx-auto md:px-6 py-8">
          <Breadcrumbs
            items={[
              { label: labels.breadcrumb_tailor_made || 'Tailor-Made', active: true },
            ]}
            className="mb-8"
          />
          <div className="space-y-6">
            <form onSubmit={handleSubmit} className="w-full space-y-8 md:space-y-12">
              <input type="hidden" name="adults" value={adultsCount} />
              <input type="hidden" name="teens" value={teensCount} />
              <input type="hidden" name="children" value={childrenCount} />
              <input type="hidden" name="infants" value={infantsCount} />
            
            {/* 1. Secure My Quote - Identity Card */}
            <div className={sectionClass}>
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center text-white">
                         <CheckCircle2 size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1">
                            Secure My Quote
                        </h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Direct delivery to your inbox</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className={labelClass}>Email Destination</label>
                        <input 
                            type="email" 
                            name="email"
                            required 
                            placeholder="your@email.com"
                            className={inputClass}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className={labelClass}>First Name</label>
                        <input 
                            type="text" 
                            name="first_name"
                            required 
                            placeholder="John"
                            className={inputClass}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className={labelClass}>Phone</label>
                        <input 
                            type="tel" 
                            name="phone"
                            required 
                            placeholder="+230..."
                            className={inputClass}
                        />
                    </div>
                </div>
            </div>
            {/* 2. Trip Details Section */}
            <div className={sectionClass}>
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center text-white">
                         <MapPin size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1">Trip Details</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Where and when are you flying?</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2 space-y-1">
                        <label className={labelClass}>Destination</label>
                        <input 
                            type="text" 
                            name="country"
                            required 
                            placeholder="e.g. Malaysia, Europe, Maldives..."
                            className={inputClass}
                        />
                    </div>
                    
                    <div className="space-y-1">
                        <label className={labelClass}>Start Date</label>
                        <div className="relative">
                            <DatePicker 
                                selected={parseISO(departureDate)}
                                onSelect={(date) => {
                                    const d = format(date, 'yyyy-MM-dd')
                                    setDepartureDate(d)
                                    setReturnDate(getReturnDate(d, nights))
                                }}
                                className="w-full bg-white border-2 border-slate-200 rounded-2xl focus:border-black focus:ring-4 focus:ring-black/5 outline-none font-bold text-slate-900 transition-all text-sm h-[56px] shadow-sm px-6"
                            />
                        </div>
                        <input type="hidden" name="departure_date" value={departureDate} />
                    </div>

                    <div className="space-y-1">
                        <label className={labelClass}>End Date</label>
                        <div className="relative">
                            <DatePicker 
                                selected={parseISO(returnDate)}
                                onSelect={(date) => {
                                    const d = format(date, 'yyyy-MM-dd')
                                    setReturnDate(d)
                                    syncNights(departureDate, d)
                                }}
                                disabledDays={{ before: parseISO(departureDate) }}
                                className="w-full bg-white border-2 border-slate-200 rounded-2xl focus:border-black focus:ring-4 focus:ring-black/5 outline-none font-bold text-slate-900 transition-all text-sm h-[56px] shadow-sm px-6"
                            />
                        </div>
                        <input type="hidden" name="return_date" value={returnDate} />
                    </div>

                    <div className="space-y-1">
                        <label className={labelClass}>Flexibility</label>
                        <select 
                            name="flexibility"
                            required 
                            className="w-full px-6 py-4 bg-white border-2 border-slate-200 rounded-2xl focus:border-black focus:ring-4 focus:ring-black/5 outline-none font-bold text-slate-900 transition-all text-sm h-[56px] shadow-sm appearance-none cursor-pointer"
                        >
                            <option value="flexible">Flexible (+/- 3 days)</option>
                            <option value="firm">Firm (Exact Dates)</option>
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className={labelClass}>Number of Days</label>
                        <div className="relative">
                            <input 
                                type="number" 
                                name="nights"
                                required
                                min="1"
                                placeholder="e.g. 7"
                                value={nights}
                                onChange={(e) => {
                                    const n = parseInt(e.target.value) || 1
                                    setNights(n)
                                    setReturnDate(getReturnDate(departureDate, n))
                                }}
                                className={inputClass}
                            />
                            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-300 uppercase tracking-widest pointer-events-none">Nights</span>
                        </div>
                    </div>
                </div>
            </div>
            {/* 3. Meal Plan Section */}
            <div className={sectionClass}>
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center text-white shadow-lg shadow-black/10">
                         <Utensils size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1">Meal Plan Preference</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Select your dining preference</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {['none', 'Bed & Breakfast', 'Half Board', 'Full Board'].map((plan) => (
                        <div 
                            key={plan}
                            onClick={() => setMealPlan(plan)}
                            className={`px-6 py-6 border-2 rounded-2xl cursor-pointer transition-all text-center flex flex-col items-center justify-center gap-2 group
                                ${mealPlan === plan 
                                    ? 'bg-black border-black text-white shadow-xl scale-[1.02]' 
                                    : 'bg-white border-slate-100 text-slate-600 hover:border-black hover:text-black hover:shadow-md'}`}
                        >
                            <span className="text-[11px] font-black uppercase tracking-widest leading-none">
                                {plan === 'none' ? 'Room Only' : plan}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* 4. Guests Section */}
            <div className={sectionClass}>
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center text-white">
                         <Users size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1">Guests</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Who is travelling with you?</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6 md:p-8 bg-slate-50 border-2 border-slate-100 rounded-2xl md:rounded-[2.5rem]">
                    <div className="space-y-2">
                        <label className={labelClass}>Adults</label>
                        <div className="relative group">
                            <input 
                                type="number" 
                                value={adultsCount}
                                onChange={(e) => setAdultsCount(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-full px-6 py-5 bg-white border-2 border-slate-200 rounded-2xl focus:border-black outline-none font-black text-slate-900 transition-all text-sm group-hover:border-slate-300"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col">
                                <button type="button" onClick={() => updateAdults(1)} className="p-1 hover:text-red-600 transition-colors"><Plus size={14} /></button>
                                <button type="button" onClick={() => updateAdults(-1)} className="p-1 hover:text-red-600 transition-colors"><Minus size={14} /></button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className={labelClass}>Teens</label>
                        <div className="relative group">
                            <input 
                                type="number" 
                                value={teensCount}
                                onChange={(e) => setTeensCount(Math.max(0, parseInt(e.target.value) || 0))}
                                className="w-full px-6 py-5 bg-white border-2 border-slate-200 rounded-2xl focus:border-black outline-none font-black text-slate-900 transition-all text-sm group-hover:border-slate-300"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col">
                                <button type="button" onClick={() => updateTeens(1)} className="p-1 hover:text-red-600 transition-colors"><Plus size={14} /></button>
                                <button type="button" onClick={() => updateTeens(-1)} className="p-1 hover:text-red-600 transition-colors"><Minus size={14} /></button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className={labelClass}>Children</label>
                        <div className="relative group">
                            <input 
                                type="number" 
                                value={childrenCount}
                                onChange={(e) => setChildrenCount(Math.max(0, parseInt(e.target.value) || 0))}
                                className="w-full px-6 py-5 bg-white border-2 border-slate-200 rounded-2xl focus:border-black outline-none font-black text-slate-900 transition-all text-sm group-hover:border-slate-300"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col">
                                <button type="button" onClick={() => updateChildren(1)} className="p-1 hover:text-red-600 transition-colors"><Plus size={14} /></button>
                                <button type="button" onClick={() => updateChildren(-1)} className="p-1 hover:text-red-600 transition-colors"><Minus size={14} /></button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className={labelClass}>Infants</label>
                        <div className="relative group">
                            <input 
                                type="number" 
                                value={infantsCount}
                                onChange={(e) => setInfantsCount(Math.max(0, parseInt(e.target.value) || 0))}
                                className="w-full px-6 py-5 bg-white border-2 border-slate-200 rounded-2xl focus:border-black outline-none font-black text-slate-900 transition-all text-sm group-hover:border-slate-300"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col">
                                <button type="button" onClick={() => updateInfants(1)} className="p-1 hover:text-red-600 transition-colors"><Plus size={14} /></button>
                                <button type="button" onClick={() => updateInfants(-1)} className="p-1 hover:text-red-600 transition-colors"><Minus size={14} /></button>
                            </div>
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                    {childrenCount > 0 && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-8 pt-8 border-t border-slate-100 overflow-hidden"
                        >
                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4">Children Ages</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                                {Array.from({ length: childrenCount }).map((_, index) => (
                                    <div key={index} className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Child {index + 1}</label>
                                        <input 
                                            type="number" 
                                            name={`child_age_${index}`}
                                            value={childAges[index] || ''}
                                            onChange={(e) => handleAgeChange(index, e.target.value)}
                                            min="0"
                                            placeholder="Age"
                                            className="w-full px-4 py-3 bg-white border-2 border-slate-100 rounded-xl focus:border-black outline-none font-black text-slate-900 transition-all text-xs"
                                        />
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            {/* 5. Additional Information Section */}
            <div className={sectionClass}>
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center text-white">
                         <MessageSquare size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1">Additional Information</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Tell us more about your dream trip</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-3">
                        <label className={labelClass}>Special Requests</label>
                        <textarea 
                            name="message"
                            rows={5}
                            placeholder="Tell us more about your dream trip..."
                            className={inputClass}
                        />
                    </div>
                    
                    <div className="mt-10 pt-10 border-t-2 border-slate-100 text-center space-y-8">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed max-w-lg mx-auto">
                            By submitting, you agree to our <a href="/terms-conditions" className="text-black underline font-black">Terms</a> & <a href="/privacy-policy" className="text-black underline font-black">Privacy Policy</a>.
                        </p>
                        <label className="flex items-center justify-center gap-3 cursor-pointer group">
                             <input type="checkbox" name="marketing" id="marketing" className="peer sr-only" defaultChecked />
                             <div className="w-5 h-5 border-2 border-slate-200 rounded peer-checked:bg-black peer-checked:border-black flex items-center justify-center transition-all group-hover:border-black">
                                <CheckCircle2 size={12} className="text-white"/>
                             </div>
                             <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 group-hover:text-black">Email me travel inspirations</span>
                        </label>
                    </div>

                    {/* Submit Button Row */}
                    <div className="pt-10 mt-10 border-t-2 border-slate-100">
                        <button 
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-6 bg-black text-white font-black uppercase text-[13px] tracking-widest rounded-2xl transition-all hover:bg-slate-900 disabled:opacity-30 shadow-2xl active:scale-95 shadow-black/20"
                        >
                            {isSubmitting ? 'Processing Request...' : 'Design My Trip'}
                        </button>
                    </div>
                </div>
            </div>
            </form>
          </div>
      </div>
    </div>
  );
}
