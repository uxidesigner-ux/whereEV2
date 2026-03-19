# whereEV2 범위/갯수 모델 기획

시트 헤더의 "N곳"과 사용자가 보는 지도/목록이 같은 기준을 쓰도록 하기 위한 기획. **코드 수정 전** 적용 가능한 수준으로 정리.

---

## 1. 현재 문제 진단

| 항목 | 현재 동작 | 문제 |
|------|-----------|------|
| **데이터 소스** | 앱 로드 시 `fetchEvChargers({ numOfRows: 200, maxPages: 3 })`로 한 번 로드. `items`는 전국(또는 API가 주는 범위) 일부. | 지도 bounds / 사용자 위치와 무관하게 **고정된 집합**만 존재. |
| **필터** | `filteredItems` = items에 대해 운영기관·타입·시도·시군구만 적용. | **지도 화면 범위·반경 제한 없음**. |
| **목록/지도** | 목록 = `sortedItemsForMobile`(filteredItems 거리순). 지도 마커 = `filteredItems`. | 둘 다 "필터만 통과한 전체"라서 **갯수는 동일**하지만, "현재 화면 안"과는 무관. |
| **헤더 문구** | "현재 지도 영역 · N곳" 또는 "내 주변 충전소 · N곳". N = `sortedItemsForMobile.length` = filteredItems.length. | "현재 지도 영역"이라고 해도 **실제로는 지도 화면과 무관한 숫자**. 사용자는 "지금 화면에서 고를 수 있는 수"로 해석함. |
| **mapCenter** | `MapCenterTracker`가 `moveend` 시 `getCenter()`만 저장. | **bounds(남서·동북)** 미사용. 중심만 있어서 "화면 안" 집계 불가. |

**정리**: "현재 지도 영역 · N곳"의 N이 **지도 뷰포트(bounds) 안에 있는 충전소 수**가 아니라 **필터만 적용한 전체 수**라서, 숫자와 사용자 기대(지금 화면에서 선택 가능한 수)가 어긋남.

---

## 2. whereEV2에 맞는 범위 모델 제안

### 2.1 범위의 두 가지 모드

| 모드 | 기준 | N의 의미 | 헤더 예시 |
|------|------|----------|-----------|
| **지도 영역** | 현재 지도 bounds(뷰포트 사각형) 내 충전소만 | "지금 화면에 보이는 영역 안 N곳" | 현재 지도 영역 · N곳 |
| **내 주변(반경)** | userLocation 기준 반경(예: 3km) 이내만 | "내 위치에서 3km 안 N곳" | 내 주변 3km · N곳 |

- **지도 영역 모드**: 지도를 이동/줌하면 bounds가 바뀌므로 N이 바뀌어야 함. (단, **이미 로드된 items 안에서만** bounds 필터 적용. API는 범위 파라미터 없이 페이지 단위이므로, "로드된 데이터 중 bounds 내"가 상한.)
- **내 주변 모드**: userLocation이 있을 때만 사용. 반경(radius km) 이내만 집계. 반경 값은 고정(예 3km) 또는 사용자 선택(2차).

### 2.2 데이터 흐름 (제안)

```
items (API 로드분, 고정)
  → [필터: 운영기관·타입·시도·시군구] → filteredItems
  → [범위]
      - 지도 영역 모드: bounds 내 충전소만 → itemsInBounds (또는 inScopeItems)
      - 내 주변 모드: userLocation 반경 이내만 → itemsInRadius
  → 목록/지도에 사용하는 집합 = 범위 적용 결과
  → N = 이 집합의 길이
```

- **목록과 지도는 반드시 같은 집합** 사용: 위 "범위 적용 결과" 하나를 두고, 목록은 이를 거리순 정렬한 것, 지도는 이 집합으로 마커 렌더. 그러면 헤더 N과 목록 개수·지도 마커 개수가 일치.

### 2.3 현재 API 제약

- Safemap EV API는 **bounds/bbox/radius 파라미터 없음**. 페이지 단위(numOfRows, pageNo)로만 로드.
- 따라서 "현재 지도 영역" = **이미 메모리 안에 있는 items 중, 현재 bounds 안에 들어오는 것만 필터**한 결과. 지도를 완전히 다른 지역으로 옮기면 해당 지역 데이터가 없을 수 있어 N=0 또는 적을 수 있음.
- 1차에서는 "로드된 데이터 안에서 bounds/radius 필터만 적용"하고, 2차에서 "지도가 새 지역으로 이동했을 때 해당 bounds로 API 재요청" 여부를 검토하는 수준이 적절함.

---

## 3. 헤더 문구 상태 정의

