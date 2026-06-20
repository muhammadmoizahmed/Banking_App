import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, IconButton } from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay } from 'react-native-reanimated';
import api from '../lib/axios';

const AnimatedCard = Animated.createAnimatedComponent(Card);

interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Animation values
  const headerOpacity = useSharedValue(0);
  const listOpacity = useSharedValue(0);

  React.useEffect(() => {
    headerOpacity.value = withDelay(100, withSpring(1, { damping: 15 }));
    listOpacity.value = withDelay(300, withSpring(1, { damping: 15 }));
  }, []);

  const headerStyle = useAnimatedStyle(() => ({ opacity: headerOpacity.value }));
  const listStyle = useAnimatedStyle(() => ({ opacity: listOpacity.value }));

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await api.get<Notification[]>('/api/notifications');
      return response.data;
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.put(`/api/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  return (
    <ScrollView style={styles.container}>
      <Animated.View style={[styles.header, headerStyle]}>
        <IconButton
          icon="arrow-left"
          size={28}
          onPress={() => router.replace('/(tabs)')}
        />
        <Text variant="headlineSmall" style={styles.title}>Notifications</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      <Animated.View style={listStyle}>
        {notifications?.map((notification, index) => (
          <AnimatedCard
            key={notification.id}
            style={[
              styles.notificationCard,
              !notification.is_read && styles.unreadCard
            ]}
            onPress={() => !notification.is_read && markAsReadMutation.mutate(notification.id)}
          >
            <Card.Content style={styles.cardContent}>
              <View style={styles.notificationRow}>
                <View style={[
                  styles.iconContainer,
                  {
                    backgroundColor: notification.title.includes('Received')
                      ? 'rgba(34, 197, 94, 0.1)'
                      : 'rgba(99, 102, 241, 0.1)'
                  }
                ]}>
                  <IconButton
                    icon={notification.title.includes('Received') ? 'arrow-down-bold' : 'arrow-up-bold'}
                    size={24}
                    iconColor={notification.title.includes('Received') ? '#22c55e' : '#2563eb'}
                  />
                </View>
                <View style={styles.textContainer}>
                  <Text variant="titleMedium" style={styles.notificationTitle}>
                    {notification.title}
                  </Text>
                  <Text variant="bodyMedium" style={styles.notificationMessage}>
                    {notification.message}
                  </Text>
                  <Text variant="bodySmall" style={styles.notificationTime}>
                    {new Date(notification.created_at).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
                {!notification.is_read && (
                  <View style={styles.unreadDot} />
                )}
              </View>
            </Card.Content>
          </AnimatedCard>
        ))}
      </Animated.View>

      {!isLoading && (!notifications || notifications.length === 0) && (
        <Card style={styles.emptyCard}>
          <Card.Content style={styles.emptyContent}>
            <IconButton icon="bell-off" size={64} iconColor="#cbd5e1" />
            <Text variant="bodyLarge" style={{ textAlign: 'center', color: '#94a3b8', marginTop: 16 }}>
              No notifications yet
            </Text>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    color: '#0f172a',
    fontWeight: '700',
  },
  notificationCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  unreadCard: {
    backgroundColor: '#eff6ff',
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
  },
  cardContent: {
    padding: 4,
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    borderRadius: 16,
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  notificationTitle: {
    color: '#0f172a',
    fontWeight: '600',
  },
  notificationMessage: {
    color: '#475569',
    marginTop: 4,
  },
  notificationTime: {
    color: '#94a3b8',
    marginTop: 6,
  },
  unreadDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2563eb',
    marginLeft: 16,
  },
  emptyCard: {
    margin: 20,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 48,
  },
});
