import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { AppSettings, Product, Category } from '@/types';

// Constants for storage keys
const PRODUCTS_KEY = 'sandyspace_products';
const CATEGORIES_KEY = 'sandyspace_categories';
const SETTINGS_KEY = 'sandyspace_settings';
const PIN_KEY = 'sandyspace_pin';

// Default PIN
const DEFAULT_PIN = '0000';

// Default categories
const DEFAULT_CATEGORIES: Category[] = [
  {
    id: '41',
    name: 'Robes',
    image: 'https://images.pexels.com/photos/7679720/pexels-photo-7679720.jpeg'
  },
  {
    id: '42',
    name: 'Pantalons',
    image: 'https://images.pexels.com/photos/7679731/pexels-photo-7679731.jpeg'
  },
  {
    id: '43',
    name: 'Complément alimentaire',
    image: 'https://images.pexels.com/photos/3850838/pexels-photo-3850838.jpeg'
  },
  {
    id: '44',
    name: 'Chaussures',
    image: 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg'
  },
  {
    id: '45',
    name: 'Les hauts',
    image: 'https://images.pexels.com/photos/6311652/pexels-photo-6311652.jpeg'
  },
  {
    id: '46',
    name: 'Perles',
    image: 'https://images.pexels.com/photos/1191531/pexels-photo-1191531.jpeg'
  },
  {
    id: '47',
    name: 'Sacs à main',
    image: 'https://images.pexels.com/photos/904350/pexels-photo-904350.jpeg'
  }
];

// Default settings
const DEFAULT_SETTINGS: AppSettings = {
  deepInfraApiKey: '',
  apiEndpoint: 'https://api.sandyspace.com',
  pin: DEFAULT_PIN
};

// Initialize storage on first app load
export const initializeStorage = async (): Promise<void> => {
  try {
    // Always reset categories to ensure they're up to date
    await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(DEFAULT_CATEGORIES));

    // Check if settings exist, if not, initialize with defaults
    const settings = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!settings) {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
    }

    // Check if PIN exists, if not, initialize with default
    if (Platform.OS === 'web') {
      const pin = await AsyncStorage.getItem(PIN_KEY);
      if (!pin) {
        await AsyncStorage.setItem(PIN_KEY, DEFAULT_PIN);
      }
    } else {
      const pin = await SecureStore.getItemAsync(PIN_KEY);
      if (!pin) {
        await SecureStore.setItemAsync(PIN_KEY, DEFAULT_PIN);
      }
    }
  } catch (error) {
    console.error('Failed to initialize storage:', error);
  }
};

// Products
export const getProducts = async (): Promise<Product[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(PRODUCTS_KEY);
    return jsonValue ? JSON.parse(jsonValue) : [];
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return [];
  }
};

export const getProductsByCategory = async (categoryId: string): Promise<Product[]> => {
  try {
    const products = await getProducts();
    return products.filter(product => product.categoryId === categoryId);
  } catch (error) {
    console.error('Failed to fetch products by category:', error);
    return [];
  }
};

export const saveProduct = async (product: Product): Promise<void> => {
  try {
    const products = await getProducts();
    const existingIndex = products.findIndex(p => p.id === product.id);
    
    if (existingIndex !== -1) {
      // Update existing product
      products[existingIndex] = { 
        ...product, 
        updatedAt: new Date().toISOString() 
      };
    } else {
      // Add new product
      products.push({ 
        ...product,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    await AsyncStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  } catch (error) {
    console.error('Failed to save product:', error);
    throw error;
  }
};

export const deleteProduct = async (productId: string): Promise<void> => {
  try {
    const products = await getProducts();
    const updatedProducts = products.filter(p => p.id !== productId);
    await AsyncStorage.setItem(PRODUCTS_KEY, JSON.stringify(updatedProducts));
  } catch (error) {
    console.error('Failed to delete product:', error);
    throw error;
  }
};

// Categories
export const getCategories = async (): Promise<Category[]> => {
  try {
    // Always return default categories to ensure consistency
    return DEFAULT_CATEGORIES;
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return DEFAULT_CATEGORIES;
  }
};

// Settings
export const getSettings = async (): Promise<AppSettings> => {
  try {
    const jsonValue = await AsyncStorage.getItem(SETTINGS_KEY);
    return jsonValue ? JSON.parse(jsonValue) : DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    return DEFAULT_SETTINGS;
  }
};

export const updateSettings = async (settings: Partial<AppSettings>): Promise<void> => {
  try {
    const currentSettings = await getSettings();
    const updatedSettings = { ...currentSettings, ...settings };
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updatedSettings));
    
    // If PIN is updated, also update it in secure storage
    if (settings.pin) {
      if (Platform.OS === 'web') {
        await AsyncStorage.setItem(PIN_KEY, settings.pin);
      } else {
        await SecureStore.setItemAsync(PIN_KEY, settings.pin);
      }
    }
  } catch (error) {
    console.error('Failed to update settings:', error);
    throw error;
  }
};

// PIN Management
export const getPIN = async (): Promise<string> => {
  try {
    if (Platform.OS === 'web') {
      const pin = await AsyncStorage.getItem(PIN_KEY);
      return pin || DEFAULT_PIN;
    } else {
      const pin = await SecureStore.getItemAsync(PIN_KEY);
      return pin || DEFAULT_PIN;
    }
  } catch (error) {
    console.error('Failed to get PIN:', error);
    return DEFAULT_PIN;
  }
};

export const updatePIN = async (newPIN: string): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem(PIN_KEY, newPIN);
    } else {
      await SecureStore.setItemAsync(PIN_KEY, newPIN);
    }
    // Also update in regular settings for consistency
    const settings = await getSettings();
    await updateSettings({ ...settings, pin: newPIN });
  } catch (error) {
    console.error('Failed to update PIN:', error);
    throw error;
  }
};

export const verifyPIN = async (enteredPIN: string): Promise<boolean> => {
  try {
    const storedPIN = await getPIN();
    return enteredPIN === storedPIN;
  } catch (error) {
    console.error('Failed to verify PIN:', error);
    return false;
  }
};