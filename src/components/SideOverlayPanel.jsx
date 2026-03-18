import { Box } from '@mui/material'
import { glass, spacing } from '../theme/dashboardTheme.js'

const GLASS_PADDING = 24
const GLASS_RADIUS = 24

/**
 * 지도 위 블롱 UI. MuiBox-root 단일 컨테이너, padding 24px / border-radius 24px 고정.
 */
export function SideOverlayPanel({
  side = 'left',
  children,
  sx = {},
  width = 320,
  mobileHeight = '45vh',
  mobilePosition = 'top',
  ...rest
}) {
  return (
    <Box
      className="ev-glass-overlay"
      sx={{
        ...glass.panel,
        borderRadius: GLASS_RADIUS,
        padding: GLASS_PADDING,
        position: 'absolute',
        top: spacing.lg,
        bottom: spacing.lg,
        [side]: spacing.lg,
        width: width,
        maxWidth: 'calc(100vw - 24px)',
        zIndex: 1000,
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.lg,
        transition: 'background 0.2s ease, box-shadow 0.2s ease',
        '&:hover': glass.panelHover,
        '@media (max-width: 900px)': {
          left: spacing.lg,
          right: spacing.lg,
          width: 'auto',
          maxHeight: mobileHeight,
          minHeight: 240,
          ...(mobilePosition === 'top'
            ? { top: spacing.lg, bottom: 'auto' }
            : { top: 'auto', bottom: spacing.lg }),
        },
        ...sx,
      }}
      {...rest}
    >
      {children}
    </Box>
  )
}
