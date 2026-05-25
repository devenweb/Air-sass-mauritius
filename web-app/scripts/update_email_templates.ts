import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const TEMPLATE_WRAPPER = (header: string, content: string) => `
<div style="font-family: sans-serif; max-width: 650px; margin: 20px auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden; color: #333; line-height: 1.5;">
    <div style="padding: 30px; text-align: center; background-color: #fff; border-bottom: 4px solid #e11d48;">
        <img src="{{logo_url}}" alt="Royal Travel Agency" style="height: 60px; width: auto;" />
    </div>
    
    <div style="padding: 40px; background-color: #ffffff;">
        <h2 style="color: #e11d48; margin-top: 0; font-size: 22px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">${header}</h2>
        
        ${content}
        
        <div style="padding-top: 30px; border-top: 1px solid #f0f0f0; text-align: center;">
            <p style="font-size: 14px; margin-bottom: 5px; color: #888;">Best Regards,</p>
            <p style="font-size: 16px; font-weight: 800; color: #000; margin-top: 0;">The Royal Travel Agency Team</p>
            <p style="font-size: 12px; color: #aaa; margin-top: 20px;">info@travellounge.mu | Since 1995</p>
        </div>
    </div>
</div>
`;

const RESERVATION_DETAILS_TABLE = `
        <div style="margin-bottom: 35px; border: 1px solid #f0f0f0; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #f9fafb; padding: 15px 20px; border-bottom: 1px solid #f0f0f0;">
                <h3 style="margin: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #e11d48; font-weight: 800;">Reservation Details</h3>
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr>
                    <td style="padding: 12px 20px; border-bottom: 1px solid #f9f9f9; color: #888; width: 40%;">Service</td>
                    <td style="padding: 12px 20px; border-bottom: 1px solid #f9f9f9; font-weight: 700;">{{service_name}}</td>
                </tr>
                <tr>
                    <td style="padding: 12px 20px; border-bottom: 1px solid #f9f9f9; color: #888;">{{label_start}}</td>
                    <td style="padding: 12px 20px; border-bottom: 1px solid #f9f9f9; font-weight: 700;">{{check_in}}</td>
                </tr>
                <tr style="display: {{show_checkout}};">
                    <td style="padding: 12px 20px; border-bottom: 1px solid #f9f9f9; color: #888;">{{label_end}}</td>
                    <td style="padding: 12px 20px; border-bottom: 1px solid #f9f9f9; font-weight: 700;">{{check_out}}</td>
                </tr>
                <tr style="display: {{show_nights}};">
                    <td style="padding: 12px 20px; border-bottom: 1px solid #f9f9f9; color: #888;">No of nights</td>
                    <td style="padding: 12px 20px; border-bottom: 1px solid #f9f9f9; font-weight: 700;">{{nights}}</td>
                </tr>
                <tr>
                    <td style="padding: 12px 20px; border-bottom: 1px solid #f9f9f9; color: #888;">Adult(s)</td>
                    <td style="padding: 12px 20px; border-bottom: 1px solid #f9f9f9; font-weight: 700;">{{adults}}</td>
                </tr>
                <tr>
                    <td style="padding: 12px 20px; border-bottom: 1px solid #f9f9f9; color: #888;">Children</td>
                    <td style="padding: 12px 20px; border-bottom: 1px solid #f9f9f9; font-weight: 700;">{{children}}</td>
                </tr>
                <tr>
                    <td style="padding: 12px 20px; border-bottom: 1px solid #f9f9f9; color: #888;">{{label_unit}}/Preference</td>
                    <td style="padding: 12px 20px; border-bottom: 1px solid #f9f9f9; font-weight: 700;">{{room_preference}}</td>
                </tr>
                <tr>
                    <td style="padding: 12px 20px; border-bottom: 1px solid #f9f9f9; color: #888;">Meal Plan</td>
                    <td style="padding: 12px 20px; border-bottom: 1px solid #f9f9f9; font-weight: 700;">{{meal_preference}}</td>
                </tr>
                <tr>
                    <td style="padding: 12px 20px; color: #888; vertical-align: top;">Special Notes</td>
                    <td style="padding: 12px 20px; font-weight: 500; color: #555;">{{notes}}</td>
                </tr>
            </table>
        </div>
`;

