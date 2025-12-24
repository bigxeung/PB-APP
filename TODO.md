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
- [ ] 이미지 다운로드 기능 (선택사항)
- [ ] 예시 프롬프트 복사 기능 (선택사항)
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

#### 4. ProfileScreen 완성
- [ ] 내 모델 목록 표시
- [ ] 생성 히스토리
- [ ] 학습 히스토리
- [ ] 즐겨찾기한 모델
- [ ] 프로필 편집 기능

#### 5. 검색 기능
- [ ] 검색 화면 구현
- [ ] 검색 API 연동
- [ ] 필터링 (태그, 카테고리)
- [ ] 정렬 옵션

#### 6. 공통 컴포넌트 개선
- [ ] ModelCard 컴포넌트 완성
  - [ ] 썸네일 이미지 로딩
  - [ ] 좋아요 버튼
  - [ ] 즐겨찾기 버튼
- [ ] Slider 공통 컴포넌트 제작
- [ ] ImagePicker 공통 컴포넌트 제작
- [ ] Loading Spinner 컴포넌트
- [ ] Empty State 컴포넌트

### 🟢 낮은 우선순위 (Low Priority)

#### 7. 추가 기능
- [ ] 다크 모드 / 라이트 모드 토글
- [ ] 앱 설정 화면
- [ ] 알림 기능
- [ ] 이미지 공유 기능
- [ ] 모델 다운로드 기능 (오프라인 사용)

#### 8. 성능 최적화
- [ ] 이미지 lazy loading
- [ ] 무한 스크롤 최적화
- [ ] 메모리 관리 개선
- [ ] 캐싱 전략 구현

#### 9. 에러 처리 및 UX 개선
- [ ] 전역 에러 핸들러
- [ ] 오프라인 모드 지원
- [ ] 재시도 로직
- [ ] 사용자 피드백 (Toast, Snackbar)

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

- [ ] `src/services/api.ts` 파일 확인
- [ ] conference(front)의 `src/services/api.ts` 참고
- [ ] AsyncStorage에서 토큰 가져오기
- [ ] 에러 처리 로직 추가
- [ ] 로딩 상태 관리

### 중요 라이브러리

설치가 필요한 라이브러리:
- [ ] `expo-image-picker` - 이미지 선택
- [ ] `react-native-slider` or `@react-native-community/slider` - 슬라이더
- [ ] `react-native-webview` - WebView (필요시)
- [ ] `react-native-fast-image` - 이미지 최적화 (선택사항)

---

## 📅 업데이트 로그

- **2024-12-24**: TODO 리스트 작성
  - HomeScreen, TrainingScreen, GenerateModal 기본 UI 완료
  - Bottom Tab Navigation 구현 완료
