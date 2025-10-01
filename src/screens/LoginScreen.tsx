/* eslint-disable react-native/no-unused-styles */
import * as React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme/colors';
import { responsiveFont, responsiveSpacing } from '../theme/layout';

const EMAIL_REGEX = /.+@.+\..+/;

type Mode = 'signin' | 'signup';

export default function LoginScreen() {
  const { login, register, lastEmail, initializing } = useAuth();
  const [mode, setMode] = React.useState<Mode>('signin');
  const [email, setEmail] = React.useState(lastEmail ?? '');
  const [password, setPassword] = React.useState('');
  const [displayName, setDisplayName] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const { width } = useWindowDimensions();
  const styles = React.useMemo(() => createStyles(width), [width]);

  React.useEffect(() => {
    setEmail(lastEmail ?? '');
  }, [lastEmail]);

  const toggleMode = React.useCallback(() => {
    setError(null);
    setMode((prev) => (prev === 'signin' ? 'signup' : 'signin'));
  }, []);

  const handleSubmit = React.useCallback(async () => {
    if (loading) return;

    const trimmedEmail = email.trim();
    const trimmedDisplayName = displayName.trim();

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!password) {
      setError('Password is required');
      return;
    }

    if (mode === 'signup' && trimmedDisplayName.length < 2) {
      setError('Please add a display name to personalise your account');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (mode === 'signin') {
        await login(trimmedEmail, password);
      } else {
        await register({
          email: trimmedEmail,
          password,
          displayName: trimmedDisplayName,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [displayName, email, login, mode, password, register, loading]);

  const heading = mode === 'signin' ? 'Welcome back' : 'Create your space';
  const subtitle =
    mode === 'signin'
      ? 'Log in to keep an eye on every upcoming renewal.'
      : 'Let’s get you set up with smart reminders and spend tracking.';

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.card}>
          <Text style={styles.heading}>{heading}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder="you@example.com"
              placeholderTextColor={colors.muted}
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              returnKeyType="next"
            />
          </View>

          {mode === 'signup' ? (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Display name</Text>
              <TextInput
                placeholder="Your name"
                placeholderTextColor={colors.muted}
                value={displayName}
                onChangeText={setDisplayName}
                style={styles.input}
                autoCapitalize="words"
              />
            </View>
          ) : null}

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor={colors.muted}
              value={password}
              onChangeText={setPassword}
              style={styles.input}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <PrimaryButton
            label={mode === 'signin' ? 'Log in' : 'Create account'}
            onPress={handleSubmit}
            disabled={loading || initializing}
            style={styles.submitButton}
          />

          <Pressable onPress={toggleMode} style={styles.switchModeButton}>
            <Text style={styles.switchModeLabel}>
              {mode === 'signin'
                ? 'New here? Create an account'
                : 'Already have an account? Log in'}
            </Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color={colors.accent} size="large" />
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (width: number) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
      padding: responsiveSpacing(2, width),
      alignItems: 'center',
      justifyContent: 'center',
    },
    flex: {
      width: '100%',
      maxWidth: 420,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: responsiveSpacing(1.5, width),
      padding: responsiveSpacing(2, width),
      gap: responsiveSpacing(1.2, width),
      shadowColor: colors.accentSecondary,
      shadowOpacity: 0.1,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 12 },
      elevation: 4,
    },
    heading: {
      fontFamily: 'PoppinsBold',
      color: colors.text,
      fontSize: responsiveFont(26, width),
    },
    subtitle: {
      fontFamily: 'PoppinsRegular',
      color: colors.textSecondary,
      fontSize: responsiveFont(14, width),
      lineHeight: responsiveFont(20, width),
    },
    fieldGroup: {
      gap: responsiveSpacing(0.6, width),
    },
    label: {
      fontFamily: 'PoppinsBold',
      color: colors.text,
      fontSize: responsiveFont(13, width),
    },
    input: {
      backgroundColor: `${colors.background}F5`,
      borderRadius: responsiveSpacing(1, width),
      paddingHorizontal: responsiveSpacing(1.2, width),
      paddingVertical: responsiveSpacing(0.9, width),
      fontFamily: 'PoppinsRegular',
      fontSize: responsiveFont(14, width),
      borderWidth: 1,
      borderColor: `${colors.textSecondary}20`,
      color: colors.text,
    },
    error: {
      fontFamily: 'PoppinsRegular',
      color: colors.danger,
      fontSize: responsiveFont(12, width),
    },
    submitButton: {
      marginTop: responsiveSpacing(0.5, width),
    },
    switchModeButton: {
      alignSelf: 'center',
      marginTop: responsiveSpacing(1, width),
    },
    switchModeLabel: {
      fontFamily: 'PoppinsBold',
      color: colors.accent,
      fontSize: responsiveFont(13, width),
    },
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#00000022',
      borderRadius: responsiveSpacing(1.5, width),
    },
  });
