# Blueming AI - LoRA Platform Mobile App

React Native (Expo) 기반 AI 이미지 생성 및 LoRA 모델 학습 플랫폼 모바일 애플리케이션

## 📱 주요 기능

### 🔐 인증 시스템
- **Firebase Authentication** 통합
  - Google 소셜 로그인 (OAuth 2.0)
  - 이메일/비밀번호 회원가입 및 로그인
  - 비밀번호 확인 검증
  - 자동 로그인 (AsyncStorage persistence)
- **JWT 토큰** 기반 인증
- Firebase ID Token → Backend JWT 교환 방식

### 🎨 모델 탐색 및 관리
- **홈 화면**
  - Popular / Recent 탭 전환
  - 태그 기반 필터링 (복수 선택 가능)
  - 검색 기능 (실시간 검색)
  - 무한 스크롤 (페이지네이션)
  - Pull to Refresh
  - 스켈레톤 로딩 UI
  - 애니메이션 전환

- **모델 상세**
  - 이미지 갤러리 (슬라이드)
  - 좋아요 기능 (Optimistic Update)
  - 댓글 작성/삭제
  - 프롬프트 리스트
  - 태그 표시
  - 모델 편집 (Owner만 가능)
  - Generate 버튼

### 🖼️ 이미지 생성 (Generation)
- **GenerateModal**
  - 내 모델 / 커뮤니티 모델 선택
  - 프롬프트 입력 (예시 프롬프트 복사 기능)
  - 고급 설정 (Steps, Guidance Scale, LoRA Weight, 이미지 개수)
  - 실시간 진행률 표시 (폴링 방식)
  - 생성된 이미지 표시 및 다운로드
  - 갤러리 저장 (expo-media-library)

### 🎓 모델 학습 (Training)
- **TrainingScreen**
  - 이미지 선택 및 업로드 (expo-image-picker)
  - 이미지 미리보기 그리드
  - S3 Presigned URL 업로드
  - 학습 파라미터 설정 (Learning Rate, Epochs, LoRA Rank)
  - 추천 Epochs 자동 계산
  - 실시간 진행률 표시 (폴링 방식)
  - Advanced Settings 접기/펼치기

### 👤 프로필 (Profile)
- **4개 탭 네비게이션**
  - My Models: 내가 만든 모델
  - Favorites: 좋아요한 모델
  - Generation: 생성 히스토리
  - Training: 학습 히스토리
- **통계 카드** (Models, Favorites, Generations 개수)
- **프로필 편집** (닉네임, 프로필 이미지)
- **히스토리 상세 모달**

### 🌐 Firebase 연동
- **Firebase Authentication**
  - Email/Password 인증
  - Google OAuth 인증
  - AsyncStorage persistence
- **Firebase Firestore**
  - 사용자 프로필 동기화
  - 모델 데이터 캐싱
  - 생성/학습 히스토리 저장
  - 즐겨찾기 실시간 동기화

### ⚡ 성능 최적화
- **메모리 관리**
  - FlatList 최적화 (initialNumToRender, maxToRenderPerBatch)
  - 이미지 캐시 관리
  - 앱 백그라운드 시 자동 정리
- **네트워크 최적화**
  - API 응답 캐싱 (5분 TTL)
  - 자동 재시도 (지수 백오프)
  - 오프라인 감지 및 Toast 알림
- **Optimistic Update**
  - 좋아요 즉시 반영
  - 실패 시 자동 롤백

### 🔔 알림 시스템
- **expo-notifications** 통합
- 푸시 알림 권한 요청
- 알림 수신 처리

## 🛠 기술 스택

### Core
- **React Native** (Expo SDK 54)
- **TypeScript**
- **React Navigation** (Bottom Tabs + Stack)

### State Management
- **React Context API**
  - AuthContext (인증 상태)
  - ThemeContext (다크/라이트 모드)
  - ToastContext (알림 메시지)
  - NetworkContext (네트워크 상태)
  - NotificationContext (푸시 알림)

### Backend Integration
- **Axios** (HTTP 클라이언트)
- **AsyncStorage** (로컬 저장소)
- JWT Token 인증

### Firebase
- **Firebase JS SDK** (v11.x)
  - firebase/auth
  - firebase/firestore
- React Native persistence (AsyncStorage)

### UI/UX
- **expo-image-picker** (이미지 선택)
- **expo-file-system** (파일 관리)
- **expo-media-library** (갤러리 저장)
- **expo-clipboard** (클립보드)
- **@react-native-community/slider** (슬라이더)
- **@react-native-community/netinfo** (네트워크 감지)
- **expo-notifications** (푸시 알림)

## 📁 프로젝트 구조

