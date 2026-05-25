import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Dimensions, Animated, TextInput, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { Text, Surface, Portal, Modal, ActivityIndicator } from 'react-native-paper';
import { MessageSquare, X, Mic, Send, Volume2, Sparkles, Headphones } from 'lucide-react-native';
import { Colors } from '../theme/colors';
import * as Linking from 'expo-linking';
import { useSettings } from '../context/SettingsContext';

const { width, height } = Dimensions.get('window');

export const AIConcierge = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const { mobileConfig, generalConfig } = useSettings();
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(20))[0];

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 20, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [isOpen]);

  const handleSend = () => {
    if (!message.trim()) return;
    const phone = mobileConfig?.supportPhone || generalConfig?.contactPhone || '23055097701';
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phone.replace(/\+/g, '').replace(/\s+/g, '')}?text=${encodedMessage}`;
    Linking.openURL(whatsappUrl);
    setMessage('');
    setIsOpen(false);
  };

  const toggleVoice = () => {
    setIsListening(!isListening);
    // In a real app, integrate expo-speech-recognition
    // For now, we simulate the 'listening' state as a visual feature
    if (!isListening) {
      setTimeout(() => {
        setIsListening(false);
        setMessage("I want to book a luxury getaway in Mauritius...");
      }, 2000);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <View style={styles.fabContainer}>
        <TouchableOpacity 
          style={[styles.fab, isOpen && styles.fabOpen]} 
          onPress={() => setIsOpen(!isOpen)}
          activeOpacity={0.8}
        >
          {isOpen ? <X color="#fff" size={24} /> : <MessageSquare color="#fff" size={24} />}
          {!isOpen && (
            <View style={styles.onlineBadge}>
               <View style={styles.ping} />
            </View>
          )}
        </TouchableOpacity>
      </View>

      <Portal>
        <Modal 
          visible={isOpen} 
          onDismiss={() => setIsOpen(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Animated.View style={[
            styles.chatContainer,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerBg} />
              <View style={styles.headerContent}>
                 <View style={styles.avatarRow}>
                    <Surface style={styles.botIcon} elevation={4}>
                       <Sparkles size={18} color="#fff" />
                    </Surface>
                    <View>
                       <Text style={styles.headerTitle}>AI CONCIERGE</Text>
                       <View style={styles.statusRow}>
                          <View style={styles.statusDot} />
                          <Text style={styles.statusText}>ELITE ASSISTANCE ONLINE</Text>
                       </View>
                    </View>
                 </View>
                 <TouchableOpacity style={styles.closeBtn} onPress={() => setIsOpen(false)}>
                    <X size={20} color="rgba(255,255,255,0.4)" />
                 </TouchableOpacity>
              </View>
            </View>

            {/* Body */}
            <KeyboardAvoidingView 
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.body}
            >
              <View style={styles.suggestionCard}>
                 <Text style={styles.suggestionLabel}>HOW CAN I HELP?</Text>
                 <Text style={styles.suggestionText}>
                   "I'm looking for a premium hotel in the North for 3 nights next week..."
                 </Text>
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  placeholder="Tell me your requirements..."
                  placeholderTextColor={Colors.slate[400]}
                  style={styles.input}
                  multiline
                  value={message}
                  onChangeText={setMessage}
                />
                <TouchableOpacity 
                  style={[styles.micBtn, isListening && styles.micBtnActive]} 
                  onPress={toggleVoice}
                >
                  {isListening ? <Volume2 size={20} color="#fff" /> : <Mic size={20} color={Colors.slate[400]} />}
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={[styles.sendBtn, !message.trim() && styles.sendBtnDisabled]}
                onPress={handleSend}
                disabled={!message.trim()}
              >
                 <Send size={16} color="#fff" />
                 <Text style={styles.sendBtnText}>START AI BOOKING</Text>
              </TouchableOpacity>

              <View style={styles.footer}>
                 <Headphones size={12} color={Colors.slate[400]} />
                 <Text style={styles.footerText}>CONNECTS TO WHATSAPP BUSINESS</Text>
              </View>
            </KeyboardAvoidingView>
          </Animated.View>
        </Modal>
      </Portal>
    </>
  );
};

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    bottom: 30,
    right: 24,
    zIndex: 1000,
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fabOpen: {
    backgroundColor: Colors.charcoal,
    transform: [{ rotate: '90deg' }],
  },
  onlineBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#fff',
  },
  ping: {
    width: '100%',
    height: '100%',
    borderRadius: 7,
    backgroundColor: '#fff',
    opacity: 0.4,
  },
  modalContent: {
    margin: 20,
    justifyContent: 'flex-end',
    flex: 1,
    paddingBottom: 40,
  },
  chatContainer: {
    backgroundColor: '#fff',
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 12,
  },
  header: {
    height: 100,
    position: 'relative',
    backgroundColor: Colors.charcoal,
  },
  headerBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  botIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  statusText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    padding: 24,
  },
  suggestionCard: {
    backgroundColor: Colors.slate[50],
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  suggestionLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: Colors.slate[400],
    letterSpacing: 2,
    marginBottom: 8,
  },
  suggestionText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.charcoal,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  input: {
    backgroundColor: Colors.slate[50],
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    paddingRight: 60,
    fontSize: 14,
    color: Colors.charcoal,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  micBtn: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  micBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  sendBtn: {
    height: 60,
    backgroundColor: Colors.charcoal,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sendBtnDisabled: {
    opacity: 0.3,
  },
  sendBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  footerText: {
    fontSize: 8,
    fontWeight: '900',
    color: Colors.slate[400],
    letterSpacing: 1,
  }
});
