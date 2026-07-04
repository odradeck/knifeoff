import { useState } from "react";

// 거절 버튼 클릭 시 뜨는 reCAPTCHA 패러디 게이트. 체크 → 확인 중 → 통과 후 자동으로 다음 단계(수학문제)로 넘어간다.
export default function CaptchaModal({ onVerified, onClose }) {
  const [state, setState] = useState("idle"); // idle | checking | checked

  function handleClick() {
    if (state !== "idle") return;
    setState("checking");
    setTimeout(() => {
      setState("checked");
      setTimeout(onVerified, 550);
    }, 900);
  }

  return (
    <div className="modal-mask" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal captcha-modal" role="dialog" aria-modal="true">
        <div className="m-head">
          <div className="m-kick">본인 확인 · KNIFEOFF 결재 보안</div>
          <h3>🔒 거절 권한 확인</h3>
        </div>
        <div className="m-body">
          <button
            type="button"
            className={"captcha-box" + (state !== "idle" ? " on" : "")}
            onClick={handleClick}
            disabled={state !== "idle"}
          >
            <span className={"captcha-checkbox" + (state === "checked" ? " on" : "")}>
              {state === "checking" && <span className="captcha-spinner" />}
              {state === "checked" && <span className="captcha-tick">✓</span>}
            </span>
            <span className="captcha-label">
              {state === "checked" ? "확인되었습니다" : state === "checking" ? "확인 중..." : "팀장이 맞습니까?"}
            </span>
            <span className="captcha-brand">
              <span className="captcha-logo">🔪</span>
              <span className="captcha-brand-text">
                reCAPTCHA
                <br />
                <a href="#" onClick={(e) => e.preventDefault()}>개인정보 보호</a> · <a href="#" onClick={(e) => e.preventDefault()}>약관</a>
              </span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