const CUSTOMER_CONTENT = `
        <p style="font-size: 16px; margin-bottom: 25px;">Dear <strong>Mr/Ms {{customer_name}}</strong>,</p>
        <p style="font-size: 15px; color: #555;">{{raw:intro_text}}</p>
        <p style="font-size: 14px; color: #666; margin-bottom: 30px;">Our reservations team will review your request and send a detailed confirmation or tailor-made quote within the next 2 working days to this e-mail address: <strong>{{email}}</strong>.</p>
        
        ${RESERVATION_DETAILS_TABLE}
        
        <div style="margin-bottom: 30px; background-color: #fff9f9; padding: 20px; border-radius: 8px; border: 1px dashed #e11d48;">
            <p style="margin: 0; font-size: 13px; color: #e11d48; font-weight: 800; text-transform: uppercase; text-align: center;">Important: This is not a booking confirmation</p>
            <p style="margin: 10px 0 0; font-size: 12px; color: #774444; line-height: 1.4; text-align: center;">Requested services are subject to availability. Our team will contact you shortly to finalize the reservation and handle payment if required.</p>
        </div>
`;

const ADMIN_CONTENT = `
        <p style="font-size: 16px; margin-bottom: 25px;">Hello Team,</p>
        <p style="font-size: 15px; color: #555;">A new booking request has been received from the website.</p>
        <p style="font-size: 14px; color: #666; margin-bottom: 30px;"><strong>Customer:</strong> {{customer_name}} ({{customer_email}})<br><strong>Phone:</strong> {{customer_phone}}</p>
        
        ${RESERVATION_DETAILS_TABLE}
        
        <!-- Commented out to remove the action button from the template
        <div style="text-align: center; margin-top: 20px;">
            <a href="https://admin.travellounge.mu/bookings" style="background-color: #e11d48; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View in Admin Portal</a>
        </div>
        -->
`;

async function updateTemplates() {
    // Update Customer Template
    const { error: error1 } = await supabase
        .from('email_templates')
        .update({
            body: TEMPLATE_WRAPPER('{{service_type_label}} : #{{booking_id}}', CUSTOMER_CONTENT),
            subject: '{{service_type_label}} : #{{booking_id}} - ROYAL TRAVEL AGENCY 🌴'
        })
        .eq('name', 'booking_confirmation');

    if (error1) console.error('Error updating booking_confirmation:', error1);
    else console.log('Successfully updated booking_confirmation template.');

    // Update Admin Template
    const { error: error2 } = await supabase
        .from('email_templates')
        .update({
            body: TEMPLATE_WRAPPER('NEW BOOKING REQUEST : #{{booking_id}}', ADMIN_CONTENT),
            subject: '🚨 NEW {{service_type_label}}: #{{booking_id}} - {{customer_name}}'
        })
        .eq('name', 'admin_new_booking');

    if (error2) console.error('Error updating admin_new_booking:', error2);
    else console.log('Successfully updated admin_new_booking template.');

    // Update Admin New Inquiry Template
    const { error: error3 } = await supabase
        .from('email_templates')
        .update({
            body: ADMIN_NEW_INQUIRY_CONTENT,
            subject: '📩 NEW INQUIRY: {{customer_name}} - {{destination}}'
        })
        .eq('name', 'admin_new_inquiry');

    if (error3) console.error('Error updating admin_new_inquiry:', error3);
    else console.log('Successfully updated admin_new_inquiry template.');
}

const ADMIN_NEW_INQUIRY_CONTENT = `
      <h1 style="color: #111827; font-size: 24px; font-weight: 800; margin-bottom: 16px;">New Inquiry Received</h1>
      <p>A new request has been submitted through the website.</p>
      
      <div class="booking-details">
        <h4 style="margin: 0 0 15px 0; font-size: 14px; color: #DC2626; text-transform: uppercase; letter-spacing: 1px;">Lead Details</h4>
        <div class="detail-row">
            <span class="detail-label">Customer</span>
            <span class="detail-value">{{customer_name}}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Email</span>
            <span class="detail-value">{{customer_email}}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Phone</span>
            <span class="detail-value">{{customer_phone}}</span>
        </div>
      </div>

      <div class="booking-details">
        <h4 style="margin: 0 0 15px 0; font-size: 14px; color: #DC2626; text-transform: uppercase; letter-spacing: 1px;">Trip Summary</h4>
        <div class="detail-row">
            <span class="detail-label">Destination</span>
            <span class="detail-value">{{destination}}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Date</span>
            <span class="detail-value">{{departure_date}}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Guests</span>
            <span class="detail-value">{{adults}} Adults, {{children}} Kids</span>
        </div>
      </div>

      <h4 style="font-size: 14px; font-weight: 800; color: #111827; margin: 20px 0 10px 0;">Message Content</h4>
      <div style="background: #f4f4f7; padding: 20px; border-radius: 8px; color: #1f2937; line-height: 1.6; white-space: pre-wrap;">
        {{raw:message}}
      </div>

      <!-- Commented out to remove the action button from the template
      <div style="margin-top: 30px; text-align: center;">
        <a href="https://admin.travellounge.mu/inquiries" class="button">View in Dashboard</a>
      </div>
      -->
`;

updateTemplates();
