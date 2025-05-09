import { Platform } from 'react-native';
import { launchImageLibraryAsync, launchCameraAsync, MediaTypeOptions, requestCameraPermissionsAsync, requestMediaLibraryPermissionsAsync } from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { encode } from 'base-64';

// Generate unique ID
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

// Format price with currency
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price) + ' FCFA';
};

// Format date
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

// Pick image from camera or library
export const pickImage = async (
  useCamera: boolean = false
): Promise<{ success: boolean; uri?: string; base64?: string; error?: string }> => {
  try {
    if (Platform.OS !== 'web') {
      // Request permissions for native platforms
      if (useCamera) {
        const { status } = await requestCameraPermissionsAsync();
        if (status !== 'granted') {
          throw new Error('Sandy space souhaite accéder a votre caméra. Veuillez autoriser l\'accès à votre caméra pour continuer.');
        }
      } else {
        const { status } = await requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          throw new Error('Sandy space souhaite accéder a votre galerie. Veuillez autoriser l\'');
        }
      }
    }

    // Launch camera or picker with proper configuration
    const pickerOptions = {
      mediaTypes: MediaTypeOptions.Images,
      allowsEditing: true,
      // Sans contrainte de ratio d'aspect
      quality: 0.8, // Réduire la qualité pour diminuer la taille
      base64: true, // Request base64 data directly
    };

    const result = useCamera
      ? await launchCameraAsync(pickerOptions)
      : await launchImageLibraryAsync(pickerOptions);

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return { success: false, error: 'Annulation de la selection de l\'image' };
    }

    const selectedImage = result.assets[0];
    
    // Utiliser directement l'image sans ImageManipulator
    return { 
      success: true, 
      uri: selectedImage.uri, 
      base64: selectedImage.base64 || '' 
    };
  } catch (error) {
    console.error('Erreur lors de la prise de l\'image:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Echec de selection de l\'image' 
    };
  }
};

// Convert image URI to base64 (for web platform support)
export const imageUriToBase64 = async (uri: string): Promise<string | null> => {
  try {
    if (Platform.OS === 'web') {
      const response = await fetch(uri);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            // Remove the data:image/jpeg;base64, prefix
            const base64data = reader.result.split(',')[1];
            resolve(base64data);
          } else {
            reject(new Error('Echec de conversion de l\'image en base64'));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } else {
      // Pour les plateformes natives, utiliser manipulateAsync
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 800 } }],
        { base64: true, format: ImageManipulator.SaveFormat.JPEG }
      );
      return manipResult.base64 || null;
    }
  } catch (error) {
    console.error('Erreur de conversion de l\'image en base64 :', error);
    return null;
  }
};