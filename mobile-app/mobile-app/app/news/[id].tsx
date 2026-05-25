import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  TouchableOpacity,
  Share,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { 
  ActivityIndicator, 
  Text,
} from 'react-native-paper';
import { supabase } from '../../src/lib/supabase';
import { resolveImageUrl } from '../../src/utils/imageUtils';
import { Colors } from '../../src/theme/colors';
import { ArrowLeft, Share2, Clock, User, Tag } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

type Post = {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  featured_image: string;
  published_at: string;
  tags?: string[];
  admins: {
    name: string;
  } | null;
};

export default function NewsDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchPost();
    }
  }, [id]);

  const fetchPost = async () => {
    try {
      const { data, error } = await supabase
        .from('editorial_posts')
        .select(`
          *,
          admins:author_id (name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setPost(data);
    } catch (err) {
      console.error('Error fetching news detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!post) return;
    try {
      await Share.share({
        message: `${post.title}\n\n${post.excerpt}\n\nRead more on Travel Lounge app.`,
        title: post.title,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.center}>
        <Text>Article not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>GO BACK</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Image */}
        <View style={styles.imageContainer}>
          <Image 
            source={resolveImageUrl(post.featured_image)} 
            style={styles.image}
            resizeMode="cover"
          />
          <View style={styles.overlay} />
          
          <SafeAreaView style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.circleBtn} 
              onPress={() => router.back()}
            >
              <ArrowLeft size={20} color={Colors.charcoal} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.circleBtn} 
              onPress={handleShare}
            >
              <Share2 size={20} color={Colors.charcoal} />
            </TouchableOpacity>
          </SafeAreaView>

          <View style={styles.titleContainer}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>TRAVEL INSIGHTS</Text>
            </View>
            <Text style={styles.title}>{post.title}</Text>
          </View>
        </View>

        <View style={styles.contentWrapper}>
          {/* Multi-Meta Row */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Clock size={14} color={Colors.slate[400]} />
              <Text style={styles.metaLabel}>
                {new Date(post.published_at).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <User size={14} color={Colors.slate[400]} />
              <Text style={styles.metaLabel}>
                By {post.admins?.name || 'Editorial Team'}
              </Text>
            </View>
          </View>

          {/* Excerpt/Intro */}
          {post.excerpt && (
            <View style={styles.excerptBox}>
              <Text style={styles.excerptText}>{post.excerpt}</Text>
            </View>
          )}

          {/* Body Content */}
          <Text style={styles.contentText}>{post.content}</Text>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {post.tags.map((tag, idx) => (
                <View key={idx} style={styles.tagBadge}>
                  <Tag size={12} color={Colors.slate[500]} />
                  <Text style={styles.tagText}>{tag.toUpperCase()}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
        
        {/* Footer Padding */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    height: 480,
    width: '100%',
    position: 'relative',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 20,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  titleContainer: {
    position: 'absolute',
    bottom: 40,
    left: 24,
    right: 24,
  },
  categoryBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  categoryText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  },
  title: {
    color: '#FFF',
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 40,
    letterSpacing: -1,
  },
  contentWrapper: {
    padding: 24,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 32,
    borderBottomWidth: 1,
    borderBottomColor: Colors.slate[50],
    paddingBottom: 24,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaLabel: {
    fontSize: 12,
    color: Colors.slate[400],
    fontWeight: '700',
  },
  excerptBox: {
    marginBottom: 32,
    paddingLeft: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  excerptText: {
    fontSize: 18,
    fontStyle: 'italic',
    color: Colors.charcoal,
    lineHeight: 28,
    fontWeight: '500',
  },
  contentText: {
    fontSize: 16,
    color: Colors.slate[700],
    lineHeight: 28,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 40,
    paddingTop: 32,
    borderTopWidth: 1,
    borderTopColor: Colors.slate[50],
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.slate[50],
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.slate[500],
    letterSpacing: 1,
  },
  backBtn: {
    marginTop: 20,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backBtnText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 1,
  },
});
