# LoRA Platform Mobile App

React Native (Expo) 기반 LoRA Platform 모바일 애플리케이션

## 기술 스택

- **React Native** (Expo)
- **TypeScript**
- **React Navigation** (Bottom Tabs + Stack)
- **Axios** (HTTP 클라이언트)
- **AsyncStorage** (로컬 저장소)

## 프로젝트 구조

```
mobile/
├── src/
│   ├── screens/          # 화면 컴포넌트
│   │   ├── LoginScreen.tsx
│   │   ├── ModelListScreen.tsx
│   │   ├── ModelDetailScreen.tsx
│   │   └── ProfileScreen.tsx
│   ├── components/       # 재사용 컴포넌트
│   │   └── ModelCard.tsx
│   ├── navigation/       # 네비게이션 설정
│   │   └── AppNavigator.tsx
│   ├── services/         # API 클라이언트
│   │   └── api.ts
│   ├── context/          # React Context
│   │   └── AuthContext.tsx
│   ├── types/            # TypeScript 타입
│   │   └── index.ts
│   └── utils/            # 유틸리티 함수
├── App.tsx               # 앱 진입점
└── package.json
```

## 설치 및 실행

### 1. 의존성 설치

```bash
cd mobile
npm install
```

### 2. 환경 변수 설정

`.env` 파일이 이미 설정되어 있습니다:
```
API_BASE_URL=http://blueming-ai-env.eba-gdfew9bx.ap-northeast-2.elasticbeanstalk.com
```

### 3. 개발 서버 실행

```bash
npm start
```

실행 옵션:
- `a` - Android 에뮬레이터에서 실행
- `i` - iOS 시뮬레이터에서 실행 (Mac만 가능)
- QR 코드 스캔 - 실제 기기에서 Expo Go 앱으로 실행

### 4. 실기기에서 테스트

1. 스마트폰에 **Expo Go** 앱 설치
   - [Android - Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - [iOS - App Store](https://apps.apple.com/app/expo-go/id982107779)

2. 같은 WiFi 네트워크에 연결

3. 터미널에 표시된 QR 코드 스캔

## 주요 기능

### 1. 인증
- Google OAuth 로그인 (예정)
- JWT 토큰 기반 인증
- 자동 로그인
- 로그아웃

### 2. 모델 리스트
- Popular / Recent 탭
- 무한 스크롤 (페이지네이션)
- Pull to Refresh
- 모델 카드 (썸네일, 제목, 통계)

### 3. 모델 상세
- 이미지 갤러리
- 좋아요 기능
- 프롬프트 리스트
- 태그 표시

### 4. 프로필
- 내 정보 표시
- 내가 만든 모델 리스트
- 로그아웃

## API 연동

기존 백엔드 API 사용:
- **Base URL**: `http://blueming-ai-env.eba-gdfew9bx.ap-northeast-2.elasticbeanstalk.com`

주요 엔드포인트:
- `GET /api/models/popular` - 인기 모델
- `GET /api/models` - 최신 모델
- `GET /api/models/:id` - 모델 상세
- `GET /api/models/my` - 내 모델
- `POST /api/models/:id/like` - 좋아요 토글
- `GET /api/users/me` - 내 프로필

## 빌드

### Android APK

```bash
npx eas build --platform android --profile preview
```

### iOS IPA

```bash
npx eas build --platform ios --profile preview
```

## 개발 가이드

### 📋 개발 문서 (반드시 읽어주세요!)

**작업 시작 전 필수 확인:**

1. **[`TODO.md`](./TODO.md)** - 해야 할 작업 목록 및 우선순위
2. **[`claude.md`](./claude.md)** - 개발 워크플로우, Theme 시스템, 스타일 가이드

### conference(front) 폴더 참조

**모든 새 기능 구현 시 반드시 `conference(front)` 폴더의 해당 Vue 컴포넌트를 먼저 확인하고 참고하세요!**

- `conference(front)/src/views/` → React Native Screens
- `conference(front)/src/components/` → React Native Components
- `conference(front)/src/assets/main.css` → `constants/theme.ts`

### 새로운 화면 추가

1. **TODO.md에서 작업 확인**
2. **conference(front)에서 해당 Vue 파일 확인**
3. `src/screens/`에 화면 컴포넌트 생성
4. `src/types/index.ts`에 네비게이션 타입 추가
5. `src/navigation/AppNavigator.tsx`에 라우트 추가
6. **TODO.md 업데이트**

### 새로운 API 추가

1. **conference(front)/src/services/api.ts 참고**
2. `src/types/index.ts`에 타입 정의
3. `src/services/api.ts`에 API 함수 추가

### 스타일 가이드

**→ [`claude.md`](./claude.md) 및 [`constants/theme.ts`](./constants/theme.ts) 참조**

- Theme 시스템 사용 (Colors, Spacing, Radius, FontSizes, Shadows)
- 다크 모드 기본
- 색상: `#1A1A1D` (배경), `#3B82F6` (Primary)
- 폰트: System Default
- 간격: Spacing 사용 (xs: 4px, sm: 8px, md: 16px, lg: 24px, xl: 32px)

## 트러블슈팅

### "Metro bundler가 시작되지 않음"
```bash
npm start -- --clear
```

### "모듈을 찾을 수 없음"
```bash
rm -rf node_modules
npm install
npm start -- --clear
```

### API 연결 실패
1. `.env` 파일 확인
2. 네트워크 연결 확인
3. 백엔드 서버 상태 확인

## Firebase 연동 (예정)

추후 과제 제출을 위해 Firebase 추가 예정:
- Firebase Authentication (Google 로그인)
- Firebase Firestore (데이터베이스)

## 라이센스

Private Project
