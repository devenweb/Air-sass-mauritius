import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  SafeAreaView,
  Image,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  ActivityIndicator, 
  Text, 
  Title, 
  Paragraph, 
} from 'react-native-paper';
import { supabase } from '../../src/lib/supabase';
import PremiumCard from '../../src/components/PremiumCard';
import { resolveImageUrl } from '../../src/utils/imageUtils';

type Post = {
  id: string;
  title: string;
  excerpt: string;
  featured_image: string;
  published_at: string;
  admins: {
    name: string;
  } | null;
};

export default function NewsScreen() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('editorial_posts')
        .select(`
          *,
          admins:author_id (name)
        `)
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching news:', err);
      setError(err?.message || 'Failed to load articles. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  };

  const renderPostItem = useCallback(({ item }: { item: Post }) => (
    <TouchableOpacity 
      activeOpacity={0.9} 
      onPress={() => router.push(`/news/${item.id}`)}
    >
      <PremiumCard style={styles.card}>
        {item.featured_image && (
          <Image source={resolveImageUrl(item.featured_image)} style={styles.cardImage} />
        )}
        <View style={styles.cardContent}>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>
              {new Date(item.published_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </Text>
            {item.admins?.name && (
              <Text style={styles.metaText}>By {item.admins.name}</Text>
            )}
          </View>
          <Title style={styles.cardTitle}>{item.title}</Title>
          <Paragraph numberOfLines={3} style={styles.cardPara}>
            {item.excerpt}
          </Paragraph>
        </View>
      </PremiumCard>
    </TouchableOpacity>
  ), []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#DC2626" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>⚠️ {error}</Text>
        <Text style={styles.emptyText} onPress={fetchPosts}>Tap to retry</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={posts}
        renderItem={renderPostItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#DC2626" />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.preHeader}>EDITORIAL</Text>
            <Text style={styles.mainHeader}>Travel Insights</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>No news articles found.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    backgroundColor: '#FFF',
    marginBottom: 16,
  },
  preHeader: {
    fontSize: 10,
    fontWeight: '900',
    color: '#DC2626',
    letterSpacing: 4,
    marginBottom: 8,
  },
  mainHeader: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1E293B',
    letterSpacing: -1,
  },
  listContent: {
    paddingBottom: 40,
  },
  card: {
    marginHorizontal: 24,
    marginBottom: 24,
  },
  cardImage: {
    width: '100%',
    height: 200,
  },
  cardContent: {
    padding: 24,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metaText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1E293B',
    lineHeight: 24,
    marginBottom: 8,
  },
  cardPara: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 22,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 8,
    textDecorationLine: 'underline',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
