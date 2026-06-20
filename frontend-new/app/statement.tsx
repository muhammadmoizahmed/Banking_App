
import React from 'react';
import { View, StyleSheet, Alert, Linking, ScrollView } from 'react-native';
import { Text, Card, Button, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay } from 'react-native-reanimated';
import { useAuthStore } from '../store/auth-store';
import { baseURL } from '../lib/axios';

const AnimatedCard = Animated.createAnimatedComponent(Card);

export default function StatementScreen() {
  const router = useRouter();

  // Animation values
  const fadeIn = useSharedValue(0);
  const slideUp = useSharedValue(50);

  React.useEffect(() => {
    fadeIn.value = withDelay(100, withSpring(1, { damping: 15 }));
    slideUp.value = withDelay(100, withSpring(0, { damping: 15 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.value,
    transform: [{ translateY: slideUp.value }],
  }));

  const durations = [
    { id: '1week', label: '1 Week' },
    { id: '1month', label: '1 Month' },
    { id: '6months', label: '6 Months' },
    { id: '12months', label: '12 Months' },
    { id: '6years', label: '6 Years' },
  ];

  const downloadStatement = async (duration: string) => {
    try {
      const authStore = useAuthStore.getState();
      const token = authStore.accessToken;
      const url = `${baseURL}/api/transactions/statement?duration=${duration}&access_token=${token}`;
      Linking.openURL(url);
    } catch (error) {
      Alert.alert('Error', 'Failed to download statement');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <AnimatedCard style={[styles.card, animatedStyle]}>
        <Card.Content style={styles.cardContent}>
          <View style={styles.headerRow}>
            <IconButton icon="arrow-left" size={28} onPress={() => router.replace('/(tabs)')} />
            <Text variant="headlineSmall" style={styles.title}>Account Statement</Text>
            <View style={{ width: 40 }} />
          </View>

          <Text variant="titleMedium" style={styles.label}>Select Duration</Text>
          <View style={styles.durationsContainer}>
            {durations.map((duration) => (
              <Button
                key={duration.id}
                mode="contained"
                onPress={() => downloadStatement(duration.id)}
                style={styles.durationButton}
                contentStyle={styles.durationButtonContent}
                buttonColor="#2563eb"
              >
                {duration.label}
              </Button>
            ))}
          </View>

          <Card style={styles.contactCard}>
            <Card.Content style={styles.contactContent}>
              <Text variant="titleMedium" style={styles.contactTitle}>Need more than 6 years?</Text>
              <Text variant="bodyMedium" style={styles.contactText}>
                For statements older than 6 years, please contact our bank support team.
              </Text>
            </Card.Content>
          </Card>
        </Card.Content>
      </AnimatedCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f3f4f6',
    paddingTop: 40,
  },
  card: {
    borderRadius: 24,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  cardContent: {
    paddingVertical: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    color: '#0f172a',
    fontWeight: '700',
  },
  label: {
    color: '#64748b',
    marginBottom: 16,
    fontSize: 16,
    fontWeight: '600',
  },
  durationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  durationButton: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 12,
  },
  durationButtonContent: {
    paddingVertical: 12,
  },
  contactCard: {
    marginTop: 16,
    borderRadius: 16,
    backgroundColor: '#fff3cd',
  },
  contactContent: {
    paddingVertical: 16,
  },
  contactTitle: {
    color: '#856404',
    fontWeight: '700',
    marginBottom: 8,
  },
  contactText: {
    color: '#856404',
  },
});
