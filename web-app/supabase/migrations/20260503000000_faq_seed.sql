
-- Royal Travel Agency FAQ Seed Data
-- Categories: Booking, Payments, Stay, Local Deals, Cancellations

INSERT INTO faqs (category, question, answer, order_index, is_published) VALUES
('Booking & Reservations', 'How do I make a booking on Royal Travel Agency?', 'Simply browse our curated collection of hotels, packages, and activities. Select your preferred dates and number of guests, click "Book Now," and follow the secure checkout process. You will receive an instant confirmation via email.', 10, true),
('Booking & Reservations', 'Can I book for a group?', 'Yes, Royal Travel Agency specializes in group bookings. For groups larger than 10 people, we recommend contacting our dedicated concierge team via WhatsApp or Email for personalized assistance and group rates.', 20, true),
('Booking & Reservations', 'Is my booking confirmed immediately?', 'Most bookings for Local Deals and Day Packages are confirmed instantly. For some International Travel Packages, a short verification period may be required, and our team will update you within 24 hours.', 30, true),

('Payments & Refunds', 'What payment methods do you accept?', 'We accept all major credit/debit cards (Visa, Mastercard, Amex), Juice by MCB, and Bank Transfers. All transactions are secured with industry-standard encryption.', 40, true),
('Payments & Refunds', 'Is it safe to pay online?', 'Absolutely. Royal Travel Agency uses a PCI-DSS compliant payment gateway, ensuring your financial information is never stored on our servers and is handled with maximum security.', 50, true),
('Payments & Refunds', 'What is your refund policy?', 'Refunds are subject to the specific cancellation policy of the service booked. Generally, if a refund is approved, it will be processed back to your original payment method within 5-10 business days.', 60, true),

('Check-in & Stay', 'What do I need to bring for hotel check-in?', 'You will need a valid National Identity Card or Passport and your Royal Travel Agency Booking Voucher (digital or printed).', 70, true),
('Check-in & Stay', 'Can I request an early check-in or late check-out?', 'Early check-in and late check-out are subject to availability and the hotel''s policy. We recommend contacting the hotel directly or notifying our concierge team in advance.', 80, true),

('Local Deals & Packages', 'Are these deals only for Mauritian Residents?', '"Local Deals" and "Day Packages" are often exclusive to Mauritian residents and permit holders. Please check the "Terms & Conditions" on the specific deal page for eligibility.', 90, true),
('Local Deals & Packages', 'Do you offer corporate packages?', 'Yes, Royal Travel Agency offers bespoke solutions for corporate retreats, team-building events, and year-end parties. Contact our B2B team for a custom quote.', 100, true),

('Cancellations', 'How do I cancel my booking?', 'You can cancel your booking through your Royal Travel Agency Dashboard or by contacting our support team. Cancellation fees may apply depending on the time of cancellation and the service provider''s policy.', 110, true);
