# Blueming AI Mobile App - TODO List

## 🚀 진행 중 (In Progress)

- [ ] 없음

## ✅ 완료 (Completed)

- [x] 프로젝트 초기 설정
- [x] Theme 시스템 구축 (constants/theme.ts)
- [x] HomeScreen 구현 (히어로 섹션, 모델 리스트)
- [x] TrainingScreen 기본 UI 구현
- [x] GenerateModal 기본 UI 구현
- [x] Bottom Tab Navigation (Home, Training, Profile)
- [x] 로그인 선택사항으로 변경
- [x] **GenerateModal 완성** (모델 선택, API 연동, 슬라이더, 진행률 폴링, 이미지 표시)
- [x] **TrainingScreen 완성** (이미지 피커, S3 업로드, 학습 API 연동, 진행률 폴링)
- [x] **ModelDetailScreen** (이미 완성되어 있었음)
- [x] **ProfileScreen 완성** (4개 탭, 통계, 히스토리 표시)
- [x] API 서비스 완성 (generateAPI, trainingAPI, uploadAPI, communityAPI, promptsAPI)
- [x] TypeScript 타입 정의 (Generation, Training, Upload, Comment, Prompt)

---

## 📋 해야 할 작업 (To Do)

### 🔴 높은 우선순위 (High Priority)

#### ~~1. GenerateModal 완성~~ ✅
- [x] 모델 선택 Picker/Modal 구현
- [x] 내 모델 목록 불러오기 API 연동
- [x] 커뮤니티 모델 목록 불러오기 API 연동
- [x] 이미지 생성 API 연동
- [x] 진행률 폴링 (Polling 방식으로 구현, SSE 대신)
- [x] 생성된 이미지 표시
- [x] 이미지 다운로드 기능 (expo-file-system, expo-media-library 사용)
- [x] 예시 프롬프트 복사 기능 (expo-clipboard 사용)
- [x] 슬라이더 컴포넌트 추가 (Steps, Guidance Scale, LoRA Weight, Images)

#### ~~2. TrainingScreen 완성~~ ✅
- [x] 이미지 선택/업로드 UI 구현
- [x] 이미지 피커 (expo-image-picker)
- [x] 이미지 미리보기 그리드 (가로 스크롤)
- [x] 개별 이미지 삭제 기능
- [x] S3 Presigned URL 받아오기 API 연동
- [x] S3에 이미지 업로드 (진행률 표시)
- [x] 학습 시작 API 연동
- [x] 진행률 폴링 (Polling 방식으로 구현, WebSocket 대신)
- [x] 학습 상태 실시간 업데이트
- [x] 추천 Epochs 자동 계산 로직
- [x] 슬라이더 컴포넌트 추가 (Learning Rate, Epochs, LoRA Rank)

#### ~~3. ModelDetailScreen 구현~~ ✅
- [x] conference(front)/src/views/ModelList.vue의 ModelDetailModal 참고
- [x] 모델 상세 정보 표시
- [x] 썸네일 이미지
- [x] 제목, 설명
- [x] 작성자 정보
- [x] 샘플 이미지 갤러리
- [x] 태그 목록
- [x] 통계 (좋아요, 조회수, 즐겨찾기)
- [x] 좋아요/즐겨찾기 기능
- [x] Generate 버튼 → GenerateModal 열기
- [x] 모델 상세 정보 API 연동

### 🟡 중간 우선순위 (Medium Priority)

#### ~~4. ProfileScreen 완성~~ ✅
- [x] 내 모델 목록 표시 (My Models 탭)
- [x] 생성 히스토리 (Generation 탭)
- [x] 학습 히스토리 (Training 탭)
- [x] 즐겨찾기한 모델 (Favorites 탭)
- [x] 4개 탭 네비게이션
- [x] 통계 카드 (Models, Favorites, Generations 개수)
- [x] 프로필 편집 기능 (닉네임, 프로필 이미지 변경)

