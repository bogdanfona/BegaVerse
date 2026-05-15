import React, { useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';

const AnimatedCard = ({ icon, title, description, onPress, delay }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        delay: delay,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        delay: delay,
        duration: 400,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        useNativeDriver: true,
      })
    ]).start();
    
    setTimeout(onPress, 100);
  };

  return (
    <Animated.View style={{
      transform: [{ scale: scaleAnim }],
      opacity: fadeAnim,
    }}>
      <TouchableOpacity 
        style={styles.card}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        <Text style={styles.cardIcon}>{icon}</Text>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDescription}>{description}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function HomeScreen({ navigation }) {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🌊 BegaVerse</Text>
        <Text style={styles.subtitle}>Digital Twin of Bega River</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Explore Bega</Text>
        
        <AnimatedCard
          icon="📸"
          title="Scan QR Code"
          description="Unlock AR content at Bega locations"
          onPress={() => navigation.navigate('ARCamera')}
          delay={0}
        />

        <AnimatedCard
          icon="🎯"
          title="Active Quests"
          description="Complete challenges and earn rewards"
          onPress={() => navigation.navigate('Quests')}
          delay={100}
        />

        <AnimatedCard
          icon="👤"
          title="Your Profile"
          description="View your level, badges, and achievements"
          onPress={() => navigation.navigate('Profile')}
          delay={200}
        />
        <AnimatedCard
  icon="🌊"
  title="AR Dimension"
  description="See Bega River in augmented reality"
  onPress={() => navigation.navigate('ARDimension')}
  delay={300}
/>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>850</Text>
          <Text style={styles.statLabel}>XP</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>Level 5</Text>
          <Text style={styles.statLabel}>Explorer</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>3/10</Text>
          <Text style={styles.statLabel}>Quests</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#0077BE',
    padding: 30,
    paddingTop: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#FFB74D',
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0077BE',
    marginBottom: 5,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 10,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0077BE',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
});