-- Update site_settings with dynamic UI labels and placeholders
UPDATE site_settings 
SET value = value || '{
  "ui_labels": {
    "detailed_itinerary": "Detailed Itinerary",
    "service_details": "Service Details",
    "quick_search": "Quick Search",
    "popular_tags": "Popular Tags",
    "sort_by": "Sort By",
    "check_in": "Check In",
    "check_out": "Check Out",
    "room_preview": "Room Preview",
    "exclusive_offers": "Exclusive Offers",
    "seasonal_deals": "Seasonal Deals",
    "order_summary": "Order Summary",
    "secure_payment": "Secure Payment",
    "support_concierge": "Direct Concierge",
    "account_preferences": "Account Preferences",
    "whatsapp": "WHATSAPP",
    "email": "EMAIL",
    "booking": "BOOKING",
    "executive_price": "EXECUTIVE PRICE",
    "continue_booking": "CONTINUE BOOKING",
    "the_experience": "The Experience",
    "elite_accommodation": "Elite Accommodation",
    "client_impressions": "Client Impressions",
    "common_questions": "Common Questions",
    "visit_us": "Visit Us",
    "contact_us": "Contact Us",
    "quick_links": "Quick Links",
    "your_experience": "Your Experience",
    "your_review": "Your Review",
    "travel_dates": "Travel Dates",
    "start_date": "Start Date",
    "journey_details": "Journey Details",
    "flexible_booking": "Flexible Booking",
    "travel_date": "Travel Date",
    "our_process": "Our Process",
    "island_getaways": "Island Getaways",
    "trip_questionnaire": "Trip Questionnaire",
    "secure_payment_lock": "Secure Payment",
    "order_item": "Order Item",
    "total_amount": "Total Amount",
    "room_type": "Room Type"
  },
  "form_placeholders": {
    "first_name": "First Name",
    "last_name": "Last Name",
    "email_address": "Email Address",
    "phone_number": "Phone Number",
    "special_requests": "Special Requests",
    "meal_preference": "Meal Preference",
    "pickup_date": "Pickup Date",
    "travel_dates": "Travel Dates",
    "search_services": "Search Services",
    "card_number": "Card Number",
    "expiry_date": "Expiry Date",
    "cvv": "CVV",
    "cardholder_name": "Cardholder Name"
  }
}'::jsonb
WHERE key = 'general_config';

-- Seed content_blocks for static pages
INSERT INTO content_blocks (page_slug, section_key, content)
VALUES 
  -- About Page
  ('about', 'hero', '{"title": "Our Story", "subtitle": "Crafting Excellence Since 2014"}'),
  ('about', 'mission', '{"title": "The Mission", "content": "Travel Lounge Ltd is a one stop travel solutions provider which aims to continuously grow across borders..."}'),
  
  -- Safety Page
  ('safety', 'hero', '{"title": "Your Safety is Our Top Priority", "label": "SAFETY FIRST"}'),
  ('safety', 'iata', '{"title": "Global Standards", "content": "We are a fully IATA accredited travel agency, adhering to the highest international standards of safety and service."}'),
  
  -- FAQ Page
  ('faq', 'hero', '{"title": "Help Center", "label": "FAQ"}'),
  
  -- Privacy Page
  ('privacy-policy', 'hero', '{"title": "Privacy Policy", "content": "Your privacy is important to us. This policy outlines how we handle your personal information."}'),
  
  -- Terms Page
  ('terms-conditions', 'hero', '{"title": "Terms & Conditions", "content": "Please read these terms and conditions carefully before using our services."}'),
  
  -- Home (Listing Headers - Web)
  ('home', 'deals', '{"title": "Seasonal Deals", "label": "Exclusive Offers"}'),
  ('home', 'partners', '{"label": "TRUSTED BY THE BEST"}')
ON CONFLICT (page_slug, section_key) DO UPDATE SET content = EXCLUDED.content;
