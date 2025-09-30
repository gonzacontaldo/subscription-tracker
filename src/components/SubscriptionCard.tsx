/* eslint-disable react-native/no-unused-styles */
import * as React from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
  useWindowDimensions,
} from 'react-native';

import { subscriptionIcons } from '../constants/icons';
import { colors } from '../theme/colors';
import { responsiveCardRadius, responsiveFont, responsiveSpacing } from '../theme/layout';
import type { Subscription } from '../types/subscription';
import { daysUntil } from '../utils/dateHelpers';

type Props = {
  subscription: Subscription;
  onPress: () => void;
  style?: ViewStyle;
};

export default function SubscriptionCard({ subscription, onPress, style }: Props) {
  const { width } = useWindowDimensions();
  const styles = React.useMemo(() => createStyles(width), [width]);
  const iconSource =
    subscription.iconKey && subscriptionIcons[subscription.iconKey]
      ? subscriptionIcons[subscription.iconKey]
      : subscriptionIcons.default;
  return (
    <Pressable style={[styles.card, style]} onPress={onPress}>
      <View style={styles.iconWrapper}>
        <Image source={iconSource} style={styles.icon} />
      </View>
      <View style={styles.content}>
        <Text style={styles.name}>{subscription.name}</Text>
        <Text style={styles.category}>{subscription.category}</Text>
        <Text style={styles.nextPayment}>
          Next Payment in {daysUntil(subscription.nextPaymentDate)} days
        </Text>
      </View>
      <View>
        <Text style={styles.price}>
          {subscription.currency} {subscription.price.toFixed(2)}
        </Text>
      </View>
    </Pressable>
  );
}

const createStyles = (width: number) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: responsiveCardRadius(width),
      padding: responsiveSpacing(1.4, width),
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 8 },
      elevation: 3,
      flexDirection: 'row',
      alignItems: 'center',
      gap: responsiveSpacing(1.1, width),
    },
    iconWrapper: {
      width: responsiveSpacing(4.6, width),
      height: responsiveSpacing(4.6, width),
      borderRadius: responsiveSpacing(2.3, width),
      backgroundColor: `${colors.accent}18`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    icon: {
      width: responsiveSpacing(2.8, width),
      height: responsiveSpacing(2.8, width),
      resizeMode: 'contain',
    },
    content: { flex: 1 },
    name: {
      fontSize: responsiveFont(16, width),
      fontFamily: 'PoppinsBold',
      color: colors.text,
    },
    category: {
      fontSize: responsiveFont(13, width),
      fontFamily: 'PoppinsRegular',
      color: colors.textSecondary,
      marginTop: responsiveSpacing(0.2, width),
    },
    nextPayment: {
      fontSize: responsiveFont(13, width),
      fontFamily: 'PoppinsRegular',
      color: colors.muted,
      marginTop: responsiveSpacing(0.3, width),
    },
    price: {
      fontSize: responsiveFont(17, width),
      fontFamily: 'PoppinsBold',
      color: colors.accent,
    },
  });
