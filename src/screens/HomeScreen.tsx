import { DrawerActions, useIsFocused } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as React from 'react';
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native';

import SubscriptionCard from '../components/SubscriptionCard';
import {
  getAllSubscriptions,
  updateSubscription,
} from '../db/repositories/subscriptions.repo';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { colors } from '../theme/colors';
import type { Subscription } from '../types/subscription';
import { rollForwardNextPayment } from '../utils/dateHelpers';
import { cancelReminder, scheduleReminder } from '../utils/notifications';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;
type SortOption = 'Price' | 'Next Payment' | 'Start Date';

const SORT_OPTIONS: ReadonlyArray<SortOption> = ['Price', 'Next Payment', 'Start Date'];
const DAY_MS = 24 * 60 * 60 * 1000;

export default function HomeScreen({ navigation }: Props) {
  const [subscriptions, setSubscriptions] = React.useState<Subscription[]>([]);
  const [sortBy, setSortBy] = React.useState<SortOption>('Next Payment');
  const isFocused = useIsFocused();

  const loadData = React.useCallback(async () => {
    try {
      const subs = await getAllSubscriptions();

      // Auto-roll forward next payment dates if they are in the past
      for (const sub of subs) {
        const rolled = rollForwardNextPayment(
          sub.startDate,
          sub.billingCycle,
          sub.nextPaymentDate,
        );

        if (rolled !== sub.nextPaymentDate) {
          let newNotificationId: string | null = null;

          try {
            if (sub.notificationId) {
              await cancelReminder(sub.notificationId);
            }

            const reminderDays = sub.reminderDaysBefore ?? 1;
            const triggerDate = new Date(
              new Date(rolled).getTime() - reminderDays * DAY_MS,
            );

            newNotificationId =
              (await scheduleReminder(
                `sub-${sub.id}-${Date.now()}`,
                `${sub.name} renewal soon`,
                `Your ${sub.name} subscription will renew at $${sub.price.toFixed(2)}`,
                triggerDate,
              )) ?? null;

            const updatedSub: Subscription = {
              ...sub,
              nextPaymentDate: rolled,
              notificationId: newNotificationId,
            };

            await updateSubscription(updatedSub);

            sub.nextPaymentDate = updatedSub.nextPaymentDate;
            sub.notificationId = updatedSub.notificationId;
          } catch (innerErr) {
            if (newNotificationId) {
              await cancelReminder(newNotificationId);
            }
            throw innerErr;
          }
        }
      }

      // Apply sorting
      const sorted = [...subs].sort((a, b) => {
        if (sortBy === 'Price') return b.price - a.price;
        if (sortBy === 'Start Date')
          return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        return (
          new Date(a.nextPaymentDate).getTime() - new Date(b.nextPaymentDate).getTime()
        );
      });

      setSubscriptions(sorted);
    } catch (err) {
      console.error('Failed to load subscriptions:', err);
    }
  }, [sortBy]);

  React.useEffect(() => {
    if (isFocused) {
      void loadData();
    }
  }, [isFocused, loadData]);

  // Group by category
  const grouped = subscriptions.reduce<Record<string, Subscription[]>>((acc, sub) => {
    const cat = sub.category || 'Other';
    if (!acc[cat]) {
      acc[cat] = [];
    }
    acc[cat]!.push(sub);
    return acc;
  }, {});

  const sections = Object.entries(grouped).map(([title, data]) => ({
    title,
    data,
  }));

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.menuButton}
          onPress={() => navigation.getParent()?.dispatch(DrawerActions.openDrawer())}
        >
          <Text style={styles.menuIcon}>☰</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Subscriptions</Text>
      </View>

      {/* Sorting Bar */}
      <View style={styles.sortWrapper}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <View style={styles.sortButtons}>
          {SORT_OPTIONS.map((opt) => (
            <Pressable
              key={opt}
              style={[styles.sortButton, sortBy === opt && styles.sortButtonActive]}
              onPress={() => setSortBy(opt)}
            >
              <Text
                style={[
                  styles.sortButtonText,
                  sortBy === opt && styles.sortButtonTextActive,
                ]}
              >
                {opt}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id!.toString()}
        renderItem={({ item }) => (
          <SubscriptionCard
            subscription={item}
            onPress={() => navigation.navigate('Details', { id: item.id })}
          />
        )}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionHeader}>{title}</Text>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No subscriptions yet. Add one!</Text>
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      <Pressable
        style={styles.fab}
        onPress={() => navigation.navigate('AddSubscription')}
      >
        <Text style={styles.fabText}>＋</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  menuIcon: {
    fontSize: 18,
    color: colors.card,
    fontFamily: 'PoppinsBold',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'PoppinsBold',
    color: colors.text,
  },

  // Sorting
  sortWrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  sortLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: 'PoppinsRegular',
    marginBottom: 6,
  },
  sortButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 4,
  },
  sortButton: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  sortButtonActive: {
    backgroundColor: colors.accent,
  },
  sortButtonText: {
    fontFamily: 'PoppinsRegular',
    fontSize: 14,
    color: colors.text,
  },
  sortButtonTextActive: {
    fontFamily: 'PoppinsBold',
    color: colors.card,
  },

  // Sections
  sectionHeader: {
    fontSize: 18,
    fontFamily: 'PoppinsBold',
    backgroundColor: colors.background,
    color: colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginTop: 12,
  },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    color: colors.textSecondary,
    fontFamily: 'PoppinsRegular',
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: colors.accent,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  fabText: { fontSize: 28, color: colors.card, fontWeight: 'bold' },
});
