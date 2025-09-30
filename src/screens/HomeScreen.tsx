/* eslint-disable react-native/no-unused-styles */
import { DrawerActions, useIsFocused } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as React from 'react';
import {
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '../components/PrimaryButton';
import SubscriptionCard from '../components/SubscriptionCard';
import { useAuth } from '../contexts/AuthContext';
import {
  getAllSubscriptions,
  updateSubscription,
} from '../db/repositories/subscriptions.repo';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { colors } from '../theme/colors';
import {
  responsiveCardRadius,
  responsiveFont,
  responsiveMaxContentWidth,
  responsiveSpacing,
} from '../theme/layout';
import type { Subscription } from '../types/subscription';
import { rollForwardNextPayment } from '../utils/dateHelpers';
import { cancelReminder, scheduleReminder } from '../utils/notifications';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;
type SortOption = 'Price' | 'Next Payment' | 'Start Date';

type SectionItem = {
  title: string;
  data: Subscription[];
};

const SORT_OPTIONS: ReadonlyArray<SortOption> = ['Price', 'Next Payment', 'Start Date'];
const DAY_MS = 24 * 60 * 60 * 1000;

export default function HomeScreen({ navigation }: Props) {
  const [subscriptions, setSubscriptions] = React.useState<Subscription[]>([]);
  const [sortBy, setSortBy] = React.useState<SortOption>('Next Payment');
  const isFocused = useIsFocused();
  const { width } = useWindowDimensions();
  const styles = React.useMemo(() => createStyles(width), [width]);
  const { user } = useAuth();
  const menuHitSlop = React.useMemo(
    () => ({
      top: responsiveSpacing(0.6, width),
      bottom: responsiveSpacing(0.6, width),
      left: responsiveSpacing(0.6, width),
      right: responsiveSpacing(0.6, width),
    }),
    [width],
  );

  const loadData = React.useCallback(async () => {
    if (!user) {
      setSubscriptions([]);
      return;
    }
    try {
      const subs = await getAllSubscriptions(user.id);

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
              userId: sub.userId ?? user.id,
            };

            await updateSubscription(updatedSub);

            sub.nextPaymentDate = updatedSub.nextPaymentDate;
            sub.notificationId = updatedSub.notificationId;
            sub.userId = updatedSub.userId;
          } catch (innerErr) {
            if (newNotificationId) {
              await cancelReminder(newNotificationId);
            }
            throw innerErr;
          }
        }
      }

      const sorted = [...subs].sort((a, b) => {
        if (sortBy === 'Price') return b.price - a.price;
        if (sortBy === 'Start Date') {
          return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        }
        return (
          new Date(a.nextPaymentDate).getTime() - new Date(b.nextPaymentDate).getTime()
        );
      });

      setSubscriptions(sorted);
    } catch (err) {
      console.error('Failed to load subscriptions:', err);
    }
  }, [sortBy, user]);

  React.useEffect(() => {
    if (isFocused && user) {
      void loadData();
    }
  }, [isFocused, loadData, user]);

  React.useEffect(() => {
    if (!user) {
      setSubscriptions([]);
    }
  }, [user]);

  const sections = React.useMemo<SectionItem[]>(() => {
    const grouped = subscriptions.reduce<Record<string, Subscription[]>>((acc, sub) => {
      const cat = sub.category || 'Other';
      if (!acc[cat]) {
        acc[cat] = [];
      }
      acc[cat]!.push(sub);
      return acc;
    }, {});

    return Object.entries(grouped).map(([title, data]) => ({ title, data }));
  }, [subscriptions]);

  const totalMonthly = React.useMemo(
    () => subscriptions.reduce((sum, sub) => sum + estimateMonthlyCost(sub), 0),
    [subscriptions],
  );

  const upcoming = React.useMemo(() => {
    return [...subscriptions]
      .sort(
        (a, b) =>
          new Date(a.nextPaymentDate).getTime() - new Date(b.nextPaymentDate).getTime(),
      )
      .at(0);
  }, [subscriptions]);

  const listHeader = (
    <View style={styles.headerWrapper}>
      <View style={styles.topRow}>
        <Pressable
          style={styles.menuButton}
          hitSlop={menuHitSlop}
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        >
          <Text style={styles.menuIcon}>☰</Text>
        </Pressable>
        <View style={styles.titleBlock}>
          <Text style={styles.screenTitle}>Subscription hub</Text>
          <Text style={styles.screenSubtitle}>
            Master your renewals and keep your monthly budget happy.
          </Text>
        </View>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>Today’s snapshot</Text>
          <Text style={styles.summarySubtitle}>
            A clear view of what’s active, due, and costing you.
          </Text>
        </View>

        <View style={styles.metricGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Active services</Text>
            <Text style={styles.metricValue}>{subscriptions.length}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Monthly spend</Text>
            <Text style={styles.metricValue}>{`$${totalMonthly.toFixed(2)}`}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Next renewal</Text>
            <Text style={styles.metricValue}>
              {upcoming ? new Date(upcoming.nextPaymentDate).toLocaleDateString() : '—'}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.sortSection}>
          <Text style={styles.sortHeading}>Sort & focus</Text>
          <View style={styles.chipRow}>
            {SORT_OPTIONS.map((option) => {
              const active = sortBy === option;
              return (
                <Pressable
                  key={option}
                  style={[styles.sortChip, active && styles.sortChipActive]}
                  onPress={() => setSortBy(option)}
                >
                  <Text
                    style={[styles.sortChipLabel, active && styles.sortChipLabelActive]}
                  >
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {upcoming ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              if (upcoming.id == null) {
                return;
              }
              navigation.navigate('Details', { id: upcoming.id });
            }}
            style={({ pressed }) => [
              styles.upcomingCard,
              pressed && styles.upcomingCardPressed,
            ]}
          >
            <View style={styles.upcomingRow}>
              <Text style={styles.upcomingLabel}>Next up</Text>
              <Text style={styles.upcomingDate}>
                {new Date(upcoming.nextPaymentDate).toLocaleDateString()}
              </Text>
            </View>
            <Text style={styles.upcomingName}>{upcoming.name}</Text>
            <View style={styles.upcomingRow}>
              <Text style={styles.upcomingNote}>Tap to see details</Text>
              <Text style={styles.upcomingPrice}>{`$${upcoming.price.toFixed(2)}`}</Text>
            </View>
          </Pressable>
        ) : (
          <View style={[styles.upcomingCard, styles.upcomingEmpty]}>
            <Text style={styles.upcomingLabel}>No renewals pending</Text>
            <Text style={styles.upcomingEmptyText}>
              Add more services or tweak reminders to surface them here.
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <SectionList<Subscription, SectionItem>
        sections={sections}
        keyExtractor={(item, index) =>
          item.id != null ? item.id.toString() : `subscription-${index}`
        }
        renderItem={({ item }) => (
          <SubscriptionCard
            subscription={item}
            onPress={() => {
              const { id } = item;
              if (id == null) {
                return;
              }

              navigation.navigate('Details', { id });
            }}
            style={styles.subscriptionCard}
          />
        )}
        renderSectionHeader={({ section: { title } }) => (
          <View style={styles.sectionHeaderContainer}>
            <Text style={styles.sectionHeaderText}>{title}</Text>
          </View>
        )}
        ListHeaderComponent={listHeader}
        ListHeaderComponentStyle={styles.listHeaderSpacing}
        ListEmptyComponent={
          <Text style={styles.emptyStateText}>
            No subscriptions yet. Add one to get started.
          </Text>
        }
        contentContainerStyle={styles.listContent}
        style={styles.list}
      />

      <View style={styles.bottomBar}>
        <PrimaryButton
          label="Add subscription"
          onPress={() => navigation.navigate('AddSubscription')}
          style={styles.bottomButton}
        />
      </View>
    </SafeAreaView>
  );
}

function estimateMonthlyCost(sub: Subscription) {
  switch (sub.billingCycle) {
    case 'weekly':
      return (sub.price * 52) / 12;
    case 'yearly':
      return sub.price / 12;
    default:
      return sub.price;
  }
}

const createStyles = (width: number) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
      position: 'relative',
    },
    list: {
      flex: 1,
    },
    listContent: {
      paddingTop: responsiveSpacing(0.3, width),
      paddingBottom: responsiveSpacing(6.5, width),
      alignItems: 'stretch',
      paddingHorizontal: 0,
    },
    headerWrapper: {
      alignSelf: 'stretch',
      paddingHorizontal: responsiveSpacing(1.6, width),
      gap: responsiveSpacing(1.2, width),
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: responsiveSpacing(1.2, width),
    },
    menuButton: {
      width: responsiveSpacing(4.6, width),
      height: responsiveSpacing(4.6, width),
      borderRadius: responsiveSpacing(2.3, width),
      backgroundColor: colors.card,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#101828',
      shadowOpacity: 0.12,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 8 },
      elevation: 4,
    },
    menuIcon: {
      fontSize: responsiveFont(18, width),
      color: colors.text,
      fontFamily: 'PoppinsBold',
    },
    titleBlock: {
      flex: 1,
      gap: responsiveSpacing(0.5, width),
    },
    screenTitle: {
      fontFamily: 'PoppinsBold',
      color: colors.text,
      fontSize: responsiveFont(26, width),
      letterSpacing: -0.3,
    },
    screenSubtitle: {
      fontFamily: 'PoppinsRegular',
      color: colors.textSecondary,
      fontSize: responsiveFont(14, width),
      lineHeight: responsiveFont(20, width),
    },
    summaryCard: {
      width: '100%',
      maxWidth: responsiveMaxContentWidth(width),
      alignSelf: 'center',
      backgroundColor: colors.card,
      borderRadius: responsiveCardRadius(width),
      padding: responsiveSpacing(1.6, width),
      gap: responsiveSpacing(1.4, width),
      marginBottom: responsiveSpacing(0.4, width),
      shadowColor: '#101828',
      shadowOpacity: 0.12,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 12 },
      elevation: 5,
    },
    summaryHeader: {
      gap: responsiveSpacing(0.5, width),
    },
    summaryTitle: {
      fontFamily: 'PoppinsBold',
      color: colors.text,
      fontSize: responsiveFont(20, width),
      letterSpacing: 0.2,
    },
    summarySubtitle: {
      fontFamily: 'PoppinsRegular',
      color: colors.textSecondary,
      fontSize: responsiveFont(13, width),
      lineHeight: responsiveFont(18, width),
    },
    metricGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: responsiveSpacing(1, width),
    },
    metricCard: {
      flexBasis: '31%',
      flexGrow: 1,
      backgroundColor: `${colors.background}F2`,
      borderRadius: responsiveSpacing(1.2, width),
      paddingVertical: responsiveSpacing(1, width),
      paddingHorizontal: responsiveSpacing(1.1, width),
      gap: responsiveSpacing(0.4, width),
      borderWidth: 1,
      borderColor: `${colors.textSecondary}14`,
    },
    metricLabel: {
      fontFamily: 'PoppinsRegular',
      color: colors.textSecondary,
      fontSize: responsiveFont(11, width),
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    metricValue: {
      fontFamily: 'PoppinsBold',
      color: colors.text,
      fontSize: responsiveFont(18, width),
    },
    divider: {
      height: 1,
      backgroundColor: `${colors.textSecondary}14`,
      borderRadius: 1,
    },
    sortSection: {
      gap: responsiveSpacing(0.8, width),
    },
    sortHeading: {
      fontFamily: 'PoppinsBold',
      color: colors.textSecondary,
      fontSize: responsiveFont(12, width),
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: responsiveSpacing(0.8, width),
    },
    sortChip: {
      paddingVertical: responsiveSpacing(0.7, width),
      paddingHorizontal: responsiveSpacing(1.3, width),
      borderRadius: responsiveSpacing(1, width),
      backgroundColor: `${colors.background}F0`,
      borderWidth: 1,
      borderColor: `${colors.textSecondary}1f`,
    },
    sortChipActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    sortChipLabel: {
      fontFamily: 'PoppinsRegular',
      color: colors.text,
      fontSize: responsiveFont(14, width),
    },
    sortChipLabelActive: {
      fontFamily: 'PoppinsBold',
      color: colors.card,
    },
    upcomingCard: {
      backgroundColor: `${colors.accent}16`,
      borderRadius: responsiveCardRadius(width),
      padding: responsiveSpacing(1.2, width),
      gap: responsiveSpacing(0.6, width),
      borderWidth: 1,
      borderColor: `${colors.accent}33`,
    },
    upcomingCardPressed: {
      transform: [{ scale: 0.98 }],
      opacity: 0.9,
    },
    upcomingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    upcomingLabel: {
      fontFamily: 'PoppinsBold',
      color: colors.text,
      fontSize: responsiveFont(12, width),
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    upcomingDate: {
      fontFamily: 'PoppinsBold',
      color: colors.text,
      fontSize: responsiveFont(13, width),
    },
    upcomingName: {
      fontFamily: 'PoppinsBold',
      color: colors.text,
      fontSize: responsiveFont(18, width),
    },
    upcomingNote: {
      fontFamily: 'PoppinsRegular',
      color: colors.textSecondary,
      fontSize: responsiveFont(12, width),
    },
    upcomingPrice: {
      fontFamily: 'PoppinsBold',
      color: colors.accent,
      fontSize: responsiveFont(16, width),
    },
    upcomingEmpty: {
      backgroundColor: `${colors.background}F8`,
      borderStyle: 'dashed',
    },
    upcomingEmptyText: {
      fontFamily: 'PoppinsRegular',
      color: colors.textSecondary,
      fontSize: responsiveFont(12, width),
      lineHeight: responsiveFont(16, width),
    },
    sectionHeaderContainer: {
      alignSelf: 'stretch',
      paddingHorizontal: responsiveSpacing(1.6, width),
      paddingTop: responsiveSpacing(0.8, width),
      paddingBottom: responsiveSpacing(0.5, width),
    },
    sectionHeaderText: {
      fontFamily: 'PoppinsBold',
      color: colors.textSecondary,
      fontSize: responsiveFont(12, width),
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    emptyStateText: {
      textAlign: 'center',
      marginTop: responsiveSpacing(3, width),
      color: colors.textSecondary,
      fontFamily: 'PoppinsRegular',
      fontSize: responsiveFont(14, width),
      lineHeight: responsiveFont(20, width),
    },
    listHeaderSpacing: {
      marginBottom: responsiveSpacing(0.6, width),
    },
    subscriptionCard: {
      width: '100%',
      alignSelf: 'stretch',
      marginBottom: responsiveSpacing(0.8, width),
    },
    bottomBar: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: responsiveSpacing(1.6, width),
      paddingHorizontal: responsiveSpacing(1.6, width),
      alignItems: 'center',
    },
    bottomButton: {
      alignSelf: 'stretch',
      maxWidth: responsiveMaxContentWidth(width),
    },
  });
