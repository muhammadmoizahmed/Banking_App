import React, { useEffect } from 'react';
import { View, StyleSheet, Alert, ScrollView, Linking } from 'react-native';
import { Text, Card, Button, TextInput, IconButton, Portal, Dialog } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay } from 'react-native-reanimated';
import api, { baseURL } from '../lib/axios';
import { useAuthStore } from '../store/auth-store';

const AnimatedCard = Animated.createAnimatedComponent(Card);

interface TransferFormData {
  recipient_account_number: string;
  amount: string;
  description?: string;
}

export default function TransferScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams();

  // Dialog state
  const [dialogVisible, setDialogVisible] = React.useState(false);
  const [dialogType, setDialogType] = React.useState<'success' | 'low_balance' | 'error' | null>(null);
  const [dialogMessage, setDialogMessage] = React.useState('');
  const [receiptUrl, setReceiptUrl] = React.useState<string | null>(null);

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

  const { control, handleSubmit, formState: { errors }, setValue } = useForm<TransferFormData>({
    defaultValues: {
      recipient_account_number: '',
      amount: '',
      description: '',
    },
  });

  useEffect(() => {
    if (params.recipient_account_number) {
      setValue('recipient_account_number', params.recipient_account_number as string);
    }
  }, [params.recipient_account_number, setValue]);

  const transferMutation = useMutation({
    mutationFn: async (formData: TransferFormData) => {
      const amountNum = parseFloat(formData.amount);
      const response = await api.post('/api/transactions/transfer', {
        ...formData,
        amount: amountNum,
      });
      return { ...response.data, _amount: amountNum };
    },
    onSuccess: async (data) => {
      const transferAmount = data._amount;
      queryClient.setQueryData(['dashboard'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          total_balance: (old.total_balance || 0) - transferAmount,
          total_expenses: (old.total_expenses || 0) + transferAmount,
          account: old.account ? {
            ...old.account,
            available_balance: (old.account.available_balance || 0) - transferAmount,
            ledger_balance: (old.account.ledger_balance || 0) - transferAmount,
          } : old.account,
        };
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['accounts'] }),
        queryClient.invalidateQueries({ queryKey: ['transactions'] }),
        queryClient.invalidateQueries({ queryKey: ['beneficiaries'] }),
      ]);

      const transactionId = data?.transaction?.id;
      const token = useAuthStore.getState().accessToken;
      const receipt = transactionId
        ? `${baseURL}/api/transactions/receipt/${transactionId}?access_token=${token}`
        : null;

      setReceiptUrl(receipt);
      setDialogType('success');
      setDialogMessage('Your transfer has been completed successfully.');
      setDialogVisible(true);
    },
    onError: (error: any) => {
      const detail = error.response?.data?.detail || 'Transfer failed';
      setReceiptUrl(null);
      if (detail.toLowerCase().includes('balance') || detail.toLowerCase().includes('insufficient')) {
        setDialogType('low_balance');
        setDialogMessage('You have insufficient balance to complete this transaction. Please deposit funds first.');
      } else {
        setDialogType('error');
        setDialogMessage(detail);
      }
      setDialogVisible(true);
    },
  });

  const onSubmit = (data: TransferFormData) => {
    transferMutation.mutate(data);
  };

  return (
    <ScrollView style={styles.container}>
      <AnimatedCard style={[styles.card, animatedStyle]}>
        <Card.Content style={styles.cardContent}>
          <View style={styles.headerRow}>
            <IconButton icon="arrow-left" size={28} onPress={() => router.replace('/(tabs)')} />
            <Text variant="headlineSmall" style={styles.title}>Send Money</Text>
            <View style={{ width: 40 }} />
          </View>

          <Controller
            control={control}
            name="recipient_account_number"
            rules={{ required: 'Recipient account number is required' }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Recipient Account Number"
                mode="outlined"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                style={styles.input}
                keyboardType="numeric"
                error={!!errors.recipient_account_number}
                left={<TextInput.Icon icon="credit-card" />}
                textColor="#000000"
                theme={{ colors: { text: '#000000', placeholder: '#64748b' } }}
              />
            )}
          />
          {errors.recipient_account_number && (
            <Text style={styles.error}>{errors.recipient_account_number.message}</Text>
          )}

          <Controller
            control={control}
            name="amount"
            rules={{
              required: 'Amount is required',
              pattern: {
                value: /^\d+(\.\d{1,2})?$/,
                message: 'Please enter a valid amount',
              },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Amount"
                mode="outlined"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                style={styles.input}
                keyboardType="numeric"
                left={<TextInput.Affix text="Rs. " />}
                error={!!errors.amount}
                textColor="#000000"
                theme={{ colors: { text: '#000000', placeholder: '#64748b' } }}
              />
            )}
          />
          {errors.amount && (
            <Text style={styles.error}>{errors.amount.message}</Text>
          )}

          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Description (Optional)"
                mode="outlined"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                style={styles.input}
                multiline
                numberOfLines={3}
                left={<TextInput.Icon icon="note-text" />}
                textColor="#000000"
                theme={{ colors: { text: '#000000', placeholder: '#64748b' } }}
              />
            )}
          />

          <Button
            mode="contained"
            onPress={handleSubmit(onSubmit)}
            loading={transferMutation.isPending}
            disabled={transferMutation.isPending}
            style={styles.button}
            contentStyle={styles.buttonContent}
            buttonColor="#2563eb"
            icon="send"
          >
            Send Money
          </Button>
        </Card.Content>
      </AnimatedCard>
      
      <Portal>
        <Dialog 
          visible={dialogVisible} 
          onDismiss={() => {
            if (dialogType === 'success') {
              router.replace('/(tabs)');
            } else {
              setDialogVisible(false);
            }
          }} 
          style={styles.dialog}
        >
          <Dialog.Content style={styles.dialogContent}>
            <View style={styles.dialogIconContainer}>
              {dialogType === 'success' && (
                <IconButton icon="check-circle" iconColor="#22c55e" size={60} style={styles.dialogIcon} />
              )}
              {dialogType === 'low_balance' && (
                <IconButton icon="alert-circle" iconColor="#ef4444" size={60} style={styles.dialogIcon} />
              )}
              {dialogType === 'error' && (
                <IconButton icon="close-circle" iconColor="#ef4444" size={60} style={styles.dialogIcon} />
              )}
            </View>
            <Text variant="headlineSmall" style={[
              styles.dialogTitle,
              dialogType === 'success' ? styles.textSuccess : styles.textDanger
            ]}>
              {dialogType === 'success' ? 'Transfer Successful' : dialogType === 'low_balance' ? 'Low Balance' : 'Transfer Failed'}
            </Text>
            <Text variant="bodyLarge" style={styles.dialogMessage}>
              {dialogMessage}
            </Text>
          </Dialog.Content>
          <Dialog.Actions style={styles.dialogActions}>
            {dialogType === 'success' && receiptUrl && (
              <Button
                mode="outlined"
                textColor="#2563eb"
                style={styles.dialogButton}
                onPress={() => Linking.openURL(receiptUrl)}
              >
                Receipt
              </Button>
            )}
            {dialogType === 'low_balance' && (
              <Button
                mode="contained"
                buttonColor="#2563eb"
                style={styles.dialogButton}
                onPress={() => {
                  setDialogVisible(false);
                  router.replace('/(tabs)/wallet');
                }}
              >
                Deposit
              </Button>
            )}
            <Button
              mode="contained"
              buttonColor={dialogType === 'success' ? '#22c55e' : '#64748b'}
              style={styles.dialogButton}
              onPress={() => {
                setDialogVisible(false);
                if (dialogType === 'success') {
                  router.replace('/(tabs)');
                }
              }}
            >
              {dialogType === 'low_balance' ? 'Cancel' : 'OK'}
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
  input: {
    marginBottom: 8,
    backgroundColor: '#ffffff',
  },
  error: {
    color: '#ef4444',
    fontSize: 12,
    marginBottom: 16,
    marginLeft: 4,
  },
  button: {
    marginTop: 24,
    borderRadius: 16,
  },
  buttonContent: {
    paddingVertical: 12,
  },
  dialog: {
    borderRadius: 24,
    backgroundColor: '#ffffff',
    padding: 8,
  },
  dialogContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  dialogIconContainer: {
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogIcon: {
    margin: 0,
  },
  dialogTitle: {
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  dialogMessage: {
    textAlign: 'center',
    color: '#475569',
    lineHeight: 20,
  },
  dialogActions: {
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  dialogButton: {
    borderRadius: 12,
    minWidth: 100,
  },
  textSuccess: {
    color: '#22c55e',
  },
  textDanger: {
    color: '#ef4444',
  },
});
