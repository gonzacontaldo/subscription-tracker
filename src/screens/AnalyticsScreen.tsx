import type { DrawerScreenProps } from '@react-navigation/drawer';
import { DrawerActions, useFocusEffect } from '@react-navigation/native';
import * as React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import DonutChart, { type DonutChartSegment } from '../components/DonutChart';
import { getAllSubscriptions } from '../db/repositories/subscriptions.repo';
import type { RootDrawerParamList } from '../navigation/RootNavigator';
import { colors } from '../theme/colors';
import type { Subscription } from '../types/subscription';

const palette = [
  '#27AE60',
  '#2D9CDB',
  '#F2994A',
  '#9B59B6',
  '#EB5757',
  '#6FCF97',
  '#F2C94C',
  '#BB6BD9',
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

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const subs = await getAllSubscriptions();
      setSubscriptions(subs);
    } catch (error) {
      console.error('Failed to load analytics data', error);
    } finally {
      setLoading(false);
    }
  }, []);

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

  const primaryCurrency = React.useMemo(() => {
    return sortedEntries[0]?.currency || 'USD';
  }, [sortedEntries]);

  const averageMonthly = React.useMemo(() => {
    if (!sortedEntries.length) return 0;
    return totalMonthly / sortedEntries.length;
  }, [sortedEntries.length, totalMonthly]);

  const highestEntry = React.useMemo(() => {
    if (!sortedEntries.length) return null;
    return sortedEntries[0];
  }, [sortedEntries]);

  const categoryBreakdown = React.useMemo(() => {
    const map = new Map<string, number>();
    sortedEntries.forEach((entry) => {
      map.set(entry.category, (map.get(entry.category) || 0) + entry.monthlyValue);
    });

    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [sortedEntries]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Pressable
          style={styles.menuButton}
          onPress={() => navigation.getParent()?.dispatch(DrawerActions.openDrawer())}
        >
          <Text style={styles.menuIcon}>☰</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Analytics</Text>
      </View>

      <Text style={styles.description}>
        Track how much you’re spending across subscriptions and which ones dominate your
        budget.
      </Text>

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
            {sortedEntries.length ? formatCurrency(averageMonthly, primaryCurrency) : '—'}
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
          <Text style={styles.hint}>Add subscriptions to see a spending breakdown.</Text>
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
        <View style={styles.card}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
    fontSize: 22,
    fontFamily: 'PoppinsBold',
    color: colors.text,
  },
  description: {
    fontFamily: 'PoppinsRegular',
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    marginRight: -12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    justifyContent: 'center',
    marginRight: 12,
    marginBottom: 12,
    minWidth: 140,
  },
  summaryWide: {
    flex: 1.2,
  },
  summaryCardLast: {
    marginRight: 0,
  },
  summaryLabel: {
    fontFamily: 'PoppinsRegular',
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 4,
  },
  summaryValue: {
    fontFamily: 'PoppinsBold',
    color: colors.text,
    fontSize: 18,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  cardTitle: {
    fontFamily: 'PoppinsBold',
    color: colors.text,
    fontSize: 16,
    marginBottom: 12,
  },
  chartWrapper: {
    alignItems: 'center',
    marginBottom: 16,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendRowSpacing: {
    marginBottom: 12,
  },
  legendSwatch: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  legendLabel: {
    fontFamily: 'PoppinsBold',
    color: colors.text,
    fontSize: 14,
  },
  legendMeta: {
    fontFamily: 'PoppinsRegular',
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  hint: {
    fontFamily: 'PoppinsRegular',
    color: colors.textSecondary,
    fontSize: 14,
  },
  categoryRow: {
    marginBottom: 0,
  },
  categoryRowSpacing: {
    marginBottom: 14,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryName: {
    fontFamily: 'PoppinsBold',
    color: colors.text,
    fontSize: 14,
  },
  categoryValue: {
    fontFamily: 'PoppinsBold',
    color: colors.text,
    fontSize: 14,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.background,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
  },
  highlightName: {
    fontFamily: 'PoppinsBold',
    fontSize: 18,
    color: colors.text,
    marginBottom: 4,
  },
  highlightValue: {
    fontFamily: 'PoppinsBold',
    fontSize: 16,
    color: colors.accent,
    marginBottom: 4,
  },
  highlightHint: {
    fontFamily: 'PoppinsRegular',
    fontSize: 12,
    color: colors.textSecondary,
  },
});