```
LoRA-Platform-Front/
├── src/
│   ├── screens/              # 화면 컴포넌트
│   │   ├── HomeScreen.tsx           # 메인 홈 (모델 탐색)
│   │   ├── LoginScreen.tsx          # 로그인 (Google/Email)
│   │   ├── TrainingScreen.tsx       # 모델 학습
│   │   ├── ProfileScreen.tsx        # 프로필 (4개 탭)
│   │   └── SearchScreen.tsx         # 검색
│   │
│   ├── components/           # 재사용 컴포넌트
│   │   ├── ModelCard.tsx            # 모델 카드
│   │   ├── ModelDetailModal.tsx     # 모델 상세 모달
│   │   ├── TopNavigation.tsx        # 상단 네비게이션
│   │   ├── EmptyState.tsx           # 빈 상태 UI
│   │   ├── LoadingSpinner.tsx       # 로딩 스피너
│   │   ├── generate/
│   │   │   ├── GenerateModal.tsx           # 이미지 생성 모달
│   │   │   └── GenerationHistoryDetailModal.tsx
│   │   └── profile/
│   │       ├── ProfileEditModal.tsx        # 프로필 편집
│   │       └── TrainingHistoryDetailModal.tsx
│   │
│   ├── navigation/           # 네비게이션 설정
│   │   └── AppNavigator.tsx
│   │
│   ├── services/             # API 서비스
│   │   ├── api.ts                   # Backend API
│   │   ├── firebaseAuth.ts          # Firebase Auth
│   │   └── firestoreService.ts      # Firestore CRUD
│   │
│   ├── context/              # React Context
│   │   ├── AuthContext.tsx
│   │   ├── ThemeContext.tsx
│   │   ├── ToastContext.tsx
│   │   ├── NetworkContext.tsx
│   │   └── NotificationContext.tsx
│   │
│   ├── hooks/                # Custom Hooks
│   │   ├── useMemoryCleanup.ts
│   │   └── usePrefetchImages.ts
│   │
│   ├── config/               # 설정 파일
│   │   └── firebase.ts              # Firebase 초기화
│   │
│   ├── types/                # TypeScript 타입
│   │   └── index.ts
│   │
│   └── utils/                # 유틸리티
│       └── memory.ts                # 메모리 관리
│
├── constants/
│   └── theme.ts              # Theme 시스템
│
├── App.tsx                   # 앱 진입점
├── TODO.md                   # 작업 목록
├── CLAUDE.md                 # 개발 가이드
└── api.txt                   # API 명세서
```

## 🚀 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env` 파일 생성:
```env
API_BASE_URL=https://d3ka730j70ocy8.cloudfront.net
GOOGLE_WEB_CLIENT_ID=your-web-client-id
GOOGLE_IOS_CLIENT_ID=your-ios-client-id
GOOGLE_ANDROID_CLIENT_ID=your-android-client-id
```

### 3. Firebase 설정

`src/config/firebase.ts`에서 Firebase config 확인:
```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  // ...
};
```

### 4. 개발 서버 실행

```bash
npm start
```

실행 옵션:
- `a` - Android 에뮬레이터
- `i` - iOS 시뮬레이터 (Mac만 가능)
- `r` - 앱 새로고침
- `c` - Metro 캐시 삭제 및 재시작

### 5. 실기기에서 테스트

