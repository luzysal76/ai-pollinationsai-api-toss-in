# 디버깅팀 Report

**Topic:** AI 그림일기 Android 앱에서 AI 이미지 생성이 안 되는 문제 디버깅 및 수정. 앱 스택: React 19 + Vite + Capacitor 8 + Android WebView. 이미지 생성 API: Pollinations.ai (https://image.pollinations.ai/prompt/{encoded_prompt}?width=512&height=512&model=flux&seed=N). 문제: Android WebView에서 fetch()로 이미지 Blob을 가져오려 할 때 실패할 수 있음. 시도한 수정: 1) capacitor.config.json에 allowNavigation 추가, 2) network_security_config.xml 생성 (pollinations.ai 명시적 허용), 3) AndroidManifest.xml에 networkSecurityConfig 참조, 4) WritePage.jsx에서 60초 타임아웃 + CORS 실패 시 originalUrl로 fallback. 핵심 파일: src/pages/WritePage.jsx (doGenerate 함수), src/utils/pollinations.js (buildPrompt, getImageUrl), capacitor.config.json, android/app/src/main/res/xml/network_security_config.xml, android/app/src/main/AndroidManifest.xml. 프로젝트 경로: C:/Users/유주현/Documents/super-agent/ai-pollinationsai-api-toss-in. Pollinations.ai URL은 CORS 허용(Access-Control-Allow-Origin: *)이며 한글 프롬프트는 encodeURIComponent로 인코딩됨. 의심 원인: 1) Capacitor WebView가 외부 fetch를 차단, 2) 프롬프트가 너무 길어 URL이 너무 길어짐, 3) 한글이 포함된 프롬프트가 API에서 제대로 처리 안 됨, 4) fetch fallback은 됐으나 <img src>로 외부 URL 로딩도 차단될 수 있음.
**Total Rounds:** 4
**Date:** 2026-06-16

---

## Round 1 — Stage 1: 증상 분석가 ✅

> **Passed → Stage 2**

### 🔍 증상 체계화

**정상 동작 (기대):**
- `fetch(pollinations URL)` → Blob 수신 → `URL.createObjectURL` → `<img src=blobUrl>` 표시

**비정상 동작 (실제):**
- fetch 실패 → catch → fallback `originalUrl` 설정 → `<img src=originalUrl>` 시도 → 여기서도 실패하거나, 혹은 `onError` → "그림 생성 실패" 표시

**발생 패턴:** Android WebView 환경에서만 발생 (web 브라우저에서는 정상). Capacitor `https://localhost` origin에서 외부 서비스 호출 시 차단.

---

### 🧩 핵심 단서 (코드 분석)

| 파일 | 발견 사항 |
|------|---------|
| `WritePage.jsx:88` | AbortError 핸들링 **로직 버그**: `!ctrl.signal.aborted` 조건이 false면 `if` 블록 skip되지만 **return 없이** 그 아래 `setImageData(fallback)`이 항상 실행됨 → 사용자 직접 취소도 fallback URL 세팅됨 |
| `WritePage.jsx:76` | `mode: 'cors'` 명시 → CORS 실패 시 네트워크 오류, not HTTP 오류 |
| `capacitor.config.json:7` | `allowNavigation` = WebView **페이지 이동** 허용이지 `fetch()` CORS 허용이 **아님** |
| `network_security_config.xml:4` | `cleartextTrafficPermitted="false"` + system 인증서만 → HTTPS는 허용되나 fetch CORS는 별개 |
| `pollinations.js:114–117` | 한글 200자 → `encodeURIComponent` → 최대 **1,800자**로 폭발, URL 전체 2,000~2,500자 가능 |

---

### 🎯 가설 목록 (우선순위 순)

**가설 1 (유력 🔴): `allowNavigation`이 fetch에 무효함**
- Capacitor `allowNavigation`은 WebView 내비게이션(페이지 전환) 제어용
- `fetch()`의 CORS 허용과 **무관**. 실제 fetch는 Capacitor 기본 WebView 보안 정책에 의해 차단될 수 있음
- 수정 필요: `@capacitor-community/http` 플러그인 사용 또는 네이티브 HTTP 브리지

**가설 2 (유력 🔴): fallback `<img src=originalUrl>` 로딩도 차단됨**
- fetch가 실패해 `originalUrl`로 폴백해도 `<img>` 태그에서 동일한 external URL 로딩 시도
- Android WebView에서 `https://localhost` → `https://image.pollinations.ai` 이미지 로드 시 일부 버전에서 차단
- `onError` 발생 → "그림 생성 실패" 화면 노출

**가설 3 (가능 🟡): 프롬프트 URL이 너무 길어짐**
- 한글 200자 × ~9byte 인코딩 = ~1,800자 + 나머지 = 총 URL 2,000~2,500자
- Pollinations.ai 서버 또는 Android WebView HTTP 클라이언트의 URL 길이 제한 초과 가능
- 증상: 특정 조건(긴 일기)에서만 실패

**가설 4 (가능 🟡): AbortError 핸들링 로직 버그**
- `WritePage.jsx:85~97` — 사용자 취소 시 아무것도 안 하는 것처럼 보이지만 실제로는 fallback URL도 설정됨
- 타임아웃(60초)이 먼저 발동하면 사용자 취소와 구별 불가, fallback이 무조건 실행
- 직접 이미지 생성 실패는 아니지만 UX 혼란 야기

**가설 5 (낮음 🟢): 한글이 포함된 프롬프트가 API에서 미처리**
- `translateKorean()`이 제한된 단어만 번역 (약 30개)
- 나머지 한글은 그대로 URL에 포함 → Pollinations flux 모델이 한글 텍스트 무시하거나 이상한 이미지 생성 가능
- 이미지 자체는 생성되나 품질/내용 문제

---

### ℹ️ 재현 조건 추정

- **항상 실패**: Android WebView에서 `fetch()` CORS 차단이 원인이면 → 모든 시도에서 실패
- **간헐적 실패**: URL 길이가 원인이면 → 일기 길이에 비례
- **항상 fallback**: fetch 실패 → fallback URL → `<img>` onError → "실패" 표시로 일관되게 보일 수 있음

---

---

## Round 2 — Stage 2: 원인 추적자 ✅

> **Passed → Stage 3**

### 코드 실행 흐름 전체 추적

```
doGenerate() 호출
  ↓
generateDiaryImageUrl(text, mood, weather, artStyle)
  → buildPrompt() → translateKorean() → slice(0,200) → encodeURIComponent(prompt)
  → URL: https://image.pollinations.ai/prompt/{encoded}?width=512&height=512&model=flux&seed=N
  ↓
fetch(url, { signal, mode: 'cors' })
  ↓
  [성공] resp.ok → blob → blobUrl → setImageData({blobUrl, blob, originalUrl}) ✅
  [실패] catch(err) →
      AbortError: setImageData({blobUrl:null, blob:null, originalUrl}) → line 92 (항상 실행됨)
      TypeError/기타: setImageData({blobUrl:null, blob:null, originalUrl}) → line 96
  ↓ (fallback 경로)
<img src={originalUrl}> 렌더링
  → onError → setImgError(true) → "그림 생성에 실패했어요" ❌
  → 성공 시 이미지 표시 (5~30초 대기) ✅
```

---

### 가설별 코드 흐름 추적 결과

---

#### 🔴 가설 1: `allowNavigation`이 fetch에 무효함 — **가능성 높음**

**실제 코드 경로:**
- `capacitor.config.json:7` — `allowNavigation: ["image.pollinations.ai", ...]`
- Capacitor 소스: `BridgeWebViewClient.shouldOverrideUrlLoading()` 에서 사용됨
- **이 콜백은 최상위 페이지 네비게이션(URL 변경)에만 호출됨**
- `fetch()`, XHR, `<img>`, WebSocket 등 **서브리소스 요청에는 호출되지 않음**

**결론:** `allowNavigation`은 fetch 허용과 **무관**하다. 그러나 HTTPS → HTTPS 요청은 Android WebView에서 기본적으로 허용되므로 "fetch가 차단"되는 것 자체는 아니다. 진짜 문제는 다음이다:

> `mode: 'cors'` → Pollinations.ai가 `Access-Control-Allow-Origin: *` 응답을 실제로 보내는지 여부

만약 CORS 헤더가 없으면 `TypeError` 발생 → `else` 블록 → fallback URL 설정 → `<img>` 로딩 경로로 이어짐.

---

#### 🔴 가설 2: fallback `<img src=originalUrl>` 로딩도 차단됨 — **가능성 높음**

**실제 코드 경로:**

```jsx
// WritePage.jsx:234
<img
  src={imgDisplaySrc}   // = imageData.originalUrl (2,000+자 URL)
  onError={() => setImgError(true)}
/>
```

**핵심 추적 포인트:**

| 단계 | 동작 | 판단 |
|------|------|------|
| `<img>` 태그는 CORS 체크 안 함 | crossorigin 속성 없음 → CORS 헤더 무관 | ✅ 이 부분은 OK |
| Capacitor `BridgeWebViewClient.shouldInterceptRequest()` | 외부 URL → null 반환 → 네이티브 처리 | ✅ 차단 안 됨 |
| INTERNET 권한 | `AndroidManifest.xml:42` 있음 | ✅ |
| network_security_config | pollinations.ai HTTPS 허용 | ✅ |
| **문제**: `<img>` 요청 = 새 이미지 생성 요청 | 서버가 5~30초 소요 | ⚠️ |
| `generating` 상태 | `finally` 블록에서 이미 `false` | ⚠️ 로딩 인디케이터 없음 |

**결론:** `<img>` 자체가 "차단"되는 것은 아님. 그러나:
1. fallback `<img>` 요청이 서버에 **새 이미지 생성** 요청을 보냄
2. 생성 시간 5~30초 동안 UI에 **로딩 표시 없음** (`generating=false` 이미)
3. 사용자는 무반응 UI를 "실패"로 인식하거나, 오랜 대기 후 이미지 표시
4. 만약 Pollinations.ai가 해당 요청에 에러 응답(`4xx`)을 주면 → `onError` → "실패"

---

#### 🔴 가설 4: AbortError 핸들링 로직 버그 — **가능성 높음 (UX 파괴적)**

**실제 코드 경로 (WritePage.jsx:85~97) 정밀 추적:**

```javascript
if (err.name === 'AbortError') {
  if (!ctrl.signal.aborted || err.message === 'signal timed out') {
    // ← 빈 블록: 코멘트만 있고 return 없음
  }
  // ↓ 이 줄은 조건과 무관하게 항상 실행됨!
  setImageData({ blobUrl: null, blob: null, originalUrl: url, prompt, seed });
}
```

**시나리오별 실제 동작:**

| 시나리오 | `ctrl.signal.aborted` | if 조건 | fallback 실행? | 의도? |
|---------|----------------------|---------|--------------|------|
| 사용자 취소 | `true` | `false OR false` = false | **항상 실행** ❌ | 실행 안 돼야 함 |
| 60초 timeout | `true` | `false OR false` = false (주1) | **항상 실행** | 실행 의도 OK |

> 주1: `err.message === 'signal timed out'`은 `AbortSignal.timeout()` 정적 메서드로만 발생. `setTimeout + ctrl.abort()` 조합에서는 발생 안 함. 따라서 이 조건은 **항상 false**.

**결론:** 사용자가 취소해도 fallback URL이 설정되고 `<img>` 로딩 시도됨. 이 `<img>` 가 실패하면 "그림 생성 실패" 화면이 뜸.

---

#### 🟡 가설 3: URL 길이 문제 — **가능성 있음**

**실제 URL 길이 계산:**

```
https://image.pollinations.ai/prompt/  →  42자
encodeURIComponent(cleanText):
  - cleanText = translateKorean(text).slice(0, 200)
  - 한글 미번역 시: 한글 1자 = UTF-8 3바이트 = %XX%XX%XX = 9자
  - 최악: 200 × 9 = 1,800자
영어 부분들 (mood+weather+style+quality): ~190자
?width=512&height=512&model=flux&seed=N: ~45자
총: ~2,077자
```

**서버 제한 확인:**
- nginx 기본 `client_max_uri_length`: 8,192 바이트 → **문제 없음**
- Android WebView(Chrome): 2MB URL 허용 → **문제 없음**
- **단, Pollinations.ai가 커스텀 제한을 둔 경우 불확실**

**결론:** 일반적인 상황에서는 URL 길이가 직접적 원인은 아니나, 서버 설정에 따라 간헐적 원인이 될 수 있음.

---

#### ⚪ 가설 5: 한글 프롬프트 API 미처리 — **가능성 낮음**

**실제 코드 경로:**
- `translateKorean()`: 35개 단어만 번역 (pollinations.js:67-78)
- 나머지 한글 → `encodeURIComponent` → 서버에 전달
- flux 모델: 한글 토큰 = 무시 또는 랜덤 해석
- **style/mood/weather 키워드는 전부 영어** → 기본 이미지는 생성됨

**결론:** 이미지 **품질** 문제이지 **생성 실패** 원인이 아님. 완전히 배제.

---

### 3단계 전달용 최종 분류

| 가설 | 등급 | 코드 위치 | 핵심 근거 |
|------|------|----------|---------|
| AbortError 버그: 취소 시 fallback 항상 실행 | 🔴 높음 | WritePage.jsx:88-92 | `return` 없는 빈 if 블록 → line 92 무조건 실행 |
| fallback `<img>` 로딩 중 로딩 표시 없음 | 🔴 높음 | WritePage.jsx:232-238 | `generating=false` 후 `<img>` 로딩 = 사용자에게 무반응 |
| `allowNavigation` 무효 → fetch 동작 불명 | 🔴 높음 | capacitor.config.json:7 | WebView 네비게이션용, fetch와 무관 |
| URL 길이 (~2,077자) 서버 제한 가능성 | 🟡 있음 | pollinations.js:129-133 | 일반 nginx 한도 내, 서버 커스텀 설정 불확실 |
| 한글 프롬프트 품질 저하 | ⚪ 낮음 | pollinations.js:80-86 | 생성 실패 아닌 품질 이슈 |

---

---

## Round 3 — Stage 3: 가설 검증자 ✅

> **Passed → Stage 4**

### 반증 시나리오 검토 결과

---

#### 가설 1: `allowNavigation` 무효 + fetch CORS → **보류 ⚠️**

**반증 시나리오:**  
> "Pollinations.ai가 실제로 `Access-Control-Allow-Origin: *` 헤더를 항상 응답에 포함한다면, `mode: 'cors'` fetch는 성공해야 한다."

- 문제 설명에 "Pollinations.ai URL은 CORS 허용(`Access-Control-Allow-Origin: *`)"이라고 **명시됨**
- HTTPS → HTTPS fetch는 Android WebView에서 기본 허용
- `INTERNET` 권한: `AndroidManifest.xml`에 존재
- `network_security_config.xml`: pollinations.ai HTTPS 허용

**반례 성립 여부:** 부분 성립. Pollinations.ai가 항상 CORS 헤더를 보내는 한, fetch가 CORS로 차단되지 않음. 그러나 Android WebView + Capacitor 환경에서 리다이렉트/CDN 거쳐 CORS 헤더 누락 가능성은 배제 불가.

**판정: 보류 ⚠️** — 직접적 차단 원인이라고 확정할 수 없으나, 간헐적 원인 가능성 유지

---

#### 가설 2: fallback `<img>` 로딩 중 UX 붕괴 → **확정 ✅**

**반증 시나리오:**  
> "`<img>` 태그는 CORS 체크 없이 외부 URL 로딩 가능하므로, 시간이 지나면 이미지가 표시되어야 한다."

코드 확인 (WritePage.jsx:136, 98-99):
```javascript
const imgDisplaySrc = imageData?.blobUrl || imageData?.originalUrl || null;
// ...
} finally {
  setGenerating(false);  // ← finally 블록: try/catch 완료 즉시 false
}
```

- `generating=false` → `<GeneratingOverlay>` 사라짐 → **로딩 표시 없음**
- `<img src={originalUrl}>` → Pollinations 서버에 **새 이미지 생성 요청** (5~30초 소요)
- 그 동안 UI: 텍스트만 보이고 이미지 없음 → 사용자는 "실패"로 인식
- Pollinations 서버가 에러 반환 시 `onError` → `setImgError(true)` → "그림 생성에 실패했어요" 표시

**반례 불성립.** 차단 문제가 아니라 UX 타이밍 + 에러 처리 문제.

**판정: 확정 ✅**

---

#### 가설 4: AbortError 핸들링 버그 → **확정 ✅ (주 원인)**

**반증 시나리오:**  
> "`setTimeout + ctrl.abort()` 조합에서 `err.message`가 'signal timed out'이 될 수 있다."

코드 직접 확인 (WritePage.jsx:73, 85-92):
```javascript
const timeoutId = setTimeout(() => ctrl.abort(), 60_000);
// ...
if (err.name === 'AbortError') {
  if (!ctrl.signal.aborted || err.message === 'signal timed out') {
    // 사용자가 직접 취소한 경우: 그냥 종료
  }
  // ← return 없음! 사용자 취소 시도 fallback 항상 실행됨
  setImageData({ blobUrl: null, blob: null, originalUrl: url, prompt, seed });
}
```

**검증:**
- `setTimeout(() => ctrl.abort())` → `err.message` = `"signal is aborted without reason"` 또는 `"The user aborted a request"` (브라우저마다 다름)
- `'signal timed out'`은 오직 `AbortSignal.timeout()` 정적 메서드에서만 발생
- `ctrl.signal.aborted`는 abort() 호출 즉시 `true` → `!ctrl.signal.aborted` = `false`
- 따라서 if 조건 = `false || false` = **항상 false** → if 블록 항상 skip
- **사용자 취소, 60초 타임아웃 모두** line 92 `setImageData(fallback)` 실행됨

**반례 불성립. 코드 버그 확정.**

**판정: 확정 ✅**

---

#### 가설 3: URL 길이 (~2,077자) → **보류 ⚠️**

**반증 시나리오:**  
> "nginx 기본 제한 8,192바이트, Android WebView 2MB 제한 내이므로 URL 길이는 문제 없다."

- 일반 인프라 한도 내 → 직접 원인 아님
- 단, Pollinations.ai 커스텀 rate limit / URL 길이 제한 시 간헐적 원인 가능

**판정: 보류 ⚠️** — 주 원인 아니나 완전 배제 불가

---

#### 가설 5: 한글 프롬프트 품질 저하 → **제외 ❌**

- `style/mood/weather` 키워드는 전부 영어로 생성됨
- 한글 일기 내용 무시되어도 기본 이미지는 생성
- 생성 **실패** 원인이 아님

**판정: 제외 ❌**

---

### 확정된 원인 목록 (4단계 전달)

| # | 원인 | 분류 | 위치 | 심각도 |
|---|------|------|------|--------|
| 1 | **AbortError if 블록에 `return` 누락** → 사용자 취소/60초 타임아웃 모두 fallback 실행됨 | 확정 ✅ | WritePage.jsx:88-92 | 🔴 Critical |
| 2 | **fallback `<img>` 로딩 중 `generating=false`** → 5~30초 무반응 UI + Pollinations 에러 시 onError → "실패" 표시 | 확정 ✅ | WritePage.jsx:98-99, 136 | 🔴 Critical |
| 3 | **`allowNavigation` fetch와 무관 + Android WebView CORS 간헐적 가능성** | 보류 ⚠️ | capacitor.config.json:7 | 🟡 중간 |
| 4 | **URL 길이 ~2,077자 서버 커스텀 제한 가능성** | 보류 ⚠️ | pollinations.js:132 | 🟡 낮음 |
| 5 | 한글 프롬프트 품질 저하 | 제외 ❌ | — | — |

---

### 수정 방향 (4단계를 위한 핵심 지침)

**수정 1 (Critical):** `AbortError` 블록에 사용자 직접 취소 시 `return` 추가

```javascript
if (err.name === 'AbortError') {
  // 사용자가 직접 취소한 경우 → 아무것도 하지 않고 종료
  if (ctrl.signal.aborted && err.message !== 'signal timed out') {
    return; // ← 이 return이 핵심
  }
  // 60초 타임아웃 → URL 직접 사용 폴백
  setImageData({ blobUrl: null, blob: null, originalUrl: url, prompt, seed });
}
```

**수정 2 (Critical):** fallback `<img>` 로딩 시 `generating` 상태 유지 또는 별도 `imgLoading` 상태 추가

```javascript
// fallback 설정 후 별도 로딩 표시
setImageData({ blobUrl: null, blob: null, originalUrl: url, prompt, seed });
setImgLoading(true); // img onLoad/onError에서 false로
```

---

---

## Round 4 — Stage 4: 수정 방안 설계자 🏆

### 수정 방안 설계 (최종)

---

### 🔴 수정 1 — AbortError 취소 판별 버그 (`WritePage.jsx`)

**문제 위치:** `doGenerate()` 내 catch 블록 (line 85~92)

**핵심:** `setTimeout + ctrl.abort()` 조합은 타임아웃인지 사용자 취소인지 **에러 속성만으로는 구별 불가**. 별도 ref로 추적해야 함.

```jsx
// 추가: abortReasonRef (abortRef 바로 아래)
const abortRef      = useRef(null);
const abortReasonRef = useRef(null); // 'user' | 'timeout' | null

// handleCancel 수정 (line 104)
const handleCancel = () => {
  abortReasonRef.current = 'user';
  abortRef.current?.abort();
};

// doGenerate 내 타임아웃 설정 수정 (line 73)
const timeoutId = setTimeout(() => {
  abortReasonRef.current = 'timeout';
  ctrl.abort();
}, 60_000);

// catch 블록 전면 교체 (line 83~97)
} catch (err) {
  clearTimeout(timeoutId);
  if (err.name === 'AbortError') {
    if (abortReasonRef.current === 'user') {
      return; // ← 사용자 직접 취소 → finally만 실행(setGenerating(false))
    }
    // 타임아웃 → URL 직접 폴백
    setImageData({ blobUrl: null, blob: null, originalUrl: url, prompt, seed });
    setImgLoading(true);
  } else {
    // CORS 오류, 네트워크 오류 → URL 직접 폴백
    console.warn('[그림일기] Blob fetch 실패, 직접 URL 폴백:', err.message);
    setImageData({ blobUrl: null, blob: null, originalUrl: url, prompt, seed });
    setImgLoading(true);
  }
} finally {
  setGenerating(false);
  abortReasonRef.current = null; // 초기화
}
```

---

### 🔴 수정 2 — fallback `<img>` 로딩 중 무반응 UI 개선 (`WritePage.jsx`)

**문제 위치:** `generating=false` 직후 `<img src=originalUrl>` 로딩이 5~30초 걸리는 동안 UI에 아무 피드백 없음.

```jsx
// 상태 추가 (line 40 근처)
const [imgLoading, setImgLoading] = useState(false);

// handleStyleChange에 imgLoading 초기화 추가
const handleStyleChange = (key) => {
  setArtStyle(key);
  if (imageData?.blobUrl) URL.revokeObjectURL(imageData.blobUrl);
  setImageData(null);
  setImgError(false);
  setImgLoading(false); // ← 추가
};

// doGenerate 시작 시 초기화 (line 64 근처)
setImgError(false);
setImgLoading(false); // ← 추가

// img 태그 수정 (line 234~238 근처)
<img
  src={imgDisplaySrc}
  alt={`${styleObj?.label || 'AI'} 스타일로 생성된 그림일기 그림`}
  className="w-full max-w-[260px] mx-auto block rounded-xl my-4 animate-fade-in-up"
  onLoad={() => setImgLoading(false)}                           // ← 추가
  onError={() => { setImgLoading(false); setImgError(true); }} // ← 수정
/>

// 이미지 영역 조건부 렌더링에 로딩 인디케이터 추가
{hasImage && !imgError ? (
  <div className="relative">
    {imgLoading && (
      <div className="flex flex-col items-center justify-center py-10 gap-2">
        <div className="w-8 h-8 border-4 border-[#FFB800] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm" style={{ color: '#aaa' }}>그림을 불러오는 중...</p>
      </div>
    )}
    {!imgLoading && (
      <>
        <img ... onLoad={...} onError={...} />
        {/* 스타일 뱃지, 재생성 버튼 등 */}
      </>
    )}
  </div>
) : /* imgError, 빈 상태 기존 코드 유지 */ }
```

---

### 🟡 수정 3 — URL 길이 최적화 (`pollinations.js`)

**문제 위치:** `buildPrompt()` 내 `cleanText` (line 114~115)

```js
// 기존: 200자
const cleanText = translateKorean(diaryText)
  .slice(0, 200)          // ← 최대 1,800 인코딩 글자
  // ...

// 수정: 100자
const cleanText = translateKorean(diaryText)
  .slice(0, 100)          // ← 최대 900 인코딩 글자 → 총 URL ~1,200자
  .replace(/[^a-zA-Z0-9가-힣\s.,]/g, ' ')
  .trim();
```

한글 일기 기준 URL이 **~2,077자 → ~1,177자**로 단축. 이미지 품질 저하 최소 (mood/weather/style 키워드는 유지).

---

### 🔍 사이드이펙트 분석

| 수정 | 영향 범위 | 부작용 |
|------|----------|--------|
| abortReasonRef 추가 | `handleCancel`, `doGenerate` | 없음. 단순 ref 추가 |
| `return` in AbortError | 사용자 취소 시 상태 불변 | 취소 시 이전 이미지/빈 화면 유지됨 — 의도된 동작 |
| `imgLoading` 상태 | 스타일 변경·재생성·초기화 모두 리셋 필요 | `handleStyleChange`와 `doGenerate` 시작 시 반드시 `false`로 초기화해야 함 (설계에 포함) |
| URL 100자 제한 | AI 이미지 내용 디테일 감소 | 일기 첫 100자만 반영 — 핵심 내용은 일반적으로 앞부분에 있어 체감 차이 미미 |

---

### 🛡️ 재발 방지책

#### 테스트 케이스 (수동 QA 체크리스트)

```
[ ] 생성 버튼 클릭 → 즉시 취소 → 에러 화면 NOT 뜨는지 확인
[ ] 생성 버튼 클릭 → 즉시 취소 → 이전 이미지 상태 그대로 유지되는지 확인
[ ] fetch 실패 시뮬레이션(오프라인 모드) → "그림을 불러오는 중..." 스피너 표시 확인
[ ] 스피너 표시 중 이미지 로드 완료 → 스피너 사라지고 이미지 표시 확인
[ ] 스피너 표시 중 이미지 404/500 에러 → "생성 실패" 화면 표시 확인
[ ] 다른 스타일로 변경 → imgLoading false 초기화 확인
```

#### 방어 코드 패턴

```jsx
// doGenerate 진입 시 모든 상태 명시적 초기화 — 상태 잔존 방지
setImageData(null);
setImgError(false);
setImgLoading(false);       // ← 반드시 포함
abortReasonRef.current = null;
```

#### 모니터링 포인트

```js
// catch 블록에 분기별 로그 강화
console.warn('[그림일기] AbortError', { reason: abortReasonRef.current, url });
console.warn('[그림일기] fetch 실패 → 폴백', { error: err.message, urlLength: url.length });
// → 실제 앱 로그에서 URL 길이, 오류 빈도 모니터링 가능
```

---

### 📋 최종 디버그 보고서 요약

| 항목 | 내용 |
|------|------|
| **확정 원인 1** | `AbortError` catch 블록에 `return` 누락 → 사용자 취소 시에도 fallback 상태 세팅됨 |
| **확정 원인 2** | fetch 실패 후 fallback `<img>` 로딩 5~30초 동안 `generating=false` → 무반응 UI → 사용자가 "실패"로 오인 |
| **보류 원인** | URL ~2,077자 (Pollinations 서버 커스텀 제한 불확실), `allowNavigation` 무효 (간헐적 가능성) |
| **수정 파일** | `src/pages/WritePage.jsx` (주), `src/utils/pollinations.js` (보조) |
| **핵심 수정** | ① abortReasonRef로 취소 원인 추적 + `return` 추가, ② `imgLoading` 상태 추가 + 스피너 UI, ③ cleanText 200→100자 |
| **재발 방지** | 6개 수동 QA 체크리스트, 진입 시 상태 명시 초기화, catch 분기별 로그 |

---

---

