/**
 * 생활안전지도(Safemap) 전기차충전소 API
 * 문서: https://www.safemap.go.kr/opna/data/dataViewRenew.do?objtId=118
 */

import { webMercatorToLatLng } from '../utils/coordTransform.js'

const SAFEMAP_BASE =
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_SAFEMAP_API_BASE
    ? import.meta.env.VITE_SAFEMAP_API_BASE.replace(/\/$/, '')
    : 'https://www.safemap.go.kr'
const SAFEMAP_EV_LIST_PATH = '/openapi2/IF_0042'
const SAFEMAP_EV_LIST_URL = `${SAFEMAP_BASE}${SAFEMAP_EV_LIST_PATH}`

/** chger_ty 코드 → 한글 라벨 */
export const CHGER_TY_LABELS = {
  1: 'DC차데모',
  2: 'AC완속',
  3: 'DC차데모+AC3상',
  4: 'DC콤보',
  5: 'DC차데모+DC콤보',
  6: 'DC차데모+AC3상+DC콤보',
  7: 'AC3상',
  8: 'DC콤보(완속)',
  9: 'NACS',
  10: 'DC콤보+NACS',
}

export function getChgerTyLabel(code) {
  const c = code != null ? String(code).trim() : ''
  return CHGER_TY_LABELS[c] ?? `타입${c || '?'}`
}

/**
 * API 원본 항목을 앱에서 쓰는 형태로 정규화.
 * x,y는 Web Mercator일 수 있으므로 WGS84(lat,lng)로 변환 후 반환.
 */
function get(obj, ...keys) {
  for (const k of keys) {
    if (obj[k] != null && obj[k] !== '') return obj[k]
  }
  return ''
}

export function normalizeCharger(item, index) {
  if (!item || typeof item !== 'object') return null
  const rawX = item.x ?? item.X
  const rawY = item.y ?? item.Y
  const converted = webMercatorToLatLng(rawX, rawY)
  if (!converted) {
    console.warn(
      '[Safemap EV] 좌표 변환 실패, 마커 제외:',
      get(item, 'stat_nm', 'statNm', 'stat_id', 'statId') || index,
      { x: rawX, y: rawY }
    )
    return null
  }
  const chgerTyCode = get(item, 'chger_ty', 'chgerTy') || ''
  return {
    id: get(item, 'chger_id', 'chgerId', 'objt_id', 'objtId') || `ev-${index}`,
    statId: get(item, 'stat_id', 'statId'),
    statNm: get(item, 'stat_nm', 'statNm') || '이름 없음',
    chgerId: get(item, 'chger_id', 'chgerId'),
    chgerTy: chgerTyCode,
    chgerTyLabel: getChgerTyLabel(chgerTyCode),
    useTm: get(item, 'use_tm', 'useTm'),
    busiId: get(item, 'busi_id', 'busiId'),
    busiNm: get(item, 'busi_nm', 'busiNm') || '-',
    telno: get(item, 'telno'),
    adres: get(item, 'adres', 'rn_adres', 'rnAdres'),
    rnAdres: get(item, 'rn_adres', 'rnAdres'),
    ctprvnCd: get(item, 'ctprvn_cd', 'ctprvnCd'),
    sggCd: get(item, 'sgg_cd', 'sggCd'),
    emdCd: get(item, 'emd_cd', 'emdCd'),
    lat: converted.lat,
    lng: converted.lng,
  }
}

/**
 * 한 페이지 조회
 */
export async function fetchEvChargersPage({ pageNo = 1, numOfRows = 100 } = {}) {
  const key = import.meta.env.VITE_SAFEMAP_SERVICE_KEY
  if (!key) throw new Error('VITE_SAFEMAP_SERVICE_KEY가 설정되지 않았습니다. .env 또는 .env.local을 확인하세요.')
  const base = SAFEMAP_EV_LIST_URL.replace(/\?$/, '')
  const rest = new URLSearchParams({
    pageNo: String(pageNo),
    numOfRows: String(numOfRows),
    returnType: 'json',
  }).toString()
  const url = `${base}?serviceKey=${encodeURIComponent(key)}&${rest}`
  const res = await fetch(url)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Safemap API 오류: ${res.status} ${res.statusText}. ${text.slice(0, 200)}`)
  }
  const data = await res.json()
  return data
}

/**
 * 응답에서 목록 배열 추출 (JSON 구조에 따라 유연하게)
 */
function extractListFromResponse(data) {
  if (!data) return []
  const body = data.response?.body ?? data.body ?? data
  const items = body.items ?? body.item ?? (Array.isArray(body) ? body : [])
  const list = Array.isArray(items) ? items : items.item ? [].concat(items.item) : []
  return list
}

/**
 * 전체 데이터 로드 (페이지네이션 순회).
 * totalCount가 있으면 그만큼만, 없으면 1페이지만.
 */
export async function fetchEvChargers({ pageNo = 1, numOfRows = 100, maxPages = 50 } = {}) {
  const all = []
  let page = pageNo
  let totalCount = null

  while (page <= maxPages) {
    const data = await fetchEvChargersPage({ pageNo: page, numOfRows })
    if (import.meta.env.DEV && page === 1) {
      console.log('[Safemap EV] API 응답 구조(1페이지):', data)
    }
    const list = extractListFromResponse(data)
    const total = data.response?.body?.totalCount ?? data.body?.totalCount ?? data.totalCount
    if (total != null) totalCount = Number(total)
    list.forEach((item, i) => {
      const normalized = normalizeCharger(item, all.length + i)
      if (normalized) all.push(normalized)
    })
    if (list.length < numOfRows) break
    if (totalCount != null && all.length >= totalCount) break
    page += 1
  }

  return { items: all, totalCount: totalCount ?? all.length }
}
