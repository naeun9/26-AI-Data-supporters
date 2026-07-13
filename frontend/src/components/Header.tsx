import { useEffect, useState } from "react";
import { LogOut, Menu, X } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAppState } from "../state/AppState";
import { TypeIcon } from "../icons/TypeIcon";
import "./Header.css";

const NAV = [
  { to: "/", label: "홈" },
  { to: "/notices", label: "지원공고" },
  { to: "/chat", label: "챗봇" },
  { to: "/test", label: "유형검사" },
  { to: "/dashboard", label: "창업 현황" },
  { to: "/education", label: "창업교육" },
];

export function Header() {
  const { loggedIn, nickname, myType, logout } = useAppState();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const onMyPage = location.pathname === "/my";
  const isHome = location.pathname === "/";

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  return (
    <header className="site-header">
      <div className="container site-header-inner">
        <div className="site-header-brand">
          <NavLink to="/" className="brand-link">
            <span className="brand-mark">K</span>
            <span className="brand-name">창업메이트</span>
          </NavLink>
        </div>

        <nav className="site-nav">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `site-nav-link${isActive ? " active" : ""}`}
              end={item.to === "/"}
            >
              {item.label}
              {item.to === "/test" && isHome && (
                <span className="nav-tooltip">내 창업자 유형 알아보기!</span>
              )}
            </NavLink>
          ))}
        </nav>

        <button
          className="site-nav-toggle"
          aria-label={mobileNavOpen ? "메뉴 닫기" : "메뉴 열기"}
          onClick={() => setMobileNavOpen((v) => !v)}
        >
          {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <div className="site-header-auth">
          {loggedIn ? (
            <div className="header-profile">
              <button className="header-profile-link" onClick={() => navigate("/my")}>
                <span className="header-avatar">
                  {myType ? <TypeIcon type={myType} size={20} /> : nickname.slice(0, 1)}
                </span>
                <span className="header-nickname">{nickname} 님</span>
              </button>
              {onMyPage && (
                <button className="btn btn-ghost header-logout-btn" onClick={logout}>
                  <LogOut size={15} /> 로그아웃
                </button>
              )}
            </div>
          ) : (
            <div className="header-auth-buttons">
              <button className="btn header-signup-btn" onClick={() => navigate("/signup")}>
                회원가입
              </button>
              <button className="btn btn-primary header-login-btn" onClick={() => navigate("/login")}>
                로그인
              </button>
            </div>
          )}
        </div>
      </div>

      {mobileNavOpen && (
        <nav className="site-nav-mobile">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `site-nav-mobile-link${isActive ? " active" : ""}`}
              end={item.to === "/"}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  );
}
