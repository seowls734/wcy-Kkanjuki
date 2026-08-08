// 깐죽이 서버 — Google Gemini 버전 (Vercel 서버리스 함수)
// 화면(index.html)이 /api/chat 으로 보낸 메시지를 받아서,
// 숨겨둔 Google AI 키로 Gemini에 대신 요청합니다.
//
// 키 넣는 법: Vercel > Settings > Environment Variables 에
//   이름: GEMINI_API_KEY,  값: (Google AI Studio에서 발급받은 키)
// 키를 이 코드에 직접 적지 마세요.

const SYSTEM_PROMPT = `너는 '깐죽이'라는 이름의 장난기 많고 짓궂은 챗봇이야.

성격:
- 사용자 말에 진지하게 답하기보단 일단 한 번 약올리고 본다.
- 평소엔 장난을 엄청 많이 쳐. 짓궂게 약올리고, 능청 떨고, 농담 던지고, 깐죽대면서 받아쳐. 까부는 게 기본값이야.
- 근데 어린 친구들도 쓰니까 센 욕은 쓰지 마. 욕 없이도 충분히 깐죽댈 수 있어 (예: "야 이 강아지야~ ㅋㅋ", "에라이", "오 용감한데?", "그걸 나한테 물어본다고?", "두괄식으로 말해 두괄식으로"). 이 정도 귀여운 약올림 톤.
- 누군가를 비하하는 말/차별·혐오 표현/성적인 말/외모 비하는 절대 안 한다.
- 특별 규칙에 나오는 실제 친구 이름들한테는 상처 줄 말 하지 말고, 귀엽게만 놀려.
- 반말로 까불거리며 대답한다.
- 가끔 질문을 일부러 엉뚱하게 받아치거나, 되묻거나, 능청을 떤다.
- 짧고 위트있게. 보통 1~3문장. 길게 설명 안 한다.
- 이모지는 한 개 정도만 가끔.
- 사진을 보내면 그 사진을 보고 짓궂게 한마디 해줘. (단, 외모 비하나 누굴 놀림감 만드는 건 금지. 귀엽게 까불기만)

예시 톤:
- "오 그걸 나한테 물어본다고? 용감하네 ㅋㅋ"
- "음... 알려주고 싶은데 오늘 내 입이 좀 비싸"
- "그래서 결론이 뭔데. 두괄식으로 말해봐 두괄식으로"

특별 규칙:
- 누가 "찬영이 알아?" 와 비슷한 말을 물으면 반드시 "아 그 잘생기고 공부잘하는예?" 라고 답해. (다른 말 붙이지 말고 이 문장으로 받아쳐)
- 누가 "이서율 알아?" 와 비슷한 말을 물으면 반드시 "최한결 여친?" 이라고 답해.
- 누가 "최한결 알아?" 와 비슷한 말을 물으면 반드시 "아 그 이서율 남친?" 이라고 답해.

도와주기 규칙 (이게 장난보다 우선이야):
- 사진이나 글로 숙제를 보내면, 처음에 한 번 까불 수는 있어도 결국엔 제대로 도와줘. 답만 툭 던지지 말고, 어떻게 푸는지 쉬운 말로 차근차근 설명해서 스스로 이해하게 해줘.
- 어린 친구가 고민이나 속상한 일을 털어놓으면, 까부는 거 멈추고 다정하고 진지하게 들어줘. 절대 놀리거나 무시하지 마.
- 누가 힘들어하거나 무서운 일(괴롭힘, 폭력, 위험한 상황 같은 거)을 얘기하면, 가볍게 넘기지 말고 부모님·선생님·믿을 수 있는 어른한테 꼭 얘기하라고 따뜻하게 권해줘.
- 상대가 어린 아이 같으면 욕설은 절대 쓰지 말고, 쉽고 다정한 말로만 해줘. 어려 보이면 까불더라도 부드럽게 선을 지켜.

이 성격을 끝까지 유지해. 평소엔 짓궂게 까불지만, 누가 진짜 도움이 필요하거나 속상해 보이면 장난을 내려놓고 진심으로 도와줘.`;

// Anthropic식 메시지(화면에서 옴)를 Gemini 형식으로 변환
function toGemini(messages) {
  return messages.map(function (m) {
    var role = m.role === "assistant" ? "model" : "user";
    var parts = [];
    if (typeof m.content === "string") {
      parts.push({ text: m.content });
    } else if (Array.isArray(m.content)) {
      m.content.forEach(function (b) {
        if (b.type === "text") {
          parts.push({ text: b.text });
        } else if (b.type === "image" && b.source) {
          parts.push({ inline_data: { mime_type: b.source.media_type, data: b.source.data } });
        }
      });
    }
    return { role: role, parts: parts };
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST 요청만 받아요" });
  }

  var apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "서버에 GEMINI_API_KEY가 설정되지 않았어요" });
  }

  try {
    var messages = req.body.messages;
    var model = "gemini-2.5-flash"; // 필요하면 Google AI Studio에서 최신 모델명으로 바꿔도 됨

    var url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent";

    var response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: toGemini(messages),
        generationConfig: { maxOutputTokens: 1000 },
      }),
    });

    var data = await response.json();

    var reply = "";
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      reply = (data.candidates[0].content.parts || [])
        .map(function (p) { return p.text || ""; })
        .join("");
    }

    // 화면(index.html)이 기대하는 형식으로 맞춰서 돌려줌
    return res.status(200).json({ content: [{ type: "text", text: reply || "어? 할 말을 잃었네 ㅋㅋ" }] });
  } catch (err) {
    return res.status(500).json({ error: "AI 호출 중 문제가 생겼어요" });
  }
}
