/**
 * 위경도 거리 계산 (Haversine)
 * @returns 거리(km)
 */
export function haversineDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371 // Earth radius km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * 거리를 "약 1.2km" 형태 문자열로
 */
export function formatDistanceKm(km) {
  if (km == null || Number.isNaN(km)) return null
  if (km < 1) return `약 ${(km * 1000).toFixed(0)}m`
  return `약 ${km.toFixed(1)}km`
}

/** 같은 장소 그룹 키: statNm + 좌표(소수 5자리). */
export function placeKey(row) {
  const lat = Number(row.lat).toFixed(5)
  const lng = Number(row.lng).toFixed(5)
  return `${(row.statNm || '').trim()}|${lat}|${lng}`
}

/** 여러 값 요약 표시 (최대 2개 + 나머지 N). */
export function formatListSummary(arr, maxShow = 2) {
  if (!arr || arr.length === 0) return '-'
  const uniq = [...new Set(arr)].filter(Boolean)
  if (uniq.length <= maxShow) return uniq.join(' · ')
  return uniq.slice(0, maxShow).join(' · ') + ` +${uniq.length - maxShow}`
}
