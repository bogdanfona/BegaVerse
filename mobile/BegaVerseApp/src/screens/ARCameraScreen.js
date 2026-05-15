import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

export default function ARCameraScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.cameraPlaceholder}>
        <Text style={styles.cameraIcon}>📷</Text>
        <Text style={styles.cameraText}>Camera View</Text>
        <Text style={styles.instructionText}>
          Point camera at QR code on Bega River
        </Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => alert('QR Scanner will be implemented next!')}
        >
          <Text style={styles.buttonText}>📸 Scan QR Code</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.secondaryButtonText}>← Back to Home</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>💡 How it works:</Text>
        <Text style={styles.infoText}>
          1. Find a QR code marker along Bega River{'\n'}
          2. Point your camera at it{'\n'}
          3. Unlock AR content: history, ecology, art
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  cameraIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  cameraText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  instructionText: {
    fontSize: 14,
    color: '#FFB74D',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  controls: {
    padding: 20,
    backgroundColor: '#000',
  },
  button: {
    backgroundColor: '#0077BE',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#fff',
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  infoBox: {
    backgroundColor: '#0077BE',
    padding: 20,
    margin: 20,
    marginTop: 0,
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 22,
  },
});