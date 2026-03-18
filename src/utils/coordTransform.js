/**
 * Web Mercator (EPSG:3857) 좌표를 WGS84(lat, lng)로 변환.
 * Leaflet은 WGS84 기준이므로 지도 표시 전 변환 필요.
 */
export function webMercatorToLatLng(x, y) {
  const numX = Number(x)
  const numY = Number(y)
  if (Number.isNaN(numX) || Number.isNaN(numY)) return null
  // 이미 WGS84 범위(경도 -180~180, 위도 -90~90)면 변환 생략
  if (Math.abs(numX) <= 180 && Math.abs(numY) <= 90) {
    return { lat: numY, lng: numX }
  }
  const R = 6378137
  const maxExtent = 20037508.34
  const lng = (numX / maxExtent) * 180
  let lat = (numY / maxExtent) * 180
  lat =
    (180 / Math.PI) *
    (2 * Math.atan(Math.exp((lat * Math.PI) / 180)) - Math.PI / 2)
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null
  return { lat, lng }
}
