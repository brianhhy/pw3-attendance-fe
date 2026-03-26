# PW3 출석 관리 시스템 (pw3-attendance-fe)

서빙고 파워웨이브 3부를 위한 출석 관리 웹 애플리케이션입니다. 학생, 교사, 학부모의 출석을 효율적으로 관리하고 통계를 제공합니다.

---

## 주요 기능

- **출석 체크**: 날짜별 학생 및 교사 출석 현황 조회 및 마킹
- **인원 관리**: 학생 및 교사 정보 등록, 수정, 삭제
- **출석 관리**: 날짜별 출석 기록 조회 및 내보내기
- **통계**: 전체 출석률, 학년별 출석률, 월별 등록 현황 시각화
- **메시지 발송**: SMS / 카카오톡을 통한 학생·학부모 대상 메시지 전송
- **참관 수업 출석**: 이벤트 활성화 시 학부모 참관 수업 출석 체크

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| Framework | Next.js 16.1.0 (App Router) |
| Language | TypeScript 5 |
| UI Library | React 19, Radix UI, shadcn/ui |
| Styling | Tailwind CSS 4 |
| State Management | Zustand 5 |
| HTTP Client | Axios |
| Charts | Chart.js 4, React-ChartJS-2 |
| Icons | Lucide React |

---

## 시작하기

### 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 변수를 설정합니다.

```bash
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)으로 접속합니다.

### 빌드

```bash
npm run build
npm start
```

### 린트

```bash
npm run lint
```

---

## 프로젝트 구조

```
pw3-attendance-fe/
├── app/
│   ├── (shared)/                  # 공통 모듈
│   │   ├── (api)/                 # API 호출 함수
│   │   ├── (components)/          # 공통 컴포넌트 (Header, Sidebar, Search 등)
│   │   ├── (store)/               # Zustand 전역 상태 관리
│   │   ├── (modal)/               # 공통 모달 컴포넌트
│   │   └── utils/                 # 유틸리티 함수
│   ├── components/                # 페이지용 컴포넌트 (출석 폼 등)
│   ├── management/                # 인원/출석 관리 페이지
│   ├── message/                   # 메시지 발송 페이지
│   ├── statistics/                # 통계 페이지
│   ├── parent-attendance/         # 학부모 참관 출석 페이지
│   ├── layout.tsx                 # 루트 레이아웃 (Header + Sidebar)
│   └── page.tsx                   # 홈 (출석 체크)
├── components/ui/                 # shadcn/ui 컴포넌트
├── lib/utils.ts                   # 공통 유틸
└── public/
    ├── fonts/                     # 커스텀 폰트 (GMarket Sans, 학교안심)
    └── images/                    # 로고 등 정적 이미지
```

---

## 페이지 구성

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/` | 출석 체크 | 학생/교사 출석 현황 조회 및 마킹 |
| `/management/people` | 인원 관리 | 학생·교사 정보 등록 및 수정 |
| `/management/attendance` | 출석 관리 | 날짜별 출석 기록 조회·내보내기 |
| `/statistics` | 통계 | 출석률 차트 및 분석 |
| `/message` | 메시지 | SMS/카카오 메시지 발송 |
| `/parent-attendance` | 참관 출석 | 학부모 참관 수업 출석 (이벤트 활성 시) |

---

## 출석 상태

| 상태 | 설명 |
|------|------|
| `ATTEND` | 출석 |
| `LATE` | 지각 |
| `ABSENT` | 결석 |

---

## 참관 수업 이벤트

학부모 참관 수업 출석 페이지는 이벤트가 활성화된 날짜에만 사이드바에 표시됩니다.
이벤트 설정은 헤더의 이벤트 설정 버튼에서 관리하며, `pw3_event` 키로 로컬스토리지에 저장됩니다.
