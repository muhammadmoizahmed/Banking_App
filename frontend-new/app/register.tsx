import React, { useState } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { TextInput, Button, Text, Card } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay } from 'react-native-reanimated';
import api from '../lib/axios';

const AnimatedCard = Animated.createAnimatedComponent(Card);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface RegisterFormData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

export default function RegisterScreen() {
  const router = useRouter();
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

  const { control, handleSubmit, setError, formState: { errors } } = useForm<RegisterFormData>({
    defaultValues: {
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      phone: '',
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      const payload = {
        ...data,
        email: data.email.trim().toLowerCase(),
        first_name: data.first_name.trim(),
        last_name: data.last_name.trim(),
        phone: data.phone?.trim() || undefined,
        password: data.password.trim(),
      };
      const response = await api.post('/api/auth/register', payload);
      return response.data;
    },
    onSuccess: () => {
      Alert.alert('Success', 'User created successfully', [
        { text: 'OK', onPress: () => router.replace('/login') }
      ]);
    },
    onError: (error: any) => {
      const detail = error.response?.data?.detail;
      const message = Array.isArray(detail)
        ? detail.map((item: any) => item.msg).join('\n')
        : detail || 'Something went wrong';

      if (error.response?.status === 409) {
        setError('email', {
          type: 'server',
          message: 'Email already registered',
        });
        Alert.alert('Registration Failed', 'Email already registered');
        return;
      }

      Alert.alert('Registration Failed', message);
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    registerMutation.mutate(data);
  };

  return (
    <ScrollView style={styles.container}>
      <Animated.View style={[styles.header, headerStyle]}>
        <Text variant="displaySmall" style={styles.title}>Create Account</Text>
        <Text variant="bodyLarge" style={styles.subtitle}>Sign up to get started</Text>
      </Animated.View>

      <AnimatedCard style={[styles.card, cardStyle]}>
        <Card.Content style={styles.cardContent}>
          <Controller
            control={control}
            name="first_name"
            rules={{
              validate: (value) => value.trim().length > 0 || 'First name is required',
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="First Name"
                mode="outlined"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                style={styles.input}
                error={!!errors.first_name}
                left={<TextInput.Icon icon="account" />}
                textColor="#000000"
                activeOutlineColor="#2563eb"
                outlineColor="#94a3b8"
                theme={{ colors: { text: "#000000", placeholder: "#64748b" } }}
              />
            )}
          />
          {errors.first_name && (
            <Text style={styles.error}>{errors.first_name.message}</Text>
          )}

          <Controller
            control={control}
            name="last_name"
            rules={{
              validate: (value) => value.trim().length > 0 || 'Last name is required',
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Last Name"
                mode="outlined"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                style={styles.input}
                error={!!errors.last_name}
                left={<TextInput.Icon icon="account" />}
                textColor="#000000"
                activeOutlineColor="#2563eb"
                outlineColor="#94a3b8"
                theme={{ colors: { text: "#000000", placeholder: "#64748b" } }}
              />
            )}
          />
          {errors.last_name && (
            <Text style={styles.error}>{errors.last_name.message}</Text>
          )}

          <Controller
            control={control}
            name="email"
            rules={{
              validate: (value) => {
                const email = value.trim();
                if (!email) {
                  return 'Email is required';
                }
                return emailPattern.test(email) || 'Enter a valid email address';
              },
            }}
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
                theme={{ colors: { text: "#000000", placeholder: "#64748b" } }}
              />
            )}
          />
          {errors.email && (
            <Text style={styles.error}>{errors.email.message}</Text>
          )}

          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Phone Number (Optional)"
                mode="outlined"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                style={styles.input}
                keyboardType="phone-pad"
                left={<TextInput.Icon icon="phone" />}
                textColor="#000000"
                activeOutlineColor="#2563eb"
                outlineColor="#94a3b8"
                theme={{ colors: { text: "#000000", placeholder: "#64748b" } }}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            rules={{ 
              validate: (value) => {
                const password = value.trim();
                if (!password) {
                  return 'Password is required';
                }
                return password.length >= 6 || 'Password must be at least 6 characters';
              },
            }}
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
            loading={registerMutation.isPending}
            disabled={registerMutation.isPending}
            style={styles.button}
            contentStyle={styles.buttonContent}
            buttonColor="#2563eb"
            icon="account-plus"
          >
            Create Account
          </Button>
        </Card.Content>
      </AnimatedCard>

      <Animated.View style={linkStyle}>
        <Button
          mode="text"
          onPress={() => router.push('/login')}
          style={styles.linkButton}
          textColor="#2563eb"
        >
          <Text variant="bodyMedium" style={{ color: "#000000" }}>Already have an account? </Text>
          <Text variant="bodyMedium" style={{ fontWeight: '700', color: "#2563eb" }}>Sign in</Text>
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
    marginTop: 40,
    marginBottom: 32,
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
