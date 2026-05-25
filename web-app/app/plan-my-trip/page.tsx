'use client'

import React, { useState } from 'react';
import Image from 'next/image';
import { 
  CheckCircle2
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { resolveImageUrl } from '@/lib/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { toast } from 'sonner';
import { useSettings } from '@/contexts/SettingsContext';
import { DatePicker } from '@/components/ui/DatePicker';
import { parseISO, format, isBefore } from 'date-fns';

export default function PlanMyTrip() {
  const { generalConfig: settings } = useSettings();
  const labels = (settings?.ui_labels || {}) as Record<string, string>;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const supabase = createClient();
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    const formData = new FormData(e.currentTarget);
    const sanitize = (val: any) => String(val || '').replace(/<[^>]*>?/gm, '').trim();

    const firstName = sanitize(formData.get('first_name'));
    const lastName = sanitize(formData.get('last_name'));
    const email = sanitize(formData.get('email')).toLowerCase();
    const phone = sanitize(formData.get('phone'));

    if (!firstName || !lastName || !email || !phone) {
        toast.error('Please provide all contact information (Name, Email, Phone)');
        setIsSubmitting(false);
        return;
    }
    const departure_date = sanitize(formData.get('departure_date'));
    const return_date = sanitize(formData.get('return_date'));
    const country = sanitize(formData.get('country'));
    const flexibility = sanitize(formData.get('flexibility'));
    const nights = sanitize(formData.get('nights'));
    const adults = sanitize(formData.get('adults'));
    const children = sanitize(formData.get('children'));
    const special_requests = sanitize(formData.get('message'));
    
    // Construct rich message from all fields
    const message = `
Full Name: ${firstName} ${lastName}
Phone: ${phone}
Start Date: ${departure_date}
End Date: ${return_date}
Flexibility: ${flexibility}
Nights: ${nights}
Country: ${country}
Adults: ${adults}
Children: ${children}

Additional Information:
${special_requests}

Agreed to Terms: ${formData.get('terms') ? 'Yes' : 'No'}
Marketing Opt-in: ${formData.get('marketing') ? 'Yes' : 'No'}
    `.trim();

    const data = {
      name: `${firstName} ${lastName}`,
      email: email,
      phone: phone,
      subject: `Trip Request: ${country || 'Custom'}`,
      message: message,
      status: 'unread'
    };

    try {
      const { error } = await supabase.from('inquiries').insert([data]);
      if (error) throw error;
      
      // Trigger Email Notification (Server Action)
      try {
          const { notifyInquiryReceived } = await import('@/lib/emailActions')
          await notifyInquiryReceived({
              email: email,
              customerName: String(data.name),
              customerPhone: String(data.phone),
              destination: country,
              departureDate: departure_date,
              adults: adults,
              children: children,
              message: message
          })
      } catch (e) {
          console.error('Email notification failed but inquiry saved:', e)
      }

      setSubmitStatus('success');
      toast.success(labels.plan_trip_success || 'Your request has been sent! Our experts will contact you soon.');
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error('Error submitting inquiry:', error);
      setSubmitStatus('error');
      toast.error(labels.plan_trip_error || 'Something went wrong. Please try again or call us.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white min-h-screen pb-6 font-sans">
      {/* Hero Section - Maintaining Brand Style */}
      <section className="relative py-8 flex items-center overflow-hidden bg-slate-900">
        <Image
          src={resolveImageUrl(settings?.planTripHeroImage, "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2070&auto=format&fit=crop")}
          alt="Plan My Trip"
          fill
          className="object-cover opacity-60"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
        <div className="container mx-auto px-6 relative z-10 text-center">
            <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight">
                {labels.plan_trip_hero_title || 'Plan My Trip'}
            </h1>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-6 mt-8">
          <Breadcrumbs 
            items={[{ label: labels.breadcrumb_plan_trip || 'Plan My Trip', active: true }]}
            className="mb-4"
          />

          <div className="text-center mb-4">
            <h2 className="text-2xl md:text-4xl font-black text-red-600 uppercase mb-2">
                {labels.request_flight_title || 'Request FOR a Quote'}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Personal Details Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">First Name</label>
                    <input 
                        type="text" 
                        name="first_name"
                        required 
                        placeholder="Name"
                        className="w-full px-4 py-3 border border-slate-300 rounded-md focus:ring-1 focus:ring-black focus:border-black outline-none font-medium placeholder:text-slate-400"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Last Name</label>
                    <input 
                        type="text" 
                        name="last_name"
                        required 
                        placeholder="Name"
                        className="w-full px-4 py-3 border border-slate-300 rounded-md focus:ring-1 focus:ring-black focus:border-black outline-none font-medium placeholder:text-slate-400"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Phone</label>
                    <input 
                        type="tel" 
                        name="phone"
                        required 
                        placeholder="Enter your phone number"
                        className="w-full px-4 py-3 border border-slate-300 rounded-md focus:ring-1 focus:ring-black focus:border-black outline-none font-medium placeholder:text-slate-400"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Email</label>
                    <input 
                        type="email" 
                        name="email"
                        required 
                        placeholder="Email"
                        className="w-full px-4 py-3 border border-slate-300 rounded-md focus:ring-1 focus:ring-black focus:border-black outline-none font-medium placeholder:text-slate-400"
                    />
                </div>
            </div>

            {/* Travel Timing Section */}
            <div>
              <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">When do you want to travel?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Start Date</label>
                      <DatePicker 
                          selected={departureDate ? parseISO(departureDate) : undefined}
                          onSelect={(date) => {
                              const d = format(date, 'yyyy-MM-dd')
                              setDepartureDate(d)
                              if (returnDate && isBefore(parseISO(returnDate), date)) {
                                  setReturnDate('')
                              }
                          }}
                          placeholder="Departure Date"
                          className="w-full bg-white border border-slate-300 rounded-md h-[48px]"
                      />
                      <input type="hidden" name="departure_date" value={departureDate} />
                  </div>
                  <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">End Date</label>
                      <DatePicker 
                          selected={returnDate ? parseISO(returnDate) : undefined}
                          onSelect={(date) => setReturnDate(format(date, 'yyyy-MM-dd'))}
                          disabledDays={departureDate ? { before: parseISO(departureDate) } : undefined}
                          placeholder="Return Date"
                          className="w-full bg-white border border-slate-300 rounded-md h-[48px]"
                      />
                      <input type="hidden" name="return_date" value={returnDate} />
                  </div>
                  <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Flexibility Day</label>
                      <input 
                          type="text" 
                          name="flexibility"
                          className="w-full px-4 py-3 border border-slate-300 rounded-md focus:ring-1 focus:ring-black focus:border-black outline-none font-medium"
                      />
                  </div>
                  <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Number of nights</label>
                      <input 
                          type="number" 
                          name="nights"
                          className="w-full px-4 py-3 border border-slate-300 rounded-md focus:ring-1 focus:ring-black focus:border-black outline-none font-medium"
                      />
                  </div>
                  <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Country</label>
                      <select 
                          name="country"
                          className="w-full px-4 py-3 border border-slate-300 rounded-md focus:ring-1 focus:ring-black focus:border-black outline-none font-medium bg-white"
                      >
                          <option value="Asia">Asia</option>
                          <option value="Europe">Europe</option>
                          <option value="Africa">Africa</option>
                          <option value="America">America</option>
                          <option value="Mauritius">Mauritius</option>
                          <option value="Rodrigues">Rodrigues</option>
                      </select>
                  </div>
              </div>
            </div>

            {/* Travelers Section */}
            <div>
              <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">Number of persons travelling?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Number of Adults</label>
                      <input 
                          type="number" 
                          name="adults"
                          className="w-full px-4 py-3 border border-slate-300 rounded-md focus:ring-1 focus:ring-black focus:border-black outline-none font-medium"
                      />
                  </div>
                  <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Number of Children</label>
                      <input 
                          type="number" 
                          name="children"
                          className="w-full px-4 py-3 border border-slate-300 rounded-md focus:ring-1 focus:ring-black focus:border-black outline-none font-medium"
                      />
                  </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">More info about your trip</label>
                <textarea 
                    name="message"
                    rows={6}
                    className="w-full px-4 py-3 border border-slate-300 rounded-md focus:ring-1 focus:ring-black focus:border-black outline-none font-medium resize-none shadow-inner"
                ></textarea>
            </div>

            {/* Legal & Marketing */}
            <div className="space-y-4">
                <label className="flex items-start gap-3 cursor-pointer group">
                    <input type="checkbox" name="terms" required className="mt-1 w-4 h-4 border-slate-300 rounded text-black focus:ring-black transition-all" />
                    <span className="text-sm font-medium text-slate-600 group-hover:text-black transition-colors leading-tight">
                        I agree to the terms of use & Privacy Policy
                    </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer group">
                    <input type="checkbox" name="marketing" className="mt-1 w-4 h-4 border-slate-300 rounded text-black focus:ring-black transition-all" />
                    <span className="text-sm font-medium text-slate-600 group-hover:text-black transition-colors leading-tight">
                        I want to receive the best marketing offers from Travel Lounge by email
                    </span>
                </label>
            </div>

            {/* Submit */}
            <div className="flex flex-col items-center pt-4 border-t border-slate-100">
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="px-12 py-3 bg-black text-white font-bold rounded-sm h-12 flex items-center justify-center min-w-[120px] transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : 'Submit'}
                </button>

                <AnimatePresence>
                  {submitStatus === 'success' && (
                    <motion.p 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 text-green-600 font-bold bg-green-50 px-6 py-3 rounded-lg border border-green-100 flex items-center gap-2"
                    >
                      <CheckCircle2 size={18} />
                      Request sent successfully!
                    </motion.p>
                  )}
                </AnimatePresence>
            </div>
          </form>
      </div>
    </div>
  );
}

// Helper icons/components
const Loader2 = ({ size, className }: { size: number, className: string }) => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
)

