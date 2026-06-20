import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, TextInput, IconButton, Portal, Dialog } from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay } from 'react-native-reanimated';
import api from '../../lib/axios';

const AnimatedCard = Animated.createAnimatedComponent(Card);

interface AccountData {
  id: number;
  user_id: number;
  account_number: string;
  iban: string;
  branch_code: string;
  account_type: string;
  status: string;
  available_balance: number;
  ledger_balance: number;
  currency: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

type AccountCardProps = {
  account: AccountData;
  index: number;
  isActive: boolean;
  onPress: () => void;
};

function AccountCard({ account, index, isActive, onPress }: AccountCardProps) {
  const translateY = useSharedValue(50);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    translateY.value = withDelay(300 + index * 100, withSpring(0));
    opacity.value = withDelay(300 + index * 100, withSpring(1));
  }, [index, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <AnimatedCard
      style={[
        styles.accountCard,
        isActive && styles.activeAccountCard,
        animatedStyle,
      ]}
      onPress={onPress}
    >
      <Card.Content style={styles.accountCardContent}>
        <View style={styles.accountHeader}>
          <View>
            <Text variant="titleMedium" style={styles.accountType}>
              {account.account_type.charAt(0).toUpperCase() + account.account_type.slice(1)} Account
            </Text>
            <Text variant="bodySmall" style={styles.accountNumber}>
              **** **** **{account.account_number.slice(-4)}
            </Text>
          </View>
          <Text variant="headlineSmall" style={styles.accountBalance}>
            Rs. {account.available_balance.toFixed(2)}
          </Text>
        </View>
        <View style={styles.accountDetails}>
          <Text variant="bodySmall" style={styles.label}>IBAN:</Text>
          <Text variant="bodySmall" style={styles.value}>{account.iban}</Text>
        </View>
        <View style={styles.accountDetails}>
          <Text variant="bodySmall" style={styles.label}>Branch Code:</Text>
          <Text variant="bodySmall" style={styles.value}>{account.branch_code}</Text>
        </View>
      </Card.Content>
    </AnimatedCard>
  );
}