1. **Expo Go** 앱 설치
   - [Android - Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - [iOS - App Store](https://apps.apple.com/app/expo-go/id982107779)

2. 같은 WiFi 네트워크에 연결

3. QR 코드 스캔

## 🔌 API 연동

### Base URL
```
https://d3ka730j70ocy8.cloudfront.net
```

### 주요 엔드포인트

#### Authentication
- `POST /api/auth/firebase` - Firebase ID Token 인증
- `POST /api/auth/test` - 테스트 로그인
- `GET /api/users/me` - 내 프로필

#### Models
- `GET /api/models/popular` - 인기 모델
- `GET /api/models/public` - 공개 모델
- `GET /api/models/filter?tags=...&sort=...` - 태그 필터링
- `GET /api/models/search?query=...` - 검색
- `GET /api/models/{id}` - 모델 상세
- `GET /api/models/my` - 내 모델
- `POST /api/models/{id}/like` - 좋아요 토글
- `PUT /api/models/{id}` - 모델 수정

#### Community
- `GET /api/models/likes` - 좋아요한 모델
- `GET /api/models/{id}/comments` - 댓글 목록
- `POST /api/models/{id}/comments` - 댓글 작성
- `DELETE /api/models/{id}/comments/{commentId}` - 댓글 삭제

#### Generation
- `POST /api/generate` - 이미지 생성 시작
- `GET /api/generate/{jobId}` - 생성 진행률
- `GET /api/generate/history` - 생성 히스토리

#### Training
- `POST /api/training` - 학습 시작
- `GET /api/training/{jobId}` - 학습 진행률
- `GET /api/training/history` - 학습 히스토리
- `GET /api/upload/presigned-url` - S3 업로드 URL

## 🎨 스타일 가이드

**→ [`CLAUDE.md`](./CLAUDE.md) 및 [`constants/theme.ts`](./constants/theme.ts) 참조**

### Theme 시스템
```typescript
import { Colors, Spacing, Radius, FontSizes, Shadows } from '@/constants/theme';

// Colors
Colors.primary        // #3B82F6 - Vibrant Blue
Colors.bgDark         // #1A1A1D - Deep Space
Colors.bgCard         // #28282B - Raised Card
Colors.textPrimary    // #FFFFFF - Pure White

// Spacing
Spacing.xs  // 4px
Spacing.sm  // 8px
Spacing.md  // 16px
Spacing.lg  // 24px
Spacing.xl  // 32px

// Shadows
Shadows.md    // 중간 그림자
Shadows.glow  // Blue Glow 효과
```

### 디자인 원칙
- **다크 테마 기본**
- **Vibrant Blue (#3B82F6)** Primary 색상
- **일관된 간격** (Spacing 사용)
- **CommonStyles 재사용**

## 📋 개발 가이드

### 작업 시작 전 필수 확인

1. **[`TODO.md`](./TODO.md)** - 작업 목록 및 우선순위
2. **[`CLAUDE.md`](./CLAUDE.md)** - 개발 워크플로우
3. **`conference(front)` 폴더** - Vue 컴포넌트 참고

### conference(front) 참조 매핑

| conference(front) | Mobile App | 설명 |
|-------------------|------------|------|
| `src/views/ModelList.vue` | `HomeScreen.tsx` | 메인 홈 |
| `src/views/Training.vue` | `TrainingScreen.tsx` | 학습 |
| `src/views/Profile.vue` | `ProfileScreen.tsx` | 프로필 |
| `src/components/generate/GenerateModal.vue` | `GenerateModal.tsx` | 생성 |
| `src/assets/main.css` | `constants/theme.ts` | 스타일 |

### 새 화면 추가 절차

1. TODO.md에서 작업 확인
2. conference(front)에서 해당 Vue 파일 확인
3. `src/screens/`에 컴포넌트 생성
4. `src/types/index.ts`에 타입 추가
5. `src/navigation/AppNavigator.tsx`에 라우트 추가
6. TODO.md 업데이트

## 🐛 트러블슈팅

### Metro bundler 문제
```bash
npm start -- --clear
# 또는
r (앱 실행 중 r 키)
```

### 모듈을 찾을 수 없음
```bash
rm -rf node_modules
npm install
npm start -- --clear
```

### API 연결 실패
1. `.env` 파일 확인
2. Firebase 설정 확인
3. 네트워크 연결 확인
4. 백엔드 서버 상태 확인 (https://d3ka730j70ocy8.cloudfront.net)

### 캐시 문제
```bash
# Metro 캐시 삭제
npm start -- --clear

# 또는 코드에서
import { clearApiCache } from './src/services/api';
clearApiCache();
```

### Firebase Auth 에러
- Firebase Console에서 Email/Password, Google 로그인 활성화 확인
- `google-services.json` (Android) 또는 `GoogleService-Info.plist` (iOS) 확인

## 📦 빌드

### Android APK
```bash
npx eas build --platform android --profile preview
```

### iOS IPA
```bash
npx eas build --platform ios --profile preview
```

## 🎓 과제 요구사항 충족

### ✅ Frontend Web App
- Vue.js (conference(front) 폴더)

### ✅ Mobile App
- React Native (현재 프로젝트)

### ✅ Firebase Authentication
- Google 소셜 로그인
- Email/Password 인증

### ✅ Firebase Database
- Firestore 연동
- 실시간 데이터 동기화

### ✅ 통합
- WebApp과 Mobile App이 같은 Firebase 프로젝트 사용
- WebApp 배포: JCloud (Firebase Hosting 아님)

## 📝 Git 커밋 컨벤션

```
Feat: 새로운 기능 추가
Fix: 버그 수정
Docs: 문서 수정
Refactor: 코드 리팩토링
Style: 코드 스타일 변경
Perf: 성능 개선
Test: 테스트 코드
Chore: 빌드 설정 등
```

## 📄 라이센스

Private Project - University Assignment

## 👥 팀

- Frontend (Web): Vue.js
- Frontend (Mobile): React Native
- Backend: Spring Boot (용재님)
- Firebase: my-lora-auth

---

**Last Updated**: 2025-12-26
