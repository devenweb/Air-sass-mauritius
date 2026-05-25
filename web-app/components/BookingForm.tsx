import React from 'react'
import { Mail, MessageSquare, Users, Send, User, Phone, Utensils, ChevronDown } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'
import { useSettings } from '@/contexts/SettingsContext'
import { notifyInquiryReceived } from '@/lib/emailActions'
import { isLocalDealServiceType } from '@/lib/localDeals'

type BookingFormProps = {
  serviceId?: string
  serviceName?: string
  serviceCategory?: string
  packageTitle?: string
  servicePrice?: number
  className?: string
}

const bookingFormSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  phone: z.string().trim().optional(),
  travelers: z.string().trim().optional(),
  mealPlan: z.string().trim().optional(),
  message: z.string().trim().optional(),
})

type BookingFormData = z.infer<typeof bookingFormSchema>

export default function BookingForm({ 
  serviceId, 
  serviceName, 
  serviceCategory, 
  packageTitle,
  servicePrice,
  className = '' 
}: BookingFormProps) {
  const { settings } = useSettings()
  const labels = (settings?.labels || {}) as any
  const placeholders = (settings?.placeholders || {}) as any

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      travelers: '',
      mealPlan: 'None',
      message: ''
    }
  })

  async function onSubmit(data: BookingFormData) {
    try {
      const supabase = createClient()
      
      // Sanitization helper
      const clean = (val?: string) => val ? val.replace(/<[^>]*>?/gm, '').trim() : '';
      
      const firstName = clean(data.firstName)
      const lastName = clean(data.lastName)
      const email = clean(data.email).toLowerCase()
      const phone = clean(data.phone)
      const message = clean(data.message)

      // Submit inquiry to Supabase
      const { error } = await supabase
        .from('inquiries')
        .insert({
          name: `${firstName} ${lastName}`,
          email: email,
          phone: phone,
          subject: packageTitle ? `Package Inquiry: ${packageTitle}` : `Inquiry for ${serviceName || 'Service'}`,
          message: message,
          status: 'unread',
          source: 'Booking Form',
          lead_data: {
            service_id: serviceId,
            service_name: serviceName,
            service_category: serviceCategory,
            travelers: data.travelers,
            meal_plan: data.mealPlan,
            price: servicePrice
          }
        })

      if (error) throw error

      // Trigger email notification to admin
      await notifyInquiryReceived({
        customerName: `${firstName} ${lastName}`,
        email: email,
        customerPhone: phone || 'N/A',
        destination: serviceName || packageTitle || 'Service Inquiry',
        departureDate: 'TBC',
        adults: data.travelers || '2',
        children: '0',
        message: message || 'No message provided',
        isLocalDeal: isLocalDealServiceType(serviceCategory)
      })


      toast.success(labels.inquiry_sent_success || 'Inquiry sent successfully!')
      reset()
    } catch (error) {
      console.error('Error submitting inquiry:', error)
      toast.error(labels.inquiry_sent_error || 'Failed to send inquiry')
    }
  }

  // Compact form section component to reduce spacing
  const CompactFormSection = ({ 
    children, 
    className: sectionClassName = '' 
  }: { 
    children: React.ReactNode, 
    className?: string 
  }) => (
    <div className={`mb-3 ${sectionClassName}`}>{children}</div>
  )

  // Compact form row component to reduce spacing
  const CompactFormRow = ({ children }: { children: React.ReactNode }) => (
    <div className="flex flex-col md:flex-row gap-4 md:gap-6 mb-3">{children}</div>
  )

  return (
    <div className={`bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm ${className}`}>
      <h3 className="text-xl font-black text-slate-900 mb-6 uppercase tracking-wide">{labels.inquire_now || 'Send an Inquiry'}</h3>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3"> {/* Reduced spacing */}
        <CompactFormRow>
          <CompactFormSection>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{labels.first_name || 'First Name'}</label>
            <div className="relative">
              <User className="absolute left-4 top-3.5 text-slate-400" size={18} />
              <input 
                {...register('firstName')}
                placeholder={placeholders.first_name || "John"}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 transition-all font-medium"
              />
            </div>
            {errors.firstName && (
              <p className="text-red-500 text-[10px] font-black uppercase mt-1">{errors.firstName.message}</p>
            )}
          </CompactFormSection>

          <CompactFormSection>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{labels.last_name || 'Last Name'}</label>
            <div className="relative">
              <User className="absolute left-4 top-3.5 text-slate-400" size={18} />
              <input 
                {...register('lastName')}
                placeholder={placeholders.last_name || "Doe"}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 transition-all font-medium"
              />
            </div>
            {errors.lastName && (
              <p className="text-red-500 text-[10px] font-black uppercase mt-1">{errors.lastName.message}</p>
            )}
          </CompactFormSection>
        </CompactFormRow>

        <CompactFormRow>
          <CompactFormSection>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{labels.email || 'Email'}</label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 text-slate-400" size={18} />
              <input 
                {...register('email')}
                type="email"
                placeholder={placeholders.email || "john.doe@email.com"}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 transition-all font-medium"
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-[10px] font-black uppercase mt-1">{errors.email.message}</p>
            )}
          </CompactFormSection>

          <CompactFormSection>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{labels.phone || 'Phone'}</label>
            <div className="relative">
              <Phone className="absolute left-4 top-3.5 text-slate-400" size={18} />
              <input 
                {...register('phone')}
                type="tel"
                placeholder={placeholders.phone || "+230 XXXX XXXX"}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 transition-all font-medium"
              />
            </div>
            {errors.phone && (
              <p className="text-red-500 text-[10px] font-black uppercase mt-1">{errors.phone.message}</p>
            )}
          </CompactFormSection>
        </CompactFormRow>

        <CompactFormRow>
          <CompactFormSection>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{labels.travelers || 'Travelers'}</label>
            <div className="relative">
              <Users className="absolute left-4 top-3.5 text-slate-400" size={18} />
              <select 
                {...register('travelers')}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 transition-all font-medium appearance-none"
              >
                <option>{labels.one_traveler || '1 Traveler'}</option>
                <option>{labels.two_travelers || '2 Travelers'}</option>
                <option>{labels.three_travelers || '3 Travelers'}</option>
                <option>{labels.four_plus_travelers || '4+ Travelers'}</option>
              </select>
            </div>
          </CompactFormSection>

          <CompactFormSection>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{labels.meal_plan || 'Meal Plan'}</label>
            <div className="relative">
              <Utensils className="absolute left-4 top-3.5 text-slate-400" size={18} />
              <select 
                {...register('mealPlan')}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 transition-all font-medium appearance-none"
              >
                <option value="None">{labels.no_meal_plan || 'No Meal Plan'}</option>
                <option value="Bed & Breakfast">{labels.bb_meal_plan || 'Bed & Breakfast'}</option>
                <option value="Half Board">{labels.hb_meal_plan || 'Half Board'}</option>
                <option value="Full Board">{labels.fb_meal_plan || 'Full Board'}</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <ChevronDown size={14} />
              </div>
            </div>
          </CompactFormSection>
        </CompactFormRow>

        <CompactFormSection>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{labels.special_requests || 'Special Requests'}</label>
          <div className="relative">
            <MessageSquare className="absolute left-4 top-3.5 text-slate-400" size={18} />
            <textarea
              rows={3}
              {...register('message')}
              placeholder={placeholders.special_requests || "Any dietary requirements or preferences?"}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 transition-all font-medium resize-none"
            />
          </div>
        </CompactFormSection>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 bg-red-600 text-white font-bold rounded-xl hover:bg-slate-900 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (labels.submitting_btn || 'Sending...') : (
            <>
              {labels.send_inquiry_btn || 'Send Inquiry'} <Send size={18} />
            </>
          )}
        </button>
      </form>
    </div>
  )
}