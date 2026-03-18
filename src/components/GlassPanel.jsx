import { Box } from '@mui/material'
import { glass, radius } from '../theme/dashboardTheme.js'

/**
 * Liquid glass 스타일 패널.
 * 반투명 배경, backdrop blur, subtle border/shadow, 둥근 모서리.
 */
/** Liquid glass: 내부 패딩·radius는 24px 고정 (상위에서 p 적용 시 spacing.glass 사용) */
export function GlassPanel({ children, sx = {}, elevation = 'panel', ...rest }) {
  const base = elevation === 'card' ? glass.card : glass.panel
  const borderRadius = radius.glass
  return (
    <Box
      sx={{
        ...base,
        borderRadius,
        transition: 'background 0.2s ease, box-shadow 0.2s ease',
        '&:hover': elevation === 'panel' ? glass.panelHover : undefined,
        ...sx,
      }}
      {...rest}
    >
      {children}
    </Box>
  )
}
