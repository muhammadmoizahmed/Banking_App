import React from 'react';
import { View, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { Text, Card, Button, Avatar, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/auth-store';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay } from 'react-native-reanimated';

const AnimatedCard = Animated.createAnimatedComponent(Card);

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { width } = useWindowDimensions();
  const isNarrow = width < 420;

  const headerOpacity = useSharedValue(0);
  const cardOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);

  React.useEffect(() => {
    headerOpacity.value = withDelay(100, withSpring(1, { damping: 15 }));
    cardOpacity.value = withDelay(300, withSpring(1, { damping: 15 }));
    buttonOpacity.value = withDelay(500, withSpring(1, { damping: 15 }));
  }, []);

  const headerStyle = useAnimatedStyle(() => ({ opacity: headerOpacity.value }));
  const cardStyle = useAnimatedStyle(() => ({ opacity: cardOpacity.value }));
  const buttonStyle = useAnimatedStyle(() => ({ opacity: buttonOpacity.value }));

  const handleLogout = async () => {
    const confirmLogout = window.confirm('Are you sure you want to logout?');
    if (confirmLogout) {
      try {
        await logout();
        router.replace('/login');
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Animated.View style={[styles.header, headerStyle]}>
        <Avatar.Text
          size={120}
          label={`${user?.first_name.charAt(0)}${user?.last_name.charAt(0)}`}
          style={styles.avatar}
          color="white"
        />
        <Text variant="headlineSmall" style={styles.name}>
          {user?.first_name} {user?.last_name}
        </Text>
        <Text variant="bodyLarge" style={styles.email}>
          {user?.email}
        </Text>
      </Animated.View>

      <AnimatedCard style={[styles.infoCard, cardStyle]}>
        <Card.Content style={styles.infoCardContent}>
          <View style={[styles.infoRow, isNarrow && styles.infoRowNarrow]}>
            <Text variant="titleMedium" style={styles.infoLabel}>First Name</Text>
            <Text variant="bodyLarge" style={styles.infoValue}>{user?.first_name}</Text>
          </View>
          <Divider style={styles.divider} />
          <View style={[styles.infoRow, isNarrow && styles.infoRowNarrow]}>
            <Text variant="titleMedium" style={styles.infoLabel}>Last Name</Text>
            <Text variant="bodyLarge" style={styles.infoValue}>{user?.last_name}</Text>
          </View>
          <Divider style={styles.divider} />
          <View style={[styles.infoRow, isNarrow && styles.infoRowNarrow]}>
            <Text variant="titleMedium" style={styles.infoLabel}>Email</Text>
            <Text variant="bodyLarge" style={styles.infoValue}>{user?.email}</Text>
          </View>
          {user?.phone && (
            <>
              <Divider style={styles.divider} />
              <View style={[styles.infoRow, isNarrow && styles.infoRowNarrow]}>
                <Text variant="titleMedium" style={styles.infoLabel}>Phone</Text>
                <Text variant="bodyLarge" style={styles.infoValue}>{user?.phone}</Text>
              </View>
            </>
          )}
        </Card.Content>
      </AnimatedCard>

      <View style={buttonStyle}>
        <Button
          mode="contained"
          icon="logout"
          buttonColor="#ef4444"
          onPress={handleLogout}
          style={styles.logoutButton}
          contentStyle={styles.logoutButtonContent}
        >
          Logout
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f3f4f6',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 16,
  },
  avatar: {
    marginBottom: 20,
    backgroundColor: '#2563eb',
  },
  name: {
    color: '#0f172a',
    marginBottom: 4,
    fontWeight: '800',
  },
  email: {
    color: '#64748b',
  },
  infoCard: {
    borderRadius: 20,
    marginBottom: 24,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  infoCardContent: {
    paddingVertical: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    gap: 12,
  },
  infoRowNarrow: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  infoLabel: {
    color: '#64748b',
  },
  infoValue: {
    color: '#0f172a',
    fontWeight: '600',
  },
  divider: {
    marginVertical: 4,
  },
  logoutButton: {
    borderRadius: 16,
  },
  logoutButtonContent: {
    paddingVertical: 12,
  },
});
