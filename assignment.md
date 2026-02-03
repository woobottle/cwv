# 웹 바이탈 최적화 Week 1: Vanilla JavaScript

**학습 목표**

- Core Web Vitals 지표(LCP, FCP, CLS, INP)와 TTI를 이해한다.
- 실제 웹 페이지에서 성능 병목을 진단하고 개선한다.
- Chrome DevTools와 Lighthouse를 활용한 성능 측정 방법을 익힌다.
- 프레임워크 없이 순수 HTML/CSS/JS로 최적화 기법을 적용한다.

---

## TL;DR

**의도적으로 느리게 만들어진 이미지 갤러리 블로그 앱**을 받아서, Chrome DevTools와 Lighthouse로 문제를 진단하고, 웹 바이탈 지표를 개선해주세요.

**목표**: Lighthouse 성능 점수 **90점 이상**

---

## 🚀 시작하기

### 1. 환경 설정

```bash
# 프로젝트 폴더로 이동
cd starter/

# 의존성 설치
npm install

# 개발 서버 시작
npm run dev
```

브라우저에서 http://localhost:3000 접속

### 2. 측정 방법 및 체크리스트

**측정 도구 사용 방법**:

- **Chrome DevTools Lighthouse**: Chrome 브라우저에서 F12를 눌러 DevTools를 열고 Lighthouse 탭을 사용
- **CLI 명령어**: `npm run measure` 커맨드로 자동화된 측정 가능

Lighthouse 측정 시 **일관된 결과**를 위해 반드시 확인하세요:

- [ ] **Chrome Incognito 모드** 사용 (확장 프로그램 영향 제거)
- [ ] **다른 탭 모두 닫기** (메모리/CPU 경쟁 방지)
- [ ] **DevTools > Network**: "Disable cache" 체크
- [ ] **동일한 조건**으로 3회 측정 후 중간값 사용

> ⚠️ Lighthouse 점수는 측정할 때마다 ±5점 정도 변동될 수 있습니다. 이는 정상입니다.

---

## 📦 제공되는 앱 구조

```
/week1-gallery-blog/
  ├── index.html          # 메인 페이지 (느림)
  ├── styles.css          # 비최적화된 CSS
  ├── script.js           # 비최적화된 JavaScript
  └── /assets/
      ├── analytics.js    # 무거운 third-party 스크립트
      └── comments.js
```

**앱 설명**:

- 상단에 큰 히어로 이미지
- 본문 텍스트 + 50개 이미지 갤러리
- 댓글 섹션
- 분석 스크립트

**현재 상태**:

- Lighthouse 점수: ~50점
- LCP: ~4.5초
- FCP: ~2.5초
- TTI: ~6초
- CLS: ~0.35
- INP: ~450ms

---

## Step 1. 현재 상태 측정 및 문제 파악

### 목표

성능 측정 도구를 사용해 현재 상태를 정확히 파악하고, 개선할 영역을 식별합니다.

### 할 일

#### 1-1. Lighthouse 실행

Chrome DevTools에서 Lighthouse를 실행하고 성능 점수를 측정하세요.

**측정할 지표**:

- Performance Score
- FCP (First Contentful Paint)
- LCP (Largest Contentful Paint)
- TBT (Total Blocking Time)
- CLS (Cumulative Layout Shift)
- Speed Index

#### 1-2. Performance 패널 분석

DevTools의 Performance 패널을 사용해 페이지 로드를 기록하고 분석하세요.

**확인할 것**:

- Main 스레드 블로킹 시간
- Network waterfall
- Long Tasks (50ms 이상 작업)
- Layout Shift 발생 지점

### 참고 자료

- [Chrome DevTools - Lighthouse](https://developer.chrome.com/docs/lighthouse/)
- [Chrome DevTools - Performance](https://developer.chrome.com/docs/devtools/performance/)

---

## Step 2. 배너 이미지 LCP 개선 (Largest Contentful Paint)

### 전략

- 이미지 포맷
- 다양한 화면 크기에 맞는 이미지를 제공
- 로딩 우선순위 조절

**힌트**:

- `<picture>` 태그와 `srcset` 속성을 찾아보세요
- `width`와 `height` 속성이 왜 필요한지 고민해주세요.
- img prioirty 속성들

### 참고 자료

- [Optimize LCP - web.dev](https://web.dev/optimize-lcp/)
- [Responsive Images - MDN](https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images)

**목표 달성**: LCP < 2.5s ✅

---

## Step 3. FCP 개선 (First Contentful Paint)

### 목표

FCP를 **1.8초 미만**으로 개선

### 현재 상황

- `<head>`에 렌더링을 차단하는 CSS/JS가 있음
- 불필요한 third-party 스크립트가 동기 로드됨
- 웹폰트가 렌더링을 차단함

### 전략

- critical css
- js 로딩 최적화
- 폰트 최적화

**힌트**:

- Critical CSS란 무엇인가요?
- font-display, preconnect

---

## Step 4. TTI 개선 (Time to Interactive)

### 현재 상황

- 페이지 로드 시 50개 이미지를 한 번에 DOM에 추가 (Long Task 발생)
- 무거운 동기 계산 작업이 메인 스레드를 블로킹
- 각 이미지마다 이벤트 리스너 등록

### 전략

- lazy load
- intersection observer
- requestIdleCallback
- event delegation

### 참고 자료

- [Lazy loading - web.dev](https://web.dev/lazy-loading/)
- [Intersection Observer API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
- [requestIdleCallback - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback)

---

## Step 5. CLS 개선 (Cumulative Layout Shift)

### 현재 상황

- 이미지 크기가 명시되지 않아 로드 시 레이아웃 이동
- 웹폰트 로딩 중 텍스트 크기 변화
- 늦게 삽입되는 배너가 기존 콘텐츠를 밀어냄

### 전략

- set width, height
- aspect-ratio
- image placeholder

### 참고 자료

- [Optimize CLS - web.dev](https://web.dev/optimize-cls/)
- [aspect-ratio - MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/aspect-ratio)

---

## Step 6. INP 개선 (Interaction to Next Paint)

### 현재 상황

- 검색 입력 시 매번 전체 리스트 재렌더링
- 스크롤 이벤트에 throttle/debounce 없음

### 참고 자료

- [Optimize INP - web.dev](https://web.dev/optimize-inp/)
- [Debouncing and Throttling Explained](https://css-tricks.com/debouncing-throttling-explained-examples/)
- [requestAnimationFrame - MDN](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame)

---
