import { Product } from '@/types';
import { getSettings } from './storage';

// Upload image to server and get URL back
export const uploadImage = async (
  imageUri: string
): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    const settings = await getSettings();
    const { apiEndpoint } = settings;

    // Create form data with image
    const formData = new FormData();
    const uriParts = imageUri.split('.');
    const fileType = uriParts[uriParts.length - 1];

    formData.append('image', {
      uri: imageUri,
      name: `photo.${fileType}`,
      type: `image/${fileType}`,
    } as any);

    // Upload image
    const response = await fetch(`${apiEndpoint}/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    const data = await response.json();
    return { success: true, url: data.url };
  } catch (error) {
    console.error('Failed to upload image:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};

// Send product data to server
export const syncProduct = async (
  product: Product
): Promise<{ success: boolean; error?: string }> => {
  try {
    const settings = await getSettings();
    const { apiEndpoint } = settings;

    const response = await fetch(`${apiEndpoint}/api/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(product),
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to sync product:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};

// Sync multiple products
export const syncProducts = async (
  products: Product[]
): Promise<{ success: boolean; syncedCount: number; error?: string }> => {
  try {
    const settings = await getSettings();
    const { apiEndpoint } = settings;

    const response = await fetch(`${apiEndpoint}/api/update-batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ products }),
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    return { success: true, syncedCount: products.length };
  } catch (error) {
    console.error('Failed to sync products:', error);
    return { 
      success: false, 
      syncedCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};

// Upload product with images to SandySpace API
export const uploadProductToSandySpace = async (
  product: Product,
  imageUris: string[]
): Promise<{ success: boolean; response?: any; error?: string }> => {
  try {
    const settings = await getSettings();
    const { apiEndpoint } = settings;
    
    // Prepare payload based on the product data
    const payload = {
      type: "standard",
      name: product.name,
      code: Math.floor(Math.random() * 100000000).toString(),
      barcode_symbology: "C128",
      product_code_name: "",
      brand_id: "",
      category_id: product.categoryId,
      unit_id: 1,
      sale_unit_id: 1,
      purchase_unit_id: 1,
      cost: product.cost,
      price: product.price < 100 ? product.price * 1000 : product.price,
      qty: 0.00,
      wholesale_price: "",
      daily_sale_objective: "",
      alert_quantity: "",
      tax_id: "",
      tax_method: 1,
      warranty: "",
      warranty_type: "months",
      guarantee: "",
      guarantee_type: "months",
      stock_warehouse_id: [1, 2],
      stock: ["", ""],
      product_details: product.description,
      variant_option: [],
      variant_value: [],
      warehouse_id: [1, 2],
      diff_price: ["", ""],
      promotion_price: "",
      starting_date: "",
      last_date: "",
      is_online: 1,
      in_stock: 1,
      tags: "",
      meta_title: product.name,
      meta_description: product.description,
      products: ""
    };

    // Create form data
    const formData = new FormData();
    
    // Append all non-array fields from payload
    for (const [key, value] of Object.entries(payload)) {
      if (!Array.isArray(value)) {
        formData.append(key, value.toString());
      }
    }
    
    // Handle array fields separately
    if (payload.stock_warehouse_id) {
      payload.stock_warehouse_id.forEach((id, index) => {
        formData.append(`stock_warehouse_id[${index}]`, id.toString());
      });
    }
    
    if (payload.warehouse_id) {
      payload.warehouse_id.forEach((id, index) => {
        formData.append(`warehouse_id[${index}]`, id.toString());
      });
    }
    
    if (payload.stock) {
      payload.stock.forEach((stock, index) => {
        formData.append(`stock[${index}]`, stock.toString());
      });
    }
    
    if (payload.diff_price) {
      payload.diff_price.forEach((price, index) => {
        formData.append(`diff_price[${index}]`, price.toString());
      });
    }
    
    // Handle variants
    if (product.variants && product.variants.length > 0) {
      // Set is_variant flag
      formData.append('is_variant', '1');
      
      // Group variants by type
      const variantsByType: Record<string, string[]> = {};
      
      product.variants.forEach(variant => {
        const typeName = variant.type === 'color' ? 'Couleur' : 'Taille';
        
        if (!variantsByType[typeName]) {
          variantsByType[typeName] = [];
        }
        
        // Add unique values to the type
        variant.values.forEach(value => {
          if (!variantsByType[typeName].includes(value)) {
            variantsByType[typeName].push(value);
          }
        });
      });
      
      // Add variant options and values
      Object.entries(variantsByType).forEach(([typeName, values], index) => {
        formData.append(`variant_option[]`, typeName);
        formData.append(`variant_value[]`, values.join(','));
      });
      
      // Generate all possible combinations
      const variantTypes = Object.keys(variantsByType);
      const variantValues = Object.values(variantsByType);
      
      // Generate all combinations of variant values
      const generateCombinations = (
        current: string[] = [],
        depth: number = 0
      ): string[][] => {
        if (depth === variantTypes.length) {
          return [current];
        }
        
        let result: string[][] = [];
        for (const value of variantValues[depth]) {
          result = result.concat(
            generateCombinations([...current, value], depth + 1)
          );
        }
        
        return result;
      };
      
      const combinations = generateCombinations();
      
      // Add each combination as a variant
      combinations.forEach((combo, index) => {
        const variantName = combo.join('/');
        const itemCode = `${variantName}-${payload.code}`;
        
        // Find if there's a matching variant with additional cost/price
        let additionalCost = 0;
        let additionalPrice = 0;
        
        // Try to find matching variant for pricing
        for (const variant of product.variants) {
          if (variant.values.some(v => combo.includes(v))) {
            additionalCost += variant.additionalCost || 0;
            additionalPrice += variant.additionalPrice || 0;
          }
        }
        
        formData.append(`variant_name[]`, variantName);
        formData.append(`item_code[]`, itemCode);
        formData.append(`additional_cost[]`, additionalCost.toString());
        formData.append(`additional_price[]`, additionalPrice.toString());
      });
    }
    
    // Append images
    if (imageUris && imageUris.length > 0) {
      imageUris.forEach((uri, index) => {
        // Extract file name and type from URI
        const uriParts = uri.split('.');
        const fileType = uriParts[uriParts.length - 1];
        const fileName = `product_image_${index}.${fileType}`;
        
        // Append image to form data
        formData.append(`image[${index}]`, {
          uri: uri,
          name: fileName,
          type: `image/${fileType}`
        } as any);
      });
    }
    
    // Upload to SandySpace API
    const response = await fetch('https://sandyspace.com/api-products', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
        // Add any additional headers if needed
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server responded with ${response.status}: ${errorText}`);
    }
    
    const responseData = await response.json();
    return { success: true, response: responseData };
  } catch (error) {
    console.error('Failed to upload product to SandySpace:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred during product upload' 
    };
  }
};