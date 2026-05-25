/**
 * Local Deals service types that route to inbound@travellounge.mu
 * All other service types route to reservation@travellounge.mu
 */
const LOCAL_DEAL_TYPES = ['hotel', 'day_package', 'evening_package']

/**
 * Checks if a service_type belongs to the Local Deals menu.
 * Used to determine email routing for admin notifications.
 */
export function isLocalDealServiceType(serviceType?: string | null): boolean {
    return LOCAL_DEAL_TYPES.includes(serviceType || '')
}
