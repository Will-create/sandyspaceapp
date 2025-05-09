import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  Pressable, 
  ScrollView, 
  Alert,
  Switch,
  ActivityIndicator
} from 'react-native';
import { Key, Server, Fingerprint, Lock, Save, RefreshCw } from 'lucide-react-native';
import { AppSettings } from '@/types';
import { getSettings, updateSettings, updatePIN, getProducts } from '@/lib/storage';
import { syncProducts } from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function SettingsScreen() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [deepInfraApiKey, setDeepInfraApiKey] = useState('');
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [syncCount, setSyncCount] = useState(0);
  const [lastSyncDate, setLastSyncDate] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await getSettings();
        setSettings(data);
        setDeepInfraApiKey(data.deepInfraApiKey || '');
        setApiEndpoint(data.apiEndpoint || 'https://api.sandyspace.com');
        
        // Count products that need syncing
        const products = await getProducts();
        const needSync = products.filter(p => !p.uploaded);
        setSyncCount(needSync.length);
        
        // Get last sync date from a product
        const lastSynced = products
          .filter(p => p.uploaded)
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
        
        if (lastSynced) {
          setLastSyncDate(lastSynced.updatedAt);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };

    loadSettings();
  }, []);

  const handleSaveSettings = async () => {
    if (!settings) return;
    
    setIsSaving(true);
    
    try {
      // Validate and update API settings
      const updatedSettings: Partial<AppSettings> = {
        deepInfraApiKey,
        apiEndpoint: apiEndpoint || 'https://api.sandyspace.com',
      };
      
      await updateSettings(updatedSettings);
      
      Alert.alert('Succès', 'Paramètres mis à jour avec succès');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de mettre à jour les paramètres');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePIN = async () => {
    // Validate PIN format
    if (newPin.length !== 4 || !/^\d+$/.test(newPin)) {
      Alert.alert('Erreur', 'Le code PIN doit contenir exactement 4 chiffres');
      return;
    }
    
    // Validate confirmation
    if (newPin !== confirmPin) {
      Alert.alert('Erreur', 'Les codes PIN ne correspondent pas');
      return;
    }
    
    setIsSaving(true);
    
    try {
      await updatePIN(newPin);
      
      // Reset fields
      setNewPin('');
      setConfirmPin('');
      
      Alert.alert('Succès', 'Code PIN mis à jour avec succès');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de mettre à jour le code PIN');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSyncProducts = async () => {
    if (syncCount === 0) {
      Alert.alert('Information', 'Aucun produit à synchroniser');
      return;
    }
    
    setIsSyncing(true);
    
    try {
      // Get products that need syncing
      const products = await getProducts();
      const needSync = products.filter(p => !p.uploaded);
      
      if (needSync.length === 0) {
        Alert.alert('Information', 'Aucun produit à synchroniser');
        return;
      }
      
      // Sync products
      const result = await syncProducts(needSync);
      
      if (result.success) {
        Alert.alert(
          'Synchronisation réussie',
          `${result.syncedCount} produit(s) synchronisé(s) avec succès`
        );
        
        // Update sync count and last sync date
        setSyncCount(0);
        setLastSyncDate(new Date().toISOString());
      } else {
        Alert.alert('Erreur', result.error || 'Erreur lors de la synchronisation');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur s\'est produite lors de la synchronisation');
    } finally {
      setIsSyncing(false);
    }
  };

  if (!settings) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Paramètres</Text>
      
      {/* API Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Paramètres API</Text>
        
        <View style={styles.inputContainer}>
          <View style={styles.inputLabel}>
            <Server size={18} color="#7f8c8d" style={styles.inputIcon} />
            <Text style={styles.labelText}>URL API</Text>
          </View>
          <TextInput
            style={styles.input}
            value={apiEndpoint}
            onChangeText={setApiEndpoint}
            placeholder="https://api.sandyspace.com"
          />
        </View>
        
        <View style={styles.inputContainer}>
          <View style={styles.inputLabel}>
            <Key size={18} color="#7f8c8d" style={styles.inputIcon} />
            <Text style={styles.labelText}>Clé API DeepInfra</Text>
          </View>
          <View style={styles.apiKeyContainer}>
            <TextInput
              style={[styles.input, styles.apiKeyInput]}
              value={deepInfraApiKey}
              onChangeText={setDeepInfraApiKey}
              placeholder="Clé API pour la génération IA"
              secureTextEntry={!showApiKey}
            />
            <Pressable
              style={styles.visibilityToggle}
              onPress={() => setShowApiKey(!showApiKey)}
            >
              <Fingerprint size={20} color="#7f8c8d" />
            </Pressable>
          </View>
        </View>
        
        <Pressable
          style={[
            styles.button,
            styles.saveButton,
            isSaving && styles.disabledButton
          ]}
          onPress={handleSaveSettings}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <Save size={18} color="white" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Enregistrer</Text>
            </>
          )}
        </Pressable>
      </View>
      
      {/* PIN Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sécurité</Text>
        
        <View style={styles.inputContainer}>
          <View style={styles.inputLabel}>
            <Lock size={18} color="#7f8c8d" style={styles.inputIcon} />
            <Text style={styles.labelText}>Nouveau code PIN</Text>
          </View>
          <TextInput
            style={styles.input}
            value={newPin}
            onChangeText={setNewPin}
            placeholder="Entrez 4 chiffres"
            keyboardType="numeric"
            maxLength={4}
            secureTextEntry
          />
        </View>
        
        <View style={styles.inputContainer}>
          <View style={styles.inputLabel}>
            <Lock size={18} color="#7f8c8d" style={styles.inputIcon} />
            <Text style={styles.labelText}>Confirmer code PIN</Text>
          </View>
          <TextInput
            style={styles.input}
            value={confirmPin}
            onChangeText={setConfirmPin}
            placeholder="Confirmez le code PIN"
            keyboardType="numeric"
            maxLength={4}
            secureTextEntry
          />
        </View>
        
        <Pressable
          style={[
            styles.button,
            styles.pinButton,
            isSaving && styles.disabledButton
          ]}
          onPress={handleUpdatePIN}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <Lock size={18} color="white" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Mettre à jour le code PIN</Text>
            </>
          )}
        </Pressable>
      </View>
      
      {/* Synchronization */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Synchronisation</Text>
        
        <View style={styles.syncInfoContainer}>
          <Text style={styles.syncInfoLabel}>Produits à synchroniser:</Text>
          <Text style={styles.syncInfoValue}>
            {syncCount} {syncCount === 1 ? 'produit' : 'produits'}
          </Text>
        </View>
        
        {lastSyncDate && (
          <View style={styles.syncInfoContainer}>
            <Text style={styles.syncInfoLabel}>Dernière synchronisation:</Text>
            <Text style={styles.syncInfoValue}>{formatDate(lastSyncDate)}</Text>
          </View>
        )}
        
        <Pressable
          style={[
            styles.button,
            styles.syncButton,
            (isSyncing || syncCount === 0) && styles.disabledButton
          ]}
          onPress={handleSyncProducts}
          disabled={isSyncing || syncCount === 0}
        >
          {isSyncing ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <RefreshCw size={18} color="white" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>
                Synchroniser {syncCount > 0 ? `(${syncCount})` : ''}
              </Text>
            </>
          )}
        </Pressable>
      </View>
      
      {/* App Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>À propos</Text>
        <Text style={styles.appInfo}>SandySpace Product Manager</Text>
        <Text style={styles.appVersion}>Version 1.0.0</Text>
        <Text style={styles.appCopyright}>© 2025 SandySpace</Text>
      </View>
    </ScrollView>
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 24,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputIcon: {
    marginRight: 8,
  },
  labelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  input: {
    backgroundColor: '#f5f6fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2c3e50',
    borderWidth: 1,
    borderColor: '#ecf0f1',
  },
  apiKeyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  apiKeyInput: {
    flex: 1,
  },
  visibilityToggle: {
    position: 'absolute',
    right: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#3498db',
  },
  pinButton: {
    backgroundColor: '#9b59b6',
  },
  syncButton: {
    backgroundColor: '#27ae60',
  },
  disabledButton: {
    backgroundColor: '#bdc3c7',
  },
  syncInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  syncInfoLabel: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  syncInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  appInfo: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  appCopyright: {
    fontSize: 12,
    color: '#95a5a6',
  },
});