/* eslint-disable react-native/no-unused-styles */
import { Picker } from '@react-native-picker/picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as React from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
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
import { addSubscription } from '../db/repositories/subscriptions.repo';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { colors } from '../theme/colors';
import {
  responsiveCardRadius,
  responsiveFont,
  responsiveMaxContentWidth,
  responsiveSpacing,
} from '../theme/layout';
import type { Subscription } from '../types/subscription';
import { calculateNextPayment } from '../utils/dateHelpers';
import { cancelReminder, scheduleReminder } from '../utils/notifications';

type Props = NativeStackScreenProps<RootStackParamList, 'AddSubscription'>;

export default function AddSubscriptionScreen({ navigation }: Props) {
  const [name, setName] = React.useState('');
  const [price, setPrice] = React.useState('');
  const [category, setCategory] = React.useState('Other');
  const [billingCycle, setBillingCycle] =
    React.useState<Subscription['billingCycle']>('monthly');
  const [startDate, setStartDate] = React.useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [reminderDaysBefore, setReminderDaysBefore] = React.useState<number>(1);

  const { width } = useWindowDimensions();
  const styles = React.useMemo(() => createStyles(width), [width]);
  const { user } = useAuth();

  const DAY_MS = 24 * 60 * 60 * 1000;

  const handleSave = async () => {
    if (!user) {
      Alert.alert('Session expired', 'Please log in again to add subscriptions.');
      return;
    }
    if (!name || !price) {
      Alert.alert('Validation', 'Please enter name and price');
      return;
    }

    let scheduledNotificationId: string | null = null;

    try {
      const numericPrice = parseFloat(price);
      if (Number.isNaN(numericPrice)) {
        Alert.alert('Validation', 'Please enter a valid number for price');
        return;
      }
      const start = startDate || new Date().toISOString();
      const nextPayment = calculateNextPayment(start, billingCycle);
      const reminderDays = reminderDaysBefore ?? 1;
      const triggerDate = new Date(
        new Date(nextPayment).getTime() - reminderDays * DAY_MS,
      );

      scheduledNotificationId =
        (await scheduleReminder(
          `sub-${Date.now()}`,
          `${name} renewal soon`,
          `Your ${name} subscription will renew at $${numericPrice.toFixed(2)}`,
          triggerDate,
        )) ?? null;

      await addSubscription({
        name,
        iconKey: getIconKeyForName(name),
        price: numericPrice,
        currency: 'USD',
        category,
        billingCycle,
        startDate: start,
        nextPaymentDate: nextPayment,
        notes: '',
        reminderDaysBefore: reminderDays,
        notificationId: scheduledNotificationId,
      });

      navigation.goBack();
    } catch (err) {
      if (scheduledNotificationId) {
        await cancelReminder(scheduledNotificationId);
      }
      console.error('Failed to add subscription:', err);
      Alert.alert('Error', 'Could not save subscription');
    }
  };

  const handleDateConfirm = (date: Date) => {
    setStartDate(date.toISOString());
    setShowDatePicker(false);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerGroup}>
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Text style={styles.backIcon}>←</Text>
            </Pressable>
            <View style={styles.headerText}>
              <Text style={styles.title}>Add New Subscription</Text>
              <Text style={styles.subtitle}>
                Keep track of every recurring payment with reminders and smart summaries.
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <TextInput
              style={styles.input}
              placeholder="Name (e.g. Netflix)"
              placeholderTextColor={colors.muted}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              returnKeyType="next"
            />

            <View style={styles.row}>
              <View style={styles.rowItem}>
                <Text style={styles.label}>Price</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor={colors.muted}
                  keyboardType="decimal-pad"
                  value={price}
                  onChangeText={setPrice}
                />
              </View>
              <View style={styles.rowItem}>
                <Text style={styles.label}>Remind me</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={reminderDaysBefore}
                    onValueChange={(val) => setReminderDaysBefore(val)}
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
                selectedValue={category}
                onValueChange={(value) => setCategory(value)}
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
                selectedValue={billingCycle}
                onValueChange={(value: Subscription['billingCycle']) =>
                  setBillingCycle(value)
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
                {startDate ? new Date(startDate).toDateString() : 'Pick a date'}
              </Text>
            </Pressable>
          </View>

          <PrimaryButton
            label="Save subscription"
            onPress={() => {
              void handleSave();
            }}
            style={styles.primaryButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <DateTimePickerModal
        isVisible={showDatePicker}
        mode="date"
        date={startDate ? new Date(startDate) : new Date()}
        onConfirm={handleDateConfirm}
        onCancel={() => setShowDatePicker(false)}
      />
    </SafeAreaView>
  );
}

const createStyles = (width: number) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    flex: { flex: 1 },
    container: { flex: 1 },
    contentContainer: {
      paddingHorizontal: responsiveSpacing(1.8, width),
      paddingBottom: responsiveSpacing(2.5, width),
      paddingTop: responsiveSpacing(1.5, width),
      alignItems: 'center',
      gap: responsiveSpacing(1.5, width),
    },
    headerGroup: {
      width: '100%',
      maxWidth: responsiveMaxContentWidth(width),
      flexDirection: 'row',
      alignItems: 'center',
      gap: responsiveSpacing(1, width),
      marginBottom: responsiveSpacing(0.8, width),
    },
    headerText: {
      flex: 1,
      gap: responsiveSpacing(0.4, width),
    },
    backButton: {
      width: responsiveSpacing(4.2, width),
      height: responsiveSpacing(4.2, width),
      borderRadius: responsiveSpacing(2.1, width),
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    backIcon: {
      fontSize: responsiveFont(18, width),
      color: colors.text,
      fontFamily: 'PoppinsBold',
    },
    title: {
      fontSize: responsiveFont(26, width),
      fontFamily: 'PoppinsBold',
      color: colors.text,
    },
    subtitle: {
      fontSize: responsiveFont(14, width),
      fontFamily: 'PoppinsRegular',
      color: colors.textSecondary,
      lineHeight: responsiveFont(20, width),
    },
    card: {
      width: '100%',
      maxWidth: responsiveMaxContentWidth(width),
      backgroundColor: colors.card,
      borderRadius: responsiveCardRadius(width),
      padding: responsiveSpacing(1.6, width),
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 8 },
      elevation: 2,
      gap: responsiveSpacing(1, width),
    },
    row: {
      flexDirection: 'row',
      gap: responsiveSpacing(1, width),
    },
    rowItem: { flex: 1 },
    input: {
      backgroundColor: `${colors.background}EE`,
      color: colors.text,
      paddingVertical: responsiveSpacing(1.1, width),
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
      letterSpacing: 0.5,
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
    primaryButton: {
      width: '100%',
      maxWidth: responsiveMaxContentWidth(width),
      marginTop: responsiveSpacing(0.5, width),
    },
  });
