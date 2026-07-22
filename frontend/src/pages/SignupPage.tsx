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
  const { signupWithEmail, loginWithGoogle } = useAppState();
  const [agreed, setAgreed] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [socialError, setSocialError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleGoogleSignup() {
    if (submitting) return;
    setSocialError(null);
    setSubmitting(true);
    try {
      await loginWithGoogle();
      navigate("/test");
    } catch (err) {
      setSocialError(err instanceof Error ? err.message : "구글 가입에 실패했어요.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEmailSignup(e: FormEvent) {
    e.preventDefault();
    if (!agreed || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await signupWithEmail(email, password, nickname);
      navigate("/test");
    } catch (err) {
      setError(err instanceof Error ? err.message : "회원가입에 실패했어요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <MiniHeader right={<Link to="/" className="btn-text" style={{ textDecoration: "none" }}>홈으로</Link>} />
      <main className="auth-main">
        <div className="auth-title">
          <h1>회원가입</h1>
        </div>

        <div className="auth-social-group">
          <SocialButton provider="google" label="Google로 가입" onClick={handleGoogleSignup} />
        </div>
        {socialError && (
          <p style={{ color: "#c33a3f", fontSize: 13, margin: "8px 0 0", textAlign: "center" }}>{socialError}</p>
        )}

        <div className="auth-divider">이메일로 가입</div>

        <form className="auth-form" onSubmit={handleEmailSignup}>
          <label className="field">
            <span className="field-label">이메일</span>
            <input
              className="field-input"
              type="email"
              placeholder="가입할 이메일을 입력해 주세요."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="field">
            <span className="field-label">비밀번호</span>
            <input
              className="field-input"
              type="password"
              placeholder="8자 이상 입력해 주세요."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </label>
          <label className="field">
            <span className="field-label">닉네임</span>
            <input
              className="field-input"
              placeholder="사용하실 이름을 입력해 주세요."
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              required
            />
          </label>

          <button type="button" className="auth-terms-row" onClick={() => setAgreed((a) => !a)}>
            <span className={`auth-checkbox${agreed ? " checked" : " unchecked"}`}>
              {agreed && <Check size={12} />}
            </span>
            <span>[필수] 이용약관 및 개인정보 처리방침 동의</span>
          </button>

          {error && (
            <p style={{ color: "#c33a3f", fontSize: 13, margin: "4px 0 0" }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={!agreed || submitting}
            className={`btn auth-submit${agreed && !submitting ? " btn-dark" : " disabled"}`}
          >
            {submitting ? "가입 중..." : "가입하기"}
          </button>
        </form>
      </main>
    </div>
  );
}
