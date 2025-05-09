import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Pressable, 
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Plus, Upload, X, CircleCheck as CheckCircle } from 'lucide-react-native';
import { Product } from '@/types';
import { getProductsByCategory, deleteProduct } from '@/lib/storage';
import { syncProduct } from '@/lib/api';
import { formatPrice, formatDate } from '@/lib/utils';

export default function ProductsScreen() {
  const { category, name } = useLocalSearchParams<{ category: string, name: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);

  useEffect(() => {
    if (!category) return;

    const loadProducts = async () => {
      setLoading(true);
      try {
        const data = await getProductsByCategory(category);
        setProducts(data);
      } catch (error) {
        console.error('Failed to load products:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [category]);

  const handleAddProduct = () => {
    if (!category) return;
    router.push({ 
      pathname: '/products/add',
      params: { 
        category,
        name: name || 'Catégorie' 
      } 
    });
  };

  const handleDeleteProduct = async (productId: string) => {
    Alert.alert(
      'Confirmation',
      'Êtes-vous sûr de vouloir supprimer ce produit ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Supprimer',
          onPress: async () => {
            try {
              await deleteProduct(productId);
              setProducts(products.filter(product => product.id !== productId));
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer le produit');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleSyncProduct = async (product: Product) => {
    setSyncing(product.id);
    try {
      const result = await syncProduct(product);
      if (result.success) {
        const updatedProducts = products.map(p => 
          p.id === product.id ? { ...p, uploaded: true } : p
        );
        setProducts(updatedProducts);
      } else {
        Alert.alert('Erreur de synchronisation', result.error);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de synchroniser le produit');
    } finally {
      setSyncing(null);
    }
  };

  if (!loading && products.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Aucun produit dans cette catégorie.
          </Text>
          <Pressable
            style={styles.addButton}
            onPress={handleAddProduct}
          >
            <Text style={styles.addButtonText}>Ajouter un produit</Text>
          </Pressable>
        </View>
        
        <Pressable
          style={styles.floatingButton}
          onPress={handleAddProduct}
        >
          <Plus size={24} color="white" />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#400605" style={styles.loader} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.productCard}>
              <Image 
                source={{ uri: item.imageUri }} 
                style={styles.productImage}
              />
              <View style={styles.productInfo}>
                <View style={styles.nameContainer}>
                  <Text style={styles.productName}>{item.name}</Text>
                  {item.uploaded && (
                    <CheckCircle size={16} color="#27ae60" style={styles.statusIcon} />
                  )}
                </View>
                <Text style={styles.productDescription} numberOfLines={2}>
                  {item.description}
                </Text>
                <Text style={styles.productPrice}>
                  {formatPrice(item.price)}
                </Text>
                <Text style={styles.productDate}>
                  Ajouté le {formatDate(item.createdAt)}
                </Text>
              </View>
              
              <View style={styles.productActions}>
                {syncing === item.id ? (
                  <ActivityIndicator size="small" color="#400605" />
                ) : !item.uploaded ? (
                  <Pressable
                    style={styles.syncButton}
                    onPress={() => handleSyncProduct(item)}
                  >
                    <Upload size={20} color="#400605" />
                  </Pressable>
                ) : null}
                
                <Pressable
                  style={styles.deleteButton}
                  onPress={() => handleDeleteProduct(item.id)}
                >
                  <X size={20} color="#e74c3c" />
                </Pressable>
              </View>
            </View>
          )}
          contentContainerStyle={styles.productList}
        />
      )}
      
      <Pressable
        style={styles.floatingButton}
        onPress={handleAddProduct}
      >
        <Plus size={24} color="white" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    color: '#95a5a6',
    marginBottom: 24,
    textAlign: 'center',
  },
  productList: {
    padding: 16,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  productImage: {
    width: 100,
    height: 100,
    resizeMode: 'cover',
  },
  productInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
    flexShrink: 1,
  },
  statusIcon: {
    marginLeft: 6,
  },
  productDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#400605',
    marginBottom: 4,
  },
  productDate: {
    fontSize: 12,
    color: '#95a5a6',
  },
  productActions: {
    flexDirection: 'column',
    justifyContent: 'center',
    padding: 8,
  },
  syncButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#ecf0f1',
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#ecf0f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingButton: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#400605',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  addButton: {
    backgroundColor: '#400605',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});