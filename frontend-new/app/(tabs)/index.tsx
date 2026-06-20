import React from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, useWindowDimensions } from 'react-native';
import { Text, Card, Button, IconButton, Badge } from 'react-native-paper';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
} from 'react-native-reanimated';
import api from '../../lib/axios';
import { useAuthStore } from '../../store/auth-store';

const AnimatedCard = Animated.createAnimatedComponent(Card);
const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedText = Animated.createAnimatedComponent(Text);

export default function HomeScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const { width } = useWindowDimensions();
  const isNarrow = width < 420;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await api.get('/api/transactions/dashboard/stats');
      return response.data;
    },
  });

  // Animation values
  const balanceOpacity = useSharedValue(0);
  const balanceScale = useSharedValue(0.8);
  const actionsOpacity = useSharedValue(0);
  const transactionsOpacity = useSharedValue(0);

  React.useEffect(() => {
    balanceOpacity.value = withDelay(100, withSpring(1, { damping: 15 }));
    balanceScale.value = withDelay(100, withSpring(1, { damping: 15 }));
    actionsOpacity.value = withDelay(400, withSpring(1, { damping: 15 }));
    transactionsOpacity.value = withDelay(700, withSpring(1, { damping: 15 }));
  }, []);

  const balanceStyle = useAnimatedStyle(() => ({
    opacity: balanceOpacity.value,
    transform: [{ scale: balanceScale.value }],
  }));

  const actionsStyle = useAnimatedStyle(() => ({
    opacity: actionsOpacity.value,
    transform: [{ translateY: withSpring(0, { damping: 15 }) }],
  }));

  const transactionsStyle = useAnimatedStyle(() => ({
    opacity: transactionsOpacity.value,
    transform: [{ translateY: withSpring(0, { damping: 15 }) }],
  }));

  const getTransactionName = (tx: any) => {
    if (tx.transaction_type === 'receive') {
      return `From ${tx.beneficiary_user?.first_name} ${tx.beneficiary_user?.last_name}`;
    }
    if (tx.transaction_type === 'transfer') {
      return `To ${tx.beneficiary_user?.first_name} ${tx.beneficiary_user?.last_name}`;
    }
    if (tx.transaction_type === 'deposit') {
      return 'Deposit';
    }
    if (tx.transaction_type === 'withdrawal') {
      return 'Withdrawal';
    }
    return tx.transaction_type
      ? tx.transaction_type.replace(/_/g, ' ').replace(/\b\w/g, (char: string) => char.toUpperCase())
      : 'Transaction';
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
      >
        <View style={styles.header}>
          <View>
            <Text variant="bodyMedium" style={styles.greeting}>Hello,</Text>
            <Text variant="headlineSmall" style={styles.userName}>
              {user?.first_name} {user?.last_name}
            </Text>
          </View>
          <View style={styles.notificationButtonContainer}>
            <IconButton 
              icon="bell-circle" 
              mode="contained" 
              size={40} 
              onPress={() => router.push('/notifications')}
            />
            {data?.unread_notifications_count > 0 && (
              <Badge style={styles.notificationBadge} size={20}>
                {data.unread_notifications_count}
              </Badge>
            )}
          </View>
        </View>

        <AnimatedCard style={[styles.balanceCard, balanceStyle]}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.balanceLabel}>Total Balance</Text>
            <Text variant="displaySmall" style={styles.balance}>
              Rs. {data?.total_balance?.toFixed(2) || '0.00'}
            </Text>
            {data?.account && (
              <View style={styles.accountInfo}>
                <Text style={styles.accountLabel}>Account Number:</Text>
                <Text style={styles.accountValue}>{data.account.account_number}</Text>
                <Text style={styles.accountLabel}>IBAN:</Text>
                <Text style={styles.accountValue}>{data.account.iban}</Text>
                <Text style={styles.accountLabel}>Account Type:</Text>
                <Text style={styles.accountValue}>
                  {data.account.account_type.charAt(0).toUpperCase() + data.account.account_type.slice(1)}
                </Text>
              </View>
            )}
          </Card.Content>
        </AnimatedCard>

        <AnimatedView style={[styles.quickActions, actionsStyle, isNarrow && styles.quickActionsNarrow]}>
          <Button
            mode="contained"
            icon="send"
            onPress={() => router.push('/transfer')}
            style={[styles.actionButton, isNarrow && styles.actionButtonNarrow]}
            contentStyle={styles.actionButtonContent}
            buttonColor="#2563eb"
          >
            Send
          </Button>
          <Button
            mode="contained"
            icon="wallet-plus"
            onPress={() => router.push('/(tabs)/wallet')}
            style={[styles.actionButton, isNarrow && styles.actionButtonNarrow]}
            contentStyle={styles.actionButtonContent}
            buttonColor="#f97316"
          >
            Deposit
          </Button>
          <Button
            mode="contained"
            icon="wallet-minus"
            onPress={() => router.push('/(tabs)/wallet')}
            style={[styles.actionButton, isNarrow && styles.actionButtonNarrow]}
            contentStyle={styles.actionButtonContent}
            buttonColor="#06b6d4"
          >
            Withdraw
          </Button>
          <Button
            mode="contained"
            icon="receipt"
            onPress={() => router.push('/bill-payment')}
            style={[styles.actionButton, isNarrow && styles.actionButtonNarrow]}
            contentStyle={styles.actionButtonContent}
            buttonColor="#f59e0b"
          >
            Pay Bill
          </Button>
          <Button
            mode="contained"
            icon="ticket"
            onPress={() => router.push('/ticket-booking')}
            style={[styles.actionButton, isNarrow && styles.actionButtonNarrow]}
            contentStyle={styles.actionButtonContent}
            buttonColor="#ec4899"
          >
            Book Ticket
          </Button>
          <Button
            mode="contained"
            icon="file-document"
            onPress={() => router.push('/statement')}
            style={[styles.actionButton, isNarrow && styles.actionButtonNarrow]}
            contentStyle={styles.actionButtonContent}
            buttonColor="#10b981"
          >
            Statement
          </Button>
        </AnimatedView>

        <View style={[styles.sectionHeader, isNarrow && styles.sectionHeaderNarrow]}>
          <Text variant="titleLarge" style={styles.sectionTitle}>Recent Transactions</Text>
          <Button mode="text" compact onPress={() => router.push('/(tabs)/transactions')}>
            See All
          </Button>
        </View>

        <AnimatedView style={transactionsStyle}>
          {data?.recent_transactions?.map((tx: any, index: number) => {
            const name = getTransactionName(tx);
            const isIncoming = tx.transaction_type === 'deposit' || tx.transaction_type === 'receive';

            return (
              <Card key={tx.id} style={styles.transactionCard}>
                <Card.Content style={[styles.transactionContent, isNarrow && styles.transactionContentNarrow]}>
                  <View style={[styles.transactionLeft, isNarrow && styles.transactionLeftNarrow]}>
                    <View style={[
                      styles.transactionIcon, 
                      { backgroundColor: isIncoming ? '#22c55e' : '#2563eb' }
                    ]}>
                      <IconButton
                        icon={isIncoming ? 'arrow-down-bold' : 'arrow-up-bold'}
                        iconColor="white"
                        size={20}
                      />
                    </View>
                    <View>
                      <Text variant="titleMedium" style={styles.transactionType}>
                        {name}
                      </Text>
                      <Text variant="bodySmall" style={styles.transactionDate}>
                        {new Date(tx.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </Text>
                    </View>
                  </View>
                  <Text variant="titleMedium" style={[isIncoming ? styles.income : styles.expense, isNarrow && styles.amountNarrow]}>
                    {isIncoming ? '+' : '-'}Rs.
                    {tx.amount.toFixed(2)}
                  </Text>
                </Card.Content>
              </Card>
            );
          })}

          {(!data?.recent_transactions || data?.recent_transactions?.length === 0) && (
            <Card style={styles.emptyCard}>
              <Card.Content style={styles.emptyContent}>
                <Text variant="bodyLarge" style={{ textAlign: 'center' }}>No transactions yet</Text>
              </Card.Content>
            </Card>
          )}
        </AnimatedView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  scrollView: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    color: '#64748b',
    fontSize: 16,
  },
  userName: {
    color: '#0f172a',
    fontWeight: '700',
  },
  notificationButtonContainer: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#ef4444',
  },
  balanceCard: {
    borderRadius: 24,
    marginBottom: 24,
    backgroundColor: '#0f172a',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  balanceLabel: {
    color: '#94a3b8',
    marginBottom: 8,
  },
  balance: {
    color: '#fff',
    marginBottom: 16,
    fontWeight: '800',
  },
  accountInfo: {
    marginBottom: 16,
  },
  accountLabel: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 8,
  },
  accountValue: {
    color: '#e2e8f0',
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statsRowNarrow: {
    flexDirection: 'column',
    gap: 14,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItemNarrow: {
    flex: undefined,
  },
  statIconContainer: {
    marginRight: 12,
    borderRadius: 12,
    padding: 4,
  },
  incomeIcon: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  expenseIcon: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: 12,
  },
  statValue: {
    fontWeight: '700',
    fontSize: 16,
  },
  income: {
    color: '#22c55e',
  },
  expense: {
    color: '#ef4444',
  },
  amountNarrow: {
    marginTop: 8,
  },
  divider: {
    width: 1,
    backgroundColor: '#334155',
    marginHorizontal: 16,
  },
  dividerNarrow: {
    width: '100%',
    height: 1,
    marginHorizontal: 0,
    marginVertical: 2,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  quickActionsNarrow: {
    gap: 10,
  },
  actionButton: {
    flexBasis: '31%',
    marginHorizontal: 0,
    marginBottom: 10,
    borderRadius: 16,
  },
  actionButtonNarrow: {
    flexBasis: '48%',
  },
  actionButtonContent: {
    paddingVertical: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionHeaderNarrow: {
    alignItems: 'flex-start',
    gap: 6,
  },
  sectionTitle: {
    color: '#0f172a',
    fontWeight: '700',
  },
  transactionCard: {
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  transactionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  transactionContentNarrow: {
    alignItems: 'flex-start',
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
    borderRadius: 12,
  },
  transactionType: {
    color: '#0f172a',
    fontWeight: '600',
  },
  transactionDate: {
    color: '#64748b',
  },
  emptyCard: {
    borderRadius: 16,
    backgroundColor: '#ffffff',
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 40,
  },
});
