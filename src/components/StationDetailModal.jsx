import { Dialog, DialogTitle, DialogContent, IconButton, Typography, Box, Button, useMediaQuery } from '@mui/material'
import Close from '@mui/icons-material/Close'
import Directions from '@mui/icons-material/Directions'
import Phone from '@mui/icons-material/Phone'
import { colors } from '../theme/dashboardTheme.js'
import { getStatLabel } from '../api/safemapEv.js'

/**
 * 충전소 상세. 모바일에서는 하단 시트형(중앙 팝업 아님), 데스크탑에서는 중앙 Dialog.
 * station: 그룹(rows, totalChargers, statCounts, latestStatUpdDt) 또는 단일 row.
 */
export function StationDetailModal({ open, station, onClose }) {
  const isMobile = useMediaQuery('(max-width: 900px)', { noSsr: true })

  if (!station) return null

  const address = station.adres || station.rnAdres || '-'
  const telno = station.telno?.trim() || ''
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}`

  const totalChargers = station.totalChargers ?? (station.rows ? station.rows.length : 1)
  const statCounts = station.statCounts ?? (station.stat != null && station.stat !== '' ? { [String(station.stat)]: 1 } : {})
  const latestStatUpdDt = station.latestStatUpdDt ?? (station.statUpdDt || '')
  const statOrder = ['2', '3', '5', '4', '1', '9']

  const content = (
    <>
      {totalChargers > 0 && (
        <Box sx={{ mb: 1.5, p: 1.25, borderRadius: 1, bgcolor: colors.gray[50], border: `1px solid ${colors.gray[200]}` }}>
          <Typography variant="caption" sx={{ color: colors.gray[500], fontWeight: 600, display: 'block', mb: 0.5 }}>충전기 현황</Typography>
          <Typography variant="body2" sx={{ color: colors.gray[800], fontWeight: 600 }}>총 {totalChargers}대</Typography>
          {Object.keys(statCounts).length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 0.75 }}>
              {[...statOrder, ...Object.keys(statCounts).filter((c) => !statOrder.includes(c))].filter((code) => statCounts[code] > 0).map((code) => (
                <Typography key={code} variant="caption" sx={{ color: colors.gray[700], fontSize: '0.8125rem' }}>
                  {getStatLabel(code)} {statCounts[code]}대
                </Typography>
              ))}
            </Box>
          )}
          {latestStatUpdDt && (
            <Typography variant="caption" sx={{ color: colors.gray[500], display: 'block', mt: 0.5 }}>상태 갱신: {latestStatUpdDt}</Typography>
          )}
        </Box>
      )}
      <Box sx={{ mb: 1.5 }}>
        <Typography variant="caption" sx={{ color: colors.gray[500], fontWeight: 600, display: 'block', mb: 0.25 }}>주소</Typography>
        <Typography variant="body2" sx={{ color: colors.gray[800], lineHeight: 1.5, wordBreak: 'break-all', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {address}
        </Typography>
      </Box>
      <Box sx={{ mb: 1.5 }}>
        <Typography variant="caption" sx={{ color: colors.gray[500], fontWeight: 600, display: 'block', mb: 0.25 }}>이용시간</Typography>
        <Typography variant="body2" sx={{ color: colors.gray[800] }}>{station.useTm || '-'}</Typography>
      </Box>
      <Box sx={{ py: 1, borderTop: `1px solid ${colors.gray[200]}`, borderBottom: `1px solid ${colors.gray[200]}`, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        <Typography variant="body2" sx={{ color: colors.gray[600], fontSize: '0.8125rem' }}><strong>운영기관</strong> {station.busiNm}</Typography>
        <Typography variant="body2" sx={{ color: colors.gray[600], fontSize: '0.8125rem' }}><strong>충전기</strong> {station.displayChgerLabel ?? station.chgerTyLabel}</Typography>
        {telno && <Typography variant="body2" sx={{ color: colors.gray[600], fontSize: '0.8125rem' }}><strong>전화</strong> {telno}</Typography>}
      </Box>
      <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 1, mt: 2, pt: 1 }}>
        <Button
          variant="contained"
          startIcon={<Directions />}
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ flex: 1, minHeight: 48, py: 1.25, bgcolor: colors.blue.primary, fontWeight: 600, fontSize: isMobile ? '0.9375rem' : undefined, '&:hover': { bgcolor: colors.blue.deep } }}
        >
          길찾기
        </Button>
        {telno && (
          <Button
            variant="outlined"
            startIcon={<Phone />}
            href={`tel:${telno}`}
            sx={{ flex: 1, minHeight: 48, py: 1.25, borderColor: colors.gray[400], color: colors.gray[700], fontWeight: 600, fontSize: isMobile ? '0.9375rem' : undefined }}
          >
            전화
          </Button>
        )}
      </Box>
    </>
  )

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      fullScreen={false}
      sx={
        isMobile
          ? {
              '& .MuiDialog-container': { alignItems: 'flex-end' },
              '& .MuiDialog-paper': { margin: 0, maxHeight: '85vh', borderRadius: '16px 16px 0 0', boxShadow: '0 -4px 24px rgba(0,0,0,0.12)' },
            }
          : undefined
      }
      slotProps={{ backdrop: { sx: isMobile ? { bgcolor: 'rgba(0,0,0,0.4)' } : {} } }}
    >
      {isMobile && <Box sx={{ height: 4, bgcolor: colors.gray[300], borderRadius: 2, mx: 'auto', mt: 1, width: 40, flexShrink: 0 }} aria-hidden />}
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          pr: 1,
          pt: isMobile ? 0.5 : 1.5,
          pb: 1.5,
          borderBottom: `1px solid ${colors.gray[200]}`,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, color: colors.gray[800], fontSize: '1rem' }}>
          {station.statNm}
        </Typography>
        <IconButton onClick={onClose} aria-label="닫기" size="small" sx={{ color: colors.gray[600] }}>
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 1.5, pb: isMobile ? 3 : 2, px: 2 }}>{content}</DialogContent>
    </Dialog>
  )
}
