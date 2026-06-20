import React, { useState } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { TextInput, Button, Text, Card } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay } from 'react-native-reanimated';
import api from '../lib/axios';
import { useAuthStore } from '../store/auth-store';

const AnimatedCard = Animated.createAnimatedComponent(Card);

interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [secureTextEntry, setSecureTextEntry] = useState(true);

  // Animation values
  const headerOpacity = useSharedValue(0);
  const cardOpacity = useSharedValue(0);
  const linkOpacity = useSharedValue(0);

  React.useEffect(() => {
    headerOpacity.value = withDelay(100, withSpring(1, { damping: 15 }));
    cardOpacity.value = withDelay(300, withSpring(1, { damping: 15 }));
    linkOpacity.value = withDelay(500, withSpring(1, { damping: 15 }));
  }, []);

  const headerStyle = useAnimatedStyle(() => ({ opacity: headerOpacity.value }));
  const cardStyle = useAnimatedStyle(() => ({ opacity: cardOpacity.value }));
  const linkStyle = useAnimatedStyle(() => ({ opacity: linkOpacity.value }));

  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const response = await api.post('/api/auth/login', data);
      return response.data;
    },
    onSuccess: async (data) => {
      const userResponse = await api.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${data.access_token}` }
      });
      await login(data.access_token, data.refresh_token, userResponse.data);
      router.replace('/(tabs)');
    },
    onError: (error: any) => {
      Alert.alert('Login Failed', error.response?.data?.detail || 'Something went wrong');
    },
  });

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  return (
    <ScrollView style={styles.container}>
      <Animated.View style={[styles.header, headerStyle]}>
        <Text variant="displaySmall" style={styles.title}>IU-Pay</Text>
        <Text variant="bodyLarge" style={styles.subtitle}>Welcome back, Please sign in</Text>
      </Animated.View>

      <AnimatedCard style={[styles.card, cardStyle]}>
        <Card.Content style={styles.cardContent}>
          <Controller
            control={control}
            name="email"
            rules={{ required: 'Email is required' }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Email Address"
                mode="outlined"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                error={!!errors.email}
                left={<TextInput.Icon icon="email" />}
                textColor="#000000"
                activeOutlineColor="#2563eb"
                outlineColor="#94a3b8"
                theme={{ colors: { text: '#000000', placeholder: '#64748b' } }}
              />
            )}
          />

          {errors.email && (
            <Text style={styles.error}>{errors.email.message}</Text>
          )}
          
          <Controller
            control={control}
            name="password"
            rules={{ required: 'Password is required' }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Password"
                mode="outlined"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                secureTextEntry={secureTextEntry}
                right={<TextInput.Icon icon={secureTextEntry ? "eye" : "eye-off"} onPress={() => setSecureTextEntry(!secureTextEntry)} />}
                style={styles.input}
                error={!!errors.password}
                left={<TextInput.Icon icon="lock" />}
                textColor="#000000"
                activeOutlineColor="#2563eb"
                outlineColor="#94a3b8"
                theme={{ colors: { text: "#000000", placeholder: "#64748b" } }}
              />
            )}
          />

          {errors.password && (
            <Text style={styles.error}>{errors.password.message}</Text>
          )}
          
          <Button
            mode="contained"
            onPress={handleSubmit(onSubmit)}
            loading={loginMutation.isPending}
            disabled={loginMutation.isPending}
            style={styles.button}
            contentStyle={styles.buttonContent}
            buttonColor="#2563eb"
            icon="login"
          >
            Sign In
          </Button>
        </Card.Content>
      </AnimatedCard>

      <Animated.View style={linkStyle}>
        <Button
          mode="text"
          onPress={() => router.push('/register')}
          style={styles.linkButton}
          textColor="#2563eb"
        >
          <Text variant="bodyMedium" style={{ color: "#000000" }}>Don't have an account? </Text>
          <Text variant="bodyMedium" style={{ fontWeight: '700', color: "#2563eb" }}>Sign up</Text>
        </Button>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#f3f4f6',
  },
  header: {
    marginTop: 60,
    marginBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    color: '#64748b',
    marginTop: 8,
  },
  card: {
    borderRadius: 20,
    elevation: 4,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  cardContent: {
    paddingVertical: 8,
  },
  input: {
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  error: {
    color: '#ef4444',
    fontSize: 12,
    marginBottom: 12,
  },
  button: {
    marginTop: 24,
    borderRadius: 16,
  },
  buttonContent: {
    paddingVertical: 12,
  },
  linkButton: {
    marginTop: 16,
  },
});
