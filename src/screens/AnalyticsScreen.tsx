/* eslint-disable react-native/no-unused-styles */
import type { DrawerScreenProps } from '@react-navigation/drawer';
import { DrawerActions, useFocusEffect } from '@react-navigation/native';
import * as React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import DonutChart, { type DonutChartSegment } from '../components/DonutChart';
import { useAuth } from '../contexts/AuthContext';
import { getAllSubscriptions } from '../db/repositories/subscriptions.repo';
import type { RootDrawerParamList } from '../navigation/RootNavigator';
import { colors } from '../theme/colors';
import {
  responsiveCardRadius,
  responsiveFont,
  responsiveMaxContentWidth,
  responsiveSpacing,
} from '../theme/layout';
import type { Subscription } from '../types/subscription';

const palette = [
  '#FFD338',
  '#111111',
  '#FFE27A',
  '#2D2D2D',
  '#FFF4C1',
  '#4F4F4F',
  '#FFB400',
  '#7A7A7A',
];

interface MonthlyEntry {
  id: number;
  name: string;
  category: string;
  currency: string;
  billingCycle: Subscription['billingCycle'];
  monthlyValue: number;
}

type Props = DrawerScreenProps<RootDrawerParamList, 'Analytics'>;

export default function AnalyticsScreen({ navigation }: Props) {
  const [subscriptions, setSubscriptions] = React.useState<Subscription[]>([]);
  const [loading, setLoading] = React.useState(false);
  const { width } = useWindowDimensions();
  const styles = React.useMemo(() => createStyles(width), [width]);
  const { user } = useAuth();
  const menuHitSlop = React.useMemo(
    () => ({
      top: responsiveSpacing(0.8, width),
      bottom: responsiveSpacing(0.8, width),
      left: responsiveSpacing(0.8, width),
      right: responsiveSpacing(0.8, width),
    }),
    [width],
  );
  const chartSize = React.useMemo(() => Math.min(width * 0.75, 280), [width]);

  const loadData = React.useCallback(async () => {
    if (!user) {
      setSubscriptions([]);
      return;
    }
    setLoading(true);
    try {
      const subs = await getAllSubscriptions(user.id);
      setSubscriptions(subs);
    } catch (error) {
      console.error('Failed to load analytics data', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const entries: MonthlyEntry[] = React.useMemo(() => {
    return subscriptions
      .filter((sub): sub is Subscription & { id: number } => typeof sub.id === 'number')
      .map((sub) => ({
        id: sub.id,
        name: sub.name,
        category: sub.category || 'Other',
        currency: sub.currency || 'USD',
        billingCycle: sub.billingCycle,
        monthlyValue: calculateMonthlyCost(sub),
      }))
      .filter((entry) => entry.monthlyValue > 0.0001);
  }, [subscriptions]);

  const totalMonthly = React.useMemo(
    () => entries.reduce((sum, entry) => sum + entry.monthlyValue, 0),
    [entries],
  );

  const sortedEntries = React.useMemo(
    () => [...entries].sort((a, b) => b.monthlyValue - a.monthlyValue),
    [entries],
  );

  const chartSegments: (DonutChartSegment & {
    currency: string;
    percentage: number;
  })[] = React.useMemo(() => {
    if (!sortedEntries.length || totalMonthly <= 0) return [];

    return sortedEntries.map((entry, index) => ({
      label: entry.name,
      value: entry.monthlyValue,
      color: palette[index % palette.length],
      currency: entry.currency,
      percentage: (entry.monthlyValue / totalMonthly) * 100,
    }));
  }, [sortedEntries, totalMonthly]);

  const primaryCurrency = sortedEntries[0]?.currency || 'USD';
  const averageMonthly = sortedEntries.length ? totalMonthly / sortedEntries.length : 0;
  const highestEntry = sortedEntries[0] ?? null;

  const categoryBreakdown = React.useMemo(() => {
    const map = new Map<string, number>();
    sortedEntries.forEach((entry) => {
      map.set(entry.category, (map.get(entry.category) || 0) + entry.monthlyValue);
    });

    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [sortedEntries]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Pressable
            style={styles.menuButton}
            hitSlop={menuHitSlop}
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          >
            <Text style={styles.menuIcon}>☰</Text>
          </Pressable>
          <View style={styles.headerTextGroup}>
            <Text style={styles.headerTitle}>Analytics</Text>
            <Text style={styles.description}>
              Track your recurring spending with beautiful charts and category breakdowns.
            </Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, styles.summaryWide]}>
            <Text style={styles.summaryLabel}>Monthly total</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(totalMonthly, primaryCurrency)}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Active subs</Text>
            <Text style={styles.summaryValue}>{sortedEntries.length}</Text>
          </View>
          <View style={[styles.summaryCard, styles.summaryCardLast]}>
            <Text style={styles.summaryLabel}>Avg / sub</Text>
            <Text style={styles.summaryValue}>
              {sortedEntries.length
                ? formatCurrency(averageMonthly, primaryCurrency)
                : '—'}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Spending breakdown</Text>
          {loading ? (
            <Text style={styles.hint}>Loading…</Text>
          ) : chartSegments.length ? (
            <>
              <View style={styles.chartWrapper}>
                <DonutChart
                  data={chartSegments}
                  total={totalMonthly}
                  innerLabel="Total"
                  innerValue={formatCurrency(totalMonthly, primaryCurrency)}
                  size={chartSize}
                />
              </View>
              <View>
                {chartSegments.map((segment, index) => (
                  <View
                    style={[
                      styles.legendRow,
                      index === chartSegments.length - 1 ? null : styles.legendRowSpacing,
                    ]}
                    key={`${segment.label}-${index}`}
                  >
                    <View
                      style={[styles.legendSwatch, { backgroundColor: segment.color }]}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.legendLabel}>{segment.label}</Text>
                      <Text style={styles.legendMeta}>
                        {formatCurrency(segment.value, segment.currency)} ·{' '}
                        {segment.percentage.toFixed(1)}%
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <Text style={styles.hint}>
              Add subscriptions to see a spending breakdown.
            </Text>
          )}
        </View>

        {categoryBreakdown.length ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Top categories</Text>
            {categoryBreakdown.map(([category, value], index) => {
              const percent = totalMonthly > 0 ? (value / totalMonthly) * 100 : 0;
              return (
                <View
                  style={[
                    styles.categoryRow,
                    index === categoryBreakdown.length - 1
                      ? null
                      : styles.categoryRowSpacing,
                  ]}
                  key={`${category}-${index}`}
                >
                  <View style={styles.categoryHeader}>
                    <Text style={styles.categoryName}>{category}</Text>
                    <Text style={styles.categoryValue}>
                      {formatCurrency(value, primaryCurrency)}
                    </Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${Math.min(Math.max(percent, 1), 100)}%`,
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        ) : null}

        {highestEntry ? (
          <View style={styles.highlightCard}>
            <Text style={styles.cardTitle}>Most expensive</Text>
            <Text style={styles.highlightName}>{highestEntry.name}</Text>
            <Text style={styles.highlightValue}>
              {formatCurrency(highestEntry.monthlyValue, highestEntry.currency)}
            </Text>
            <Text style={styles.highlightHint}>
              {highestEntry.category} · {formatBillingCycle(highestEntry.billingCycle)}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function calculateMonthlyCost(subscription: Subscription) {
  const price = subscription.price || 0;
  switch (subscription.billingCycle) {
    case 'weekly':
      return (price * 52) / 12;
    case 'yearly':
      return price / 12;
    case 'custom':
      return price;
    default:
      return price;
  }
}

function formatCurrency(value: number, currency: string) {
  if (!isFinite(value)) return '—';
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

function formatBillingCycle(cycle: Subscription['billingCycle']) {
  switch (cycle) {
    case 'weekly':
      return 'renews weekly';
    case 'yearly':
      return 'renews yearly';
    case 'custom':
      return 'custom schedule';
    default:
      return 'renews monthly';
  }
}

const createStyles = (width: number) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    contentContainer: {
      paddingBottom: responsiveSpacing(3, width),
      paddingHorizontal: responsiveSpacing(1.6, width),
      paddingTop: responsiveSpacing(1, width),
      gap: responsiveSpacing(1.6, width),
      alignItems: 'center',
    },
    headerRow: {
      flexDirection: 'row',
      gap: responsiveSpacing(1.2, width),
      alignItems: 'flex-start',
      width: '100%',
      maxWidth: responsiveMaxContentWidth(width),
    },
    menuButton: {
      width: responsiveSpacing(4.5, width),
      height: responsiveSpacing(4.5, width),
      borderRadius: responsiveSpacing(2.25, width),
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 6 },
      elevation: 2,
    },
    menuIcon: {
      fontSize: responsiveFont(18, width),
      color: colors.text,
      fontFamily: 'PoppinsBold',
    },
    headerTextGroup: { flex: 1, gap: responsiveSpacing(0.6, width) },
    headerTitle: {
      fontSize: responsiveFont(26, width),
      fontFamily: 'PoppinsBold',
      color: colors.text,
    },
    description: {
      fontSize: responsiveFont(14, width),
      fontFamily: 'PoppinsRegular',
      color: colors.textSecondary,
      lineHeight: responsiveFont(20, width),
    },
    summaryRow: {
      flexDirection: 'row',
      gap: responsiveSpacing(1, width),
      width: '100%',
      maxWidth: responsiveMaxContentWidth(width),
    },
    summaryCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: responsiveCardRadius(width),
      padding: responsiveSpacing(1, width),
      gap: responsiveSpacing(0.4, width),
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
      elevation: 1,
    },
    summaryWide: { flex: 1.2 },
    summaryCardLast: { alignItems: 'flex-start' },
    summaryLabel: {
      fontFamily: 'PoppinsRegular',
      color: colors.textSecondary,
      fontSize: responsiveFont(12, width),
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    summaryValue: {
      fontFamily: 'PoppinsBold',
      fontSize: responsiveFont(18, width),
      color: colors.text,
    },
    card: {
      width: '100%',
      maxWidth: responsiveMaxContentWidth(width),
      backgroundColor: colors.card,
      borderRadius: responsiveCardRadius(width),
      padding: responsiveSpacing(1.4, width),
      gap: responsiveSpacing(1, width),
      shadowColor: '#000',
      shadowOpacity: 0.04,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
      elevation: 1,
    },
    cardTitle: {
      fontFamily: 'PoppinsBold',
      fontSize: responsiveFont(16, width),
      color: colors.text,
    },
    hint: {
      fontFamily: 'PoppinsRegular',
      fontSize: responsiveFont(13, width),
      color: colors.textSecondary,
    },
    chartWrapper: {
      alignSelf: 'center',
    },
    legendRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: responsiveSpacing(0.9, width),
    },
    legendRowSpacing: {
      marginBottom: responsiveSpacing(0.6, width),
    },
    legendSwatch: {
      width: responsiveSpacing(1.4, width),
      height: responsiveSpacing(1.4, width),
      borderRadius: responsiveSpacing(0.7, width),
    },
    legendLabel: {
      fontFamily: 'PoppinsBold',
      fontSize: responsiveFont(14, width),
      color: colors.text,
    },
    legendMeta: {
      fontFamily: 'PoppinsRegular',
      fontSize: responsiveFont(12, width),
      color: colors.textSecondary,
    },
    categoryRow: {
      gap: responsiveSpacing(0.5, width),
    },
    categoryRowSpacing: {
      marginBottom: responsiveSpacing(0.8, width),
    },
    categoryHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    categoryName: {
      fontFamily: 'PoppinsBold',
      color: colors.text,
      fontSize: responsiveFont(14, width),
    },
    categoryValue: {
      fontFamily: 'PoppinsRegular',
      color: colors.textSecondary,
      fontSize: responsiveFont(13, width),
    },
    progressBar: {
      height: responsiveSpacing(0.7, width),
      backgroundColor: `${colors.muted}33`,
      borderRadius: responsiveSpacing(0.5, width),
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: colors.accent,
      borderRadius: responsiveSpacing(0.5, width),
    },
    highlightCard: {
      width: '100%',
      maxWidth: responsiveMaxContentWidth(width),
      backgroundColor: `${colors.accent}15`,
      borderRadius: responsiveCardRadius(width),
      padding: responsiveSpacing(1.6, width),
      gap: responsiveSpacing(0.6, width),
    },
    highlightName: {
      fontFamily: 'PoppinsBold',
      fontSize: responsiveFont(18, width),
      color: colors.accent,
    },
    highlightValue: {
      fontFamily: 'PoppinsBold',
      fontSize: responsiveFont(22, width),
      color: colors.text,
    },
    highlightHint: {
      fontFamily: 'PoppinsRegular',
      fontSize: responsiveFont(13, width),
      color: colors.textSecondary,
    },
  });
