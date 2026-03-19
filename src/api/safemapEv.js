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

/** chger_ty 코드 → 한글 라벨 (기술 용어) */
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

/** chger_ty 코드 → 사용자 용어 (급속/완속). AC·완속 계열=완속, DC·NACS 계열=급속. */
export const CHGER_TY_TO_SPEED = {
  1: '급속',   // DC차데모
  2: '완속',   // AC완속
  3: '급속',   // DC차데모+AC3상
  4: '급속',   // DC콤보
  5: '급속',   // DC차데모+DC콤보
  6: '급속',   // DC차데모+AC3상+DC콤보
  7: '완속',   // AC3상
  8: '완속',   // DC콤보(완속)
  9: '급속',   // NACS
  10: '급속',  // DC콤보+NACS
}

export function getChgerTyLabel(code) {
  const c = code != null ? String(code).trim() : ''
  return CHGER_TY_LABELS[c] ?? `타입${c || '?'}`
}

/** 코드 → 급속/완속. 미매핑은 '급속'으로 처리. */
export function getSpeedCategory(code) {
  const c = code != null ? String(code).trim() : ''
  return CHGER_TY_TO_SPEED[c] ?? '급속'
}

/** 사용자 표시용: "급속 (DC콤보)" 형태. */
export function getDisplayChgerLabel(code) {
  const label = getChgerTyLabel(code)
  const speed = getSpeedCategory(code)
  return `${speed} (${label})`
}

/** 충전기 상태(stat) 코드 → 한글 라벨. 공공 API 공통 코드 기준. */
export const STAT_LABELS = {
  1: '통신이상',
  2: '사용 가능',
  3: '사용 중',
  4: '운영중지',
  5: '점검중',
  9: '상태미확인',
}

export function getStatLabel(code) {
  const c = code != null ? String(code).trim() : ''
  return STAT_LABELS[c] ?? (c ? `상태${c}` : '—')
}

/**
 * stat 코드별 개수 객체에서 요약 문자열 생성.
 * @param {Record<string, number>} statCounts - { '2': 4, '3': 2, ... }
 * @param {string[]} order - 표시할 코드 순서(우선 노출할 것 먼저). 기본: 사용 가능(2), 사용 중(3), 점검중(5), 운영중지(4), 통신이상(1), 상태미확인(9)
 */
export function formatStatSummary(statCounts, order = ['2', '3', '5', '4', '1', '9']) {
  if (!statCounts || typeof statCounts !== 'object') return ''
  const parts = order
    .filter((code) => statCounts[code] > 0)
    .map((code) => `${getStatLabel(code)} ${statCounts[code]}`)
  return parts.join(' · ')
}

/** row 배열에서 stat 코드별 개수 집계. */
export function aggregateStatCounts(rows) {
  const counts = {}
  for (const r of rows || []) {
    const s = String(r.stat ?? '').trim()
    if (s) counts[s] = (counts[s] || 0) + 1
  }
  return counts
}

/** row 배열에서 가장 최근 statUpdDt (문자열 비교). */
export function getLatestStatUpdDt(rows) {
  const withDt = (rows || []).filter((r) => r.statUpdDt)
  if (!withDt.length) return ''
  withDt.sort((a, b) => String(b.statUpdDt || '').localeCompare(String(a.statUpdDt || '')))
  return withDt[0].statUpdDt
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
  const chgerTyLabel = getChgerTyLabel(chgerTyCode)
  return {
    id: get(item, 'chger_id', 'chgerId', 'objt_id', 'objtId') || `ev-${index}`,
    statId: get(item, 'stat_id', 'statId'),
    statNm: get(item, 'stat_nm', 'statNm') || '이름 없음',
    chgerId: get(item, 'chger_id', 'chgerId'),
    stat: get(item, 'stat'), // 충전기 상태 코드 (1~5, 9 등)
    statUpdDt: get(item, 'stat_upd_dt', 'statUpdDt'),
    chgerTy: chgerTyCode,
    chgerTyLabel,
    speedCategory: getSpeedCategory(chgerTyCode),
    displayChgerLabel: getDisplayChgerLabel(chgerTyCode),
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
