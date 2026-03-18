import 'leaflet/dist/leaflet.css'
import { useMemo, useState, useEffect } from 'react'
import {
  Box,
  Typography,
  createTheme,
  ThemeProvider,
  CssBaseline,
  CircularProgress,
  Alert,
  useMediaQuery,
} from '@mui/material'
import EvStationIcon from '@mui/icons-material/EvStation'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts'
import { fetchEvChargers } from './api/safemapEv.js'
import { colors, spacing, radius, chartBlueScale, glass } from './theme/dashboardTheme.js'
import { GlassPanel } from './components/GlassPanel.jsx'
import { StatCard } from './components/StatCard.jsx'
import { SideOverlayPanel } from './components/SideOverlayPanel.jsx'
import { FilterSelect } from './components/FilterSelect.jsx'

const SEOUL_CENTER = [37.5665, 126.978]

const muiTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: colors.blue.primary },
    secondary: { main: colors.blue.deep },
    background: { default: colors.gray[100] },
    text: { primary: colors.gray[800], secondary: colors.gray[500] },
  },
  typography: {
    fontFamily: '"Inter", "Noto Sans KR", system-ui, sans-serif',
    h6: { fontWeight: 600, color: colors.gray[800] },
    body2: { color: colors.gray[600] },
    caption: { color: colors.gray[500] },
  },
  shape: { borderRadius: radius.control },
})

L.Marker.prototype.options.icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [22, 36],
  iconAnchor: [11, 36],
})

function MapView({ stations }) {
  return (
    <>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {stations.map((s) => (
        <Marker key={s.id} position={[s.lat, s.lng]}>
          <Popup maxWidth={320}>
            <Box component="div" sx={{ fontFamily: muiTheme.typography.fontFamily }}>
              <Typography variant="subtitle2" sx={{ color: colors.blue.primary, fontWeight: 600, mb: 0.5 }}>
                {s.statNm}
              </Typography>
              <Typography variant="caption" display="block" sx={{ color: colors.gray[600] }}>
                운영기관 {s.busiNm} · {s.chgerTyLabel}
              </Typography>
              <Typography variant="caption" display="block" sx={{ color: colors.gray[500], mt: 0.5 }}>
                이용시간 {s.useTm || '-'} · 전화 {s.telno || '-'}
              </Typography>
              <Typography variant="caption" display="block" sx={{ color: colors.gray[500] }}>
                {s.adres || s.rnAdres || '-'}
              </Typography>
            </Box>
          </Popup>
        </Marker>
      ))}
    </>
  )
}

