import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Text, ActivityIndicator, Surface } from 'react-native-paper';
import { useWishlist } from '../../src/context/WishlistContext';
import { Colors } from '../../src/theme/colors';
import { Heart, MapPin, Star, Sparkles } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { resolveImageUrl } from '../../src/utils/imageUtils';

const { width } = Dimensions.get('window');

export default function WishlistScreen() {
  const { wishlist, toggleWishlist } = useWishlist();
  const router = useRouter();

  const renderWishlistItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      activeOpacity={0.9}
      onPress={() => router.push(`/services/${item.id}`)}
      style={styles.cardContainer}
    >
      <Surface style={styles.card} elevation={1}>
        <View style={styles.imageWrapper}>
          <Image 
            source={resolveImageUrl(item.image_url)} 
            style={styles.image} 
          />
          <TouchableOpacity 
            style={styles.wishlistButton}
            onPress={() => toggleWishlist(item)}
          >
            <Heart size={20} color="#DC2626" fill="#DC2626" />
          </TouchableOpacity>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.category || 'Experience'}</Text>
          </View>
        </View>
        
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
            <View style={styles.ratingRow}>
              <Star size={12} color="#D97706" fill="#D97706" />
              <Text style={styles.ratingText}>{item.rating || '4.9'}</Text>
            </View>
          </View>

          <View style={styles.locationRow}>
            <MapPin size={12} color={Colors.slate[400]} />
            <Text style={styles.locationText}>{item.location || 'Mauritius'}</Text>
          </View>

          <View style={styles.footer}>
            <View>
              <Text style={styles.priceLabel}>EXECUTIVE PRICE</Text>
              <Text style={styles.priceValue}>Rs {(item.price ?? 0).toLocaleString()}</Text>
            </View>
            <View style={styles.benefitBadge}>
               <Sparkles size={10} color="#D97706" />
               <Text style={styles.benefitText}>PREMIUM</Text>
            </View>
          </View>
        </View>
      </Surface>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Heart size={48} color={Colors.slate[200]} strokeWidth={1} />
      </View>
      <Text style={styles.emptyTitle}>Your Wishlist is Empty</Text>
      <Text style={styles.emptySubtitle}>
        Save your favorite premium experiences here to plan your perfect journey later.
      </Text>
      <TouchableOpacity 
        style={styles.exploreButton}
        onPress={() => router.push('/explore')}
      >
        <Text style={styles.exploreButtonText}>Explore Experiences</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={styles.screenHeader}>
        <Text style={styles.screenTitle}>My Wishlist</Text>
        <Text style={styles.screenSubtitle}>{wishlist.length} saved experiences</Text>
      </View>

      <FlatList
        data={wishlist}
        keyExtractor={(item) => item.id}
        renderItem={renderWishlistItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  screenHeader: {
    paddingTop: 80,
    paddingHorizontal: 24,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
  },
  screenTitle: {
    fontFamily: 'Outfit_900Black',
    fontSize: 32,
    color: Colors.charcoal,
    letterSpacing: -1,
  },
  screenSubtitle: {
    fontFamily: 'Outfit_500Medium',
    color: Colors.slate[400],
    fontSize: 14,
    marginTop: 4,
  },
  listContent: {
    padding: 24,
    paddingBottom: 120,
  },
  cardContainer: {
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
  },
  imageWrapper: {
    height: 200,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  wishlistButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryBadge: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  categoryText: {
    fontFamily: 'Outfit_900Black',
    fontSize: 9,
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  content: {
    padding: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    flex: 1,
    fontFamily: 'Outfit_900Black',
    fontSize: 20,
    color: Colors.charcoal,
    marginRight: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontFamily: 'Outfit_900Black',
    fontSize: 12,
    color: Colors.charcoal,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  locationText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 13,
    color: Colors.slate[400],
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  priceLabel: {
    fontFamily: 'Outfit_900Black',
    fontSize: 9,
    color: Colors.slate[400],
    letterSpacing: 2,
    marginBottom: 4,
  },
  priceValue: {
    fontFamily: 'Outfit_900Black',
    fontSize: 20,
    color: Colors.primary,
  },
  benefitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  benefitText: {
    fontFamily: 'Outfit_900Black',
    fontSize: 9,
    color: '#D97706',
    letterSpacing: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontFamily: 'Outfit_900Black',
    fontSize: 24,
    color: Colors.charcoal,
    marginBottom: 12,
  },
  emptySubtitle: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 15,
    color: Colors.slate[400],
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 40,
    marginBottom: 32,
  },
  exploreButton: {
    backgroundColor: Colors.charcoal,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 20,
  },
  exploreButtonText: {
    fontFamily: 'Outfit_900Black',
    fontSize: 12,
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
});
