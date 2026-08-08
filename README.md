# 깐죽이 — 인터넷 배포용

장난기 많고 짓궂은 AI 챗봇. 화면(`index.html`)과 키를 숨기는 작은 서버(`api/chat.js`)로 나뉘어 있어요.

## 파일 구조
```
/
├─ index.html      ← 화면 (키 없음, 안전)
└─ api/
   └─ chat.js      ← 작은 서버 (여기서만 키를 사용)
```
이 폴더 구조 그대로 올려야 작동해요. `api` 폴더 안에 `chat.js`가 들어 있어야 `/api/chat` 주소가 만들어집니다.

## 배포 순서 (Vercel 기준, 무료로 가능)

1. **API 키 발급**
   - console.anthropic.com 에 로그인 → 결제 수단 등록 → API Keys → Create Key
   - `sk-ant-...` 로 시작하는 키가 나와요. **그때 한 번만 보이니 바로 복사**해 두세요.
   - 이 키는 비밀번호예요. 코드에 적지 말고, 깃허브에도 올리지 말고, 아무한테도 보여주지 마세요.

2. **이 폴더를 Vercel에 올리기**
   - vercel.com 에 로그인 → 새 프로젝트 → 이 폴더를 업로드(또는 깃허브 연동).

3. **키를 환경변수로 숨기기** ← 제일 중요
   - Vercel 프로젝트 → Settings → Environment Variables
   - Name: `ANTHROPIC_API_KEY`
   - Value: 발급받은 `sk-ant-...` 키
   - 저장 후 다시 배포(Redeploy).

4. **나온 주소를 친구들한테 공유**
   - `https://내프로젝트.vercel.app` 같은 주소가 생겨요. 그걸 보내면 끝.
   - 친구들은 키도, 로그인도 필요 없어요.

## 비용
- 친구들이 쓸수록 내 API 키로 요금이 나가요(쓴 만큼). 처음엔 소액만 충전해서 테스트하세요.
- `api/chat.js` 안의 모델을 `claude-haiku-4-5-20251001` 로 바꾸면 더 저렴해요.

## 성격 바꾸기
- `api/chat.js` 맨 위 `SYSTEM_PROMPT` 만 고치면 깐죽이 성격/특별 규칙이 통째로 바뀝니다.
