import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { Text, Title, Paragraph, Surface } from 'react-native-paper';

type Promotion = {
    id: string;
    title: string;
    description: string;
    image: string;
    category: string;
};

const PROMOTIONS: Promotion[] = [
    {
        id: 'promo1',
        title: 'Summer Sale',
        description: 'Up to 30% off on beachfront villas',
        image: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?q=80&w=600&auto=format&fit=crop',
        category: 'Limited Offer'
    },
    {
        id: 'promo2',
        title: 'Honeymoon Special',
        description: 'Free spa treatment for couples',
        image: 'https://images.unsplash.com/photo-1515238152791-8216bfdf89a7?q=80&w=600&auto=format&fit=crop',
        category: 'Honeymoon'
    },
    {
        id: 'promo3',
        title: 'Family Package',
        description: 'Kids under 12 stay for free',
        image: 'https://images.unsplash.com/photo-1538964173425-93884d739596?q=80&w=600&auto=format&fit=crop',
        category: 'Family'
    }
];

export default function PromotionsCarousel() {
    const renderItem = ({ item }: { item: Promotion }) => (
        <Surface style={styles.card} elevation={2}>
            <TouchableOpacity activeOpacity={0.9} style={styles.touchable}>
                <Image
                    source={{ uri: item.image }}
                    style={styles.image}
                    resizeMode="cover"
                />
                <View style={styles.overlay}>
                    <View style={styles.tagBatch}>
                        <Text style={styles.tagText}>{item.category.toUpperCase()}</Text>
                    </View>
                    <Title style={styles.cardTitle}>{item.title}</Title>
                    <Paragraph style={styles.cardPara} numberOfLines={1}>{item.description}</Paragraph>
                </View>
            </TouchableOpacity>
        </Surface>
    );

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <Text style={styles.header}>SEASONAL DEALS</Text>
                <TouchableOpacity>
                   <Text style={styles.seeAll}>SEE ALL</Text>
                </TouchableOpacity>
            </View>
            <FlatList
                data={PROMOTIONS}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 40,
        marginBottom: 20,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 16,
    },
    header: {
        fontSize: 10,
        fontWeight: '900',
        color: '#64748B',
        letterSpacing: 2,
    },
    seeAll: {
        fontSize: 10,
        fontWeight: '900',
        color: '#DC2626',
        letterSpacing: 2,
    },
    listContent: {
        paddingLeft: 24,
        paddingRight: 8,
        paddingBottom: 20,
    },
    card: {
        width: 300,
        height: 180,
        marginRight: 16,
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: '#FFF',
    },
    touchable: {
        flex: 1,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    overlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    tagBatch: {
        backgroundColor: '#DC2626',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        alignSelf: 'flex-start',
        marginBottom: 4,
    },
    tagText: {
        fontSize: 8,
        fontWeight: '900',
        color: '#FFF',
        letterSpacing: 1,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#FFF',
        lineHeight: 22,
    },
    cardPara: {
        fontSize: 12,
        fontWeight: '700',
        color: 'rgba(255,255,255,0.8)',
    },
});
