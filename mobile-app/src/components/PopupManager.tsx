import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Modal, Image, TouchableOpacity, Dimensions, Linking } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { Colors } from '../theme/colors';
import { supabase } from '../lib/supabase';
import { X, ExternalLink } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { resolveImageUrl } from '../utils/imageUtils';

const { width, height } = Dimensions.get('window');

export const PopupManager = () => {
  const [activeAd, setActiveAd] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    checkAndShowAd();
  }, []);

  const checkAndShowAd = async () => {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('popup_ads')
        .select('*')
        .eq('is_active', true)
        .or(`start_at.is.null,start_at.lte.${now}`)
        .or(`end_at.is.null,end_at.gte.${now}`)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      if (!data || data.length === 0) return;

      const ad = data[0];
      const storageKey = `popup_viewed_${ad.id}`;
      const lastViewed = await AsyncStorage.getItem(storageKey);

      let shouldShow = false;
      if (ad.display_frequency === 'always') {
        shouldShow = true;
      } else if (ad.display_frequency === 'once_per_session') {
        // In mobile, we'll treat 'once_per_session' as once per app launch
        // We can use a global variable or just check if it was viewed in the last hour
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        if (!lastViewed || parseInt(lastViewed) < oneHourAgo) {
          shouldShow = true;
        }
      } else if (ad.display_frequency === 'once_per_day') {
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
        if (!lastViewed || parseInt(lastViewed) < oneDayAgo) {
          shouldShow = true;
        }
      }

      if (shouldShow) {
        setActiveAd(ad);
        setTimeout(() => setIsVisible(true), 2000); // 2 second delay for better UX
      }
    } catch (err) {
      console.error('Error checking popup ads:', err);
    }
  };

  const handleClose = async () => {
    setIsVisible(false);
    if (activeAd) {
      await AsyncStorage.setItem(`popup_viewed_${activeAd.id}`, Date.now().toString());
    }
  };

  const handleCTA = () => {
    if (activeAd?.cta_link) {
      if (activeAd.cta_link.startsWith('http')) {
        Linking.openURL(activeAd.cta_link);
      } else {
        // Handle internal linking or just open as web if it's a slug
        // For now, let's assume it's external if it doesn't start with /
        Linking.openURL(`https://travel-lounge.com${activeAd.cta_link}`);
      }
    }
    handleClose();
  };

  if (!activeAd) return null;

  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <X size={20} color={Colors.white} />
          </TouchableOpacity>

          {activeAd.media_url && activeAd.media_type === 'image' && (
            <Image 
              source={resolveImageUrl(activeAd.media_url)} 
              style={styles.image}
              resizeMode="cover"
            />
          )}

          <View style={styles.content}>
            <Text style={styles.title}>{activeAd.title}</Text>
            {activeAd.content && (
              <Text style={styles.message}>{activeAd.content}</Text>
            )}
            
            <TouchableOpacity style={styles.cta} onPress={handleCTA}>
              <Text style={styles.ctaText}>{activeAd.cta_text || 'LEARN MORE'}</Text>
              <ExternalLink size={14} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: Colors.white,
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  image: {
    width: '100%',
    height: 200,
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Outfit_900Black',
    fontSize: 22,
    color: Colors.charcoal,
    textAlign: 'center',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  message: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 14,
    color: Colors.slate[500],
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  cta: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaText: {
    color: Colors.white,
    fontFamily: 'Outfit_900Black',
    fontSize: 12,
    letterSpacing: 1,
  },
});
