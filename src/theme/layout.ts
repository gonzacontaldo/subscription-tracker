import { Dimensions } from 'react-native';

const { width: initialWidth } = Dimensions.get('window');

export const breakpoints = {
  phone: 0,
  tablet: 768,
  desktop: 1024,
} as const;

type BreakpointKey = keyof typeof breakpoints;

export function getBreakpoint(width: number): BreakpointKey {
  if (width >= breakpoints.desktop) return 'desktop';
  if (width >= breakpoints.tablet) return 'tablet';
  return 'phone';
}

export function responsiveSpacing(multiplier = 1, width = initialWidth) {
  const bp = getBreakpoint(width);
  const base = bp === 'desktop' ? 20 : bp === 'tablet' ? 16 : 12;
  return base * multiplier;
}

export function responsiveFont(size: number, width = initialWidth) {
  const bp = getBreakpoint(width);
  const factor = bp === 'desktop' ? 1.15 : bp === 'tablet' ? 1.05 : 1;
  return Math.round(size * factor);
}

export function responsiveCardRadius(width = initialWidth) {
  const bp = getBreakpoint(width);
  return bp === 'desktop' ? 20 : bp === 'tablet' ? 16 : 12;
}

export function responsiveMaxContentWidth(width = initialWidth) {
  const bp = getBreakpoint(width);
  return bp === 'desktop'
    ? Math.min(width * 0.6, 720)
    : bp === 'tablet'
      ? Math.min(width * 0.75, 640)
      : width;
}
