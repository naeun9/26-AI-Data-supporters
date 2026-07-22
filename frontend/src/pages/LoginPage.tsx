import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { MiniHeader } from "../components/MiniHeader";
import { SocialButton } from "../components/SocialButton";
import { useAppState } from "../state/AppState";
import "./AuthPages.css";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithEmail, loginWithGoogle } = useAppState();
  const from = (location.state as { from?: string } | null)?.from;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [socialError, setSocialError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleGoogleLogin() {
    if (submitting) return;
    setSocialError(null);
    setSubmitting(true);
    try {
      await loginWithGoogle();
      navigate(from ?? "/");
    } catch (err) {
      setSocialError(err instanceof Error ? err.message : "구글 로그인에 실패했어요.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEmailLogin(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await loginWithEmail(email, password);
      navigate(from ?? "/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인에 실패했어요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <MiniHeader right={<Link to="/" className="btn-text" style={{ textDecoration: "none" }}>홈으로</Link>} />
      <main className="auth-main">
        <div className="auth-title">
          <h1>로그인</h1>
        </div>

        <div className="auth-social-group">
          <SocialButton provider="google" label="Google로 시작하기" onClick={handleGoogleLogin} />
        </div>
        {socialError && (
          <p style={{ color: "#c33a3f", fontSize: 13, margin: "8px 0 0", textAlign: "center" }}>{socialError}</p>
        )}

        <div className="auth-divider">또는 이메일로</div>

        <form className="auth-form" onSubmit={handleEmailLogin}>
          <label className="field">
            <span className="field-label">이메일</span>
            <input
              className="field-input"
              type="email"
              placeholder="이메일을 입력해주세요."
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
              placeholder="비밀번호를 입력해주세요."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error && (
            <p style={{ color: "#c33a3f", fontSize: 13, margin: "4px 0 0" }}>{error}</p>
          )}
          <button type="submit" className="btn btn-dark auth-submit" disabled={submitting}>
            {submitting ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <div className="auth-footer">
          비밀번호 찾기 · <Link to="/signup">회원가입</Link>
        </div>
      </main>
    </div>
  );
}