| 상태 조건 | 헤더 문구 | N의 정의 |
|-----------|-----------|----------|
| userLocation 없음 + 지도 영역 모드 | **현재 지도 영역 · N곳** | filteredItems 중 현재 map bounds 내 충전소 수 |
| userLocation 있음 + "내 주변" 미사용(지도 영역 모드) | **현재 지도 영역 · N곳** | 위와 동일 |
| userLocation 있음 + "내 주변" 사용(반경 모드) | **내 주변 3km · N곳** (또는 선택 반경) | filteredItems 중 userLocation 기준 3km 이내 수 |
| 필터만 걸려 있고 타입/운영기관 등 적용됨 | 문구는 위와 동일. N만 "필터+범위" 공동 적용 결과. | (필터 ∩ 범위) 갯수 |
| 선택된 충전소 있음 | **선택: {충전소명}** (기존 유지) | N 표시 없음(선택 상태가 우선) |

- "필터 결과 · N곳"만 단독으로 쓰면 "범위 없이 필터만"처럼 보일 수 있으므로, 1차에서는 **"현재 지도 영역" / "내 주변 3km"**를 메인으로 두고, N은 항상 "필터 + 해당 범위" 교집합으로 통일하는 쪽을 권장.

---

## 4. 지도/목록/필터 동기화 방식

### 4.1 하나의 "화면에 쓰는 집합"으로 통일

- **1단계**: `filteredItems` (기존 필터만).
- **2단계**: 여기에 **범위** 적용.
  - 지도 영역 모드: `mapBounds`(map.getBounds())로 `latLngBounds.contains([lat, lng])` 필터.
  - 내 주변 모드: `userLocation` + 반경(km)으로 haversine 거리 ≤ 반경만 유지.
- **3단계**: 이 결과를 `itemsInScope`(또는 `visibleStations`) 같은 이름으로 두고,
  - **지도 마커**: `itemsInScope` 렌더.
  - **목록**: `itemsInScope`를 거리순 정렬한 배열 렌더.
  - **헤더 N**: `itemsInScope.length`.

이렇게 하면 "숫자 = 목록 개수 = 지도에 보이는 마커 수"가 됨.

### 4.2 bounds 확보

- 현재는 `mapCenter`만 있음. **map bounds**를 쓰려면 `map.getBounds()`가 필요.
- `MapCenterTracker`를 확장하거나, 별도 `MapBoundsTracker`를 두어 `moveend`(및 초기) 시 `setMapBounds(map.getBounds())` 호출. bounds는 `{ _southWest: { lat, lng }, _northEast: { lat, lng } }` 형태.
- `items` 중 `bounds.contains([s.lat, s.lng])`인 것만 남기면 "현재 지도 영역" 집합 완성.

### 4.3 "내 주변" 반경 모드

- 사용자가 "내 주변"을 선택했을 때만 반경 필터 적용. (예: chip 또는 토글 "내 주변 3km".)
- `userLocation` + 반경(3km)으로 `haversineDistanceKm(userLocation, station) <= 3` 인 것만 유지.
- 이때 헤더는 "내 주변 3km · N곳". 지도는 이 N개만 마커로 표시해도 되고, 또는 지도는 전체를 두고 마커만 N개만 그리면 됨. **일관성을 위해 "표시 집합 = N = 목록 = 지도 마커"로 맞추는 것이 좋음.**

---

## 5. UX 제안: 자동 갱신 vs 수동 재검색

| 상황 | 제안 | 이유 |
|------|------|------|
| **지도 이동/줌 (moveend)** | **자동 갱신**. bounds가 바뀌면 곧바로 `itemsInScope`를 다시 계산해 목록·헤더 N·마커 갱신. | 사용자는 "지도 움직이면 숫자도 바뀐다"가 직관적. 별도 버튼 없이도 의미가 통일됨. |
| **지도가 로드된 지역 밖으로 크게 이동** | 1차: 로드된 데이터만 쓰므로 bounds 안에 들어오는 게 없으면 N=0. **"이 지역 데이터 없음" 또는 "지도 영역을 서울 근처로 옮겨 보세요"** 안내. 2차: "이 지역 보기" 버튼으로 해당 bounds로 API 재요청 검토. | 현재 API가 범위 파라미터가 없어도, 2차에서 페이지/지역별 로드 전략을 도입할 수 있음. |
| **"내 주변" 켜기** | 자동 갱신. userLocation + 반경으로 즉시 필터. | 한 번의 선택으로 N과 목록이 바로 바뀌는 게 자연스러움. |
| **"이 지역 다시 보기" 노출** | 1차: 필수는 아님. 2차에서 "현재 bounds로 새로고침" 또는 "더 넓은 범위 로드" 버튼을 두고 API 재호출 시 검토. | 우선은 "로드된 데이터 안에서 bounds/radius만 적용"으로 의미를 명확히 하는 것이 목표. |

**정리**: 1차에서는 **지도 moveend 시 bounds 갱신 → 범위 적용 결과 자동 재계산**으로 "현재 지도 영역 · N곳"을 진짜 화면 기준으로 맞추고, "이 지역 다시 보기"는 2차에서 검토.

---

