import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Image, 
  Pressable, 
  ActivityIndicator,
  Modal,
  Dimensions,
  Share,
  Platform
} from 'react-native';
import { X, Share2 } from 'lucide-react-native';
import { Product } from '@/types';
import { getProducts } from '@/lib/storage';

export default function GalleryScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const screenWidth = Dimensions.get('window').width;

  // Calculate number of columns based on screen width
  const numColumns = screenWidth > 768 ? 4 : (screenWidth > 500 ? 3 : 2);
  const imageSize = (screenWidth - 32 - (numColumns - 1) * 8) / numColumns;

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        const data = await getProducts();
        setProducts(data);
      } catch (error) {
        console.error('Failed to load products:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const handleImagePress = (imageUri: string) => {
    setSelectedImage(imageUri);
    setZoomScale(1); // Reset zoom when opening new image
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
  };

  const handleImageDoubleTap = () => {
    setZoomScale(zoomScale === 1 ? 2 : 1);
  };

  const handleShareImage = async () => {
    if (!selectedImage) return;

    try {
      await Share.share({
        url: selectedImage, // For iOS
        message: Platform.OS === 'android' ? selectedImage : undefined, // For Android
        title: 'Partager cette image'
      });
    } catch (error) {
      console.error('Error sharing image:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  if (products.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          Aucune image dans la galerie.
        </Text>
        <Text style={styles.emptySubtext}>
          Ajoutez des produits pour les voir apparaître ici.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Galerie d'images</Text>
      <Text style={styles.subtitle}>
        {products.length} {products.length === 1 ? 'image' : 'images'} sauvegardées
      </Text>

      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.imageContainer, { width: imageSize, height: imageSize }]}
            onPress={() => handleImagePress(item.imageUri)}
          >
            <Image
              source={{ uri: item.imageUri }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
          </Pressable>
        )}
        numColumns={numColumns}
        contentContainerStyle={styles.galleryContainer}
      />

      {/* Image Viewer Modal */}
      <Modal
        visible={!!selectedImage}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalContainer}>
          <Pressable 
            style={styles.fullScreenImage} 
            onPress={handleCloseModal}
            onLongPress={handleShareImage}
          >
            <Pressable onPress={handleImageDoubleTap}>
              <Image
                source={{ uri: selectedImage || '' }}
                style={[
                  styles.fullImage,
                  { transform: [{ scale: zoomScale }] }
                ]}
                resizeMode="contain"
              />
            </Pressable>
          </Pressable>

          <View style={styles.modalActions}>
            <Pressable 
              style={styles.modalCloseButton}
              onPress={handleCloseModal}
            >
              <X size={24} color="white" />
            </Pressable>

            <Pressable 
              style={styles.modalShareButton}
              onPress={handleShareImage}
            >
              <Share2 size={24} color="white" />
            </Pressable>
          </View>

          <Text style={styles.zoomInstructions}>
            Appuyez deux fois pour zoomer • Appuyez longuement pour partager
          </Text>
        </View>
      </Modal>
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
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 24,
  },
  galleryContainer: {
    paddingBottom: 24,
  },
  imageContainer: {
    margin: 4,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'white',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  modalActions: {
    position: 'absolute',
    top: 48,
    right: 16,
    flexDirection: 'row',
  },
  modalCloseButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  modalShareButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomInstructions: {
    position: 'absolute',
    bottom: 48,
    color: 'white',
    textAlign: 'center',
    fontSize: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 8,
    borderRadius: 8,
  },
});