#### 5. 검색 기능
- [x] 검색 화면 구현
- [x] 검색 API 연동
- [x] 필터링 (태그, 카테고리)
- [x] 정렬 옵션

#### 6. 공통 컴포넌트 개선
- [x] ModelCard 컴포넌트 완성
- [x] 썸네일 이미지 로딩
- [x] 좋아요 버튼
- [x] 홈화면 태그 필터 중복 선택 가능하게 변경 (태그 + popular/recent 정렬 동시 적용)
- [x] 네비게이션 프로필 뷰에서 설정 아이콘 (이미 오른쪽에 위치)
- [x] 다크 모드 / 라이트 모드 색상 수정 -trining profile 화이트모드 글씨 등등
- [x] 앱뷰 양 옆 여백 일관화(지금 홈 트레이닝 프로필 다 다름)
- [x] generateModal에서 모델 안불러와지는 문제 수정 (model detail에계되야됨)
- [x] Select modal 창이 내려가 있는 문제 / 모델 안불러와지는 문제
- [x] training 창 프론트 처럼 advanced는 접히도록 수정( confrence(fornt) 참고 )
- [x] trianing view learning rate / ephocs 범위 조정 lorarank(16, 32, 64만 선택 가능 기본 32) -> 프론트엔드 참고
- [x] prpfile 밑 컴포넌트 여백 문제
- [x] generate histpry 모델 카드 뷰처럼 수정
- [x] generate history detail 추가 (프론트 참고)
- [x] training history detail 추가 (프론트 참고)
- [x] 프로필에서 favorite과 내 model에서 모델 선택시 홈으로 가진 다음 모델 창이 열리는 문제 해결(프로필 뷰 위에 놓이도록 변경)
- [x] 모델 owner만 가능한 수정버튼
- [x] 모델 수정 기능(public private, 썸네일 수정, 태그 수정, 프롬포트 수정 등 model detail에 있는 모든 기능)
- [x] 모델 detail에 슬라이더 수정 (지금은 이미지 1개 고정인 것 처럼 보임 front 와 같이 수정)
- [x] 홈 모델 리스트 애니메이션 (태그나 검색 시 부자연스럽게 전환되는 문제 수정)
- [x] Loading Spinner 컴포넌트 / 스켈레톤 뷰

- [x] Empty State 컴포넌트

### 🟢 낮은 우선순위 (Low Priority)

#### 7. 추가 기능
- [x] 알림 기능 (expo-notifications, NotificationContext, 푸시 토큰 관리)

#### 8. 성능 최적화
- [x] 이미지 lazy loading (React Native Image 기본 지원)
- [x] 무한 스크롤 최적화 (이미 구현됨)
- [x] 메모리 관리 개선 (FlatList 최적화, 이미지 캐시 관리, 앱 백그라운드 정리)
- [x] 캐싱 전략 구현 (메모리 캐시 5분 TTL)

#### 9. 에러 처리 및 UX 개선
- [x] 전역 에러 핸들러 (API interceptor)
- [x] 오프라인 모드 지원 (NetworkContext, Toast 알림)
- [x] 재시도 로직 (자동 재시도 2회, 지수 백오프)
- [x] 사용자 피드백 (Toast, Snackbar) (ToastContext 구현)

---

## 🐛 버그 수정 (Bug Fixes)

- [ ] 없음

---

## 📝 참고사항

### conference(front) 폴더 매핑

구현 시 **반드시** conference(front) 폴더의 해당 컴포넌트를 먼저 확인하고 참고할 것!

| 구현할 기능 | 참고 파일 |
|------------|----------|
| GenerateModal 완성 | `conference(front)/src/components/generate/GenerateModal.vue` |
| TrainingScreen 완성 | `conference(front)/src/views/Training.vue` |
| TrainingForm | `conference(front)/src/components/training/TrainingForm.vue` |
| ModelDetailScreen | `conference(front)/src/components/models/ModelDetailModal.vue` |
| ProfileScreen | `conference(front)/src/views/Profile.vue` |
| SearchScreen | `conference(front)/src/views/Search.vue` |

