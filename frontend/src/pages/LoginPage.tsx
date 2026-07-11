import type { FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { MiniHeader } from "../components/MiniHeader";
import { SocialButton } from "../components/SocialButton";
import { useAppState } from "../state/AppState";
import "./AuthPages.css";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAppState();
  const from = (location.state as { from?: string } | null)?.from;

  function handleLogin(e?: FormEvent) {
    e?.preventDefault();
    login();
    navigate(from ?? "/");
  }

  return (
    <div>
      <MiniHeader right={<Link to="/" className="btn-text" style={{ textDecoration: "none" }}>홈으로</Link>} />
      <main className="auth-main">
        <div className="auth-title">
          <h1>로그인</h1>
        </div>

        <div className="auth-social-group">
          <SocialButton provider="kakao" label="카카오로 시작하기" onClick={() => handleLogin()} />
          <SocialButton provider="google" label="Google로 시작하기" onClick={() => handleLogin()} />
        </div>

        <div className="auth-divider">또는 이메일로</div>

        <form className="auth-form" onSubmit={handleLogin}>
          <label className="field">
            <span className="field-label">이메일</span>
            <input className="field-input" placeholder="이메일을 입력해주세요." />
          </label>
          <label className="field">
            <span className="field-label">비밀번호</span>
            <input className="field-input" type="password" placeholder="비밀번호를 입력해주세요." />
          </label>
          <button type="submit" className="btn btn-dark auth-submit">
            로그인
          </button>
        </form>

        <div className="auth-footer">
          비밀번호 찾기 · <Link to="/signup">회원가입</Link>
        </div>
      </main>
    </div>
  );
}
