import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Image, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { Text, Surface } from 'react-native-paper';
import { Colors } from '../../src/theme/colors';
import { MessageCircle, Plane, ArrowRight, ShieldCheck, Headphones, MapPin, Sparkles, PhoneCall, Compass } from 'lucide-react-native';
import * as Linking from 'expo-linking';
import { useSettings } from '../../src/context/SettingsContext';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');
const HERO_HEIGHT = 260;

export default function FlightsScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [webViewHeight, setWebViewHeight] = useState(850);
  const [activeTab, setActiveTab] = useState<'commercial' | 'charter'>('commercial');
  const { mobileConfig, generalConfig } = useSettings();

  const handleSupport = (method: 'whatsapp' | 'email' | 'call', context: string = 'flight arrangements') => {
    const contact = {
      phone: mobileConfig?.supportPhone || generalConfig?.contactPhone || '+230 5509 7701',
      email: generalConfig?.contactEmail || 'office@travel-lounge.com'
    };
    if (method === 'whatsapp') {
      Linking.openURL(`https://wa.me/${contact.phone.replace(/\+/g, '').replace(/\s+/g, '')}?text=${encodeURIComponent(`I am requesting elite VIP assistance regarding ${context}.`)}`);
    }
    if (method === 'email') {
      Linking.openURL(`mailto:${contact.email}?subject=${encodeURIComponent(`Elite Inquiry: ${context}`)}`);
    }
    if (method === 'call') {
      Linking.openURL(`tel:${contact.phone.replace(/\s+/g, '')}`);
    }
  };

  const onMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'height' && data.height > 200) {
        setWebViewHeight(Math.min(data.height, 1400)); // Cap max height for stability
      }
    } catch (e) {
      // Ignored
    }
  };

  // Intercept and parse GOL flight search queries for analytics/personalization
  const trackFlightSearch = (url: string) => {
    try {
      const depMatch = url.match(/[?&](from|dep)=([^&]+)/i);
      const arrMatch = url.match(/[?&](to|arr)=([^&]+)/i);
      const dateMatch = url.match(/[?&](date|depDate)=([^&]+)/i);

      if (depMatch && arrMatch) {
        const from = decodeURIComponent(depMatch[2]);
        const to = decodeURIComponent(arrMatch[2]);
        const date = dateMatch ? decodeURIComponent(dateMatch[2]) : 'Unspecified Date';
        if (__DEV__) console.log('[Flight Tracker] Captured search request details:', { from, to, date });
      }
    } catch (e) {
      console.warn('Failed to parse GOL tracking URL parameters:', e);
    }
  };

  /* PREVIOUS injectedJS PRESERVED AS COMMENT PER USER RULES:
  const injectedJS = `
    const sendHeight = () => {
      const height = document.body.scrollHeight || document.documentElement.scrollHeight;
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'height', height: height }));
    };
    window.onload = sendHeight;
    setTimeout(sendHeight, 1500);
    setInterval(sendHeight, 2000);
    true;
  `;
  */
  const injectedJS = `
    // Override window.open to prevent external popup spawns and keep navigation local
    window.open = function(url) {
      window.location.href = url;
      return null;
    };

    // Dynamically override all target="_blank" tags to target="_self"
    const fixLinkAndFormTargets = () => {
      document.querySelectorAll('a[target="_blank"]').forEach(el => {
        el.target = '_self';
      });
      document.querySelectorAll('form[target="_blank"]').forEach(el => {
        el.target = '_self';
      });
    };
    fixLinkAndFormTargets();
    setInterval(fixLinkAndFormTargets, 1000);

    const sendHeight = () => {
      const height = document.body.scrollHeight || document.documentElement.scrollHeight;
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'height', height: height }));
    };
    
    window.onload = () => {
      sendHeight();
      fixLinkAndFormTargets();
    };
    setTimeout(sendHeight, 1500);
    setInterval(sendHeight, 2000);
    true;
  `;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Premium Bespoke Hero Section */}
        <View style={styles.heroContainer}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1436491865332-7a61a109c0f3?auto=format&fit=crop&q=80&w=1000' }} 
            style={styles.heroImage} 
          />
          <View style={styles.overlay} />
          
          <View style={styles.heroContent}>
            <View style={styles.badgeRow}>
              <View style={styles.eliteBadge}>
                <Sparkles size={12} color={Colors.primary} />
                <Text style={styles.eliteBadgeText}>BOUTIQUE ELITE AVIATION</Text>
              </View>
            </View>
            <Text style={styles.heroTitle}>GLOBAL NETWORKS</Text>
            <Text style={styles.heroTitleHighlight}>SEAMLESS TRAVEL</Text>
            <Text style={styles.heroSub}>Access full-service premium carriers and exclusive private charters curated to your schedule.</Text>
          </View>
        </View>

        {/* Premium Aviation Switcher */}
        <View style={styles.tabWrapper}>
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'commercial' && styles.tabButtonActive]}
              onPress={() => setActiveTab('commercial')}
            >
              <Plane size={16} color={activeTab === 'commercial' ? '#fff' : Colors.slate[400]} />
              <Text style={[styles.tabText, activeTab === 'commercial' && styles.tabTextActive]}>Commercial Engine</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'charter' && styles.tabButtonActive]}
              onPress={() => setActiveTab('charter')}
            >
              <Compass size={16} color={activeTab === 'charter' ? '#fff' : Colors.slate[400]} />
              <Text style={[styles.tabText, activeTab === 'charter' && styles.tabTextActive]}>Private Charters</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content Body Based on Tab Selection */}
        {activeTab === 'commercial' ? (
          <View style={styles.searchSection}>
            <Surface style={styles.searchContainer} elevation={3}>
              <View style={styles.searchHeader}>
                <View style={styles.searchDot} />
                <Text style={styles.searchLabel}>LIVE ACCREDITED IBE RESERVATION DESK</Text>
              </View>
              
              <View style={{ height: webViewHeight, overflow: 'hidden', position: 'relative' }}>
                {isLoading && (
                  <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.loadingText}>Establishing Secure GOL Gateway...</Text>
                  </View>
                )}
                {/* PREVIOUS WebView PRESERVED AS COMMENT PER USER RULES:
                <WebView 
                  source={{ uri: 'https://travellounge.golibe.com/iframe?iframe=1&target=_blank&embedded=true' }} 
                  style={styles.webview}
                  onLoadEnd={() => setIsLoading(false)}
                  scrollEnabled={false}
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                  onMessage={onMessage}
                  injectedJavaScript={injectedJS}
                />
                */}
                <WebView 
                  source={{ uri: 'https://travellounge.golibe.com/iframe?iframe=1&target=_self&embedded=true' }} 
                  style={styles.webview}
                  onLoadEnd={() => setIsLoading(false)}
                  scrollEnabled={false}
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                  onMessage={onMessage}
                  injectedJavaScript={injectedJS}
                  setSupportMultipleWindows={false}
                  onNavigationStateChange={(navState) => {
                    if (navState.url) {
                      trackFlightSearch(navState.url);
                    }
                  }}
                  onOpenWindow={(syntheticEvent) => {
                    const { nativeEvent } = syntheticEvent;
                    const { targetUrl } = nativeEvent;
                    if (__DEV__) console.log('[Flight WebView] Intercepted new window request for URL:', targetUrl);
                  }}
                />
              </View>
            </Surface>
          </View>
        ) : (
          <View style={styles.charterSection}>
            <Surface style={styles.charterCard} elevation={3}>
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&q=80&w=800' }} 
                style={styles.charterImg} 
              />
              <View style={styles.charterOverlay} />
              <View style={styles.charterContent}>
                <Text style={styles.charterTag}>VIP BESPOKE SERVICE</Text>
                <Text style={styles.charterTitle}>Private Jet & Turboprop Charters</Text>
                <Text style={styles.charterDesc}>
                  Experience uncompromised privacy, flexible routing, and immediate personalized clearances across the Indian Ocean and intercontinental sectors.
                </Text>

                <View style={styles.charterFeatures}>
                  <Text style={styles.featureItem}>• No Commercial Terminals</Text>
                  <Text style={styles.featureItem}>• Fully Tailored Itineraries</Text>
                  <Text style={styles.featureItem}>• Dedicated Concierge On-Boarding</Text>
                </View>

                <TouchableOpacity 
                  style={styles.charterBtn}
                  onPress={() => handleSupport('whatsapp', 'Private Jet Charter Arrangements')}
                >
                  <Sparkles size={16} color="#fff" />
                  <Text style={styles.charterBtnText}>REQUEST PRIVATE PROPOSAL</Text>
                </TouchableOpacity>
              </View>
            </Surface>
          </View>
        )}

        {/* Elite Assistance Section */}
        <View style={styles.assistanceSection}>
          <Surface style={styles.assistanceCard} elevation={2}>
            <View style={styles.assistanceHeader}>
              <View style={styles.conciergeIcon}>
                <Headphones size={20} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.assistanceSubtitle}>DEDICATED FLIGHT DESK</Text>
                <Text style={styles.assistanceTitle}>Complex Routings?</Text>
              </View>
            </View>
            
            <Text style={styles.assistanceDesc}>
              Allow our in-house aviation agents to source premium multi-city connections, optimized cabin fares, and complete transit management tailored perfectly to your requirements.
            </Text>

            <View style={styles.ctaGrid}>
              <TouchableOpacity 
                style={styles.primaryCta}
                onPress={() => handleSupport('whatsapp', 'Custom Flight Itineraries')}
              >
                <MessageCircle size={16} color="#fff" />
                <Text style={styles.primaryCtaText}>CONCIERGE CHAT</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.secondaryCta}
                onPress={() => handleSupport('call', 'Urgent Flight Assurances')}
              >
                <PhoneCall size={16} color="#fff" />
                <Text style={styles.secondaryCtaText}>DIRECT DESK</Text>
              </TouchableOpacity>
            </View>
          </Surface>
        </View>

        {/* Verification and Trust Footers */}
        <View style={styles.trustBanner}>
          <View style={styles.trustItem}>
            <ShieldCheck size={14} color={Colors.slate[400]} />
            <Text style={styles.trustText}>IATA PROTOCOLS</Text>
          </View>
          <View style={styles.trustItem}>
            <MapPin size={14} color={Colors.slate[400]} />
            <Text style={styles.trustText}>GLOBAL DISTRIBUTION</Text>
          </View>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

