import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions,
  Animated,
  Alert,
  Platform
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { captureRef } from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Linking from 'expo-linking';
import * as Speech from 'expo-speech';

const { width, height } = Dimensions.get('window');

// Mock AR content data (in real app, this comes from backend based on QR code)
const MOCK_AR_CONTENT = {
  'Podul Michelangelo': {
    title: 'Michelangelo Bridge',
    year: '1901',
    image: 'https://picsum.photos/400/600?random=1',
    facts: [
      'Built in 1901 during Habsburg Empire',
      'Named after Italian Renaissance artist',
      'Connects Fabric district to city center',
      'Renovated in 2010 for modern traffic'
    ],
    story: 'This historic bridge was constructed at the dawn of the 20th century, serving as a vital connection between the industrial Fabric district and the city center. The bridge witnessed the transformation of Timișoara from an industrial powerhouse to a modern European city.'
  },
  'Bega River Center': {
    title: 'Bega River Historic Center',
    year: '1760',
    image: 'https://picsum.photos/400/600?random=2',
    facts: [
      'Canal built in 1760 to prevent flooding',
      'Used for trade transport until 1950s',
      'Home to diverse aquatic ecosystem',
      'UNESCO heritage site candidate'
    ],
    story: 'The Bega Canal was engineered in the 18th century to tame the wild Bega River. It became a crucial trade route, bringing prosperity to Timișoara. Today, it serves as a green corridor through the city.'
  },
  'default': {
    title: 'Bega River Discovery',
    year: '2024',
    image: 'https://picsum.photos/400/600?random=3',
    facts: [
      'Bega River spans 254 km through Romania',
      'Flows through Timișoara for 13 km',
      'Home to 15+ fish species',
      'Part of Danube river basin'
    ],
    story: 'The Bega River has been the lifeline of Timișoara for centuries. From a wild river to a regulated canal, it has shaped the city\'s history, economy, and culture.'
  }
};

