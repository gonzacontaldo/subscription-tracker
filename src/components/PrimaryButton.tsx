import * as React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import type { ViewStyle } from 'react-native';

import { colors } from '../theme/colors';
import { responsiveFont, responsiveSpacing } from '../theme/layout';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void | Promise<void>;
  icon?: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  disabled?: boolean;
}

export function PrimaryButton({
  label,
  onPress,
  icon,
  style,
  disabled,
}: PrimaryButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        const result = onPress();
        if (result instanceof Promise) {
          void result;
        }
      }}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
      disabled={disabled}
    >
      {icon}
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.accent,
    paddingVertical: responsiveSpacing(1.25),
    paddingHorizontal: responsiveSpacing(2),
    borderRadius: responsiveSpacing(1.3),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: responsiveSpacing(0.75),
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  label: {
    color: colors.accentSecondary,
    fontFamily: 'PoppinsBold',
    fontSize: responsiveFont(16),
    letterSpacing: 0.3,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    backgroundColor: colors.muted,
    shadowOpacity: 0,
  },
});