export default function WalletScreen() {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [createAccountDialogVisible, setCreateAccountDialogVisible] = useState(false);
  const [selectedAccountType, setSelectedAccountType] = useState('savings');

  // Status dialog state
  const [statusDialogVisible, setStatusDialogVisible] = useState(false);
  const [statusDialogType, setStatusDialogType] = useState<'success' | 'low_balance' | 'error' | null>(null);
  const [statusDialogMessage, setStatusDialogMessage] = useState('');

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const response = await api.get<AccountData[]>('/api/accounts');
      return response.data;
    },
  });

  const defaultAccount = accounts?.find((acc) => acc.is_default) || accounts?.[0];
  const activeAccountId = selectedAccountId || defaultAccount?.id;

  const headerOpacity = useSharedValue(0);
  const accountsOpacity = useSharedValue(0);
  const actionsOpacity = useSharedValue(0);

  React.useEffect(() => {
    headerOpacity.value = withDelay(100, withSpring(1));
    accountsOpacity.value = withDelay(300, withSpring(1));
    actionsOpacity.value = withDelay(500, withSpring(1));
  }, [actionsOpacity, accountsOpacity, headerOpacity]);

  const headerStyle = useAnimatedStyle(() => ({ opacity: headerOpacity.value }));
  const accountsStyle = useAnimatedStyle(() => ({ opacity: accountsOpacity.value }));
  const actionsStyle = useAnimatedStyle(() => ({ opacity: actionsOpacity.value }));

  const depositMutation = useMutation({
    mutationFn: async (accountId: number) => {
      const res = await api.post(`/api/accounts/${accountId}/deposit`, { amount: parseFloat(amount) });
      return { account: res.data, amount: parseFloat(amount) };
    },
    onSuccess: (result) => {
      const { account: updatedAccount } = result;
      queryClient.setQueryData(['dashboard'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          total_balance: updatedAccount.available_balance,
          account: updatedAccount,
        };
      });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      setAmount('');
      setStatusDialogType('success');
      setStatusDialogMessage(`Deposit of Rs. ${result.amount.toFixed(2)} completed successfully.`);
      setStatusDialogVisible(true);
    },
    onError: (error: any) => {
      setStatusDialogType('error');
      setStatusDialogMessage(error.response?.data?.detail || 'Deposit failed');
      setStatusDialogVisible(true);
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: async (accountId: number) => {
      const res = await api.post(`/api/accounts/${accountId}/withdraw`, { amount: parseFloat(amount) });
      return { account: res.data, amount: parseFloat(amount) };
    },
    onSuccess: (result) => {
      const { account: updatedAccount } = result;
      queryClient.setQueryData(['dashboard'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          total_balance: updatedAccount.available_balance,
          account: updatedAccount,
        };
      });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      setAmount('');
      setStatusDialogType('success');
      setStatusDialogMessage(`Withdrawal of Rs. ${result.amount.toFixed(2)} completed successfully.`);
      setStatusDialogVisible(true);
    },
    onError: (error: any) => {
      const detail = error.response?.data?.detail || 'Withdrawal failed';
      if (detail.toLowerCase().includes('balance') || detail.toLowerCase().includes('insufficient')) {
        setStatusDialogType('low_balance');
        setStatusDialogMessage('You have insufficient balance to complete this withdrawal.');
      } else {
        setStatusDialogType('error');
        setStatusDialogMessage(detail);
      }
      setStatusDialogVisible(true);
    },
  });

  const createAccountMutation = useMutation({
    mutationFn: async () => {
      return api.post('/api/accounts', {
        account_type: selectedAccountType,
        currency: 'PKR',
        is_default: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setCreateAccountDialogVisible(false);
      Alert.alert('Success', 'Account created');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to create account');
    },
  });

  return (
    <ScrollView style={styles.container}>
      <Animated.View style={[styles.header, headerStyle]}>
        <Text variant="headlineSmall" style={styles.title}>My Accounts</Text>
        <IconButton
          icon="plus"
          mode="contained"
          containerColor="#2563eb"
          iconColor="white"
          onPress={() => setCreateAccountDialogVisible(true)}
        />
      </Animated.View>

      {(!accounts || accounts.length === 0) ? (
        <Card style={styles.emptyCard}>
          <Card.Content style={styles.emptyContent}>
            <Text variant="headlineSmall" style={{ textAlign: 'center', marginBottom: 12, color: '#0f172a' }}>
              No Accounts Yet
            </Text>
            <Button
              mode="contained"
              icon="plus"
              buttonColor="#2563eb"
              onPress={() => setCreateAccountDialogVisible(true)}
              style={{ borderRadius: 12 }}
              contentStyle={{ paddingVertical: 10 }}
            >
              Create Your First Account
            </Button>
          </Card.Content>
        </Card>
      ) : (
        <>
          <Animated.View style={accountsStyle}>
            {accounts.map((account, index) => (
              <AccountCard
                key={account.id}
                account={account}
                index={index}
                isActive={activeAccountId === account.id}
                onPress={() => setSelectedAccountId(account.id)}
              />
            ))}
          </Animated.View>

          <AnimatedCard style={[styles.actionCard, actionsStyle]}>
            <Card.Content style={styles.actionCardContent}>
              <Text variant="titleLarge" style={styles.actionTitle}>Manage Balance</Text>

              <TextInput
                label="Amount"
                mode="outlined"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                style={styles.input}
                left={<TextInput.Affix text="Rs. " />}
              />

              <View style={styles.buttonRow}>
                <Button
                  mode="contained"
                  onPress={() => activeAccountId && depositMutation.mutate(activeAccountId)}
                  style={styles.actionBtn}
                  contentStyle={styles.actionBtnContent}
                  loading={depositMutation.isPending}
                  disabled={!amount || parseFloat(amount) <= 0 || !activeAccountId}
                  buttonColor="#22c55e"
                >
                  Deposit
                </Button>
                <Button
                  mode="contained"
                  onPress={() => activeAccountId && withdrawMutation.mutate(activeAccountId)}
                  style={styles.actionBtn}
                  contentStyle={styles.actionBtnContent}
                  loading={withdrawMutation.isPending}
                  disabled={!amount || parseFloat(amount) <= 0 || !activeAccountId}
                  buttonColor="#ef4444"
                >
                  Withdraw
                </Button>
              </View>
            </Card.Content>
          </AnimatedCard>
        </>
      )}

      <Portal>
        <Dialog visible={createAccountDialogVisible} onDismiss={() => setCreateAccountDialogVisible(false)} style={styles.dialog}>
          <Dialog.Title>Create New Account</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ marginBottom: 16 }}>Select account type:</Text>
            <View style={styles.accountTypesContainer}>
              {['savings', 'current', 'student'].map((type) => (
                <Button
                  key={type}
                  mode={selectedAccountType === type ? 'contained' : 'outlined'}
                  onPress={() => setSelectedAccountType(type)}
                  style={styles.accountTypeButton}
                  buttonColor="#2563eb"
                  textColor={selectedAccountType === type ? '#ffffff' : '#000000'}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Button>
              ))}
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setCreateAccountDialogVisible(false)}>Cancel</Button>
            <Button
              mode="contained"
              buttonColor="#2563eb"
              onPress={() => createAccountMutation.mutate()}
              loading={createAccountMutation.isPending}
            >
              Create
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog 
          visible={statusDialogVisible} 
          onDismiss={() => setStatusDialogVisible(false)} 
          style={styles.dialog}
        >
          <Dialog.Content style={styles.dialogContent}>
            <View style={styles.dialogIconContainer}>
              {statusDialogType === 'success' && (
                <IconButton icon="check-circle" iconColor="#22c55e" size={60} style={styles.dialogIcon} />
              )}
              {statusDialogType === 'low_balance' && (
                <IconButton icon="alert-circle" iconColor="#ef4444" size={60} style={styles.dialogIcon} />
              )}
              {statusDialogType === 'error' && (
                <IconButton icon="close-circle" iconColor="#ef4444" size={60} style={styles.dialogIcon} />
              )}
            </View>
            <Text variant="headlineSmall" style={[
              styles.dialogTitle,
              statusDialogType === 'success' ? styles.textSuccess : styles.textDanger
            ]}>
              {statusDialogType === 'success' ? 'Transaction Successful' : statusDialogType === 'low_balance' ? 'Low Balance' : 'Transaction Failed'}
            </Text>
            <Text variant="bodyLarge" style={styles.dialogMessage}>
              {statusDialogMessage}
            </Text>
          </Dialog.Content>
          <Dialog.Actions style={styles.dialogActions}>
            <Button
              mode="contained"
              buttonColor={statusDialogType === 'success' ? '#22c55e' : '#64748b'}
              style={styles.dialogButton}
              onPress={() => setStatusDialogVisible(false)}
            >
              OK
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f3f4f6' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { color: '#0f172a', fontWeight: '700' },
  accountCard: {
    marginBottom: 16,
    borderRadius: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  activeAccountCard: {
    borderWidth: 3,
    borderColor: '#2563eb',
    shadowColor: '#2563eb',
    shadowOpacity: 0.3,
    elevation: 12,
  },
  accountCardContent: { paddingVertical: 16, paddingHorizontal: 20 },
  accountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  accountType: { color: '#0f172a', fontWeight: '600' },
  accountNumber: { color: '#64748b' },
  accountBalance: { color: '#0f172a', fontWeight: '800' },
  accountDetails: { flexDirection: 'row', marginBottom: 8 },
  label: { color: '#64748b', marginRight: 8 },
  value: { color: '#0f172a', fontWeight: '500' },
  actionCard: { marginTop: 16, borderRadius: 20, backgroundColor: '#fff' },
  actionCardContent: { paddingVertical: 20 },
  actionTitle: { marginBottom: 20, color: '#0f172a', fontWeight: '700' },
  input: { marginBottom: 24, backgroundColor: '#fff' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between' },
  actionBtn: { flex: 1, marginHorizontal: 8, borderRadius: 12 },
  actionBtnContent: { paddingVertical: 12 },
  emptyCard: { borderRadius: 20, backgroundColor: '#fff' },
  emptyContent: { alignItems: 'center', paddingVertical: 48 },
  dialog: { borderRadius: 20, backgroundColor: '#ffffff', padding: 8 },
  accountTypesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  accountTypeButton: { flex: 1, minWidth: '45%', borderRadius: 12 },
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