### API 연동 체크리스트

- [x] `src/services/api.ts` 파일 확인
- [x] conference(front)의 `src/services/api.ts` 참고
- [x] AsyncStorage에서 토큰 가져오기
- [x] 에러 처리 로직 추가
- [x] 로딩 상태 관리
- [x] generateAPI, trainingAPI, uploadAPI, communityAPI, promptsAPI 구현

### 중요 라이브러리

설치 완료된 라이브러리:
- [x] `expo-image-picker` - 이미지 선택 (설치 완료)
- [x] `@react-native-community/slider` - 슬라이더 (설치 완료)

추가로 필요한 라이브러리 (선택사항):
- [ ] `react-native-fast-image` - 이미지 최적화 (선택사항)
- [ ] `@react-native-async-storage/async-storage` - 로컬 저장소 (이미 사용중)

---

## 📅 업데이트 로그

- **2024-12-25 (저녁)**: 🚀 성능 최적화 및 알림 기능 완성
  - **오프라인 모드 지원**: NetworkContext 구현, 네트워크 상태 감지 및 Toast 알림
  - **메모리 관리 개선**:
    - FlatList 최적화 props 추가 (initialNumToRender, maxToRenderPerBatch, windowSize)
    - 이미지 캐시 관리 시스템 (src/utils/memory.ts)
    - useMemoryCleanup, useAppStateMemoryCleanup 훅 구현
    - 앱 백그라운드 진입 시 자동 메모리 정리
  - **푸시 알림 기능**:
    - expo-notifications 설치 및 설정
    - NotificationContext 구현 (권한 요청, 토큰 관리, 알림 수신)
    - app.json에 notification 플러그인 설정 추가
  - **모든 낮은 우선순위 작업 완료!** 🎉

- **2024-12-25 (오후)**: 🎨 UI/UX 개선
  - **태그 필터 개선**: 태그 필터와 popular/recent 정렬을 동시에 적용 가능하도록 수정
  - filterByTags API에 sortBy 파라미터 추가
  - 사용자가 태그 선택 + 정렬 옵션을 자유롭게 조합 가능

- **2024-12-25 (오전)**: ✨ GenerateModal 추가 기능 완성
  - **이미지 다운로드 기능**: expo-file-system, expo-media-library를 사용하여 생성된 이미지를 갤러리에 저장
  - **예시 프롬프트 복사 기능**: expo-clipboard를 사용하여 모델의 예시 프롬프트를 클립보드에 복사
  - 모델 선택 시 자동으로 모델 상세 정보(prompts 포함) 로드
  - UI 개선: Example Prompts 섹션 추가, 이미지 다운로드 버튼 추가

- **2024-12-24 (오후)**: 🎉 핵심 기능 완성
  - **GenerateModal 완성**: 모델 선택 모달, API 연동, 슬라이더, 진행률 폴링, 이미지 표시
  - **TrainingScreen 완성**: 이미지 피커, S3 업로드, 학습 API 연동, 진행률 폴링, 추천 epochs 계산
  - **ProfileScreen 완성**: 4개 탭 (My Models, Favorites, Generation, Training), 통계 카드, 히스토리 표시
  - **API 서비스 완성**: generateAPI, trainingAPI, uploadAPI, communityAPI, promptsAPI
  - **TypeScript 타입 정의 완성**: Generation, Training, Upload, Comment, Prompt 타입
  - **라이브러리 설치**: expo-image-picker, @react-native-community/slider

- **2024-12-24 (오전)**: TODO 리스트 작성
  - HomeScreen, TrainingScreen, GenerateModal 기본 UI 완료
  - Bottom Tab Navigation 구현 완료
  - ModelDetailScreen 확인 (이미 완성되어 있었음)
