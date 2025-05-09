export interface Category {
  id: string;
  name: string;
  image: string;
}

export interface ProductVariant {
  id: string;
  type: 'size' | 'color';  // Type de variante: taille ou couleur
  values: string[];        // Tableau de valeurs (tailles ou couleurs)
  additionalPrice: number; // Prix additionnel pour cette variante
  additionalCost?: number; // Coût additionnel optionnel
  stock?: number;          // Stock optionnel
  imageUri?: string;       // URI de l'image optionnel
  base64Image?: string;    // Image en base64 optionnelle
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  imageUri: string;
  base64Image?: string;
  price: number;
  cost: number;
  variants: ProductVariant[];
  createdAt: string;
  updatedAt: string;
  uploaded: boolean;
}

export interface AppSettings {
  deepInfraApiKey: string;
  apiEndpoint: string;
  pin: string;
}