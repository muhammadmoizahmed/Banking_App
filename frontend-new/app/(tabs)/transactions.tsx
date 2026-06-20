import React from 'react';
import { View, StyleSheet, ScrollView, Linking, useWindowDimensions } from 'react-native';
import { Text, Card, IconButton, Button } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/auth-store';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay } from 'react-native-reanimated';
import api, { baseURL } from '../../lib/axios';

const AnimatedCard = Animated.createAnimatedComponent(Card);

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

interface Transaction {
  id: number;
  transaction_type: string;
  amount: number;
  description?: string;
  created_at: string;
  user?: User;
  beneficiary_user?: User;
}

export default function TransactionsScreen() {
  const currentUser = useAuthStore((state) => state.user);
  const { width } = useWindowDimensions();
  const isNarrow = width < 420;
  
  // Animation values
  const headerOpacity = useSharedValue(0);
  const listOpacity = useSharedValue(0);

  React.useEffect(() => {
    headerOpacity.value = withDelay(100, withSpring(1, { damping: 15 }));
    listOpacity.value = withDelay(300, withSpring(1, { damping: 15 }));
  }, []);

  const headerStyle = useAnimatedStyle(() => ({ opacity: headerOpacity.value }));
  const listStyle = useAnimatedStyle(() => ({ opacity: listOpacity.value }));

  const { data: transactions } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const response = await api.get<Transaction[]>('/api/transactions');
      return response.data;
    },
  });

  const getTransactionInfo = (tx: Transaction) => {
    let name = '';
    let isIncoming = false;

    if (tx.transaction_type === 'receive') {
      isIncoming = true;
      name = `From ${tx.beneficiary_user?.first_name} ${tx.beneficiary_user?.last_name}`;
    } else if (tx.transaction_type === 'transfer') {
      name = `To ${tx.beneficiary_user?.first_name} ${tx.beneficiary_user?.last_name}`;
    } else if (tx.transaction_type === 'deposit') {
      isIncoming = true;
      name = 'Deposit';
    } else if (tx.transaction_type === 'withdrawal') {
      name = 'Withdrawal';
    } else {
      name = tx.transaction_type
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
    }

    return { name, isIncoming };
  };

  const getOtherUser = (tx: Transaction) => {
    if (tx.transaction_type === 'receive' && tx.beneficiary_user) {
      return tx.beneficiary_user;
    } else if (tx.transaction_type === 'transfer' && tx.beneficiary_user) {
      return tx.beneficiary_user;
    }
    return null;
  };

  return (
    <ScrollView style={styles.container}>
      <Animated.View style={[styles.header, headerStyle]}>
        <Text variant="headlineSmall" style={styles.title}>Transaction History</Text>
      </Animated.View>

      <Animated.View style={listStyle}>
        {transactions?.map((tx) => {
          const { name, isIncoming } = getTransactionInfo(tx);
          const otherUser = getOtherUser(tx);
          return (
            <AnimatedCard key={tx.id} style={styles.transactionCard}>
                  <Card.Content style={[styles.transactionContent, isNarrow && styles.transactionContentNarrow]}>
                    <View style={[styles.transactionLeft, isNarrow && styles.transactionLeftNarrow]}>
                  <View style={[
                    styles.transactionIcon,
                    { backgroundColor: isIncoming ? 'rgba(34, 197, 94, 0.1)' : 'rgba(99, 102, 241, 0.1)' }
                  ]}>
                    <IconButton
                      icon={isIncoming ? 'arrow-down-bold' : 'arrow-up-bold'}
                      iconColor={isIncoming ? '#22c55e' : '#2563eb'}
                      size={20}
                    />
                  </View>
                    <View style={{ flex: 1 }}>
                      <Text variant="titleMedium" style={styles.transactionType}>
                        {name}
                      </Text>
                    {tx.description && (
                      <Text variant="bodySmall" style={styles.description}>
                        {tx.description}
                      </Text>
                    )}
                    <Text variant="bodySmall" style={styles.date}>
                      {new Date(tx.created_at).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>
                <View style={[styles.amountColumn, isNarrow && styles.amountColumnNarrow]}>
                  <Text
                    variant="headlineSmall"
                    style={{
                      ...styles.amount,
                      color: isIncoming ? '#22c55e' : '#ef4444'
                    }}
                  >
                    {isIncoming ? '+' : '-'}Rs. {tx.amount.toFixed(2)}
                  </Text>
                  <Button
                    icon="download"
                    mode="text"
                    onPress={() => {
                      // Get auth token
                      const authStore = useAuthStore.getState();
                      const token = authStore.accessToken;
                      const url = `${baseURL}/api/transactions/receipt/${tx.id}?access_token=${token}`;
                      Linking.openURL(url);
                    }}
                    textColor="#2563eb"
                    contentStyle={{ paddingVertical: 0 }}
                    labelStyle={{ fontSize: 12 }}
                  >
                    Receipt
                  </Button>
                </View>
              </Card.Content>
            </AnimatedCard>
          );
        })}
      </Animated.View>

      {(!transactions || transactions.length === 0) && (
        <Card style={styles.emptyCard}>
          <Card.Content style={styles.emptyContent}>
            <IconButton icon="cash-off" size={64} iconColor="#cbd5e1" />
            <Text variant="titleMedium" style={{ textAlign: 'center', color: '#94a3b8', marginTop: 16 }}>
              No transactions yet
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
    padding: 20,
    backgroundColor: '#f3f4f6',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    color: '#0f172a',
    fontWeight: '700',
  },
  transactionCard: {
    marginBottom: 12,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  transactionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionContentNarrow: {
    alignItems: 'flex-start',
    gap: 12,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionLeftNarrow: {
    alignItems: 'flex-start',
  },
  transactionIcon: {
    marginRight: 16,
    borderRadius: 16,
  },
  transactionType: {
    color: '#0f172a',
    fontWeight: '600',
  },
  description: {
    color: '#64748b',
    marginTop: 2,
  },
  date: {
    color: '#94a3b8',
    marginTop: 2,
  },
  amount: {
    fontWeight: '800',
  },
  amountColumn: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  amountColumnNarrow: {
    alignItems: 'flex-start',
  },
  emptyCard: {
    borderRadius: 20,
    marginTop: 20,
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
