import { Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./LoginLocked.css";

export function LoginLocked({
  title = "로그인 후 이용할 수 있어요",
  desc,
}: {
  title?: string;
  desc?: string;
}) {
  const navigate = useNavigate();

  return (
    <div className="login-locked">
      <span className="login-locked-icon">
        <Lock size={18} />
      </span>
      <div className="login-locked-title">{title}</div>
      {desc && <div className="login-locked-desc">{desc}</div>}
      <button className="btn btn-primary login-locked-cta" onClick={() => navigate("/login")}>
        로그인하기
      </button>
    </div>
  );
}
