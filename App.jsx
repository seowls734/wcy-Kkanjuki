import React, { useState, useRef, useEffect } from "react";

// 봇의 성격을 정하는 핵심: 시스템 프롬프트
// 이 텍스트만 바꾸면 봇 성격이 통째로 바뀝니다.
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

export default function JangNanBot() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "왔어? 뭐 심심해서 왔지 ㅋㅋ 말 걸어봐, 받아줄게." },
  ]);
  const [input, setInput] = useState("");
  const [image, setImage] = useState(null); // { dataUrl, mediaType, base64 }
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // 사진 선택 → base64로 읽어서 첨부 대기 상태로
  const onPickImage = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      const base64 = dataUrl.split(",")[1];
      setImage({ dataUrl, mediaType: file.type || "image/png", base64 });
    };
    reader.readAsDataURL(file);
    e.target.value = ""; // 같은 파일 다시 고를 수 있게 초기화
  };

  const send = async () => {
    const text = input.trim();
    if ((!text && !image) || loading) return;

    const userMsg = { role: "user", content: text, image: image };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setImage(null);
    setLoading(true);

    try {
      // 화면용 메시지 → API용 형식으로 변환 (사진은 image 블록으로)
      const apiMessages = newMessages.map((m) => {
        if (m.image) {
          const blocks = [
            { type: "image", source: { type: "base64", media_type: m.image.mediaType, data: m.image.base64 } },
            { type: "text", text: m.content || "이 사진 봐봐" },
          ];
          return { role: m.role, content: blocks };
        }
        return { role: m.role, content: m.content };
      });

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: apiMessages,
        }),
      });

      const data = await response.json();
      const reply = data.content
        .map((b) => (b.type === "text" ? b.text : ""))
        .filter(Boolean)
        .join("\n");

      setMessages((prev) => [...prev, { role: "assistant", content: reply || "어? 할 말을 잃었네 ㅋㅋ" }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "삐빅- 나 잠깐 딴짓하다 놓쳤어. 다시 말해줄래?" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div style={styles.wrap}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Jua&family=Gaegu:wght@400;700&display=swap');
        @keyframes pop { 0% { transform: scale(0.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes wiggle { 0%,100% { transform: rotate(-6deg); } 50% { transform: rotate(6deg); } }
        @keyframes blink { 0%,90%,100% { transform: scaleY(1); } 95% { transform: scaleY(0.1); } }
        @keyframes dots { 0%,20% { opacity: 0.2; } 50% { opacity: 1; } 80%,100% { opacity: 0.2; } }
        .jb-msg { animation: pop 0.22s ease-out; }
        .jb-face { animation: wiggle 2.4s ease-in-out infinite; }
        .jb-eye { animation: blink 4s infinite; transform-origin: center; }
        .jb-send:active { transform: translateY(2px) scale(0.96); }
        .jb-d1 { animation: dots 1.2s infinite; }
        .jb-d2 { animation: dots 1.2s infinite 0.2s; }
        .jb-d3 { animation: dots 1.2s infinite 0.4s; }
      `}</style>

      <div style={styles.phone}>
        {/* 헤더 */}
        <div style={styles.header}>
          <div className="jb-face" style={styles.mascot}>
            <svg width="40" height="40" viewBox="0 0 40 40">
              <rect x="2.5" y="2.5" width="35" height="35" rx="10" fill="#FFE14D" stroke="#1A1A2E" strokeWidth="2.5" />
              <circle className="jb-eye" cx="15" cy="18" r="2.4" fill="#1A1A2E" />
              <path d="M22 19 Q25.5 15 29 19" stroke="#1A1A2E" strokeWidth="2.4" fill="none" strokeLinecap="round" />
              <path d="M14 25 Q20 31 28 23" stroke="#1A1A2E" strokeWidth="2.4" fill="none" strokeLinecap="round" />
              <circle cx="12" cy="24" r="2" fill="#FF5A3C" opacity="0.5" />
              <circle cx="30" cy="23" r="2" fill="#FF5A3C" opacity="0.5" />
            </svg>
          </div>
          <div>
            <div style={styles.name}>깐죽이</div>
            <div style={styles.status}>
              <span style={styles.dot} /> 까불 준비 완료
            </div>
          </div>
        </div>

        {/* 대화창 */}
        <div ref={scrollRef} style={styles.chat}>
          {messages.map((m, i) => (
            <div
              key={i}
              className="jb-msg"
              style={{ ...styles.row, justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}
            >
              <div style={m.role === "user" ? styles.bubbleUser : styles.bubbleBot}>
                {m.image && <img src={m.image.dataUrl} alt="보낸 사진" style={styles.sentImg} />}
                {m.content ? <span>{m.content}</span> : null}
              </div>
            </div>
          ))}
          {loading && (
            <div className="jb-msg" style={{ ...styles.row, justifyContent: "flex-start" }}>
              <div style={styles.bubbleBot}>
                <span className="jb-d1">●</span> <span className="jb-d2">●</span> <span className="jb-d3">●</span>
              </div>
            </div>
          )}
        </div>

        {/* 첨부한 사진 미리보기 */}
        {image && (
          <div style={styles.preview}>
            <img src={image.dataUrl} alt="첨부" style={styles.previewImg} />
            <button style={styles.previewX} onClick={() => setImage(null)}>
              ✕
            </button>
          </div>
        )}

        {/* 입력창 */}
        <div style={styles.inputBar}>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={onPickImage}
            style={{ display: "none" }}
          />
          <button
            className="jb-send"
            style={styles.attach}
            onClick={() => fileRef.current && fileRef.current.click()}
            disabled={loading}
            title="사진 보내기"
          >
            ＋
          </button>
          <input
            style={styles.input}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={image ? "사진에 한마디 붙여봐 (선택)" : "뭐라도 말 걸어봐..."}
          />
          <button className="jb-send" style={styles.send} onClick={send} disabled={loading}>
            보내기
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    minHeight: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    background: "radial-gradient(circle at 30% 20%, #FFEFC2 0%, #FFD9A0 60%, #FFC074 100%)",
    fontFamily: "'Gaegu', sans-serif",
  },
  phone: {
    width: "100%",
    maxWidth: 420,
    height: 640,
    background: "#FFFDF5",
    borderRadius: 28,
    border: "3px solid #1A1A2E",
    boxShadow: "8px 8px 0 #1A1A2E",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "14px 18px",
    background: "#FF7A59",
    borderBottom: "3px solid #1A1A2E",
  },
  mascot: { width: 40, height: 40, flexShrink: 0 },
  name: { fontFamily: "'Jua', sans-serif", fontSize: 22, color: "#FFFDF5", lineHeight: 1 },
  status: { fontSize: 14, color: "#FFE6DE", display: "flex", alignItems: "center", gap: 5, marginTop: 2 },
  dot: { width: 8, height: 8, borderRadius: "50%", background: "#7CFF6B", display: "inline-block", border: "1.5px solid #1A1A2E" },
  chat: { flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 10 },
  row: { display: "flex", width: "100%" },
  bubbleBot: {
    maxWidth: "78%",
    background: "#FFE14D",
    color: "#1A1A2E",
    padding: "10px 14px",
    borderRadius: "4px 18px 18px 18px",
    border: "2.5px solid #1A1A2E",
    fontSize: 18,
    lineHeight: 1.35,
    whiteSpace: "pre-wrap",
  },
  bubbleUser: {
    maxWidth: "78%",
    background: "#1A1A2E",
    color: "#FFFDF5",
    padding: "10px 14px",
    borderRadius: "18px 4px 18px 18px",
    fontSize: 18,
    lineHeight: 1.35,
    whiteSpace: "pre-wrap",
  },
  inputBar: { display: "flex", gap: 8, padding: 12, borderTop: "3px solid #1A1A2E", background: "#FFFDF5" },
  attach: {
    background: "#FFE14D",
    color: "#1A1A2E",
    border: "2.5px solid #1A1A2E",
    borderRadius: 14,
    padding: "0 14px",
    fontSize: 22,
    fontFamily: "'Jua', sans-serif",
    cursor: "pointer",
    boxShadow: "3px 3px 0 #1A1A2E",
    transition: "transform 0.08s",
    flexShrink: 0,
  },
  preview: { display: "flex", alignItems: "flex-start", gap: 6, padding: "10px 12px 0" },
  previewImg: { height: 60, borderRadius: 10, border: "2.5px solid #1A1A2E", objectFit: "cover" },
  previewX: {
    background: "#1A1A2E",
    color: "#FFFDF5",
    border: "none",
    borderRadius: "50%",
    width: 22,
    height: 22,
    cursor: "pointer",
    fontSize: 11,
    lineHeight: 1,
    flexShrink: 0,
  },
  sentImg: {
    display: "block",
    maxWidth: "100%",
    borderRadius: 10,
    border: "2px solid #1A1A2E",
    marginBottom: 6,
  },
  input: {
    flex: 1,
    border: "2.5px solid #1A1A2E",
    borderRadius: 14,
    padding: "10px 14px",
    fontSize: 17,
    fontFamily: "'Gaegu', sans-serif",
    outline: "none",
    background: "#FFFDF5",
    color: "#1A1A2E",
  },
  send: {
    background: "#FF7A59",
    color: "#FFFDF5",
    border: "2.5px solid #1A1A2E",
    borderRadius: 14,
    padding: "0 18px",
    fontSize: 18,
    fontFamily: "'Jua', sans-serif",
    cursor: "pointer",
    boxShadow: "3px 3px 0 #1A1A2E",
    transition: "transform 0.08s",
  },
};
