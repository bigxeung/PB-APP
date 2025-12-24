# Blueming AI Mobile App - Development Guide

이 문서는 Blueming AI 모바일 앱의 개발 가이드입니다.

## 목차
- [📋 TODO 리스트 참조](#-todo-리스트-참조)
- [⚠️ 개발 워크플로우 (필독)](#️-개발-워크플로우-필독)
- [참고 폴더 구조](#참고-폴더-구조)
- [Theme 시스템 개요](#theme-시스템-개요)
- [색상 (Colors)](#색상-colors)
- [간격 (Spacing)](#간격-spacing)
- [타이포그래피 (Typography)](#타이포그래피-typography)
- [그림자 (Shadows)](#그림자-shadows)
- [공통 스타일 (Common Styles)](#공통-스타일-common-styles)
- [사용 예시](#사용-예시)

---

## 📋 TODO 리스트 참조

### 🔥 작업 시작 전 필수 확인!

**모든 작업을 시작하기 전에 [`TODO.md`](./TODO.md) 파일을 먼저 확인하세요.**

- **우선순위가 높은 작업**부터 진행
- **conference(front) 참고 파일** 매핑 테이블 확인
- **API 연동** 체크리스트 따르기
- 작업 완료 후 TODO.md 업데이트

### 현재 진행 상황

- ✅ 완료: HomeScreen, TrainingScreen 기본 UI, GenerateModal 기본 UI, Bottom Tab Navigation
- 🚧 진행 중: [`TODO.md`](./TODO.md) 참조
- ⏳ 예정: GenerateModal 완성, TrainingScreen 완성, ModelDetailScreen 구현

**→ 자세한 내용은 [`TODO.md`](./TODO.md) 파일을 확인하세요!**

---

## ⚠️ 개발 워크플로우 (필독)

### 🚨 중요: 작업 시작 전 필수 절차

**작업 시작 전 반드시 다음 2가지를 확인하세요:**

1. **[`TODO.md`](./TODO.md)** - 무엇을 구현할지, 우선순위는 무엇인지 확인
2. **`conference(front)` 폴더** - 해당 컴포넌트 구조 및 모바일 뷰 참고

**모든 컴포넌트/화면을 만들기 전에 반드시 `conference(front)` 폴더의 해당 컴포넌트 구조를 먼저 확인하고 view의 모바일 뷰를 참고해야 합니다.**

#### 작업 순서

1. **참고 파일 확인** (필수)
   ```bash
   # 만들려는 기능과 관련된 참고 파일 찾기
   conference(front)/src/views/          # 화면 (Screen)
   cpmference(front)/src/components/     # 컴포넌트
   conference(front)/src/assets/         # 스타일
   ```

2. **구조 분석**
   - Vue 컴포넌트의 구조, props, state 파악
   - CSS 스타일링 방식 확인
   - 사용된 컴포넌트 및 라이브러리 확인
   - 애니메이션 및 인터랙션 방식 파악

3. **React Native로 변환 계획**
   - Vue → React Native 컴포넌트 매핑
   - CSS → StyleSheet 변환 계획
   - 웹 전용 기능 → 모바일 대안 찾기
   - 애니메이션: CSS → Animated API 변환

4. **구현**
   - `constants/theme.ts`의 스타일 시스템 사용
   - 참고 파일의 디자인 패턴 유지
   - 모바일 UX 최적화

5. **검증**
   - 참고 파일과 기능 동일성 확인
   - 모바일 환경 테스트

#### 예시: ModelCard 컴포넌트 만들기

```bash
# ❌ 잘못된 방법
바로 src/components/ModelCard.tsx 작성 시작

# ✅ 올바른 방법
1. conference(front)/src/components/models/ModelCard.vue 먼저 읽기
2. 어떤 props를 받는지 확인
3. 어떤 이벤트를 emit하는지 확인
4. CSS 스타일 패턴 파악
5. 그 후 React Native로 변환하여 작성
```

### 참고 폴더 매핑

| conference(front) | Mobile App | 설명 |
|------------|-----------|------|
| `src/views/*.vue` | `src/screens/*Screen.tsx` | 화면 컴포넌트 |
| `src/components/**/*.vue` | `src/components/**/*.tsx` | 재사용 컴포넌트 |
| `src/assets/main.css` | `constants/theme.ts` | 스타일 시스템 |
| `src/stores/*.ts` | `src/context/*Context.tsx` | 상태 관리 |
| `src/services/api.ts` | `src/services/api.ts` | API 서비스 |
| `src/composables/*.ts` | `src/hooks/*.ts` | 커스텀 훅 |

---

## 참고 폴더 구조

### Views (화면)
```
conference(front)/src/views/
├── ModelList.vue          → HomeScreen.tsx (메인 홈 화면)
├── ModelDetail.vue        → ModelDetailScreen.tsx
├── Training.vue           → TrainingScreen.tsx
├── Profile.vue            → ProfileScreen.tsx
├── Login.vue              → LoginScreen.tsx
└── Search.vue             → SearchScreen.tsx
```

### Components (컴포넌트)
```
conference(front)/src/components/
├── models/
│   ├── ModelCard.vue              → ModelCard.tsx
│   ├── ModelDetailModal.vue       → ModelDetailModal.tsx
│   └── ModelDetailSkeleton.vue    → ModelCardSkeleton.tsx
├── training/
│   ├── TrainingForm.vue
│   ├── TrainingHistory.vue
│   └── TrainingHistoryDetailModal.vue
├── profile/
│   ├── ProfileHeader.vue
│   ├── FavoritesTab.vue
│   ├── HistoryTab.vue
│   └── MyModelsTab.vue
├── generate/
│   ├── GenerateModal.vue
│   └── GenerateHistoryDetailModal.vue
└── Navigation.vue                 → Bottom Tab Navigator
```

### 주요 참고 파일

#### 1. 화면 레이아웃
- **ModelList.vue**: 히어로 섹션, 검색, 필터, 그리드 레이아웃
- **Profile.vue**: 프로필 헤더, 탭 네비게이션
- **Training.vue**: 폼 레이아웃, 파일 업로드

#### 2. 카드 컴포넌트
- **ModelCard.vue**: 이미지, 텍스트, 좋아요/조회수 표시
- **ModelDetailModal.vue**: 상세 정보 모달

#### 3. 스타일링
- **main.css**: 모든 색상, 간격, 타이포그래피 정의
  - CSS Variables → Theme.ts 변환됨
  - Utility Classes → CommonStyles 변환됨

---

## Theme 시스템 개요

`constants/theme.ts` 파일은 앱 전체에서 사용되는 디자인 토큰을 정의합니다.
conference(front)의 `main.css`를 기반으로 React Native에 맞게 변환되었습니다.

### Import 방법

```typescript
import { Colors, Spacing, Radius, Theme } from '@/constants/theme';
// 또는 개별 import
import { Colors } from '@/constants/theme';
```

---

## 색상 (Colors)

### Primary Colors
```typescript
Colors.primary        // #3B82F6 - Vibrant Blue
Colors.primaryDark    // #2563EB - Darker Vibrant Blue
Colors.accent         // #3B82F6 - Vibrant Blue
```

### Background Colors
```typescript
Colors.bgDark         // #1A1A1D - Deep Space (메인 배경)
Colors.bgCard         // #28282B - Raised Card (카드 배경)
Colors.bgHover        // #3A3A3D - Hover light
Colors.border         // #4A4A4F - Visible Border
```

### Text Colors
```typescript
Colors.textPrimary    // #FFFFFF - Pure White
Colors.textSecondary  // #BDBDBD - Lighter Gray
Colors.textMuted      // #828282 - Muted Gray
```

### Status Colors
```typescript
Colors.success        // #22c55e - Green
Colors.error          // #ef4444 - Red
Colors.warning        // #f59e0b - Amber
```

### Light Theme
라이트 테마는 향후 구현을 위해 `Colors.light` 객체에 정의되어 있습니다.

---

## 간격 (Spacing)

일관된 간격을 위한 값들입니다.

```typescript
Spacing.xs      // 4px
Spacing.sm      // 8px
Spacing.md      // 16px
Spacing.lg      // 24px
Spacing.xl      // 32px
Spacing['2xl']  // 48px
```

### Border Radius
```typescript
Radius.sm       // 8px
Radius.md       // 12px
Radius.lg       // 16px
Radius.xl       // 24px
Radius.full     // 9999px (원형)
```

---

## 타이포그래피 (Typography)

### Font Sizes
```typescript
FontSizes.xs        // 12px
FontSizes.sm        // 14px
FontSizes.base      // 16px
FontSizes.lg        // 18px
FontSizes.xl        // 20px
FontSizes['2xl']    // 24px
FontSizes['3xl']    // 30px
FontSizes['4xl']    // 36px
```

### Font Weights
```typescript
FontWeights.normal      // '400'
FontWeights.medium      // '500'
FontWeights.semibold    // '600'
FontWeights.bold        // '700'
FontWeights.extrabold   // '800'
```

---

## 그림자 (Shadows)

React Native에서 사용 가능한 그림자 스타일입니다.

```typescript
Shadows.sm    // 작은 그림자
Shadows.md    // 중간 그림자
Shadows.lg    // 큰 그림자
Shadows.glow  // Blue Glow 효과
```

각 그림자 객체는 `shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius`, `elevation` 속성을 포함합니다.

---

## 공통 스타일 (Common Styles)

자주 사용되는 스타일 패턴들이 미리 정의되어 있습니다.

### Buttons
```typescript
CommonStyles.button           // 기본 버튼
CommonStyles.buttonPrimary    // Primary 버튼 (파란색)
CommonStyles.buttonSecondary  // Secondary 버튼 (회색)
CommonStyles.buttonSmall      // 작은 버튼
CommonStyles.buttonLarge      // 큰 버튼
```

### Cards
```typescript
CommonStyles.card       // 기본 카드
CommonStyles.cardSmall  // 작은 카드
```

### Inputs
```typescript
CommonStyles.input         // 기본 입력 필드
CommonStyles.inputFocused  // 포커스된 입력 필드
```

### Text
```typescript
CommonStyles.textPrimary    // Primary 텍스트
CommonStyles.textSecondary  // Secondary 텍스트
CommonStyles.textMuted      // Muted 텍스트
```

### Layout
```typescript
CommonStyles.container     // 기본 컨테이너
CommonStyles.row           // Row 레이아웃
CommonStyles.column        // Column 레이아웃
CommonStyles.center        // 중앙 정렬
CommonStyles.spaceBetween  // Space Between 정렬
```

### Badges
```typescript
CommonStyles.badge          // 기본 배지
CommonStyles.badgePrimary   // Primary 배지
CommonStyles.badgeSuccess   // Success 배지
CommonStyles.badgeError     // Error 배지
CommonStyles.badgeWarning   // Warning 배지
```

### Avatar
```typescript
CommonStyles.avatar       // 기본 아바타 (40x40)
CommonStyles.avatarSmall  // 작은 아바타 (32x32)
CommonStyles.avatarLarge  // 큰 아바타 (56x56)
```

### Other
```typescript
CommonStyles.divider  // 구분선
```

---

## 사용 예시

### 1. 기본 버튼 만들기

```typescript
import { StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Colors, CommonStyles, Shadows } from '@/constants/theme';

function MyButton() {
  return (
    <TouchableOpacity
      style={[
        CommonStyles.button,
        CommonStyles.buttonPrimary,
        Shadows.glow,
        styles.customButton
      ]}
    >
      <Text style={styles.buttonText}>Click Me</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  customButton: {
    marginTop: 20,
  },
  buttonText: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
});
```

### 2. 카드 컴포넌트 만들기

```typescript
import { View, Text, StyleSheet } from 'react-native';
import { CommonStyles, Colors, Spacing, Shadows } from '@/constants/theme';

function MyCard() {
  return (
    <View style={[CommonStyles.card, Shadows.md]}>
      <Text style={CommonStyles.textPrimary}>Card Title</Text>
      <Text style={[CommonStyles.textSecondary, styles.description]}>
        Card description goes here
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  description: {
    marginTop: Spacing.sm,
  },
});
```

### 3. 커스텀 스타일과 조합하기

```typescript
import { StyleSheet } from 'react-native';
import { Colors, Spacing, Radius } from '@/constants/theme';

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.bgDark,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
});
```

### 4. Theme 객체 전체 사용하기

```typescript
import Theme from '@/constants/theme';

const styles = StyleSheet.create({
  container: {
    ...Theme.common.container,
    padding: Theme.spacing.lg,
  },
  primaryButton: {
    ...Theme.common.button,
    ...Theme.common.buttonPrimary,
    ...Theme.shadows.glow,
  },
});
```

---

## Helper Functions

### getSpacing
여러 spacing 값을 배열로 가져옵니다.

```typescript
import { getSpacing } from '@/constants/theme';

const [top, right, bottom, left] = getSpacing('lg', 'md', 'lg', 'md');
```

### rgba
색상에 투명도를 추가합니다.

```typescript
import { rgba, Colors } from '@/constants/theme';

const semiTransparentBlue = rgba(Colors.primary, 0.5); // #3B82F680
```

---

## Breakpoints

반응형 디자인을 위한 브레이크포인트가 정의되어 있습니다.

```typescript
Breakpoints.mobile    // 480
Breakpoints.tablet    // 768
Breakpoints.desktop   // 1024
```

사용 예시:
```typescript
import { Dimensions } from 'react-native';
import { Breakpoints } from '@/constants/theme';

const { width } = Dimensions.get('window');
const isMobile = width < Breakpoints.tablet;
```

---

## 참고 사항

1. **일관성 유지**: 가능한 한 정의된 Theme 값들을 사용하여 디자인 일관성을 유지하세요.
2. **커스터마이징**: 필요한 경우 Theme 값을 기반으로 커스텀 스타일을 만들 수 있습니다.
3. **플랫폼 대응**: `Shadows`는 iOS와 Android에서 모두 작동하도록 `elevation`도 포함합니다.
4. **라이트 테마**: 현재는 다크 테마만 구현되어 있으며, 라이트 테마는 `Colors.light`에 정의되어 향후 구현 예정입니다.

---

## 추가 정보

- 원본 CSS 파일: `conference(front)/src/assets/main.css`
- Theme 파일 위치: `constants/theme.ts`
- 주요 색상 참고: Vibrant Blue (#3B82F6)를 Primary 색상으로 사용
