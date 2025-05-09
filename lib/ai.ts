import { encode } from 'base-64';
import { getProducts, getSettings } from './storage';

// Base URL for the DeepInfra API
const BASE_URL = "https://api.deepinfra.com/v1/openai/chat/completions";
const MODEL = "meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8";

// Base prompt for the AI
const BASE_PROMPT = `
Tu es un assistant pour une boutique en ligne de mode appelee 'Univers de la mode'.

Analyse l'image du vetement et génère une réponse au **format JSON** strictement comme suit :
{
  "nom": "Un nom créatif, chic, en français pour le vetement",
  "description": "Une description élégante et détaillée en français, adaptée à une fiche produit e-commerce."
}
Les noms doivent etre uniquer sans doublons et j'insiste.
Ne retourne rien d'autre que l'objet JSON.
`;

// Function to get existing product names
const getExistingNames = async (categoryId: string): Promise<string[]> => {
  const products = await getProducts();
  return products
    .filter(product => product.categoryId === categoryId)
    .map(product => product.name);
};

// Parse AI response to extract JSON
const parseResponse = (content: string): { nom: string; description: string } => {
  try {
    const start = content.indexOf("{");
    const end = content.lastIndexOf("}") + 1;
    const jsonString = content.slice(start, end);
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Erreur de parsing en JSON:", error);
    return { nom: "Nom inconnu", description: "Description non générée." };
  }
};

// Generate product name and description from image
export const generateProductInfo = async (
  base64Image: string,
  categoryId: string
): Promise<{ success: boolean; name?: string; description?: string; error?: string }> => {
  try {
    // Get API key from settings
    const settings = await getSettings();
    if (!settings.deepInfraApiKey) {
      throw new Error("La cle API n'est pas definie. Veuillez le configurer dans les paramettres.");
    }

    // Get existing names to avoid duplicates
    const existingNames = await getExistingNames(categoryId);
    
    // Build prompt with existing names to avoid duplicates
    const nomsPrompt = existingNames.length > 0
      ? `\nLes noms suivants sont déjà utilisés : ${JSON.stringify(existingNames)}. Merci d'en générer un nouveau, différent de ceux-ci.`
      : '';
    
    const fullPrompt = BASE_PROMPT + nomsPrompt;

    // Make API request
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.deepInfraApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: fullPrompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `API responded with ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const parsed = parseResponse(content);

    return { 
      success: true, 
      name: parsed.nom, 
      description: parsed.description 
    };
  } catch (error) {
    console.error('AI generation failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};