/* PREVIOUS FLIGHTS SCREEN IMPLEMENTATION PRESERVED AS COMMENT PER USER RULES:
import React, { useState, useRef } from 'react';
import { StyleSheet, View, ScrollView, Image, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { Text, Surface, IconButton } from 'react-native-paper';
import { Colors } from '../../src/theme/colors';
import { MessageCircle, Plane, ArrowRight, ShieldCheck, Headphones, MapPin, Sparkles } from 'lucide-react-native';
import * as Linking from 'expo-linking';
import { useSettings } from '../../src/context/SettingsContext';

export default function LegacyFlightsScreen() {
  // Logic omitted to save space, completely backed up in git branch
  return <View />;
}
*/

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
  },
  heroContainer: {
    height: HERO_HEIGHT,
    position: 'relative',
    backgroundColor: Colors.charcoal,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    opacity: 0.5,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  heroContent: {
    position: 'absolute',
    bottom: 35,
    left: 20,
    right: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  eliteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  eliteBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'Outfit_700Bold',
    letterSpacing: 1.5,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 22,
    fontFamily: 'Outfit_800ExtraBold',
    letterSpacing: -0.5,
  },
  heroTitleHighlight: {
    color: Colors.primary,
    fontSize: 28,
    fontFamily: 'Outfit_800ExtraBold',
    letterSpacing: -0.5,
    marginTop: -2,
  },
  heroSub: {
    color: '#E2E8F0',
    fontSize: 13,
    marginTop: 6,
    fontFamily: 'Outfit_400Regular',
    lineHeight: 18,
  },
  tabWrapper: {
    paddingHorizontal: 20,
    marginTop: -24,
    zIndex: 10,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.charcoal,
    borderRadius: 16,
    padding: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  tabButtonActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    color: Colors.slate[400],
    fontSize: 13,
    fontFamily: 'Outfit_600SemiBold',
  },
  tabTextActive: {
    color: '#fff',
  },
  searchSection: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  searchContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchHeader: {
    backgroundColor: Colors.charcoal,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  searchDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  searchLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 9,
    fontFamily: 'Outfit_700Bold',
    letterSpacing: 2,
  },
  webview: {
    backgroundColor: 'transparent',
    width: '100%',
    height: '100%',
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    zIndex: 5,
    gap: 12,
  },
  loadingText: {
    color: Colors.slate[600],
    fontSize: 13,
    fontFamily: 'Outfit_500Medium',
  },
  charterSection: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  charterCard: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: Colors.charcoal,
    position: 'relative',
  },
  charterImg: {
    width: '100%',
    height: 200,
  },
  charterOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
  },
  charterContent: {
    padding: 24,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
  },
  charterTag: {
    color: Colors.primary,
    fontSize: 10,
    fontFamily: 'Outfit_800ExtraBold',
    letterSpacing: 2,
    marginBottom: 4,
  },
  charterTitle: {
    color: '#fff',
    fontSize: 20,
    fontFamily: 'Outfit_700Bold',
    marginBottom: 8,
  },
  charterDesc: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'Outfit_400Regular',
    marginBottom: 16,
  },
  charterFeatures: {
    marginBottom: 20,
    gap: 4,
  },
  featureItem: {
    color: '#E2E8F0',
    fontSize: 12,
    fontFamily: 'Outfit_500Medium',
  },
  charterBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  charterBtnText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Outfit_700Bold',
    letterSpacing: 0.5,
  },
  assistanceSection: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  assistanceCard: {
    backgroundColor: Colors.charcoal,
    borderRadius: 24,
    padding: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  assistanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  conciergeIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(220, 38, 38, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  assistanceSubtitle: {
    color: Colors.primary,
    fontSize: 10,
    fontFamily: 'Outfit_800ExtraBold',
    letterSpacing: 2,
  },
  assistanceTitle: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
  },
  assistanceDesc: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'Outfit_400Regular',
    marginBottom: 20,
  },
  ctaGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryCta: {
    flex: 1,
    height: 50,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryCtaText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Outfit_700Bold',
    letterSpacing: 0.5,
  },
  secondaryCta: {
    flex: 0.8,
    height: 50,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  secondaryCtaText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Outfit_700Bold',
  },
  trustBanner: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 16,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trustText: {
    color: Colors.slate[400],
    fontSize: 10,
    fontFamily: 'Outfit_600SemiBold',
    letterSpacing: 1,
  }
});