## 6. 지금 단계에서 OS geofencing을 도입하지 않는 이유

| 이유 | 설명 |
|------|------|
| **목표와 직접 연동 안 됨** | whereEV2 1차 목표는 "지도에서 지금 보이는/내 주변 충전소를 빠르게 고르기". 진입/이탈 알림은 별도 기능. |
| **복잡도** | Geofencing API(브라우저/OS) 연동, 권한, 백그라운드 동작 이슈. 현재 React/Leaflet 단일 화면 구조와 무관. |
| **범위/갯수 명확화에 불필요** | bounds 기반 + 사용자 위치 반경만으로도 "N곳"의 의미를 충분히 명확히 할 수 있음. |
| **데이터 소스 동일** | Geofencing을 써도 결국 "어디서 데이터를 가져올지"는 API/로드 전략 문제. 지도 bounds/radius가 그 전제. |

따라서 **먼저 bounds + radius 모델을 구현하고**, geofencing은 필요 시 별도 기획으로 두는 것이 맞음.

---

## 7. 구현 우선순위

### 1차 구현 (범위/갯수 의미 정리)

| 순서 | 내용 |
|------|------|
| 1 | **mapBounds state + MapBoundsTracker**  
|      | `moveend`(및 초기) 시 `map.getBounds()` 저장. `mapCenter`와 유사하게, MapContainer 내부 컴포넌트에서 setMapBounds 호출. |
| 2 | **지도 영역 모드: bounds 필터**  
|      | `filteredItems` 중 `mapBounds.contains([lat, lng])`인 것만 `itemsInScope`. mapBounds 없을 때(초기)는 전체 filteredItems 또는 빈 배열 규칙 정하기(예: 초기 bounds는 서울 중심으로 기본 사각형). |
| 3 | **목록/지도/헤더를 itemsInScope 기준으로 통일**  
|      | 지도 마커 = itemsInScope. 목록 = itemsInScope 거리순. 헤더 N = itemsInScope.length. "현재 지도 영역 · N곳" 문구 유지. |
| 4 | **헤더 문구 조건 정리**  
|      | selectedStation 있으면 "선택: {이름}". 없으면 범위 모드에 따라 "현재 지도 영역 · N곳" 또는(2차) "내 주변 3km · N곳". |

### 2차 구현 (내 주변 반경 + 선택적 UX)

| 순서 | 내용 |
|------|------|
| 5 | **"내 주변" 반경 모드**  
|      | userLocation 있을 때 "내 주변 3km" chip/토글. 선택 시 itemsInScope = filteredItems 중 haversine ≤ 3km. 헤더 "내 주변 3km · N곳". |
| 6 | **지도 영역 vs 내 주변 전환**  
|      | 두 모드 전환 시 N과 목록/마커가 즉시 바뀌도록 state만 전환. |
| 7 | **(선택) "이 지역 다시 보기"**  
|      | 현재 bounds로 API 재요청이 가능하다면 버튼 노출. API 스펙에 따라 2차에서 결정. |

---

## 8. 실제 코드 수정 전에 봐야 할 파일 목록

| 순서 | 파일 | 목적 |
|------|------|------|
| 1 | **`src/App.jsx`** | mapCenter/MapCenterTracker 위치. filteredItems/sortedItemsForMobile 사용처. 시트 헤더 문구·N 표시 위치. MapView에 넘기는 stations. MapBoundsTracker 추가 위치, mapBounds state, itemsInScope useMemo 위치. |
| 2 | **`src/utils/geo.js`** | haversineDistanceKm 있음. bounds contains 여부는 Leaflet `L.latLngBounds(bounds).contains(latLng)` 사용 가능. 필요 시 bounds 유틸 추가. |
| 3 | **`src/api/safemapEv.js`** | 현재 요청 파라미터(범위 없음). 2차에서 bounds/지역별 로드 시 여기 수정 여부 확인. |
| 4 | **`src/theme/dashboardTheme.js`** | 변경 없을 수 있음. 참고용. |

---

이 문서를 기준으로 1차에서는 **mapBounds 도입 + bounds 필터 + 목록/지도/헤더를 itemsInScope로 통일**까지 적용하면, "현재 지도 영역 · N곳"이 사용자 기대와 맞게 동작한다.

---

## 보정 사항 (1차 구현 시 반영)

1. **헤더 N · 지도 마커 · 목록 개수**는 반드시 동일 집합(itemsInScope) 기준으로 통일.
2. **map moveend/zoomend** 후 범위 갱신은 즉시 하지 않고 **150~250ms debounce** 적용.
3. **초기 mapBounds 없을 때**는 비정합한 N을 보이지 않음. bounds 확보 후부터만 "현재 지도 영역 · N곳" 표시.
4. **"내 주변 3km"** 문구는 실제 radius 필터 구현 후에만 사용. 1차에서는 bounds 기반 "현재 지도 영역 · N곳"만 정확히 맞춤.
