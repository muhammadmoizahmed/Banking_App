import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Text,
  Card,
  Button,
  IconButton,
  Portal,
  Dialog,
  TextInput
} from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay
} from 'react-native-reanimated';
import api from '../../lib/axios';

const AnimatedCard = Animated.createAnimatedComponent(Card);

interface CardData {
  id: number;
  account_id: number;
  user_id: number;
  card_number: string;
  expiry_month: string;
  expiry_year: string;
  cvv: string;
  card_type: string;
  status: string;
  daily_limit: number;
  online_limit: number;
  daily_spent: number;
  online_spent: number;
  created_at: string;
  updated_at: string;
}

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

type CardItemProps = {
  card: CardData;
  index: number;
  onFreeze: () => void;
  onUnfreeze: () => void;
  onDelete: () => void;
};

function CardItem({ card, index, onFreeze, onUnfreeze, onDelete }: CardItemProps) {
  const [revealed, setRevealed] = useState(false);
  const translateY = useSharedValue(100);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    translateY.value = withDelay(100 + index * 100, withSpring(0));
    opacity.value = withDelay(100 + index * 100, withSpring(1));
  }, [index, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <AnimatedCard style={[styles.card, animatedStyle]}>
      <Card.Content style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text variant="titleMedium" style={styles.cardTitle}>
            {card.card_type.charAt(0).toUpperCase() + card.card_type.slice(1)} Card
          </Text>
          <View style={styles.cardHeaderRight}>
            <Text
              variant="bodySmall"
              style={[
                styles.status,
                { color: card.status === 'active' ? '#86efac' : '#fca5a5' },
              ]}
            >
              {card.status.toUpperCase()}
            </Text>
            <IconButton
              icon={revealed ? 'eye-off' : 'eye'}
              iconColor="#ffffff"
              containerColor="rgba(255,255,255,0.12)"
              size={18}
              onPress={() => setRevealed((value) => !value)}
            />
          </View>
        </View>
        <Text variant="headlineSmall" style={styles.cardNumber}>
          {revealed ? card.card_number.match(/.{1,4}/g)?.join(' ') ?? card.card_number : `**** **** **** ${card.card_number.slice(-4)}`}
        </Text>
        <View style={styles.cardFooter}>
          <View style={styles.expiry}>
            <Text variant="bodySmall" style={styles.label}>Valid Thru</Text>
            <Text variant="titleMedium" style={styles.cardMetaValue}>{card.expiry_month}/{card.expiry_year.slice(-2)}</Text>
          </View>
          <View style={styles.cvv}>
            <Text variant="bodySmall" style={styles.label}>CVV</Text>
            <Text variant="titleMedium" style={styles.cardMetaValue}>
              {revealed ? card.cvv : '•••'}
            </Text>
          </View>
        </View>
        <View style={styles.actionButtons}>
          {card.status === 'active' ? (
            <Button
              mode="contained"
              buttonColor="#f59e0b"
              onPress={onFreeze}
              style={styles.actionBtn}
              contentStyle={styles.actionBtnContent}
            >
              Freeze
            </Button>
          ) : (
            <Button
              mode="contained"
              buttonColor="#22c55e"
              onPress={onUnfreeze}
              style={styles.actionBtn}
              contentStyle={styles.actionBtnContent}
            >
              Unfreeze
            </Button>
          )}
          <IconButton
            icon="delete"
            iconColor="#ef4444"
            containerColor="#fef2f2"
            onPress={onDelete}
          />
        </View>
      </Card.Content>
    </AnimatedCard>
  );
}

type AccountPickerButtonProps = {
  account: AccountData;
  onPress: () => void;
};

function AccountPickerButton({ account, onPress }: AccountPickerButtonProps) {
  return (
    <Button
      mode="contained"
      buttonColor="#2563eb"
      onPress={onPress}
      style={{ marginVertical: 8 }}
    >
      {account.account_number}
    </Button>
  );
}

export default function CardsScreen() {
  const queryClient = useQueryClient();
  const [createDialogVisible, setCreateDialogVisible] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<AccountData | null>(null);

  const { data: cards } = useQuery({
    queryKey: ['cards'],
    queryFn: async () => {
      const response = await api.get<CardData[]>('/api/cards');
      return response.data;
    },
  });

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const response = await api.get<AccountData[]>('/api/accounts');
      return response.data;
    },
  });

  const createCardMutation = useMutation({
    mutationFn: async ({ accountId }: { accountId: number }) => {
      return api.post('/api/cards', {
        account_id: accountId,
        card_type: 'virtual',
        daily_limit: 100000,
        online_limit: 50000,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      setCreateDialogVisible(false);
    },
  });

  const freezeCardMutation = useMutation({
    mutationFn: async (cardId: number) => {
      return api.put(`/api/cards/${cardId}/freeze`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
    },
  });

  const unfreezeCardMutation = useMutation({
    mutationFn: async (cardId: number) => {
      return api.put(`/api/cards/${cardId}/unfreeze`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
    },
  });

  const deleteCardMutation = useMutation({
    mutationFn: async (cardId: number) => {
      return api.delete(`/api/cards/${cardId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
    },
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>
          My Cards
        </Text>
        <IconButton
          icon="plus"
          mode="contained"
          containerColor="#2563eb"
          iconColor="white"
          onPress={() => setCreateDialogVisible(true)}
        />
      </View>

      {cards?.map((card, index) => (
        <CardItem
          key={card.id}
          card={card}
          index={index}
          onFreeze={() => freezeCardMutation.mutate(card.id)}
          onUnfreeze={() => unfreezeCardMutation.mutate(card.id)}
          onDelete={() => deleteCardMutation.mutate(card.id)}
        />
      ))}

      <Portal>
        <Dialog visible={createDialogVisible} onDismiss={() => setCreateDialogVisible(false)} style={styles.dialog}>
          <Dialog.Title>Create New Card</Dialog.Title>
          <Dialog.Content>
            <Text>Select an account to link the card to:</Text>
            {accounts?.map((acc) => (
              <AccountPickerButton
                key={acc.id}
                account={acc}
                onPress={() => {
                  setSelectedAccount(acc);
                  createCardMutation.mutate({ accountId: acc.id });
                }}
              />
            ))}
            {selectedAccount ? (
              <Text variant="bodySmall" style={{ marginTop: 8 }}>
                Selected: {selectedAccount.account_number}
              </Text>
            ) : null}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setCreateDialogVisible(false)}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontWeight: '700', color: '#0f172a' },
  card: { marginBottom: 16, borderRadius: 20, backgroundColor: '#1e293b', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 },
  cardContent: { paddingVertical: 16, paddingHorizontal: 20 },
  cardHeaderRight: { flexDirection: 'row', alignItems: 'center' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitle: { color: '#ffffff', fontWeight: '600' },
  status: { fontWeight: '700' },
  cardNumber: { color: '#fff', fontWeight: '800', marginBottom: 24, letterSpacing: 3 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  expiry: { alignItems: 'flex-start' },
  cvv: { alignItems: 'flex-end' },
  label: { color: '#cbd5e1', marginBottom: 4 },
  cardMetaValue: { color: '#ffffff' },
  actionButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  actionBtn: { flex: 1, marginRight: 8, borderRadius: 12 },
  actionBtnContent: { paddingVertical: 8 },
  dialog: { borderRadius: 20 },
  emptyCard: { borderRadius: 20, backgroundColor: '#fff' },
  emptyContent: { alignItems: 'center', paddingVertical: 48 },
});
