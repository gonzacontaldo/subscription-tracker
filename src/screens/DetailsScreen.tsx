/* eslint-disable react-native/no-unused-styles */
import { Picker } from '@react-native-picker/picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as React from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '../components/PrimaryButton';
import { categories } from '../constants/categories';
import { getIconKeyForName } from '../constants/icons';
import { useAuth } from '../contexts/AuthContext';
import {
  deleteSubscription,
  getSubscriptionById,
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
import { calculateNextPayment, rollForwardNextPayment } from '../utils/dateHelpers';
import { cancelReminder, scheduleReminder } from '../utils/notifications';

type Props = NativeStackScreenProps<RootStackParamList, 'Details'>;

export default function DetailsScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const [sub, setSub] = React.useState<Subscription | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [editing, setEditing] = React.useState(false);
  const [showDatePicker, setShowDatePicker] = React.useState(false);

  const { width } = useWindowDimensions();
  const styles = React.useMemo(() => createStyles(width), [width]);
  const DAY_MS = 24 * 60 * 60 * 1000;
  const { user } = useAuth();

  React.useEffect(() => {
    if (!user) return;
    void (async () => {
      try {
        const result = await getSubscriptionById(Number(id), user.id);
        setSub(result);
      } catch (err) {
        console.error('Failed to load subscription:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, user]);

  const handleUpdate = async () => {
    if (!sub || !user) return;

    let newNotificationId: string | null = null;

    try {
      if (sub.notificationId) {
        await cancelReminder(sub.notificationId);
      }

      const baseNextPayment = calculateNextPayment(sub.startDate, sub.billingCycle);
      const nextPayment = rollForwardNextPayment(
        sub.startDate,
        sub.billingCycle,
        baseNextPayment,
      );

      const reminderDays = sub.reminderDaysBefore ?? 1;
      const triggerDate = new Date(
        new Date(nextPayment).getTime() - reminderDays * DAY_MS,
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
        iconKey: getIconKeyForName(sub.name),
        nextPaymentDate: nextPayment,
        notificationId: newNotificationId,
        userId: user.id,
      };

      await updateSubscription(updatedSub);

      setSub(updatedSub);
      setEditing(false);
      Alert.alert('Success', 'Subscription updated');
    } catch (err) {
      if (newNotificationId) {
        await cancelReminder(newNotificationId);
      }
      console.error('Update failed:', err);
      Alert.alert('Error', 'Could not update subscription');
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    try {
      if (sub?.notificationId) {
        await cancelReminder(sub.notificationId);
      }
      await deleteSubscription(Number(id), user.id);
      Alert.alert('Deleted', 'Subscription removed');
      navigation.goBack();
    } catch (err) {
      console.error('Delete failed:', err);
      Alert.alert('Error', 'Could not delete subscription');
    }
  };

  const handleDateConfirm = (date: Date) => {
    if (!sub) return;
    setSub({ ...sub, startDate: date.toISOString() });
    setShowDatePicker(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!sub) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Subscription not found ❌</Text>
      </View>
    );
  }

  const nextPaymentDate = new Date(sub.nextPaymentDate);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Text style={styles.backIcon}>←</Text>
            </Pressable>
            <View style={styles.headerInfo}>
              <Text style={styles.name}>{sub.name}</Text>
              <Text style={styles.summaryText}>
                Next payment on {nextPaymentDate.toDateString()} • Reminder{' '}
                {sub.reminderDaysBefore ?? 1} day(s) before
              </Text>
            </View>
            <Text style={styles.price}>
              {sub.currency} {sub.price.toFixed(2)}
            </Text>
          </View>
          <View style={styles.tagRow}>
            <Text style={styles.tag}>{sub.category || 'Other'}</Text>
            <Text style={styles.tag}>{sub.billingCycle}</Text>
          </View>
        </View>

        {editing ? (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Details</Text>
            <TextInput
              style={styles.input}
              value={sub.name}
              onChangeText={(t) => setSub({ ...sub, name: t })}
            />

            <View style={styles.row}>
              <View style={styles.rowItem}>
                <Text style={styles.label}>Price</Text>
                <TextInput
                  style={styles.input}
                  value={String(sub.price)}
                  keyboardType="decimal-pad"
                  onChangeText={(t) => setSub({ ...sub, price: parseFloat(t) || 0 })}
                />
              </View>
              <View style={styles.rowItem}>
                <Text style={styles.label}>Reminder</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={sub.reminderDaysBefore ?? 1}
                    onValueChange={(val) =>
                      setSub({ ...sub, reminderDaysBefore: Number(val) })
                    }
                    style={styles.picker}
                  >
                    <Picker.Item label="1 day before" value={1} />
                    <Picker.Item label="2 days before" value={2} />
                    <Picker.Item label="3 days before" value={3} />
                    <Picker.Item label="1 week before" value={7} />
                  </Picker>
                </View>
              </View>
            </View>

            <Text style={styles.label}>Category</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={sub.category}
                onValueChange={(val) => setSub({ ...sub, category: val })}
                style={styles.picker}
              >
                {categories.map((cat) => (
                  <Picker.Item key={cat} label={cat} value={cat} />
                ))}
              </Picker>
            </View>

            <Text style={styles.label}>Billing Cycle</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={sub.billingCycle}
                onValueChange={(val: Subscription['billingCycle']) =>
                  setSub({ ...sub, billingCycle: val })
                }
                style={styles.picker}
              >
                <Picker.Item label="Monthly" value="monthly" />
                <Picker.Item label="Yearly" value="yearly" />
                <Picker.Item label="Weekly" value="weekly" />
                <Picker.Item label="Custom" value="custom" />
              </Picker>
            </View>

            <Text style={styles.label}>Start Date</Text>
            <Pressable onPress={() => setShowDatePicker(true)} style={styles.input}>
              <Text style={styles.inputText}>
                {sub.startDate ? new Date(sub.startDate).toDateString() : 'Pick a date'}
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Timeline</Text>
            <View style={styles.lineItem}>
              <Text style={styles.detailLabel}>Start date</Text>
              <Text style={styles.detailValue}>
                {new Date(sub.startDate).toDateString()}
              </Text>
            </View>
            <View style={styles.lineItem}>
              <Text style={styles.detailLabel}>Next payment</Text>
              <Text style={styles.detailValue}>{nextPaymentDate.toDateString()}</Text>
            </View>
          </View>
        )}

        <View style={styles.actionsRow}>
          <PrimaryButton
            label={editing ? 'Save changes' : 'Edit subscription'}
            onPress={() => {
              if (editing) {
                void handleUpdate();
              } else {
                setEditing(true);
              }
            }}
            style={styles.primaryButton}
          />
          <Pressable
            style={styles.secondaryButton}
            onPress={() => {
              void handleDelete();
            }}
          >
            <Text style={styles.secondaryButtonText}>Delete</Text>
          </Pressable>
        </View>
      </ScrollView>

      <DateTimePickerModal
        isVisible={showDatePicker}
        mode="date"
        date={sub.startDate ? new Date(sub.startDate) : new Date()}
        onConfirm={handleDateConfirm}
        onCancel={() => setShowDatePicker(false)}
      />
    </SafeAreaView>
  );
}

const createStyles = (width: number) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    contentContainer: {
      paddingHorizontal: responsiveSpacing(1.8, width),
      paddingBottom: responsiveSpacing(2.5, width),
      paddingTop: responsiveSpacing(1.5, width),
      alignItems: 'center',
      gap: responsiveSpacing(1.6, width),
    },
    headerCard: {
      width: '100%',
      maxWidth: responsiveMaxContentWidth(width),
      backgroundColor: colors.card,
      borderRadius: responsiveCardRadius(width),
      padding: responsiveSpacing(1.6, width),
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 10 },
      elevation: 3,
      gap: responsiveSpacing(0.9, width),
    },
    backButton: {
      width: responsiveSpacing(4.2, width),
      height: responsiveSpacing(4.2, width),
      borderRadius: responsiveSpacing(2.1, width),
      backgroundColor: `${colors.background}EE`,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 3 },
      elevation: 2,
    },
    backIcon: {
      fontFamily: 'PoppinsBold',
      fontSize: responsiveFont(18, width),
      color: colors.text,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: responsiveSpacing(1, width),
    },
    headerInfo: {
      flex: 1,
      gap: responsiveSpacing(0.4, width),
    },
    name: {
      fontSize: responsiveFont(24, width),
      fontFamily: 'PoppinsBold',
      color: colors.text,
    },
    price: {
      fontSize: responsiveFont(20, width),
      fontFamily: 'PoppinsBold',
      color: colors.accent,
    },
    summaryText: {
      fontSize: responsiveFont(12, width),
      fontFamily: 'PoppinsRegular',
      color: colors.textSecondary,
      lineHeight: responsiveFont(18, width),
    },
    tagRow: {
      flexDirection: 'row',
      gap: responsiveSpacing(0.8, width),
    },
    tag: {
      paddingVertical: responsiveSpacing(0.4, width),
      paddingHorizontal: responsiveSpacing(0.9, width),
      borderRadius: responsiveSpacing(1.2, width),
      backgroundColor: `${colors.accent}15`,
      color: colors.accent,
      fontFamily: 'PoppinsBold',
      fontSize: responsiveFont(12, width),
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    card: {
      width: '100%',
      maxWidth: responsiveMaxContentWidth(width),
      backgroundColor: colors.card,
      borderRadius: responsiveCardRadius(width),
      padding: responsiveSpacing(1.5, width),
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 8 },
      elevation: 2,
      gap: responsiveSpacing(1, width),
    },
    sectionLabel: {
      fontFamily: 'PoppinsBold',
      fontSize: responsiveFont(14, width),
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    row: {
      flexDirection: 'row',
      gap: responsiveSpacing(1, width),
    },
    rowItem: { flex: 1 },
    input: {
      backgroundColor: `${colors.background}EE`,
      color: colors.text,
      paddingVertical: responsiveSpacing(1.05, width),
      paddingHorizontal: responsiveSpacing(1.2, width),
      borderRadius: responsiveSpacing(1, width),
      fontFamily: 'PoppinsRegular',
      fontSize: responsiveFont(15, width),
      borderWidth: 1,
      borderColor: `${colors.muted}55`,
    },
    inputText: {
      fontFamily: 'PoppinsRegular',
      fontSize: responsiveFont(15, width),
      color: colors.text,
    },
    label: {
      fontFamily: 'PoppinsBold',
      color: colors.textSecondary,
      marginBottom: responsiveSpacing(0.4, width),
      fontSize: responsiveFont(12, width),
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    pickerWrapper: {
      backgroundColor: `${colors.background}F2`,
      borderRadius: responsiveSpacing(1, width),
      borderWidth: 1,
      borderColor: `${colors.muted}55`,
      overflow: 'hidden',
    },
    picker: { color: colors.text },
    lineItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: responsiveSpacing(0.6, width),
      borderBottomWidth: 1,
      borderBottomColor: `${colors.muted}33`,
    },
    detailLabel: {
      fontFamily: 'PoppinsRegular',
      color: colors.textSecondary,
      fontSize: responsiveFont(13, width),
    },
    detailValue: {
      fontFamily: 'PoppinsBold',
      color: colors.text,
      fontSize: responsiveFont(14, width),
    },
    actionsRow: {
      width: '100%',
      maxWidth: responsiveMaxContentWidth(width),
      gap: responsiveSpacing(1, width),
    },
    primaryButton: {
      width: '100%',
    },
    secondaryButton: {
      marginTop: responsiveSpacing(0.4, width),
      paddingVertical: responsiveSpacing(1, width),
      borderRadius: responsiveSpacing(1, width),
      alignItems: 'center',
      borderWidth: 1,
      borderColor: `${colors.danger}99`,
      backgroundColor: `${colors.danger}10`,
    },
    secondaryButtonText: {
      fontFamily: 'PoppinsBold',
      color: colors.danger,
      fontSize: responsiveFont(15, width),
      letterSpacing: 0.4,
    },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    error: {
      color: colors.danger,
      fontSize: responsiveFont(16, width),
      fontFamily: 'PoppinsBold',
    },
  });
