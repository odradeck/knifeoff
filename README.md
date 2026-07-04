# 빼박결재 KNIFEOFF™ 🔪

> **팀장이 거절할 수 없는 내부 전자결재 시스템**
> _“상신하는 순간, 승인은 이미 정해져 있다.”_

바이브코딩 대회용 POC. 겉모습은 진지한 대기업 전자결재 그룹웨어인데,
알고 보면 팀장이 **구조적으로 거절할 수 없도록** 설계된 장난입니다.

| 등장인물 | 역할 |
|---|---|
| 🧑‍💻 **나칼퇴 사원** | 연차·칼퇴를 상신하는 직원 |
| 🧑‍💼 **정승인 팀장** | 결재하는 팀장 (성함부터 이미 ‘승인’) |

---

## ✨ 핵심 기능

### 직원 뷰
1. **목적 선택** — 연차 🌴 / 칼퇴 🔪
2. **질문 위저드** — 날짜·사유·**솔직한 속마음(막 적어도 됨)**·절실도
3. **AI 자동 생성**
   - 개조식 근거 5종 (법·재무·생산성·사유·관리) + 가짜 사내 통계
   - 🌟 **「기안 취지」읍소문** — 방금 적은 (무례하고 대충인) 사유를 **LLM이 절절하고 공손한 극존칭 문장**으로 재작성
4. **미리보기 → 상신**

> **예시** — 입력: `그냥 집 가고싶음 ㅋㅋ 넷플 신작 정주행 해야됨`
> → 출력: _“존경하는 팀장님께, 소중한 시간을 할애하여 주셔서 깊이 감사드립니다. … 부디 저의 정시 퇴근 요청을 너그러이 허락해 주실 것을 간곡히 청하옵니다.”_

### 팀장 뷰 — 거절이 불가능한 이유
- 🌴 **연차 거절** → `✋ 거절` 버튼이 커서를 피해 **화면 곳곳으로 미끄러지며 영원히 도망칩니다.** (가만히 둬도 스스로 배회 · 절대 화면 밖으로 사라지지 않음) 약 올리는 말풍선은 덤.
- 🔪 **칼퇴 거절** → 클릭하면 **풀 수 없는 수학 문제**(`x = x + 1`, 리만 가설 반례 등). 모든 답 오답 처리, 유일한 탈출구는 “포기하고 승인”.
- **승인 시** → 빨간 `承認` 도장이 쾅! + 컨페티 🎉

---

## 🛠 기술 스택

- **React 18 + Vite** (프레임워크·SPA)
- **Vercel Serverless Function** (`/api/persuade`) — OpenRouter LLM 호출 프록시
  - **API 키는 서버 환경변수에만** 존재 → 브라우저에 노출되지 않음
  - LLM 실패 시 자동으로 템플릿 문장 폴백 → 데모가 절대 깨지지 않음
- 저장: **localStorage** (키 `knifeoff:documents:v1`) · 별도 백엔드 없음

```
src/
  App.jsx                앱 루트(라우팅·상태·저장소 동기화)
  components/            TopBar · Login · DocView(전자결재 문서)
  employee/EmployeeApp   위저드 → 생성 → 미리보기 → 상신
  leader/                LeaderApp · RunawayButton · MathModal
  data.js generate.js store.js ui.js styles.css
api/
  persuade.js            Vercel 서버리스 함수 (POST /api/persuade)
  _core.js               프롬프트 · OpenRouter 호출 · 폴백 (공용)
```

---

## ▶️ 로컬 실행

```bash
npm install

# API 키 설정 (LLM 읍소문 생성용)
cp .env.example .env.local   # 후 값 입력  (이미 .env.local 이 있다면 생략)

npm run dev                  # → http://localhost:5173
```

`.env.local` 없이도 실행됩니다 — 이 경우 「기안 취지」는 템플릿 문장으로 대체됩니다.

---

## 🚀 Vercel 배포

1. GitHub에 푸시하고 Vercel에서 Import (프레임워크 **Vite** 자동 감지) — 또는 `vercel` CLI.
2. **환경변수 등록** (Project → Settings → Environment Variables):

   | Key | Value |
   |---|---|
   | `OPENROUTER_API_KEY` | `sk-or-v1-...` (본인 OpenRouter 키) |
   | `OPENROUTER_MODEL` | `openai/gpt-4o-mini` (선택, 기본값) |

3. Deploy. `/api/persuade` 서버리스 함수가 LLM 호출을 처리합니다.

> ⚠️ **보안**: `.env.local` 은 git에 커밋되지 않습니다(`.gitignore`). 채팅으로 공유된 키는 대회 후 **반드시 재발급(rotate)** 하세요.

---

## 🎬 데모 시나리오 (한 브라우저)

직원 로그인 → 사유 대충 입력 → AI가 읍소문 생성 → 상신 →
완료화면 **“팀장 뷰에서 확인하기”** → 결재함에서 **거절 시도** → 결국 승인 😇

상단 **초기화** 버튼으로 스토리지를 리셋해 반복 시연할 수 있습니다.

_codename: **knifeoff** (칼퇴)_ 🔪