export default function ARContentScreen({ route, navigation }) {
  const { qrData } = route.params || {};
  const [imageLoaded, setImageLoaded] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const viewRef = useRef(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Get content based on QR code data
  const content = MOCK_AR_CONTENT[qrData] || MOCK_AR_CONTENT['default'];

  useEffect(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      if (isSpeaking) {
        Speech.stop();
      }
    };
  }, [isSpeaking]);

  const handleActionPress = async (action) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    switch(action) {
      case 'photo':
        await takeARPhoto();
        break;
      case 'audio':
        await playAudioGuide();
        break;
      case 'map':
        await openInMap();
        break;
    }
  };

  // 📸 Take AR Photo (Proper Implementation - Actually Saves)
  const takeARPhoto = async () => {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Capture the screen
    const uri = await captureRef(viewRef, {
      format: 'png',
      quality: 1,
    });

    // Create filename with timestamp
    const filename = `BegaVerse_${Date.now()}.png`;
    const newUri = `${FileSystem.documentDirectory}${filename}`;

    // Move to permanent location
    await FileSystem.copyAsync({
      from: uri,
      to: newUri
    });

    // Success feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Ask user what to do with photo
    Alert.alert(
      '✅ Photo Captured!',
      'Your AR photo is ready! What would you like to do?',
      [
        {
          text: 'Share',
          onPress: async () => {
            try {
              const canShare = await Sharing.isAvailableAsync();
              if (canShare) {
                await Sharing.shareAsync(newUri, {
                  mimeType: 'image/png',
                  dialogTitle: 'Share BegaVerse AR Photo',
                  UTI: 'public.png'
                });
              } else {
                Alert.alert('Sharing not available', 'Photo saved locally!');
              }
            } catch (shareError) {
              console.error('Share error:', shareError);
            }
          }
        },
        {
          text: 'OK',
          style: 'default'
        }
      ]
    );

  } catch (error) {
    console.error('Photo capture error:', error);
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    
    Alert.alert(
      '❌ Capture Failed',
      `Could not capture photo: ${error.message}`,
      [{ text: 'OK' }]
    );
  }
};

  // 🔊 Play Audio Guide (Text-to-Speech)
  const playAudioGuide = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // If already speaking, stop it
      if (isSpeaking) {
        Speech.stop();
        setIsSpeaking(false);
        Alert.alert('🔇 Audio Stopped', 'Audio guide paused.');
        return;
      }

      // Start speaking
      setIsSpeaking(true);
      
      Alert.alert(
        '🔊 Audio Guide Playing',
        `Narration for ${content.title} is now playing...\n\nTap the Audio button again to stop.`,
        [{ text: 'Got it!', style: 'default' }]
      );

      const narration = `${content.title}. Established in ${content.year}. ${content.story}`;

      Speech.speak(narration, {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.9,
        onDone: () => {
          setIsSpeaking(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert(
            '✅ Audio Complete',
            'Narration finished!',
            [{ text: 'OK' }]
          );
        },
        onStopped: () => {
          setIsSpeaking(false);
        },
        onError: (error) => {
          console.error('Speech error:', error);
          setIsSpeaking(false);
          Alert.alert('Error', 'Failed to play audio. Please try again.');
        }
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    } catch (error) {
      console.error('Audio playback error:', error);
      setIsSpeaking(false);
      Alert.alert(
        'Error',
        'Failed to play audio guide. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  // 🗺️ Open in Map
  const openInMap = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Bega River coordinates (center of Timișoara)
      const latitude = 45.7489;
      const longitude = 21.2087;
      
      const label = encodeURIComponent(content.title);
      
      // Different URL schemes for iOS and Android
      const scheme = Platform.select({
        ios: `maps:0,0?q=${label}@${latitude},${longitude}`,
        android: `geo:0,0?q=${latitude},${longitude}(${label})`
      });

      const url = Platform.select({
        ios: scheme,
        android: scheme,
        default: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
      });

      const supported = await Linking.canOpenURL(url);

      if (supported) {
        Alert.alert(
          '🗺️ Open in Maps?',
          `This will open ${content.title} location in your maps app.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Open Maps', 
              onPress: async () => {
                await Linking.openURL(url);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
            }
          ]
        );
      } else {
        await Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`);
      }
    } catch (error) {
      console.error('Map opening error:', error);
      Alert.alert('Error', 'Failed to open maps. Please try again.');
    }
  };

  return (
    <Animated.View 
      ref={viewRef}
      style={[styles.container, { opacity: fadeAnim }]}
      collapsable={false}
    >
      {/* Background Image */}
      <Image
        source={{ uri: content.image }}
        style={styles.backgroundImage}
        onLoad={() => setImageLoaded(true)}
        onError={(error) => {
          console.log('Image failed to load:', error);
          setImageLoaded(true);
        }}
      />
      
      {/* Overlay Gradient */}
      <View style={styles.overlay} />

      {/* Content */}
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <Animated.View 
          style={[
            styles.header,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          <View style={styles.titleContainer}>
            <Text style={styles.arBadge}>🔍 AR VIEW</Text>
            <Text style={styles.title}>{content.title}</Text>
            <Text style={styles.year}>Est. {content.year}</Text>
          </View>
        </Animated.View>

        {/* Story Card */}
        <Animated.View 
          style={[
            styles.card,
            { 
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }] 
            }
          ]}
        >
          <Text style={styles.cardTitle}>📜 Historical Story</Text>
          <Text style={styles.storyText}>{content.story}</Text>
        </Animated.View>

        {/* Fun Facts */}
        <Animated.View 
          style={[
            styles.card,
            { 
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }] 
            }
          ]}
        >
          <Text style={styles.cardTitle}>💡 Fun Facts</Text>
          {content.facts.map((fact, index) => (
            <View key={index} style={styles.factItem}>
              <Text style={styles.factBullet}>•</Text>
              <Text style={styles.factText}>{fact}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Interactive Actions */}
        <Animated.View 
          style={[
            styles.actionsCard,
            { 
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }] 
            }
          ]}
        >
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleActionPress('photo')}
            activeOpacity={0.7}
          >
            <Text style={styles.actionIcon}>📸</Text>
            <Text style={styles.actionText}>Take AR Photo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.actionButton,
              isSpeaking && styles.actionButtonActive
            ]}
            onPress={() => handleActionPress('audio')}
            activeOpacity={0.7}
          >
            <Text style={styles.actionIcon}>{isSpeaking ? '🔇' : '🔊'}</Text>
            <Text style={styles.actionText}>
              {isSpeaking ? 'Stop Audio' : 'Audio Guide'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleActionPress('map')}
            activeOpacity={0.7}
          >
            <Text style={styles.actionIcon}>🗺️</Text>
            <Text style={styles.actionText}>View on Map</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Quest Complete */}
        <Animated.View 
          style={[
            styles.questComplete,
            { 
              opacity: fadeAnim,
              transform: [{ scale: fadeAnim }] 
            }
          ]}
        >
          <Text style={styles.questIcon}>🎉</Text>
          <Text style={styles.questTitle}>Location Discovered!</Text>
          <Text style={styles.questReward}>+50 XP Earned</Text>
        </Animated.View>

        {/* Spacer for bottom button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Close Button */}
      <Animated.View
        style={[
          styles.closeButtonContainer,
          { 
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }] 
          }
        ]}
      >
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            navigation.goBack();
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.closeButtonText}>✕ Close AR View</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundImage: {
    position: 'absolute',
    width: width,
    height: height,
    opacity: 0.4,
  },
  overlay: {
    position: 'absolute',
    width: width,
    height: height,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    marginBottom: 20,
  },
  titleContainer: {
    alignItems: 'center',
  },
  arBadge: {
    backgroundColor: '#0077BE',
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 15,
    overflow: 'hidden',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  year: {
    fontSize: 16,
    color: '#FFB74D',
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0077BE',
    marginBottom: 12,
  },
  storyText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 24,
  },
  factItem: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  factBullet: {
    fontSize: 18,
    color: '#0077BE',
    marginRight: 10,
    fontWeight: 'bold',
  },
  factText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  actionsCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  actionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 15,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonActive: {
    backgroundColor: 'rgba(0, 119, 190, 0.2)',
    borderWidth: 2,
    borderColor: '#0077BE',
  },
  actionIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 11,
    color: '#0077BE',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  questComplete: {
    backgroundColor: 'rgba(76, 175, 80, 0.95)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 15,
  },
  questIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  questTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  questReward: {
    fontSize: 16,
    color: '#FFB74D',
    fontWeight: 'bold',
  },
  closeButtonContainer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
  },
  closeButton: {
    backgroundColor: '#0077BE',
    padding: 18,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});