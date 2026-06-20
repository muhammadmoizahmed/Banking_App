import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, useWindowDimensions } from 'react-native';
import { Text, Card, Button, TextInput, IconButton, Dialog, Portal, Avatar } from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay } from 'react-native-reanimated';
import api from '../../lib/axios';

const AnimatedCard = Animated.createAnimatedComponent(Card);

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

interface Beneficiary {
  id: number;
  user_id: number;
  beneficiary_user_id: number;
  nickname?: string;
  created_at: string;
  beneficiary_user: User;
  beneficiary_account_number?: string | null;
}

export default function BeneficiariesScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { width } = useWindowDimensions();
  const isNarrow = width < 420;
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [foundAccountNumber, setFoundAccountNumber] = useState<string | null>(null);
  const [lookingUpEmail, setLookingUpEmail] = useState(false);
  const [emailLookupError, setEmailLookupError] = useState<string | null>(null);

  // Animation values
  const headerOpacity = useSharedValue(0);
  const listOpacity = useSharedValue(0);

  React.useEffect(() => {
    headerOpacity.value = withDelay(100, withSpring(1, { damping: 15 }));
    listOpacity.value = withDelay(300, withSpring(1, { damping: 15 }));
  }, []);

  const headerStyle = useAnimatedStyle(() => ({ opacity: headerOpacity.value }));
  const listStyle = useAnimatedStyle(() => ({ opacity: listOpacity.value }));

  const { data: beneficiaries } = useQuery({
    queryKey: ['beneficiaries'],
    queryFn: async () => {
      const response = await api.get<Beneficiary[]>('/api/beneficiaries');
      return response.data;
    },
  });

  const addBeneficiaryMutation = useMutation({
    mutationFn: async () => {
      const userResponse = await api.get(`/api/users/search-by-email?email=${encodeURIComponent(email)}`);
      const beneficiaryUserId = userResponse.data?.id;

      if (!beneficiaryUserId) {
        throw new Error('User not found');
      }
      
      await api.post('/api/beneficiaries', {
        beneficiary_user_id: beneficiaryUserId,
        nickname: nickname || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficiaries'] });
      setVisible(false);
      setEmail('');
      setNickname('');
      Alert.alert('Success', 'Beneficiary added!');
    },
    onError: (error: any) => {
      Alert.alert(
        'Error',
        error.message === 'User not found'
          ? 'No user found for that email address'
          : error.response?.data?.detail || 'Failed to add beneficiary'
      );
    },
  });

  const lookupEmail = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setFoundAccountNumber(null);
      setEmailLookupError(null);
      return;
    }

    setLookingUpEmail(true);
    setEmailLookupError(null);

    try {
      const userResponse = await api.get(`/api/users/search-by-email?email=${encodeURIComponent(trimmedEmail)}`);
      setFoundAccountNumber(userResponse.data?.account_number || null);
      if (!userResponse.data) {
        setEmailLookupError('No user found for that email address');
      }
    } catch (error: any) {
      setFoundAccountNumber(null);
      setEmailLookupError(error.response?.data?.detail || 'No user found for that email address');
    } finally {
      setLookingUpEmail(false);
    }
  };

  const deleteBeneficiaryMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/beneficiaries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficiaries'] });
      Alert.alert('Success', 'Beneficiary deleted!');
    },
  });

  const handleSendMoney = (beneficiary: Beneficiary) => {
    router.push({
      pathname: '/transfer',
      params: { recipient_email: beneficiary.beneficiary_user.email },
    });
  };

  return (
    <ScrollView style={styles.container}>
      <Animated.View style={[styles.header, headerStyle]}>
        <Text variant="headlineSmall" style={styles.title}>Beneficiaries</Text>
        <IconButton
          icon="plus"
          mode="contained"
          containerColor="#2563eb"
          iconColor="white"
          onPress={() => setVisible(true)}
        />
      </Animated.View>

      <Animated.View style={listStyle}>
        {beneficiaries?.map((beneficiary) => (
          <Card key={beneficiary.id} style={styles.beneficiaryCard}>
            <Card.Content style={styles.cardContent}>
              <View style={[styles.beneficiaryRow, isNarrow && styles.beneficiaryRowNarrow]}>
                <View style={styles.userRow}>
                  <Avatar.Text
                    size={50}
                    label={`${beneficiary.beneficiary_user.first_name.charAt(0)}${beneficiary.beneficiary_user.last_name.charAt(0)}`}
                    style={styles.avatar}
                    color="white"
                  />
                  <View>
                    <Text variant="titleMedium" style={styles.name}>
                      {beneficiary.nickname || `${beneficiary.beneficiary_user.first_name} ${beneficiary.beneficiary_user.last_name}`}
                    </Text>
                    <Text variant="bodySmall" style={styles.emailText}>
                      {beneficiary.beneficiary_user.email}
                    </Text>
                    <Text variant="bodySmall" style={styles.accountText}>
                      Account: {beneficiary.beneficiary_account_number || 'Not available'}
                    </Text>
                  </View>
                </View>
                <View style={[styles.actionsRow, isNarrow && styles.actionsRowNarrow]}>
                  <IconButton
                    icon="send"
                    mode="contained"
                    containerColor="rgba(99, 102, 241, 0.1)"
                    iconColor="#2563eb"
                    onPress={() => handleSendMoney(beneficiary)}
                  />
                  <IconButton
                    icon="delete"
                    iconColor="#ef4444"
                    containerColor="rgba(239, 68, 68, 0.1)"
                    onPress={() => deleteBeneficiaryMutation.mutate(beneficiary.id)}
                    loading={deleteBeneficiaryMutation.isPending}
                  />
                </View>
              </View>
              <Button
                mode="contained"
                icon="send"
                onPress={() => handleSendMoney(beneficiary)}
                style={styles.transferButton}
                buttonColor="#2563eb"
              >
                Transfer
              </Button>
            </Card.Content>
          </Card>
        ))}
      </Animated.View>

      {(!beneficiaries || beneficiaries.length === 0) && (
        <Card style={styles.emptyCard}>
          <Card.Content style={styles.emptyContent}>
            <Text variant="bodyLarge" style={{ textAlign: 'center', color: '#64748b' }}>
              No beneficiaries yet
            </Text>
            <Button
              mode="contained"
              onPress={() => setVisible(true)}
              style={styles.addButton}
              buttonColor="#2563eb"
            >
              Add Beneficiary
            </Button>
          </Card.Content>
        </Card>
      )}

      <Portal>
        <Dialog visible={visible} onDismiss={() => setVisible(false)} style={styles.dialog}>
          <Dialog.Title style={styles.dialogTitle}>Add Beneficiary</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Email"
              mode="outlined"
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                setFoundAccountNumber(null);
                setEmailLookupError(null);
              }}
              onBlur={lookupEmail}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Button
              mode="text"
              onPress={lookupEmail}
              loading={lookingUpEmail}
              disabled={lookingUpEmail || !email.trim()}
              style={styles.lookupButton}
              textColor="#2563eb"
            >
              Find Account
            </Button>
            {foundAccountNumber && (
              <Text style={styles.accountPreview}>
                Account Number: {foundAccountNumber}
              </Text>
            )}
            {emailLookupError && (
              <Text style={styles.lookupError}>{emailLookupError}</Text>
            )}
            <TextInput
              label="Nickname (Optional)"
              mode="outlined"
              value={nickname}
              onChangeText={setNickname}
              style={styles.input}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setVisible(false)} textColor="#64748b">
              Cancel
            </Button>
            <Button
              onPress={() => addBeneficiaryMutation.mutate()}
              loading={addBeneficiaryMutation.isPending}
              buttonColor="#2563eb"
              textColor="white"
            >
              Add
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    color: '#0f172a',
    fontWeight: '700',
  },
  beneficiaryCard: {
    marginBottom: 12,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  cardContent: {
    paddingVertical: 12,
  },
  beneficiaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  beneficiaryRowNarrow: {
    alignItems: 'flex-start',
    gap: 12,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: 16,
    backgroundColor: '#2563eb',
  },
  name: {
    color: '#0f172a',
    fontWeight: '600',
  },
  emailText: {
    color: '#64748b',
  },
  accountText: {
    color: '#94a3b8',
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
  },
  actionsRowNarrow: {
    alignSelf: 'flex-end',
  },
  transferButton: {
    marginTop: 12,
    borderRadius: 14,
  },
  emptyCard: {
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
    paddingVertical: 40,
  },
  addButton: {
    marginTop: 16,
    borderRadius: 16,
  },
  dialog: {
    borderRadius: 20,
    backgroundColor: '#ffffff',
  },
  dialogTitle: {
    color: '#0f172a',
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#ffffff',
  },
  lookupButton: {
    alignSelf: 'flex-start',
    marginTop: -8,
    marginBottom: 8,
    paddingLeft: 0,
  },
  accountPreview: {
    color: '#0f172a',
    marginBottom: 12,
    fontWeight: '600',
  },
  lookupError: {
    color: '#ef4444',
    marginBottom: 12,
  },
});
