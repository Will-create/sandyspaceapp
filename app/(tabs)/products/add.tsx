import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  Keyboard,
  Platform
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Camera, Trash2, RefreshCw, Check, Plus, Minus, Tag } from 'lucide-react-native';
import { Product, ProductVariant } from '@/types';
import { pickImage } from '@/lib/utils';
import { uploadImage } from '@/lib/api';
import { generateProductInfo } from '@/lib/ai';
import { generateId } from '@/lib/utils';
import { saveProduct } from '@/lib/storage';

export default function AddProductScreen() {
  const { category, name } = useLocalSearchParams<{ category: string, name: string }>();
  const scrollViewRef = useRef<ScrollView>(null);

  // Base product state
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [cost, setCost] = useState('');
  const [variants, setVariants] = useState<ProductVariant[]>([
    { id: generateId(), type: 'size', values: ['S'], additionalCost: 0, additionalPrice: 0 }
  ]);
  
  // Loading states
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Reset and return to previous screen
  const handleCancel = () => {
    router.back();
  };
  
  // Pick image from camera or gallery
  const handlePickImage = async (useCamera: boolean = false) => {
    Keyboard.dismiss();
    
    const result = await pickImage(useCamera);
    
    if (result.success && result.uri) {
      setImageUri(result.uri);
      if (result.base64) {
        setBase64Image(result.base64);
      }
    } else if (result.error) {
      Alert.alert('Erreur', result.error);
    }
  };

  // Handle variant image selection
  const handleVariantImagePick = async (variantId: string) => {
    const result = await pickImage(false);
    if (result.success && result.uri && result.base64) {
      setVariants(variants.map(v => 
        v.id === variantId 
          ? { ...v, imageUri: result.uri, base64Image: result.base64 }
          : v
      ));
    }
  };
  
  // Remove selected image
  const handleRemoveImage = () => {
    setImageUri(null);
    setBase64Image(null);
  };
  
  // Generate product name and description using AI
  const handleGenerateInfo = async () => {
    if (!base64Image || !category) {
      Alert.alert('Erreur', 'Veuillez d\'abord sélectionner une image');
      return;
    }
    
    setIsGenerating(true);
    
    try {
      const result = await generateProductInfo(base64Image, category);
      
      if (result.success && result.name && result.description) {
        setProductName(result.name);
        setDescription(result.description);
        
        // Scroll to product info
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({ y: 300, animated: true });
        }, 100);
      } else {
        Alert.alert('Erreur', result.error || 'Impossible de générer les informations du produit');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur s\'est produite lors de la génération');
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Add variant
  const handleAddVariant = () => {
    if (variants.length >= 10) {
      Alert.alert('Limite atteinte', 'Vous ne pouvez pas ajouter plus de 10 variantes');
      return;
    }
    
    setVariants([
      ...variants,
      { id: generateId(), type: 'size', values: [], additionalCost: 0, additionalPrice: 0 }
    ]);
  };
  
  // Remove variant
  const handleRemoveVariant = (id: string) => {
    if (variants.length <= 1) {
      Alert.alert('Impossible de supprimer', 'Le produit doit avoir au moins une variante');
      return;
    }
    
    setVariants(variants.filter(v => v.id !== id));
  };
  
  // Update variant type
  const handleUpdateVariantType = (id: string, type: 'size' | 'color') => {
    setVariants(
      variants.map(v => v.id === id ? { ...v, type } : v)
    );
  };
  
  // Update variant values
  const handleUpdateVariantValues = (id: string, valuesString: string) => {
    const valuesArray = valuesString.split(',').map(val => val.trim()).filter(val => val);
    setVariants(
      variants.map(v => v.id === id ? { ...v, values: valuesArray } : v)
    );
  };
  
  // Update variant additional cost
  const handleUpdateVariantCost = (id: string, costStr: string) => {
    const additionalCost = parseFloat(costStr) || 0;
    setVariants(
      variants.map(v => v.id === id ? { ...v, additionalCost } : v)
    );
  };
  
  // Update variant additional price
  const handleUpdateVariantPrice = (id: string, priceStr: string) => {
    const additionalPrice = parseFloat(priceStr) || 0;
    setVariants(
      variants.map(v => v.id === id ? { ...v, additionalPrice } : v)
    );
  };
  
  // Render variant values as tags
  const renderVariantTags = (values: string[]) => {
    if (!values || values.length === 0) return null;
    
    return (
      <View style={styles.tagsContainer}>
        {values.map((tag, index) => (
          <View key={index} style={styles.tag}>
            <Tag size={12} color="#400605" style={styles.tagIcon} />
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>
    );
  };
  
  // Save product
  const handleSaveProduct = async () => {
    // Validate inputs
    if (!imageUri || !base64Image) {
      Alert.alert('Erreur', 'Veuillez sélectionner une image');
      return;
    }
    
    if (!productName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom de produit');
      return;
    }
    
    if (!basePrice && !variants.some(v => v.additionalPrice > 0)) {
      Alert.alert('Erreur', 'Veuillez entrer au moins un prix');
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Upload image to get URL
      setIsUploading(true);
      const uploadResult = await uploadImage(imageUri);
      setIsUploading(false);
      
      if (!uploadResult.success || !uploadResult.url) {
        throw new Error(uploadResult.error || 'Échec de l\'upload de l\'image');
      }
      
      // Parse base price
      const price = parseFloat(basePrice) || 0;
      
      // Create product object with new variant structure
      const newProduct: Product = {
        id: generateId(),
        categoryId: category || '1',
        name: productName,
        description: description || `Produit ${productName}`,
        imageUri: uploadResult.url,
        base64Image: base64Image,
        price: price,
        cost: parseFloat(cost) || 0,
        variants: variants.map(v => ({
          id: v.id,
          type: v.type,
          values: v.values,
          additionalCost: v.additionalCost || 0,
          additionalPrice: v.additionalPrice || 0,
          imageUri: v.imageUri,
          base64Image: v.base64Image
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        uploaded: false
      };
      
      // Save to local storage
      await saveProduct(newProduct);
      
      // Success feedback
      Alert.alert(
        'Succès',
        'Le produit a été sauvegardé avec succès',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error) {
      Alert.alert(
        'Erreur',
        'Une erreur s\'est produite lors de la sauvegarde du produit'
      );
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
      ref={scrollViewRef}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Nouveau produit - {name || 'Catégorie'}
        </Text>
      </View>
      
      {/* Image Picker */}
      <View style={styles.imagePickerContainer}>
        {imageUri ? (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
            <Pressable 
              style={styles.removeImageButton}
              onPress={handleRemoveImage}
            >
              <Trash2 size={20} color="white" />
            </Pressable>
          </View>
        ) : (
          <View style={styles.imagePlaceholder}>
            <Camera size={48} color="#95a5a6" />
            <Text style={styles.imagePlaceholderText}>
              Sélectionnez une image
            </Text>
          </View>
        )}
        
        <View style={styles.imageButtonsContainer}>
          <Pressable 
            style={[styles.imageButton, styles.galleryButton]}
            onPress={() => handlePickImage(false)}
          >
            <Text style={styles.buttonText}>Galerie</Text>
          </Pressable>
          
          <Pressable 
            style={[styles.imageButton, styles.cameraButton]}
            onPress={() => handlePickImage(true)}
          >
            <Text style={styles.buttonText}>Caméra</Text>
          </Pressable>
        </View>
      </View>
      
      {/* AI Generation */}
      {imageUri && (
        <View style={styles.aiGenerationContainer}>
          <Pressable 
            style={[
              styles.generateButton,
              isGenerating && styles.generateButtonDisabled
            ]}
            onPress={handleGenerateInfo}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <RefreshCw size={20} color="white" style={styles.buttonIcon} />
                <Text style={styles.generateButtonText}>
                  Générer avec l'IA
                </Text>
              </>
            )}
          </Pressable>
        </View>
      )}
      
      {/* Product Info */}
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Informations du produit</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Nom du produit</Text>
          <TextInput 
            style={styles.input}
            value={productName}
            onChangeText={setProductName}
            placeholder="Nom du produit"
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Description</Text>
          <TextInput 
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Description du produit"
            multiline
            numberOfLines={4}
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Prix de base (FCFA)</Text>
          <TextInput 
            style={styles.input}
            value={basePrice}
            onChangeText={setBasePrice}
            placeholder="0"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Prix d'achat (FCFA)</Text>
          <TextInput 
            style={styles.input}
            value={cost}
            onChangeText={setCost}
            placeholder="0"
            keyboardType="numeric"
          />
        </View>
      </View>
      
      {/* Variants */}
      <View style={styles.formSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Variantes</Text>
          <Pressable 
            style={styles.addVariantButton}
            onPress={handleAddVariant}
          >
            <Plus size={18} color="#400605" />
          </Pressable>
        </View>
        
        {variants.map((variant, index) => (
          <View key={variant.id} style={styles.variantContainer}>
            <View style={styles.variantHeader}>
              <View style={styles.variantTypeSelector}>
                <Pressable
                  style={[
                    styles.variantTypeButton,
                    variant.type === 'size' && styles.variantTypeButtonActive
                  ]}
                  onPress={() => handleUpdateVariantType(variant.id, 'size')}
                >
                  <Text 
                    style={[
                      styles.variantTypeText,
                      variant.type === 'size' && styles.variantTypeTextActive
                    ]}
                  >
                    Taille
                  </Text>
                </Pressable>
                
                <Pressable
                  style={[
                    styles.variantTypeButton,
                    variant.type === 'color' && styles.variantTypeButtonActive
                  ]}
                  onPress={() => handleUpdateVariantType(variant.id, 'color')}
                >
                  <Text 
                    style={[
                      styles.variantTypeText,
                      variant.type === 'color' && styles.variantTypeTextActive
                    ]}
                  >
                    Couleur
                  </Text>
                </Pressable>
              </View>
              
              <Pressable 
                style={styles.removeVariantButton}
                onPress={() => handleRemoveVariant(variant.id)}
              >
                <Minus size={18} color="#e74c3c" />
              </Pressable>
            </View>
            
            <View style={styles.variantRow}>
              <View style={styles.variantImageContainer}>
                {variant.imageUri ? (
                  <Image 
                    source={{ uri: variant.imageUri }} 
                    style={styles.variantImage} 
                  />
                ) : (
                  <Pressable
                    style={styles.addVariantImage}
                    onPress={() => handleVariantImagePick(variant.id)}
                  >
                    <Plus size={24} color="#95a5a6" />
                  </Pressable>
                )}
              </View>
              
              <View style={styles.variantInputsContainer}>
                <View style={styles.variantValuesContainer}>
                  <Text style={styles.inputLabel}>
                    {variant.type === 'size' ? 'Tailles (séparées par virgules)' : 'Couleurs (séparées par virgules)'}
                  </Text>
                  <TextInput 
                    style={styles.variantValuesInput}
                    value={variant.values.join(', ')}
                    onChangeText={(text) => handleUpdateVariantValues(variant.id, text)}
                    placeholder={variant.type === 'size' ? 'S, M, L, XL' : 'Rouge, Bleu, Vert'}
                  />
                  {renderVariantTags(variant.values)}
                </View>
                
                <View style={styles.variantPriceRow}>
                  <View style={styles.variantCostContainer}>
                    <Text style={styles.inputLabel}>Coût additionnel</Text>
                    <TextInput 
                      style={styles.variantCostInput}
                      value={variant.additionalCost ? variant.additionalCost.toString() : ''}
                      onChangeText={(text) => handleUpdateVariantCost(variant.id, text)}
                      placeholder="0"
                      keyboardType="numeric"
                    />
                    <Text style={styles.currencySymbol}>FCFA</Text>
                  </View>
                  
                  <View style={styles.variantPriceContainer}>
                    <Text style={styles.inputLabel}>Prix additionnel</Text>
                    <TextInput 
                      style={styles.variantPriceInput}
                      value={variant.additionalPrice ? variant.additionalPrice.toString() : ''}
                      onChangeText={(text) => handleUpdateVariantPrice(variant.id, text)}
                      placeholder="0"
                      keyboardType="numeric"
                    />
                    <Text style={styles.currencySymbol}>FCFA</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        ))}
      </View>
      
      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <Pressable 
          style={[styles.actionButton, styles.cancelButton]}
          onPress={handleCancel}
        >
          <Text style={styles.cancelButtonText}>Annuler</Text>
        </Pressable>
        
        <Pressable 
          style={[
            styles.actionButton, 
            styles.saveButton,
            (isSaving || isUploading) && styles.saveButtonDisabled
          ]}
          onPress={handleSaveProduct}
          disabled={isSaving || isUploading}
        >
          {(isSaving || isUploading) ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <Check size={20} color="white" style={styles.buttonIcon} />
              <Text style={styles.saveButtonText}>Enregistrer</Text>
            </>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2c3e50',
  },
  imagePickerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  imagePreviewContainer: {
    width: 200,
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(231, 76, 60, 0.8)',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 12,
    backgroundColor: '#ecf0f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  imagePlaceholderText: {
    marginTop: 12,
    color: '#7f8c8d',
    fontSize: 16,
  },
  imageButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  imageButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginHorizontal: 8,
    minWidth: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryButton: {
    backgroundColor: '#3498db',
  },
  cameraButton: {
    backgroundColor: '#2ecc71',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  aiGenerationContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  generateButton: {
    backgroundColor: '#9b59b6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 200,
  },
  generateButtonDisabled: {
    backgroundColor: '#d2b4de',
  },
  generateButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  buttonIcon: {
    marginRight: 8,
  },
  formSection: {
    marginBottom: 24,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#7f8c8d',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  addVariantButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  variantContainer: {
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 16,
  },
  variantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  variantTypeSelector: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  variantTypeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
  },
  variantTypeButtonActive: {
    backgroundColor: '#400605',
  },
  variantTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#7f8c8d',
  },
  variantTypeTextActive: {
    color: 'white',
  },
  removeVariantButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e74c3c',
  },
  variantRow: {
    flexDirection: 'row',
  },
  variantImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 16,
  },
  variantImage: {
    width: '100%',
    height: '100%',
  },
  addVariantImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
  },
  variantInputsContainer: {
    flex: 1,
  },
  variantValuesContainer: {
    marginBottom: 12,
  },
  variantValuesInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1e5e5',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginRight: 8,
    marginBottom: 8,
  },
  tagIcon: {
    marginRight: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#400605',
  },
  variantPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  variantCostContainer: {
    flex: 1,
    marginRight: 8,
    position: 'relative',
  },
  variantCostInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    paddingRight: 60,
  },
  variantPriceContainer: {
    flex: 1,
    marginLeft: 8,
    position: 'relative',
  },
  variantPriceInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    paddingRight: 60,
  },
  currencySymbol: {
    position: 'absolute',
    right: 12,
    bottom: 10,
    color: '#7f8c8d',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  cancelButton: {
    backgroundColor: '#ecf0f1',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#7f8c8d',
    fontWeight: '600',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#400605',
    marginLeft: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#95a5a6',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});