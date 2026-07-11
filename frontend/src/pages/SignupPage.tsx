import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { MiniHeader } from "../components/MiniHeader";
import { SocialButton } from "../components/SocialButton";
import { useAppState } from "../state/AppState";
import "./AuthPages.css";

export function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAppState();
  const [agreed, setAgreed] = useState(false);
  const [nickname, setNickname] = useState("");

  function finishSignup(name: string) {
    signup(name || "홍길동");
    navigate("/test");
  }

  function handleSocialSignup() {
    finishSignup("홍길동");
  }

  function handleEmailSignup(e: FormEvent) {
    e.preventDefault();
    if (!agreed) return;
    finishSignup(nickname);
  }

  return (
    <div>
      <MiniHeader right={<Link to="/" className="btn-text" style={{ textDecoration: "none" }}>홈으로</Link>} />
      <main className="auth-main">
        <div className="auth-title">
          <h1>회원가입</h1>
        </div>

        <div className="auth-social-group">
          <SocialButton provider="kakao" label="카카오로 가입" onClick={handleSocialSignup} />
          <SocialButton provider="google" label="Google로 가입" onClick={handleSocialSignup} />
        </div>

        <div className="auth-divider">이메일로 가입</div>

        <form className="auth-form" onSubmit={handleEmailSignup}>
          <label className="field">
            <span className="field-label">이메일</span>
            <input className="field-input" placeholder="가입할 이메일을 입력해 주세요." />
          </label>
          <label className="field">
            <span className="field-label">비밀번호</span>
            <input className="field-input" type="password" placeholder="8자 이상 입력해 주세요." />
          </label>
          <label className="field">
            <span className="field-label">닉네임</span>
            <input
              className="field-input"
              placeholder="사용하실 이름을 입력해 주세요."
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </label>

          <button type="button" className="auth-terms-row" onClick={() => setAgreed((a) => !a)}>
            <span className={`auth-checkbox${agreed ? " checked" : " unchecked"}`}>
              {agreed && <Check size={12} />}
            </span>
            <span>[필수] 이용약관 및 개인정보 처리방침 동의</span>
          </button>

          <button
            type="submit"
            disabled={!agreed}
            className={`btn auth-submit${agreed ? " btn-dark" : " disabled"}`}
          >
            가입하기
          </button>
        </form>
      </main>
    </div>
  );
}
