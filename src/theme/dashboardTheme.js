/**
 * EV 대시보드 디자인 시스템
 * Gray + White 기반, Single Blue 포인트 컬러
 */
export const colors = {
  // Blue scale (primary accent)
  blue: {
    primary: '#2563eb',
    light: '#3b82f6',
    lighter: '#60a5fa',
    pale: '#93c5fd',
    deep: '#1d4ed8',
    muted: 'rgba(37, 99, 235, 0.12)',
  },
  // Gray scale
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  white: '#ffffff',
  black: '#0a0a0a',
}

/** liquid glass: 배경 투명도 20% */
export const glass = {
  panel: {
    background: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.25)',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
  },
  panelHover: {
    background: 'rgba(255, 255, 255, 0.28)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)',
  },
  card: {
    background: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.25)',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
  },
}

export const spacing = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  xxl: 24,
  /** liquid glass 컴포넌트 내부 패딩 고정 */
  glass: 24,
  panel: 24,
  card: 12,
  control: 10,
}

export const radius = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 12,
  xl: 16,
  /** liquid glass 컴포넌트 border-radius 고정 */
  glass: 24,
  panel: 24,
  card: 24,
  control: 6,
  full: 9999,
}

export const chartBlueScale = [
  colors.blue.primary,
  colors.blue.light,
  colors.blue.lighter,
  colors.blue.pale,
  colors.blue.deep,
  '#1e40af',
]
