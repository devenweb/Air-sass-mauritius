import { createClient } from '@/lib/supabaseServer'
import { redirect, notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface Props {
  params: Promise<{ id: string }>
}

export default async function SearchDetailsRedirectPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch the service to determine its type
  const { data: service, error } = await supabase
    .from('services')
    .select('service_type')
    .eq('id', id)
    .eq('is_active', true)
    .single()

  if (error || !service) {
    console.error('Service not found for redirect:', error)
    notFound()
  }

  // Redirect to the correct specialized route
  switch (service.service_type) {
    case 'hotel':
      redirect(`/hotels/${id}`)
    case 'activity':
    case 'land_activity':
    case 'sea_activity':
      redirect(`/activities/${id}`)
    case 'tour':
      redirect(`/tours/${id}`)
    case 'cruise':
      redirect(`/cruises/${id}`)
    case 'transfer':
      redirect(`/transfers/${id}`)
    case 'flight':
      redirect(`/flights/${id}`)
    case 'day_package':
    case 'hotel_day_package':
      redirect(`/day-packages/${id}`)
    case 'evening_package':
      redirect(`/evening-packages/${id}`)
    case 'package':
    case 'packages':
      redirect(`/packages/${id}`)
    case 'visa':
      redirect(`/visa-services`)
    default:
      // Final fallback to activities only if not already handled
      redirect(`/activities/${id}`)
  }
}
