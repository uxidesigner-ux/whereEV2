import { Box, Typography } from '@mui/material'
import { colors } from '../theme/dashboardTheme.js'
import { formatDistanceKm } from '../utils/geo.js'

/**
 * 모바일 시트용 충전소 목록. 정렬된 배열을 받아 표시.
 * emptyMessage / emptySubMessage: 목록이 비었을 때 문구 (scope 기준 정합성용).
 */
export function StationListMobile({ stations = [], selectedId, onSelect, emptyMessage, emptySubMessage }) {
  if (!stations.length) {
    return (
      <Box sx={{ py: 2.5, px: 1, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
          {emptyMessage ?? '조건에 맞는 충전소가 없습니다.'}
        </Typography>
        {emptySubMessage && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
            {emptySubMessage}
          </Typography>
        )}
      </Box>
    )
  }
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {stations.map((s) => {
        const isSelected = selectedId != null && s.id === selectedId
        return (
          <Box
            key={s.id}
            component="button"
            type="button"
            onClick={() => onSelect(s)}
            sx={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              p: 1.5,
              minHeight: 56,
              borderRadius: 1.5,
              border: `2px solid ${isSelected ? colors.blue.primary : colors.gray[200]}`,
              bgcolor: isSelected ? colors.blue.muted : '#fff',
              boxShadow: isSelected ? '0 2px 8px rgba(37,99,235,0.15)' : '0 1px 3px rgba(0,0,0,0.06)',
              cursor: 'pointer',
              transition: 'background 0.15s, border-color 0.15s, box-shadow 0.15s',
              '&:hover': { bgcolor: isSelected ? colors.blue.muted : colors.gray[50], borderColor: colors.gray[300], boxShadow: '0 2px 6px rgba(0,0,0,0.08)' },
              '&:active': { bgcolor: colors.gray[100] },
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: '0.9375rem', color: colors.gray[800], lineHeight: 1.35 }}>
              {s.statNm}
            </Typography>
            <Typography variant="body2" sx={{ color: colors.gray[600], fontSize: '0.8125rem', display: 'block', mt: 0.5 }}>
              {s.busiNm} · {s.chgerTyLabel}
            </Typography>
            {(s.totalChargers != null && s.totalChargers > 0) && (
              <Typography variant="caption" sx={{ color: colors.gray[600], fontSize: '0.75rem', display: 'block', mt: 0.375 }}>
                총 {s.totalChargers}대{s.statSummary ? ` · ${s.statSummary}` : ''}
              </Typography>
            )}
            {s.distanceKm != null && (
              <Typography variant="caption" sx={{ color: colors.gray[500], fontSize: '0.75rem', display: 'block', mt: 0.25 }}>
                {formatDistanceKm(s.distanceKm)}
              </Typography>
            )}
          </Box>
        )
      })}
    </Box>
  )
}
