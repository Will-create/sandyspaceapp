import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Delete } from 'lucide-react-native';
import { verifyPIN } from '@/lib/storage';

export default function PinScreen() {
  const [pin, setPin] = useState<string[]>(['', '', '', '']);
  const [error, setError] = useState<string | null>(null);

  // Handle number press
  const handleNumberPress = (number: string) => {
    const currentIndex = pin.findIndex(digit => digit === '');
    if (currentIndex === -1) return;

    const newPin = [...pin];
    newPin[currentIndex] = number;
    setPin(newPin);

    // Clear any previous error
    if (error) {
      setError(null);
    }

    // Auto-submit when PIN is complete
    if (currentIndex === 3) {
      setTimeout(() => handleSubmit(newPin), 300);
    }
  };

  // Handle delete press
  const handleDelete = () => {
    const lastFilledIndex = pin.map(digit => digit !== '').lastIndexOf(true);
    if (lastFilledIndex === -1) return;

    const newPin = [...pin];
    newPin[lastFilledIndex] = '';
    setPin(newPin);

    // Clear any previous error
    if (error) {
      setError(null);
    }
  };

  // Verify PIN on submit
  const handleSubmit = async (pinToVerify: string[]) => {
    const enteredPin = pinToVerify.join('');
    
    if (enteredPin.length !== 4) {
      setError('Veuillez entrer un code PIN à 4 chiffres');
      return;
    }

    const isValid = await verifyPIN(enteredPin);
    
    if (isValid) {
      router.replace('/(tabs)');
    } else {
      setError('Code PIN incorrect');
      setPin(['', '', '', '']);
    }
  };

  // Render number button
  const NumberButton = ({ number }: { number: string }) => (
    <Pressable
      style={({ pressed }) => [
        styles.numberButton,
        pressed && styles.numberButtonPressed
      ]}
      onPress={() => handleNumberPress(number)}
    >
      <Text style={styles.numberButtonText}>{number}</Text>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.logoContainer}>
        <Image 
          source={require('../assets/images/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>SandySpace</Text>
        <Text style={styles.subtitle}>Gestionnaire de produits</Text>
      </View>

      <View style={styles.pinContainer}>
        <Text style={styles.pinLabel}>Entrez votre code PIN</Text>
        
        <View style={styles.dotsContainer}>
          {pin.map((digit, index) => (
            <View 
              key={index} 
              style={[
                styles.dot,
                digit !== '' && styles.dotFilled
              ]} 
            />
          ))}
        </View>
        
        {error && <Text style={styles.errorText}>{error}</Text>}
        
        <View style={styles.keypadContainer}>
          <View style={styles.keypadRow}>
            <NumberButton number="1" />
            <NumberButton number="2" />
            <NumberButton number="3" />
          </View>
          <View style={styles.keypadRow}>
            <NumberButton number="4" />
            <NumberButton number="5" />
            <NumberButton number="6" />
          </View>
          <View style={styles.keypadRow}>
            <NumberButton number="7" />
            <NumberButton number="8" />
            <NumberButton number="9" />
          </View>
          <View style={styles.keypadRow}>
            <View style={styles.numberButton} />
            <NumberButton number="0" />
            <Pressable
              style={({ pressed }) => [
                styles.numberButton,
                pressed && styles.numberButtonPressed
              ]}
              onPress={handleDelete}
            >
              <Delete size={24} color="white" />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#400605',
    padding: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 64,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: 'white',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
  },
  pinContainer: {
    alignItems: 'center',
  },
  pinLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 24,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 8,
  },
  dotFilled: {
    backgroundColor: 'white',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
  },
  keypadContainer: {
    width: '100%',
    maxWidth: 300,
    alignSelf: 'center',
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  numberButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberButtonPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  numberButtonText: {
    color: 'white',
    fontSize: 32,
    fontWeight: '600',
  },
});