import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { 
  List, 
  ActivityIndicator, 
  Text, 
  Searchbar,
} from 'react-native-paper';
import { supabase } from '../src/lib/supabase';

type FAQ = {
  id: string;
  question: string;
  answer: string;
  category: string;
  order_index: number;
};

export default function FAQScreen() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    try {
      const { data, error } = await supabase
        .from('faqs')
        .select('*')
        .eq('is_published', true)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setFaqs(data || []);
    } catch (err) {
      console.error('Error fetching FAQs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredFAQs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group FAQs by category
  const categories = Array.from(new Set(faqs.map(faq => faq.category)));

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#DC2626" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Searchbar
          placeholder="Search questions..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          elevation={0}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {categories.map((category) => {
          const catFAQs = filteredFAQs.filter(f => f.category === category);
          if (catFAQs.length === 0) return null;

          return (
            <List.Section key={category} title={category.toUpperCase()} titleStyle={styles.sectionTitle}>
              {catFAQs.map((faq) => (
                <List.Accordion
                  key={faq.id}
                  title={faq.question}
                  titleStyle={styles.accordionTitle}
                  titleNumberOfLines={2}
                  expanded={expandedId === faq.id}
                  onPress={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                  left={props => <List.Icon {...props} icon="help-circle-outline" color="#DC2626" />}
                  style={styles.accordion}
                >
                  <View style={styles.answerContainer}>
                    <Text style={styles.answerText}>{faq.answer}</Text>
                  </View>
                </List.Accordion>
              ))}
            </List.Section>
          );
        })}
        
        {filteredFAQs.length === 0 && (
          <View style={styles.center}>
            <Text style={styles.emptyText}>No matching questions found.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFF',
  },
  searchBar: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  content: {
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 2,
    marginLeft: 16,
    marginTop: 24,
  },
  accordion: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  accordionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  answerContainer: {
    padding: 24,
    backgroundColor: '#F8FAFC',
    marginHorizontal: 16,
    marginBottom: 16,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  answerText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 14,
  },
});
