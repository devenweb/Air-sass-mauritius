import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface WordPressPost {
  id: number;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
  };
  excerpt: {
    rendered: string;
  };
  slug: string;
  date: string;
  featured_media: number;
}

interface WordPressMedia {
  id: number;
  source_url: string;
  title: {
    rendered: string;
  };
  alt_text: string;
}

/**
 * Fetch all posts from WordPress site
 */
async function fetchWordPressPosts(wordpressSiteUrl: string): Promise<WordPressPost[]> {
  const posts: WordPressPost[] = [];
  let page = 1;
  
  try {
    while (true) {
      const response = await axios.get(`${wordpressSiteUrl}/wp-json/wp/v2/posts`, {
        params: {
          per_page: 100,
          page: page,
          _embed: true
        },
        headers: {
          'User-Agent': 'DataMigrationBot/1.0'
        }
      });
      
      if (response.data.length === 0) {
        break;
      }
      
      posts.push(...response.data);
      page++;
      
      // Be respectful to the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return posts;
  } catch (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }
}

/**
 * Fetch media items from WordPress
 */
async function fetchWordPressMedia(wordpressSiteUrl: string): Promise<WordPressMedia[]> {
  const mediaItems: WordPressMedia[] = [];
  let page = 1;
  
  try {
    while (true) {
      const response = await axios.get(`${wordpressSiteUrl}/wp-json/wp/v2/media`, {
        params: {
          per_page: 100,
          page: page
        },
        headers: {
          'User-Agent': 'DataMigrationBot/1.0'
        }
      });
      
      if (response.data.length === 0) {
        break;
      }
      
      mediaItems.push(...response.data);
      page++;
      
      // Be respectful to the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return mediaItems;
  } catch (error) {
    console.error('Error fetching media:', error);
    throw error;
  }
}

/**
 * Insert posts into Supabase
 */
async function insertPostsIntoSupabase(posts: WordPressPost[]) {
  for (const post of posts) {
    // Example mapping - adjust according to your Supabase table structure
    const { data, error } = await supabase
      .from('news') // Adjust table name to match your schema
      .insert({
        title: post.title.rendered,
        content: post.content.rendered,
        excerpt: post.excerpt.rendered,
        slug: post.slug,
        published_at: post.date,
        featured_image_id: post.featured_media
      });

    if (error) {
      console.error(`Error inserting post ${post.id}:`, error);
    } else {
      console.log(`Successfully inserted post ${post.id}`);
    }
  }
}

/**
 * Main migration function
 */
async function migrateWordPressData() {
  const wordpressSiteUrl = process.env.WORDPRESS_SITE_URL;
  
  if (!wordpressSiteUrl) {
    console.error('Missing WORDPRESS_SITE_URL environment variable');
    return;
  }

  console.log('Starting WordPress data migration...');
  
  try {
    console.log('Fetching posts...');
    const posts = await fetchWordPressPosts(wordpressSiteUrl);
    console.log(`Fetched ${posts.length} posts`);
    
    console.log('Fetching media...');
    const media = await fetchWordPressMedia(wordpressSiteUrl);
    console.log(`Fetched ${media.length} media items`);
    
    console.log('Inserting posts into Supabase...');
    await insertPostsIntoSupabase(posts);
    
    console.log('Migration completed!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateWordPressData();
}

export { 
  fetchWordPressPosts, 
  fetchWordPressMedia, 
  insertPostsIntoSupabase, 
  migrateWordPressData 
};