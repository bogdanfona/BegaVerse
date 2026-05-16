import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { Gyroscope } from 'expo-sensors';
import Svg, { 
  Defs, 
  RadialGradient, 
  LinearGradient,
  Stop, 
  Circle,
  Rect, 
  Polygon, 
  Path,
  Line,
  Ellipse,
  G,
  Text as SvgText
} from 'react-native-svg';

const { width, height } = Dimensions.get('window');

export default function ARDimensionScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [arActive, setArActive] = useState(false);
  const [objectPlaced, setObjectPlaced] = useState(false);
  const [viewRotation, setViewRotation] = useState(0);
  const [viewTilt, setViewTilt] = useState(0);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scanAnim = useRef(new Animated.Value(0)).current;
  const planeOpacity = useRef(new Animated.Value(0)).current;
  const objectScale = useRef(new Animated.Value(0)).current;
  const gyroSubscription = useRef(null);
  
  useEffect(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
    
    // Scanning animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
    
    return () => {
      if (gyroSubscription.current) {
        gyroSubscription.current.remove();
      }
    };
  }, []);
  
  // Gyroscope for AR tracking
  useEffect(() => {
    if (arActive) {
      startGyroscope();
    } else {
      stopGyroscope();
    }
  }, [arActive]);
  
  const startGyroscope = async () => {
    try {
      await Gyroscope.setUpdateInterval(16);
      
      gyroSubscription.current = Gyroscope.addListener(gyroscopeData => {
        // INVERSE rotation so objects appear "fixed" in space
        setViewRotation(prev => {
          const newRotation = prev - (gyroscopeData.y * 25);
          return Math.max(-800, Math.min(800, newRotation));
        });
        
        setViewTilt(prev => {
          const newTilt = prev - (gyroscopeData.x * 15);
          return Math.max(-100, Math.min(100, newTilt));
        });
      });
    } catch (error) {
      console.log('Gyroscope not available');
    }
  };
  
  const stopGyroscope = () => {
    if (gyroSubscription.current) {
      gyroSubscription.current.remove();
      gyroSubscription.current = null;
    }
  };
  
  // Start AR scanning
  const startAR = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setArActive(true);
    
    // Animate plane detection
    Animated.timing(planeOpacity, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();
    
    Alert.alert(
      '📱 Scanning for Surfaces',
      'Point camera at a flat surface (floor, table, ground)',
      [{ text: 'Got it!', style: 'default' }]
    );
  };
  
  // Place 3D object
  const placeObject = () => {
    if (!arActive) return;
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setObjectPlaced(true);
    
    Animated.spring(objectScale, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
    
    Alert.alert(
      '🌊 Bega River Placed!',
      'Move your phone to view from different angles. The 3D model stays anchored in space!',
      [{ text: 'Explore!', style: 'default' }]
    );
  };
  
  // Exit AR
  const exitAR = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Animated.parallel([
      Animated.timing(planeOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(objectScale, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start(() => {
      setArActive(false);
      setObjectPlaced(false);
      setViewRotation(0);
      setViewTilt(0);
    });
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
        <Text style={styles.text}>AR Experience</Text>
        <Text style={styles.subtext}>
          True augmented reality - see 3D Bega overlaid on your world!
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

  const scanPosition = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, height * 0.8]
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* CAMERA ALWAYS ON - Real World */}
      <CameraView style={styles.camera} facing="back" />

      {/* AR OVERLAY */}
      <View style={styles.arOverlay} pointerEvents="box-none">
        
        {/* Plane Detection Grid (appears when scanning) */}
        {arActive && (
          <Animated.View 
            style={[
              styles.planeDetection,
              { opacity: planeOpacity }
            ]}
            pointerEvents="none"
          >
            <Svg height={height} width={width}>
              <Defs>
                <LinearGradient id="gridGrad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor="#00E5FF" stopOpacity="0" />
                  <Stop offset="0.5" stopColor="#00E5FF" stopOpacity="0.4" />
                  <Stop offset="1" stopColor="#00E5FF" stopOpacity="0" />
                </LinearGradient>
              </Defs>
              
              {/* Grid pattern */}
              {[...Array(15)].map((_, i) => (
                <G key={`grid-${i}`}>
                  {/* Horizontal lines */}
                  <Line
                    x1="0"
                    y1={height * 0.5 + i * 40 - 300}
                    x2={width}
                    y2={height * 0.5 + i * 40 - 300}
                    stroke="#00E5FF"
                    strokeWidth="1"
                    opacity="0.3"
                  />
                  {/* Vertical lines */}
                  <Line
                    x1={i * (width / 15)}
                    y1={height * 0.3}
                    x2={i * (width / 15)}
                    y2={height * 0.9}
                    stroke="#00E5FF"
                    strokeWidth="1"
                    opacity="0.3"
                  />
                </G>
              ))}
              
              {/* Center target */}
              <Circle cx={width / 2} cy={height * 0.6} r="50" fill="none" stroke="#00E5FF" strokeWidth="2" opacity="0.6" />
              <Circle cx={width / 2} cy={height * 0.6} r="30" fill="none" stroke="#00E5FF" strokeWidth="2" opacity="0.6" />
              <Circle cx={width / 2} cy={height * 0.6} r="10" fill="#00E5FF" opacity="0.8" />
            </Svg>
          </Animated.View>
        )}
        
        {/* Scanning line */}
        {arActive && !objectPlaced && (
          <Animated.View
            style={[
              styles.scanLine,
              { transform: [{ translateY: scanPosition }] }
            ]}
            pointerEvents="none"
          >
            <Svg height="3" width={width}>
              <Line x1="0" y1="1.5" x2={width} y2="1.5" stroke="#00E5FF" strokeWidth="3" opacity="0.8" />
            </Svg>
          </Animated.View>
        )}
        
        {/* 3D Bega Object (placed in AR space) */}
        {objectPlaced && (
          <Animated.View
            style={[
              styles.arObject,
              {
                transform: [
                  { scale: objectScale },
                  { translateX: viewRotation * 0.5 },
                  { translateY: viewTilt * 0.3 }
                ]
              }
            ]}
            pointerEvents="none"
          >
            <Svg height={400} width={width * 2} viewBox={`${viewRotation} ${viewTilt} ${width} 400`}>
              <Defs>
                <LinearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor="#64B5F6" stopOpacity="0.9" />
                  <Stop offset="1" stopColor="#1976D2" stopOpacity="0.9" />
                </LinearGradient>
                
                <LinearGradient id="buildingGrad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor="#ECEFF1" stopOpacity="0.9" />
                  <Stop offset="1" stopColor="#90A4AE" stopOpacity="0.9" />
                </LinearGradient>
                
                <RadialGradient id="shadowGrad">
                  <Stop offset="0" stopColor="#000000" stopOpacity="0.4" />
                  <Stop offset="1" stopColor="#000000" stopOpacity="0" />
                </RadialGradient>
              </Defs>
              
              {/* Shadow on ground */}
              <Ellipse cx={width} cy="350" rx="180" ry="30" fill="url(#shadowGrad)" />
              
              {/* River - 3D perspective */}
              <Path
                d={`M ${width * 0.7},250 L ${width * 1.3},250 L ${width * 1.25},320 L ${width * 0.75},320 Z`}
                fill="url(#waterGrad)"
              />
              
              {/* Water waves */}
              <Path
                d={`M ${width * 0.78},270 Q ${width * 0.9},265 ${width},270 T ${width * 1.22},270`}
                stroke="#90CAF9"
                strokeWidth="3"
                fill="none"
                opacity="0.7"
              />
              <Path
                d={`M ${width * 0.8},285 Q ${width * 0.92},280 ${width},285 T ${width * 1.2},285`}
                stroke="#90CAF9"
                strokeWidth="3"
                fill="none"
                opacity="0.7"
              />
              
              {/* Building - left */}
              <Rect x={width * 0.5} y="150" width="120" height="200" fill="url(#buildingGrad)" />
              <Polygon points={`${width * 0.5},150 ${width * 0.5 + 60},130 ${width * 0.5 + 120},150`} fill="#CFD8DC" />
              
              {/* Windows */}
              {[0, 1, 2].map(row =>
                [0, 1].map(col => (
                  <Rect
                    key={`win-${row}-${col}`}
                    x={width * 0.5 + 20 + col * 50}
                    y={170 + row * 50}
                    width="25"
                    height="35"
                    fill="#1976D2"
                    opacity="0.8"
                  />
                ))
              )}
              
              {/* Building - right */}
              <Rect x={width * 1.3} y="160" width="130" height="190" fill="url(#buildingGrad)" />
              <Polygon points={`${width * 1.3},160 ${width * 1.3 + 65},140 ${width * 1.3 + 130},160`} fill="#BDBDBD" />
              
              {[0, 1, 2].map(row =>
                [0, 1].map(col => (
                  <Rect
                    key={`win2-${row}-${col}`}
                    x={width * 1.3 + 25 + col * 55}
                    y={180 + row * 50}
                    width="28"
                    height="38"
                    fill="#1976D2"
                    opacity="0.8"
                  />
                ))
              )}
              
              {/* Trees */}
              <Polygon points={`${width * 0.8},230 ${width * 0.8 + 20},210 ${width * 0.8 + 40},230`} fill="#2E7D32" opacity="0.9" />
              <Rect x={width * 0.8 + 16} y="230" width="8" height="25" fill="#5D4037" />
              
              <Polygon points={`${width * 1.15},230 ${width * 1.15 + 20},210 ${width * 1.15 + 40},230`} fill="#2E7D32" opacity="0.9" />
              <Rect x={width * 1.15 + 16} y="230" width="8" height="25" fill="#5D4037" />
              
              {/* Bridge */}
              <Rect x={width * 0.72} y="248" width="160" height="12" fill="#8D6E63" opacity="0.9" />
              {[0, 1, 2, 3].map(i => (
                <Rect
                  key={`bridge-${i}`}
                  x={width * 0.72 + 15 + i * 38}
                  y="260"
                  width="6"
                  height="30"
                  fill="#6D4C41"
                  opacity="0.9"
                />
              ))}
              
              {/* Info marker */}
              <Circle cx={width} cy="240" r="15" fill="#FF9800" opacity="0.95" />
              <SvgText x={width} y="246" textAnchor="middle" fontSize="18" fill="#fff">📍</SvgText>
            </Svg>
          </Animated.View>
        )}
        
        {/* AR HUD */}
        {arActive && (
          <View style={styles.arHud}>
            <View style={styles.hudBadge}>
              <Text style={styles.hudText}>
                {objectPlaced ? '✅ AR OBJECT PLACED' : '🔍 SCANNING SURFACE'}
              </Text>
            </View>
            
            {objectPlaced && (
              <View style={styles.trackingInfo}>
                <Text style={styles.trackingText}>
                  🎯 Tracking: Active | Distance: 1.2m
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* UI Controls */}
      <View style={styles.overlay} pointerEvents="box-none">
        
        {/* Instructions */}
        {!arActive && (
          <View style={styles.header}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>🎯 AR READY</Text>
            </View>
            <Text style={styles.title}>Augmented Reality Mode</Text>
            
            <View style={styles.instructions}>
              <Text style={styles.instructionTitle}>💡 How it works:</Text>
              <Text style={styles.instructionText}>
                1. Tap "Start AR" below{'\n'}
                2. Point camera at flat surface{'\n'}
                3. Tap "Place Object" when ready{'\n'}
                4. Move phone to view from all angles!
              </Text>
            </View>
          </View>
        )}
        
        {/* Start AR Button */}
        {!arActive && (
          <TouchableOpacity 
            style={styles.startButton}
            onPress={startAR}
          >
            <Text style={styles.startButtonText}>🚀 Start AR Scanning</Text>
          </TouchableOpacity>
        )}
        
        {/* Place Object Button */}
        {arActive && !objectPlaced && (
          <TouchableOpacity 
            style={styles.placeButton}
            onPress={placeObject}
          >
            <Text style={styles.placeButtonText}>📍 Place Bega River Here</Text>
          </TouchableOpacity>
        )}
        
        {/* Exit Button */}
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => {
            if (arActive) {
              exitAR();
            } else {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              navigation.goBack();
            }
          }}
        >
          <Text style={styles.closeButtonText}>
            {arActive ? '🔴 Exit AR' : '✕ Back'}
          </Text>
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
  camera: {
    flex: 1,
  },
  arOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  planeDetection: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scanLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  arObject: {
    position: 'absolute',
    top: height * 0.3,
    left: -width * 0.5,
    right: -width * 0.5,
  },
  arHud: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  hudBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.95)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 10,
  },
  hudText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  trackingInfo: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 12,
  },
  trackingText: {
    color: '#00E5FF',
    fontSize: 12,
    fontWeight: 'bold',
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
    backgroundColor: 'rgba(0, 229, 255, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    marginBottom: 10,
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
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  instructions: {
    backgroundColor: 'rgba(0, 119, 190, 0.9)',
    padding: 20,
    borderRadius: 15,
    marginHorizontal: 20,
    marginTop: 20,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  instructionText: {
    fontSize: 13,
    color: '#fff',
    lineHeight: 22,
  },
  startButton: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    backgroundColor: '#4CAF50',
    padding: 20,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeButton: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    backgroundColor: '#FF9800',
    padding: 20,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  placeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
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