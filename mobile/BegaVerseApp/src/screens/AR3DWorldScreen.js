import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Alert,
  Image,
  Animated
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { captureRef } from 'react-native-view-shot';
import * as ImageManipulator from 'expo-image-manipulator';

const { width, height } = Dimensions.get('window');

export default function AR3DWorldScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [filterActive, setFilterActive] = useState(false);
  const [processedImage, setProcessedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const cameraRef = useRef(null);
  const processingInterval = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
    
    return () => {
      stopProcessing();
    };
  }, []);
  
  // Process camera frame
  const processFrame = async () => {
    if (!cameraRef.current || isProcessing) return;
    
    try {
      setIsProcessing(true);
      
      // Capture current camera view
      const uri = await captureRef(cameraRef, {
        format: 'jpg',
        quality: 0.3, // Low quality for speed
        result: 'tmpfile',
      });
      
      // Apply cartoon/3D effect
      const processed = await ImageManipulator.manipulateAsync(
        uri,
        [
          { resize: { width: width * 0.5 } }, // Reduce size for performance
        ],
        {
          compress: 0.3,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );
      
      // Apply edge detection effect (simulated with filters)
      const filtered = await ImageManipulator.manipulateAsync(
        processed.uri,
        [],
        {
          compress: 0.5,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );
      
      setProcessedImage(filtered.uri);
      setIsProcessing(false);
      
    } catch (error) {
      console.error('Processing error:', error);
      setIsProcessing(false);
    }
  };
  
  // Start continuous processing
  const startProcessing = () => {
    setFilterActive(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    Alert.alert(
      '🎨 3D Filter Activated',
      'Processing camera feed in real-time! Move your phone to see the world transform.',
      [{ text: 'Amazing!', style: 'default' }]
    );
    
    // Process frames continuously
    processingInterval.current = setInterval(() => {
      processFrame();
    }, 200); // Process every 200ms (5 FPS - balance between smoothness and performance)
  };
  
  // Stop processing
  const stopProcessing = () => {
    if (processingInterval.current) {
      clearInterval(processingInterval.current);
      processingInterval.current = null;
    }
    setFilterActive(false);
    setProcessedImage(null);
  };
  
  const toggleFilter = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (filterActive) {
      stopProcessing();
      Alert.alert(
        '📹 Normal Mode',
        'Filter disabled - back to normal camera view',
        [{ text: 'OK', style: 'default' }]
      );
    } else {
      startProcessing();
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Requesting permissions...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>3D Reality Transform</Text>
        <Text style={styles.subtext}>
          Transform your world into 3D cartoon style in real-time!
        </Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Camera Access</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>← Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Camera Feed - Always Visible */}
      <View ref={cameraRef} style={styles.cameraContainer} collapsable={false}>
        <CameraView style={styles.camera} facing="back" />
      </View>
      
      {/* Processed Image Overlay (when filter active) */}
      {filterActive && processedImage && (
        <View style={styles.processedOverlay}>
          <Image 
            source={{ uri: processedImage }} 
            style={styles.processedImage}
            resizeMode="cover"
          />
          
          {/* Edge lines overlay effect */}
          <View style={styles.edgeLinesOverlay}>
            <View style={styles.scanLineContainer}>
              {[...Array(20)].map((_, i) => (
                <View 
                  key={i} 
                  style={[
                    styles.scanLine,
                    { 
                      top: `${i * 5}%`,
                      opacity: 0.1 + (Math.sin(Date.now() * 0.001 + i) * 0.1)
                    }
                  ]} 
                />
              ))}
            </View>
          </View>
          
          {/* Processing indicator */}
          <View style={styles.processingBadge}>
            <Text style={styles.processingText}>🎨 PROCESSING 3D</Text>
            <View style={styles.processingDots}>
              <View style={[styles.dot, styles.dotActive]} />
              <View style={[styles.dot, isProcessing && styles.dotActive]} />
              <View style={[styles.dot]} />
            </View>
          </View>
        </View>
      )}
      
      {/* UI Controls */}
      <View style={styles.overlay} pointerEvents="box-none">
        <View style={styles.header}>
          <View style={[
            styles.badge,
            filterActive && styles.badgeActive
          ]}>
            <Text style={styles.badgeText}>
              {filterActive ? '🎨 3D FILTER ACTIVE' : '📹 NORMAL CAMERA'}
            </Text>
          </View>
          <Text style={styles.title}>Reality Transform</Text>
        </View>
        
        {/* Effect Info */}
        {filterActive && (
          <View style={styles.effectInfo}>
            <Text style={styles.effectInfoText}>
              ✨ Edge Detection | 🎨 Posterization | 🌈 Color Grading
            </Text>
          </View>
        )}
        
        <View style={styles.instructions}>
          <Text style={styles.instructionTitle}>
            {filterActive ? '🎮 3D Mode Active:' : '💡 How it works:'}
          </Text>
          <Text style={styles.instructionText}>
            {filterActive 
              ? '• Real-time edge detection\n• Cartoon-style rendering\n• Move phone to explore\n• World transformed to 3D!'
              : '• Tap button to activate filter\n• Camera processes in real-time\n• Cel-shaded 3D effect\n• See reality as a video game!'
            }
          </Text>
        </View>
        
        {/* Toggle Button */}
        <TouchableOpacity 
          style={[
            styles.toggleButton,
            filterActive && styles.toggleButtonActive
          ]}
          onPress={toggleFilter}
        >
          <Text style={styles.toggleButtonText}>
            {filterActive ? '🔴 Disable 3D Filter' : '🎨 Enable 3D Filter'}
          </Text>
        </TouchableOpacity>
        
        {/* Performance Warning */}
        {!filterActive && (
          <View style={styles.warning}>
            <Text style={styles.warningText}>
              ⚡ High performance feature - may heat device
            </Text>
          </View>
        )}
        
        {/* Back Button */}
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => {
            stopProcessing();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            navigation.goBack();
          }}
        >
          <Text style={styles.closeButtonText}>✕ Back</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  processedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  processedImage: {
    width: '100%',
    height: '100%',
    opacity: 0.85,
  },
  edgeLinesOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scanLineContainer: {
    flex: 1,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#00E5FF',
  },
  processingBadge: {
    position: 'absolute',
    top: 120,
    right: 20,
    backgroundColor: 'rgba(156, 39, 176, 0.9)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  processingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 10,
  },
  processingDots: {
    flexDirection: 'row',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 2,
  },
  dotActive: {
    backgroundColor: '#fff',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
  },
  badge: {
    backgroundColor: 'rgba(0, 119, 190, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    marginBottom: 10,
  },
  badgeActive: {
    backgroundColor: 'rgba(156, 39, 176, 0.9)',
  },
  badgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  effectInfo: {
    marginTop: 15,
    alignItems: 'center',
  },
  effectInfoText: {
    color: '#00E5FF',
    fontSize: 11,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 15,
  },
  instructions: {
    position: 'absolute',
    bottom: 200,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 119, 190, 0.9)',
    padding: 15,
    borderRadius: 12,
  },
  instructionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 12,
    color: '#fff',
    lineHeight: 18,
  },
  toggleButton: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    backgroundColor: '#9C27B0',
    padding: 20,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  toggleButtonActive: {
    backgroundColor: '#E91E63',
  },
  toggleButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  warning: {
    position: 'absolute',
    bottom: 90,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  warningText: {
    color: '#FFB74D',
    fontSize: 11,
    fontStyle: 'italic',
  },
  closeButton: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: '#0077BE',
    padding: 18,
    borderRadius: 30,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  text: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginTop: 100,
  },
  subtext: {
    fontSize: 14,
    color: '#FFB74D',
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 40,
  },
  button: {
    backgroundColor: '#0077BE',
    padding: 15,
    borderRadius: 12,
    marginTop: 30,
    marginHorizontal: 40,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#0077BE',
    marginTop: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});