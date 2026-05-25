import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Linking, Dimensions, ActivityIndicator, TextInput } from 'react-native';
import { MapPin, Phone, Mail, Facebook, Instagram, MessageCircle, CheckCircle, Loader2 } from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { supabase } from '../lib/supabase';
import { resolveImageUrl } from '../utils/imageUtils';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

interface GeneralConfig {
  siteTitle?: string;
  contactEmail?: string;
  contactPhone?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  whatsappNumber1?: string;
  showFooterMobile?: boolean;
  logoUrl?: string;
  footer_tagline?: string;
  newsletter_tagline?: string;
  ui_labels?: Record<string, string>;
}

const Footer = () => {
  const [settings, setSettings] = useState<GeneralConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'general_config')
        .single();

      if (error) throw error;
      if (data?.value) {
        setSettings(data.value as GeneralConfig);
      }
    } catch (err) {
      console.error('Mobile Footer: Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSubscribe = async () => {
    const sanitizedEmail = email.trim();
    if (!sanitizedEmail || sanitizedEmail.length < 5) return;

    setSubmitting(true);
    setSuccess(false);
    try {
      const { error } = await supabase
        .from('subscribers')
        .insert([{ email: sanitizedEmail }]);

      if (error) {
        // Handle duplicate or other errors silently for now or with a simple alert
      } else {
        setSuccess(true);
        setEmail('');
        setTimeout(() => setSuccess(false), 5000);
      }
    } catch (err) {
      console.error('Error subscribing:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const contactPhone = settings?.contactPhone || '+230 5940 7701';
  const facebookUrl = settings?.facebookUrl || 'https://www.facebook.com/travellounge.mu';
  const instagramUrl = settings?.instagramUrl || 'https://www.instagram.com/travellounge_ltd';
  const tiktokUrl = settings?.tiktokUrl || '';
  const whatsappNumber = settings?.whatsappNumber1 || '23059407701';
  const labels = settings?.ui_labels || {};

  const handlePress = (url: string) => {
    if (url.startsWith('http') || url.startsWith('tel:') || url.startsWith('mailto:')) {
      Linking.openURL(url);
    } else {
      router.push(url as any);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  if (settings?.showFooterMobile === false) return null;

  return (
    <View style={styles.container}>
      {/* Branding Section */}
      <View style={styles.brandingSection}>
        <Image 
          source={require('../../assets/tlounge-logo-transparent.webp')} 
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.tagline}>
          {settings?.footer_tagline || 'Your local and international holiday provider. Experience safe, secure and memorable holidays with our IATA accredited experts.'}
        </Text>
        
        <View style={styles.socialRow}>
          <TouchableOpacity onPress={() => handlePress(facebookUrl)} style={styles.socialIcon}>
            <Facebook size={18} color={Colors.white} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handlePress(instagramUrl)} style={styles.socialIcon}>
            <Instagram size={18} color={Colors.white} />
          </TouchableOpacity>
          {tiktokUrl ? (
             <TouchableOpacity onPress={() => handlePress(tiktokUrl)} style={styles.socialIcon}>
                <MessageCircle size={18} color={Colors.white} />
             </TouchableOpacity>
          ) : null}
          <TouchableOpacity 
            onPress={() => handlePress(`https://wa.me/${whatsappNumber.replace(/\s+/g, '').replace('+', '')}`)} 
            style={[styles.socialIcon, { backgroundColor: '#10B981' }]}
          >
            <MessageCircle size={18} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Explore Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>EXPLORE</Text>
        <View style={styles.linkGrid}>
           {[
             { label: 'Hotels & Resorts', route: '/explore?category=hotels' },
             { label: 'International Flights', route: '/flights' },
             { label: 'Luxury Cruises', route: '/explore?category=cruises' },
             { label: 'Island Activities', route: '/explore?category=activities' },
             { label: 'Day Packages', route: '/explore?category=day-packages' },
             { label: 'Promotional Deals', route: '/explore?category=local-deals' },
           ].map((item, idx) => (
             <TouchableOpacity key={idx} style={styles.linkItem} onPress={() => handlePress(item.route)}>
                <View style={styles.dot} />
                <Text style={styles.linkText}>{item.label}</Text>
             </TouchableOpacity>
           ))}
        </View>
      </View>

      {/* The Agency Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>THE AGENCY</Text>
        <View style={styles.linkGrid}>
           {[
             { label: 'Our Story', route: '/about' },
             { label: 'Common Questions (FAQ)', route: '/faq' },
             { label: 'Privacy Policy', route: 'https://travellounge.mu/privacy-policy' },
             { label: 'Terms & Conditions', route: 'https://travellounge.mu/terms-conditions' },
           ].map((item, idx) => (
             <TouchableOpacity key={idx} style={styles.linkItem} onPress={() => handlePress(item.route)}>
                <Text style={styles.linkText}>{item.label}</Text>
             </TouchableOpacity>
           ))}
        </View>
      </View>

      {/* Newsletter Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>NEWSLETTER</Text>
        <Text style={styles.newsletterTagline}>
          {settings?.newsletter_tagline || 'Subscribe for luxury travel insights.'}
        </Text>
        
        {success ? (
          <View style={styles.successBox}>
            <CheckCircle size={16} color={Colors.success} />
            <Text style={styles.successText}>Thank you for subscribing!</Text>
          </View>
        ) : (
          <View style={styles.newsletterForm}>
            <TextInput
              style={styles.input}
              placeholder="Your email"
              placeholderTextColor={Colors.slate[500]}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity 
              style={styles.subscribeBtn} 
              onPress={handleSubscribe}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Text style={styles.subscribeBtnText}>SUBSCRIBE</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.helpDeskWrapper}>
            <TouchableOpacity style={styles.helpDesk} onPress={() => handlePress(`tel:${contactPhone.replace(/\s+/g, '')}`)}>
                <View style={styles.helpDeskIcon}>
                    <Phone size={14} color={Colors.primary} />
                </View>
                <View>
                    <Text style={styles.helpDeskLabel}>Help Desk</Text>
                    <Text style={styles.helpDeskValue}>{contactPhone}</Text>
                </View>
            </TouchableOpacity>
        </View>
      </View>

      {/* Footer Bottom */}
      <View style={styles.footerBottom}>
        <View style={styles.bottomBorder} />
        <View style={styles.copyrightContainer}>
          <Text style={styles.copyrightText}>
            © {new Date().getFullYear()} {settings?.siteTitle || 'Travel Lounge'}. All Rights Reserved. | Since 1995
          </Text>
          <Text style={styles.creditText}>
            Created and Produced by Deven
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#020617', // Slate 950
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: '#0F172A',
  },
  loadingContainer: {
    minHeight: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandingSection: {
    marginBottom: 40,
  },
  logo: {
    height: 50,
    width: 180,
    marginBottom: 20,
    marginLeft: -8,
  },
  tagline: {
    color: '#94A3B8', // Slate 400
    fontFamily: 'Outfit_500Medium',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 24,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 10,
  },
  socialIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#0F172A', // Slate 900
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  section: {
    marginBottom: 40,
  },
  sectionTitle: {
    color: '#DC2626', // Red 600
    fontFamily: 'Outfit_900Black',
    fontSize: 10,
    letterSpacing: 4,
    marginBottom: 20,
    textTransform: 'uppercase',
  },
  linkGrid: {
    gap: 12,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#DC2626',
  },
  linkText: {
    color: '#CBD5E1', // Slate 300
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 14,
  },
  newsletterTagline: {
    color: Colors.white,
    fontFamily: 'Outfit_700Bold',
    fontSize: 13,
    marginBottom: 16,
  },
  newsletterForm: {
    gap: 10,
  },
  input: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: Colors.white,
    fontFamily: 'Outfit_700Bold',
    fontSize: 12,
  },
  subscribeBtn: {
    backgroundColor: '#DC2626',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  subscribeBtnText: {
    color: Colors.white,
    fontFamily: 'Outfit_900Black',
    fontSize: 12,
    letterSpacing: 1,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  successText: {
    color: '#10B981',
    fontFamily: 'Outfit_900Black',
    fontSize: 12,
  },
  helpDeskWrapper: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#0F172A',
  },
  helpDesk: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  helpDeskIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  helpDeskLabel: {
    color: '#64748B', // Slate 500
    fontFamily: 'Outfit_900Black',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  helpDeskValue: {
    color: Colors.white,
    fontFamily: 'Outfit_900Black',
    fontSize: 14,
  },
  footerBottom: {
    marginTop: 20,
  },
  bottomBorder: {
    height: 1,
    backgroundColor: '#0F172A',
    marginBottom: 24,
  },
  copyrightContainer: {
    alignItems: 'center',
    gap: 8,
  },
  copyrightText: {
    color: '#475569', // Slate 600
    fontFamily: 'Outfit_900Black',
    fontSize: 10,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  creditText: {
    color: '#475569',
    fontFamily: 'Outfit_700Bold',
    fontSize: 9,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    opacity: 0.5,
  },
});

export default Footer;
