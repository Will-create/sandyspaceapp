import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Pressable, 
  Image,
  ActivityIndicator,
  Dimensions 
} from 'react-native';
import { router } from 'expo-router';
import { Category } from '@/types';
import { getCategories } from '@/lib/storage';

export default function HomeScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      setLoading(true);
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (error) {
        console.error('Failed to load categories:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  const handleCategoryPress = (categoryId: string, categoryName: string) => {
    router.push({
      pathname: `/products/${categoryId}`,
      params: { name: categoryName }
    });
  };

  // Calculate number of columns based on screen width
  const screenWidth = Dimensions.get('window').width;
  const numColumns = screenWidth > 768 ? 3 : 2;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.welcomeText}>
        Bienvenue sur SandySpace
      </Text>
      <Text style={styles.instructionText}>
        Sélectionnez une catégorie pour voir ou ajouter des produits
      </Text>

      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [
              styles.categoryCard,
              pressed && styles.categoryCardPressed
            ]}
            onPress={() => handleCategoryPress(item.id, item.name)}
          >
            <Image 
              source={{ uri: item.image }} 
              style={styles.categoryImage}
              resizeMode="cover"
            />
            <View style={styles.categoryOverlay} />
            <Text style={styles.categoryName}>{item.name}</Text>
          </Pressable>
        )}
        numColumns={numColumns}
        contentContainerStyle={styles.categoriesList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2c3e50',
    marginTop: 8,
    marginBottom: 4,
  },
  instructionText: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 24,
  },
  categoriesList: {
    paddingBottom: 24,
  },
  categoryCard: {
    flex: 1,
    margin: 8,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    backgroundColor: 'white',
    height: 180,
  },
  categoryCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  categoryImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  categoryOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  categoryName: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    position: 'absolute',
    bottom: 16,
    left: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});