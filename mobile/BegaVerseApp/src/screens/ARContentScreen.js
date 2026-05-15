import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Image, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions
} from 'react-native';

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
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Get content based on QR code data
  const content = MOCK_AR_CONTENT[qrData] || MOCK_AR_CONTENT['default'];

  return (
    <View style={styles.container}>
      {/* Background Image */}
      <Image
        source={{ uri: content.image }}
        style={styles.backgroundImage}
        onLoad={() => setImageLoaded(true)}
      />
      
      {/* Overlay Gradient */}
      <View style={styles.overlay} />

      {/* Content */}
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.arBadge}>🔍 AR VIEW</Text>
            <Text style={styles.title}>{content.title}</Text>
            <Text style={styles.year}>Est. {content.year}</Text>
          </View>
        </View>

        {/* Story Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📜 Historical Story</Text>
          <Text style={styles.storyText}>{content.story}</Text>
        </View>

        {/* Fun Facts */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>💡 Fun Facts</Text>
          {content.facts.map((fact, index) => (
            <View key={index} style={styles.factItem}>
              <Text style={styles.factBullet}>•</Text>
              <Text style={styles.factText}>{fact}</Text>
            </View>
          ))}
        </View>

        {/* Interactive Actions */}
        <View style={styles.actionsCard}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>📸</Text>
            <Text style={styles.actionText}>Take AR Photo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>🔊</Text>
            <Text style={styles.actionText}>Audio Guide</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>🗺️</Text>
            <Text style={styles.actionText}>View on Map</Text>
          </TouchableOpacity>
        </View>

        {/* Quest Complete */}
        <View style={styles.questComplete}>
          <Text style={styles.questIcon}>🎉</Text>
          <Text style={styles.questTitle}>Location Discovered!</Text>
          <Text style={styles.questReward}>+50 XP Earned</Text>
        </View>

        {/* Spacer for bottom button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Close Button */}
      <TouchableOpacity 
        style={styles.closeButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.closeButtonText}>✕ Close AR View</Text>
      </TouchableOpacity>

      {/* Loading Indicator */}
      {!imageLoaded && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading AR Content...</Text>
        </View>
      )}
    </View>
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
  closeButton: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
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
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 
