import { Typography } from '@mui/material'
import { GlassPanel } from './GlassPanel.jsx'
import { colors, spacing } from '../theme/dashboardTheme.js'

/**
 * KPI용 미니멀 스탯 카드. 숫자 강조(blue), 라벨 보조(gray).
 */
export function StatCard({ label, value, sx = {} }) {
  return (
    <GlassPanel elevation="card" sx={{ p: spacing.glass, ...sx }}>
      <Typography
        variant="caption"
        sx={{
          color: colors.gray[500],
          fontWeight: 500,
          letterSpacing: '0.02em',
          display: 'block',
          mb: 0.25,
        }}
      >
        {label}
      </Typography>
      <Typography
        variant="h5"
        component="span"
        sx={{
          color: colors.blue.primary,
          fontWeight: 700,
          letterSpacing: '-0.02em',
        }}
      >
        {value}
      </Typography>
    </GlassPanel>
  )
}
