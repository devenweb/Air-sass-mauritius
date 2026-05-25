import React from 'react';
import { View, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { Text, ActivityIndicator, Surface, Chip } from 'react-native-paper';
import { useCustomerBookings, Booking } from '../../src/hooks/useCustomerBookings';
import { Colors } from '../../src/theme/colors';
import { MapPin, Calendar, Clock, ChevronRight, Plane } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function BookingsScreen() {
  const { bookings, isLoading, error } = useCustomerBookings();
  const router = useRouter();

  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed': return '#059669';
      case 'pending': return Colors.primary;
      case 'cancelled': return Colors.textSecondary;
      default: return Colors.charcoal;
    }
  };

  const renderBookingItem = ({ item }: { item: Booking }) => (
    <TouchableOpacity 
      activeOpacity={0.9} 
      onPress={() => router.push(`/services/${item.service_id}`)}
    >
      <Surface style={styles.bookingCard} elevation={1}>
        <Image 
          source={{ uri: item.image_url || undefined }} 
          defaultSource={require('../../assets/icon.png')}
          style={styles.thumbnail} 
        />
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text variant="titleMedium" style={styles.serviceName} numberOfLines={1}>
              {item.service_name || item.service_type}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                {item.status}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <MapPin size={12} color={Colors.textSecondary} />
            <Text style={styles.infoText}>{item.location}</Text>
          </View>

          <View style={styles.footer}>
            <View style={styles.infoRow}>
              <Calendar size={12} color={Colors.textSecondary} />
              <Text style={styles.infoText}>
                {new Date(item.created_at).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>Total</Text>
              <Text style={styles.price}>Rs {(item.total_amount ?? 0).toLocaleString()}</Text>
            </View>
          </View>
        </View>
      </Surface>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Plane size={48} color={Colors.textSecondary} strokeWidth={1} />
      </View>
      <Text variant="titleLarge" style={styles.emptyTitle}>No adventures yet</Text>
      <Text variant="bodyMedium" style={styles.emptySubtitle}>
        Your travel inquiries and bookings will appear here. Start exploring our premium destinations!
      </Text>
      <TouchableOpacity 
        style={styles.exploreButton}
        onPress={() => router.push('/explore')}
      >
        <Text style={styles.exploreButtonText}>Discover Experiences</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>My Bookings</Text>
        <Text variant="bodyMedium" style={styles.subtitle}>Your travel history and inquiries</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id}
          renderItem={renderBookingItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 80,
    paddingHorizontal: 24,
    paddingBottom: 24,
    backgroundColor: Colors.white,
  },
  title: {
    fontWeight: '900',
    color: Colors.charcoal,
    letterSpacing: -1,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontWeight: '500',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  bookingCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
  },
  thumbnail: {
    width: 100,
    height: '100%',
    minHeight: 120,
  },
  cardContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  serviceName: {
    flex: 1,
    fontWeight: '800',
    color: Colors.charcoal,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  infoText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 12,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: 9,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  price: {
    fontWeight: '900',
    color: Colors.primary,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontWeight: '900',
    color: Colors.charcoal,
    marginBottom: 12,
  },
  emptySubtitle: {
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  exploreButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  exploreButtonText: {
    color: Colors.white,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
