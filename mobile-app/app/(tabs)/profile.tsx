import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, Avatar, Surface, Divider } from 'react-native-paper';
import { useAuth } from '../../src/context/AuthContext';
import { Colors } from '../../src/theme/colors';
import { Sparkles, User, Settings, Shield, Bell, HelpCircle, LogOut, ChevronRight, MessageSquare, Phone } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { useSettings } from '../../src/context/SettingsContext';
import * as Linking from 'expo-linking';

export default function ProfileScreen() {
  const { session, signOut } = useAuth();
  const { mobileConfig, generalConfig } = useSettings();

  const handleLogout = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to exit your premium session?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Sign Out", style: "destructive", onPress: signOut }
      ]
    );
  };

  const handleSupport = (method: 'whatsapp' | 'email') => {
    const contact = {
      phone: mobileConfig?.supportPhone || generalConfig?.contactPhone || '+230 5940 7701',
      email: generalConfig?.contactEmail || 'office@travel-lounge.com'
    };
    if (method === 'whatsapp') Linking.openURL(`https://wa.me/${contact.phone.replace(/\+/g, '')}`);
    if (method === 'email') Linking.openURL(`mailto:${contact.email}`);
  };

  const MenuItem = ({ icon: Icon, title, subtitle, onPress, color = Colors.charcoal }: any) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIconWrapper, { backgroundColor: color + '10' }]}>
        <Icon size={20} color={color} />
      </View>
      <View style={styles.menuTextContent}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      <ChevronRight size={18} color={Colors.slate[300]} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Elite Member Profile Header */}
        <View style={styles.header}>
          <View style={styles.profileInfo}>
            <View style={styles.avatarWrapper}>
                <Avatar.Text 
                    size={80} 
                    label={session?.user?.email?.substring(0, 2).toUpperCase() || 'TL'} 
                    style={styles.avatar}
                    labelStyle={styles.avatarLabel}
                />
                <View style={styles.statusBadge}>
                    <Sparkles size={12} color={Colors.white} />
                </View>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{session?.user?.email?.split('@')[0].toUpperCase() || 'GUEST MEMBER'}</Text>
              <View style={styles.tierBadge}>
                <Text style={styles.tierText}>PLATINUM MEMBER</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Account Overview</Text>
          <Surface style={styles.sectionCard} elevation={0}>
            <MenuItem icon={User} title="Personal Details" subtitle="Manage your profile information" />
            <Divider style={styles.divider} />
            <MenuItem icon={Bell} title="Notifications" subtitle="Alerts, offers and trip updates" />
            <Divider style={styles.divider} />
            <MenuItem icon={Shield} title="Privacy & Security" subtitle="Passwords and data preferences" />
          </Surface>

          <Text style={styles.sectionTitle}>Elite Support</Text>
          <Surface style={styles.sectionCard} elevation={0}>
            <MenuItem 
              icon={MessageSquare} 
              title="WhatsApp Concierge" 
              subtitle="Instant support for your bookings" 
              color="#25D366"
              onPress={() => handleSupport('whatsapp')}
            />
            <Divider style={styles.divider} />
            <MenuItem 
              icon={HelpCircle} 
              title="Help Center" 
              subtitle="FAQs and travel guidelines" 
            />
          </Surface>

          <Text style={styles.sectionTitle}>Application</Text>
          <Surface style={styles.sectionCard} elevation={0}>
            <MenuItem icon={Settings} title="Preferences" subtitle="Currency, language and theme" />
            <Divider style={styles.divider} />
            <MenuItem 
              icon={LogOut} 
              title="Sign Out" 
              color="#EF4444" 
              onPress={handleLogout}
            />
          </Surface>

          <View style={styles.footerInfoSection}>
            <Text style={styles.versionText}>
              TRAVEL LOUNGE ECOSYSTEM v{mobileConfig?.appVersion || '1.1.0'}
            </Text>
            <Text style={styles.copyrightText}>© 2026 Executive Excellence Hub</Text>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingTop: 80,
    paddingBottom: 32,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    backgroundColor: Colors.charcoal,
  },
  avatarLabel: {
    fontFamily: 'Outfit_900Black',
    fontSize: 24,
    color: Colors.white,
  },
  statusBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontFamily: 'Outfit_900Black',
    fontSize: 22,
    color: Colors.charcoal,
    letterSpacing: -0.5,
  },
  tierBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  tierText: {
    fontFamily: 'Outfit_900Black',
    fontSize: 9,
    color: '#D97706',
    letterSpacing: 1,
  },
  content: {
    padding: 24,
  },
  sectionTitle: {
    fontFamily: 'Outfit_900Black',
    fontSize: 12,
    color: Colors.slate[400],
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 16,
    marginTop: 12,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
  },
  menuIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuTextContent: {
    flex: 1,
  },
  menuTitle: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 15,
    color: Colors.charcoal,
  },
  menuSubtitle: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 12,
    color: Colors.slate[400],
    marginTop: 2,
  },
  divider: {
    backgroundColor: '#F1F5F9',
    marginHorizontal: 16,
  },
  footerInfoSection: {
    marginTop: 24,
    alignItems: 'center',
    gap: 8,
  },
  versionText: {
    fontFamily: 'Outfit_900Black',
    color: Colors.slate[200],
    fontSize: 10,
    letterSpacing: 3,
  },
  copyrightText: {
    fontFamily: 'Outfit_500Medium',
    color: Colors.slate[200],
    fontSize: 10,
  },
});

