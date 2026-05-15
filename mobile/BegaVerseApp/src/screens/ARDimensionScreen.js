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
  Ellipse,
  G,
  Text as SvgText
} from 'react-native-svg';

const { width, height } = Dimensions.get('window');

export default function ARDimensionScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [in3DWorld, setIn3DWorld] = useState(false);
  const [cameraRotation, setCameraRotation] = useState({ x: 0, y: 0, z: 0 });
  const [viewOffset, setViewOffset] = useState(0);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const portalGlow = useRef(new Animated.Value(0)).current;
  const worldFade = useRef(new Animated.Value(0)).current;
  const gyroSubscription = useRef(null);
  
  useEffect(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
    
    // Portal glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(portalGlow, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(portalGlow, {
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
  
  // Start gyroscope when entering 3D world
  useEffect(() => {
    if (in3DWorld) {
      startGyroscope();
    } else {
      stopGyroscope();
    }
  }, [in3DWorld]);
  
  const startGyroscope = async () => {
    try {
      await Gyroscope.setUpdateInterval(16); // 60fps
      
      gyroSubscription.current = Gyroscope.addListener(gyroscopeData => {
        // Update view based on phone rotation
        setViewOffset(prev => {
          const newOffset = prev + (gyroscopeData.y * 50); // Rotate left/right
          // Keep within bounds (-800 to 800 for full 360° view)
          return Math.max(-800, Math.min(800, newOffset));
        });
        
        setCameraRotation({
          x: gyroscopeData.x,
          y: gyroscopeData.y,
          z: gyroscopeData.z
        });
      });
    } catch (error) {
      console.log('Gyroscope not available:', error);
    }
  };
  
  const stopGyroscope = () => {
    if (gyroSubscription.current) {
      gyroSubscription.current.remove();
      gyroSubscription.current = null;
    }
  };
  
  // Enter 3D world
  const enterWorld = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    Alert.alert(
      '🌊 Entering Bega Dimension',
      'Move your phone to look around the 360° 3D Bega world!',
      [{ 
        text: 'Enter!', 
        onPress: () => {
          setIn3DWorld(true);
          setViewOffset(0);
          
          Animated.timing(worldFade, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }).start();
        }
      }]
    );
  };
  
  // Exit 3D world
  const exitWorld = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Animated.timing(worldFade, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      setIn3DWorld(false);
      setViewOffset(0);
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
        <Text style={styles.text}>3D Immersive Experience</Text>
        <Text style={styles.subtext}>
          Enter a full 360° 3D world! Move your phone to look around.
        </Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Access</Text>
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

  const glowOpacity = portalGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1]
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Camera Background (only before entering) */}
      {!in3DWorld && <CameraView style={styles.camera} facing="back" />}

      {/* Portal Entry */}
      {!in3DWorld && (
        <View style={styles.portalContainer}>
          <TouchableOpacity 
            style={styles.portalButton}
            onPress={enterWorld}
            activeOpacity={0.8}
          >
            <Animated.View style={{ opacity: glowOpacity }}>
              <Svg height={250} width={250}>
                <Defs>
                  <RadialGradient id="portalGlow">
                    <Stop offset="0" stopColor="#00e5ff" stopOpacity="0.9" />
                    <Stop offset="0.7" stopColor="#00b8d4" stopOpacity="0.5" />
                    <Stop offset="1" stopColor="#006064" stopOpacity="0.2" />
                  </RadialGradient>
                </Defs>
                
                <Circle cx="125" cy="125" r="120" fill="url(#portalGlow)" />
                <Circle cx="125" cy="125" r="100" fill="none" stroke="#00e5ff" strokeWidth="3" strokeDasharray="10,5" />
                <Circle cx="125" cy="125" r="80" fill="none" stroke="#00e5ff" strokeWidth="2" />
                <Circle cx="125" cy="125" r="60" fill="none" stroke="#00e5ff" strokeWidth="3" strokeDasharray="10,5" />
                <Circle cx="125" cy="125" r="20" fill="#00e5ff" />
              </Svg>
              
              <View style={styles.portalLabel}>
                <Text style={styles.portalText}>🌊 ENTER 3D DIMENSION</Text>
                <Text style={styles.portalSubtext}>Full 360° Immersive World</Text>
              </View>
            </Animated.View>
          </TouchableOpacity>
        </View>
      )}

      {/* FULL 360° 3D WORLD */}
      {in3DWorld && (
        <Animated.View style={[styles.worldContainer, { opacity: worldFade }]}>
          <Svg 
            height={height} 
            width={width * 4} // 4x width for 360° panorama
            viewBox={`${viewOffset} 0 ${width} ${height}`}
            style={styles.worldSvg}
          >
            <Defs>
              {/* Sky gradient */}
              <LinearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#87CEEB" stopOpacity="1" />
                <Stop offset="1" stopColor="#4A90E2" stopOpacity="1" />
              </LinearGradient>
              
              {/* Ground gradient */}
              <LinearGradient id="groundGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#8BC34A" stopOpacity="1" />
                <Stop offset="1" stopColor="#689F38" stopOpacity="1" />
              </LinearGradient>
              
              {/* Water gradient */}
              <LinearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#64B5F6" stopOpacity="1" />
                <Stop offset="1" stopColor="#1976D2" stopOpacity="1" />
              </LinearGradient>
            </Defs>
            
            {/* Sky - full panorama */}
            <Rect x="0" y="0" width={width * 4} height={height * 0.6} fill="url(#skyGrad)" />
            
            {/* Sun */}
            <Circle cx={width * 2} cy={height * 0.15} r="60" fill="#FFD700" opacity="0.8" />
            
            {/* Ground/Grass */}
            <Rect x="0" y={height * 0.6} width={width * 4} height={height * 0.4} fill="url(#groundGrad)" />
            
            {/* River running through - continuous */}
            <Rect 
              x="0" 
              y={height * 0.55} 
              width={width * 4} 
              height={height * 0.15} 
              fill="url(#waterGrad)" 
            />
            
            {/* Water waves pattern */}
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <Path
                key={i}
                d={`M ${i * width/2},${height * 0.6} Q ${i * width/2 + width/8},${height * 0.58} ${i * width/2 + width/4},${height * 0.6} T ${(i + 1) * width/2},${height * 0.6}`}
                stroke="#90CAF9"
                strokeWidth="3"
                fill="none"
                opacity="0.5"
              />
            ))}
            
            {/* Buildings - LEFT SIDE */}
            <G>
              {/* Building 1 */}
              <Rect x={width * 0.2} y={height * 0.35} width="120" height="180" fill="#BDBDBD" />
              <Polygon points={`${width * 0.2},${height * 0.35} ${width * 0.2 + 60},${height * 0.3} ${width * 0.2 + 120},${height * 0.35}`} fill="#9E9E9E" />
              {/* Windows */}
              <Rect x={width * 0.2 + 20} y={height * 0.4} width="25" height="30" fill="#1976D2" opacity="0.7" />
              <Rect x={width * 0.2 + 75} y={height * 0.4} width="25" height="30" fill="#1976D2" opacity="0.7" />
              
              {/* Building 2 */}
              <Rect x={width * 0.5} y={height * 0.3} width="100" height="220" fill="#CFD8DC" />
              <Polygon points={`${width * 0.5},${height * 0.3} ${width * 0.5 + 50},${height * 0.25} ${width * 0.5 + 100},${height * 0.3}`} fill="#B0BEC5" />
              <Rect x={width * 0.5 + 15} y={height * 0.38} width="20" height="25" fill="#1976D2" opacity="0.7" />
              <Rect x={width * 0.5 + 65} y={height * 0.38} width="20" height="25" fill="#1976D2" opacity="0.7" />
            </G>
            
            {/* Buildings - CENTER (you see this when looking forward) */}
            <G>
              {/* Tall building */}
              <Rect x={width * 1.5} y={height * 0.25} width="150" height="260" fill="#ECEFF1" />
              <Polygon points={`${width * 1.5},${height * 0.25} ${width * 1.5 + 75},${height * 0.18} ${width * 1.5 + 150},${height * 0.25}`} fill="#CFD8DC" />
              {/* Windows grid */}
              {[0, 1, 2].map(row => 
                [0, 1].map(col => (
                  <Rect 
                    key={`${row}-${col}`}
                    x={width * 1.5 + 30 + col * 60} 
                    y={height * 0.32 + row * 50} 
                    width="30" 
                    height="35" 
                    fill="#1976D2" 
                    opacity="0.7" 
                  />
                ))
              )}
              
              {/* Historic building */}
              <Rect x={width * 1.8} y={height * 0.35} width="140" height="180" fill="#D7CCC8" />
              <Polygon points={`${width * 1.8},${height * 0.35} ${width * 1.8 + 70},${height * 0.3} ${width * 1.8 + 140},${height * 0.35}`} fill="#BCAAA4" />
              <Rect x={width * 1.8 + 35} y={height * 0.42} width="30" height="40" fill="#8D6E63" opacity="0.8" />
            </G>
            
            {/* Buildings - RIGHT SIDE */}
            <G>
              <Rect x={width * 2.5} y={height * 0.32} width="130" height="200" fill="#B0BEC5" />
              <Polygon points={`${width * 2.5},${height * 0.32} ${width * 2.5 + 65},${height * 0.27} ${width * 2.5 + 130},${height * 0.32}`} fill="#90A4AE" />
              
              <Rect x={width * 2.8} y={height * 0.38} width="110" height="170" fill="#CFD8DC" />
              <Polygon points={`${width * 2.8},${height * 0.38} ${width * 2.8 + 55},${height * 0.33} ${width * 2.8 + 110},${height * 0.38}`} fill="#B0BEC5" />
            </G>
            
            {/* Trees along the river */}
            {[0.3, 0.6, 1.2, 1.7, 2.2, 2.7, 3.2].map((pos, idx) => (
              <G key={idx}>
                <Polygon 
                  points={`${width * pos},${height * 0.52} ${width * pos + 25},${height * 0.45} ${width * pos + 50},${height * 0.52}`} 
                  fill="#2E7D32" 
                />
                <Rect x={width * pos + 20} y={height * 0.52} width="10" height="30" fill="#5D4037" />
              </G>
            ))}
            
            {/* Bridge */}
            <Rect x={width * 1.45} y={height * 0.54} width="200" height="15" fill="#8D6E63" />
            {[0, 1, 2, 3].map(i => (
              <Rect 
                key={i}
                x={width * 1.45 + 20 + i * 45} 
                y={height * 0.54 + 15} 
                width="8" 
                height="35" 
                fill="#6D4C41" 
              />
            ))}
            
            {/* Info markers floating */}
            <Circle cx={width * 0.4} cy={height * 0.48} r="15" fill="#FF9800" opacity="0.9" />
            <SvgText x={width * 0.4} y={height * 0.485} textAnchor="middle" fontSize="18" fill="#fff">📍</SvgText>
            
            <Circle cx={width * 1.6} cy={height * 0.45} r="15" fill="#FF9800" opacity="0.9" />
            <SvgText x={width * 1.6} y={height * 0.455} textAnchor="middle" fontSize="18" fill="#fff">📍</SvgText>
            
            <Circle cx={width * 2.6} cy={height * 0.48} r="15" fill="#FF9800" opacity="0.9" />
            <SvgText x={width * 2.6} y={height * 0.485} textAnchor="middle" fontSize="18" fill="#fff">📍</SvgText>
            
            {/* Clouds */}
            <Ellipse cx={width * 0.7} cy={height * 0.2} rx="80" ry="40" fill="#FFFFFF" opacity="0.6" />
            <Ellipse cx={width * 1.8} cy={height * 0.15} rx="100" ry="45" fill="#FFFFFF" opacity="0.6" />
            <Ellipse cx={width * 2.9} cy={height * 0.22} rx="90" ry="42" fill="#FFFFFF" opacity="0.6" />
          </Svg>
          
          {/* HUD */}
          <View style={styles.hud}>
            <View style={styles.hudTop}>
              <View style={styles.hudBadge}>
                <Text style={styles.hudText}>🎮 IMMERSIVE 3D WORLD</Text>
              </View>
              <Text style={styles.hudInfo}>
                Rotation: {Math.round(viewOffset)}° | Move phone to look around
              </Text>
            </View>
            
            <View style={styles.compass}>
              <Text style={styles.compassText}>
                {viewOffset < -400 ? '← WEST' : 
                 viewOffset < -200 ? '↖ NW' :
                 viewOffset < 0 ? '↑ NORTH' :
                 viewOffset < 200 ? '↗ NE' :
                 viewOffset < 400 ? '→ EAST' :
                 '↘ SE'}
              </Text>
            </View>
          </View>
        </Animated.View>
      )}

      {/* UI Controls */}
      <View style={styles.overlay} pointerEvents="box-none">
        {!in3DWorld && (
          <>
            <View style={styles.header}>
              <View style={styles.arBadge}>
                <Text style={styles.arBadgeText}>🎯 360° 3D PORTAL</Text>
              </View>
              <Text style={styles.title}>Immersive Bega Dimension</Text>
            </View>
            
            <View style={styles.instructions}>
              <Text style={styles.instructionTitle}>💡 Instructions:</Text>
              <Text style={styles.instructionText}>
                • Tap portal to enter{'\n'}
                • Move phone to look around 360°{'\n'}
                • Full immersive 3D Bega world!
              </Text>
            </View>
          </>
        )}

        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => {
            if (in3DWorld) {
              exitWorld();
            } else {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              navigation.goBack();
            }
          }}
        >
          <Text style={styles.closeButtonText}>
            {in3DWorld ? '🚪 Exit 3D World' : '✕ Back'}
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
  portalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  portalButton: {
    alignItems: 'center',
  },
  portalLabel: {
    marginTop: 20,
    alignItems: 'center',
  },
  portalText: {
    color: '#00e5ff',
    fontSize: 20,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  portalSubtext: {
    color: '#00b8d4',
    fontSize: 14,
    marginTop: 5,
  },
  worldContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  worldSvg: {
    flex: 1,
  },
  hud: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  hudTop: {
    alignItems: 'center',
    marginTop: 60,
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
  hudInfo: {
    color: '#fff',
    fontSize: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 10,
  },
  compass: {
    position: 'absolute',
    top: 120,
    right: 20,
    backgroundColor: 'rgba(0, 119, 190, 0.9)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
  },
  compassText: {
    color: '#fff',
    fontSize: 16,
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
  arBadge: {
    backgroundColor: 'rgba(0, 229, 255, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    marginBottom: 10,
  },
  arBadgeText: {
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
  instructions: {
    position: 'absolute',
    bottom: 120,
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