function App() {
  const [items, setItems] = useState([])
  const [totalCount, setTotalCount] = useState(null)
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState(null)
  const [filterBusiNm, setFilterBusiNm] = useState('')
  const [filterChgerTy, setFilterChgerTy] = useState('')
  const [filterCtprvnCd, setFilterCtprvnCd] = useState('')
  const [filterSggCd, setFilterSggCd] = useState('')
  const isMobile = useMediaQuery('(max-width: 900px)')

  useEffect(() => {
    const key = import.meta.env.VITE_SAFEMAP_SERVICE_KEY
    if (!key) {
      setApiError('VITE_SAFEMAP_SERVICE_KEY를 .env 또는 .env.local에 설정해 주세요.')
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setApiError(null)
    fetchEvChargers({ pageNo: 1, numOfRows: 200, maxPages: 3 })
      .then(({ items: list, totalCount: total }) => {
        if (cancelled) return
        setItems(list)
        setTotalCount(total)
      })
      .catch((err) => {
        if (!cancelled) setApiError(err.message || '데이터를 불러오지 못했습니다.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const filteredItems = useMemo(() => {
    return items.filter((s) => {
      if (filterBusiNm && s.busiNm !== filterBusiNm) return false
      if (filterChgerTy && String(s.chgerTy) !== filterChgerTy) return false
      if (filterCtprvnCd && s.ctprvnCd !== filterCtprvnCd) return false
      if (filterSggCd && s.sggCd !== filterSggCd) return false
      return true
    })
  }, [items, filterBusiNm, filterChgerTy, filterCtprvnCd, filterSggCd])

  const kpis = useMemo(() => {
    const operators = new Set(filteredItems.map((s) => s.busiNm).filter(Boolean))
    const stations = new Set(filteredItems.map((s) => s.statId).filter(Boolean))
    const byType = {}
    filteredItems.forEach((s) => {
      const label = s.chgerTyLabel
      byType[label] = (byType[label] || 0) + 1
    })
    return {
      totalChargers: filteredItems.length,
      operatorCount: operators.size,
      stationCount: stations.size,
      byChgerTy: Object.entries(byType).map(([name, count]) => ({ name, count })),
    }
  }, [filteredItems])

  const operatorChartData = useMemo(() => {
    const count = {}
    filteredItems.forEach((s) => {
      const n = s.busiNm || '(미지정)'
      count[n] = (count[n] || 0) + 1
    })
    return Object.entries(count)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
  }, [filteredItems])

  const filterOptions = useMemo(() => {
    const busiNms = [...new Set(items.map((s) => s.busiNm).filter(Boolean))].sort()
    const chgerTys = [...new Set(items.map((s) => String(s.chgerTy)).filter(Boolean))].sort()
    const ctprvnCds = [...new Set(items.map((s) => s.ctprvnCd).filter(Boolean))].sort()
    const sggCds = [...new Set(items.map((s) => s.sggCd).filter(Boolean))].sort()
    return {
      busiNms: busiNms.map((v) => ({ value: v, label: v })),
      chgerTys: chgerTys.map((v) => ({
        value: v,
        label: items.find((s) => String(s.chgerTy) === v)?.chgerTyLabel ?? v,
      })),
      ctprvnCds: ctprvnCds.map((v) => ({ value: v, label: v })),
      sggCds: sggCds.map((v) => ({ value: v, label: v })),
    }
  }, [items])

  if (loading) {
    return (
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: colors.gray[100],
            zIndex: 2000,
          }}
        >
          <GlassPanel elevation="panel" sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <CircularProgress size={32} sx={{ color: colors.blue.primary }} />
            <Typography variant="body2" color="text.secondary">
              충전소 데이터 불러오는 중
            </Typography>
          </GlassPanel>
        </Box>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <Box
        sx={{
          position: 'relative',
          width: '100vw',
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        {/* Full-screen map */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            zIndex: 0,
          }}
        >
          <MapContainer
            center={SEOUL_CENTER}
            zoom={11}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom
          >
            <MapView stations={filteredItems} />
          </MapContainer>
        </Box>

        {/* Global error */}
        {apiError && (
          <Box
            sx={{
              position: 'absolute',
              top: spacing.lg,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1100,
              minWidth: 320,
              maxWidth: '90vw',
            }}
          >
            <Alert
              severity="error"
              sx={{
                ...glass.panel,
                borderRadius: radius.glass,
              }}
            >
              {apiError}
            </Alert>
          </Box>
        )}

        {/* Left overlay: title, KPI, filters */}
        <SideOverlayPanel side="left" width={isMobile ? 280 : 300}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
            <EvStationIcon sx={{ fontSize: 20, color: colors.blue.primary }} />
            <Typography variant="h6" sx={{ fontSize: '0.9375rem', fontWeight: 600, color: colors.gray[800] }}>
              EV 충전소 인프라 현황
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: colors.gray[500], display: 'block', mb: 1 }}>
            생활안전지도 API · 마커 클릭 시 상세
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
            <StatCard label="전체 충전기" value={kpis.totalChargers} />
            <StatCard label="운영기관 수" value={kpis.operatorCount} />
            <StatCard label="충전소 수" value={kpis.stationCount} />
            <StatCard label="충전기 타입" value={kpis.byChgerTy.length} />
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <FilterSelect
              label="운영기관"
              value={filterBusiNm}
              onChange={(e) => setFilterBusiNm(e.target.value)}
              options={filterOptions.busiNms}
            />
            <FilterSelect
              label="충전기 타입"
              value={filterChgerTy}
              onChange={(e) => setFilterChgerTy(e.target.value)}
              options={filterOptions.chgerTys}
            />
            <FilterSelect
              label="시도코드"
              value={filterCtprvnCd}
              onChange={(e) => setFilterCtprvnCd(e.target.value)}
              options={filterOptions.ctprvnCds}
            />
            <FilterSelect
              label="시군구코드"
              value={filterSggCd}
              onChange={(e) => setFilterSggCd(e.target.value)}
              options={filterOptions.sggCds}
            />
          </Box>
          <Typography variant="caption" sx={{ color: colors.gray[500] }}>
            표시 {filteredItems.length}건
            {totalCount != null && totalCount !== items.length && ` · 전체 약 ${totalCount}건`}
          </Typography>
        </SideOverlayPanel>

        {/* Right overlay: charts */}
        <SideOverlayPanel side="right" width={isMobile ? 280 : 340} mobilePosition="bottom" mobileHeight="48vh">
          <Typography variant="subtitle2" sx={{ color: colors.gray[600], fontWeight: 600 }}>
            운영기관별 충전기 (Top 10)
          </Typography>
          <Box sx={{ width: '100%', height: 220, minHeight: 180 }}>
            {operatorChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={operatorChartData}
                    layout="vertical"
                    margin={{ top: 4, right: 12, left: 60, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="2 2" stroke={colors.gray[200]} horizontal={false} />
                    <XAxis type="number" allowDecimals={false} stroke={colors.gray[400]} tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" width={56} tick={{ fontSize: 10 }} stroke={colors.gray[500]} />
                    <Tooltip
                      formatter={(v) => [`${v}대`, '']}
                      contentStyle={{
                        borderRadius: radius.control,
                        border: `1px solid ${colors.gray[200]}`,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      }}
                    />
                    <Bar dataKey="value" name="충전기" radius={[0, 3, 3, 0]}>
                      {operatorChartData.map((_, i) => (
                        <Cell key={i} fill={chartBlueScale[i % chartBlueScale.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
              <Typography variant="caption" sx={{ color: colors.gray[500], py: 3, display: 'block', textAlign: 'center' }}>
                필터 결과 없음
              </Typography>
            )}
          </Box>

          <Typography variant="subtitle2" sx={{ color: colors.gray[600], fontWeight: 600, mt: 1 }}>
            충전기 타입 분포
          </Typography>
          <Box sx={{ width: '100%', height: 200, minHeight: 160 }}>
            {kpis.byChgerTy.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={kpis.byChgerTy}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={1}
                  >
                      {kpis.byChgerTy.map((_, i) => (
                        <Cell key={i} fill={chartBlueScale[i % chartBlueScale.length]} stroke="rgba(255,255,255,0.6)" strokeWidth={1} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v) => [`${v}대`, '']}
                      contentStyle={{
                        borderRadius: radius.control,
                        border: `1px solid ${colors.gray[200]}`,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 10 }} iconSize={8} />
                  </PieChart>
                </ResponsiveContainer>
            ) : (
              <Typography variant="caption" sx={{ color: colors.gray[500], py: 2, display: 'block', textAlign: 'center' }}>
                데이터 없음
              </Typography>
            )}
          </Box>
        </SideOverlayPanel>
      </Box>
    </ThemeProvider>
  )
}

export default App
