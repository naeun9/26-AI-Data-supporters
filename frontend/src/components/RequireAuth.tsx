import { useLayoutEffect } from "react";
import type { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppState } from "../state/AppState";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { loggedIn, showToast } = useAppState();
  const navigate = useNavigate();
  const location = useLocation();

  useLayoutEffect(() => {
    if (!loggedIn) {
      showToast("먼저 로그인해주세요");
      navigate("/login", { replace: true, state: { from: location.pathname + location.search } });
    }
  }, [loggedIn, location.pathname, location.search, navigate, showToast]);

  if (!loggedIn) return null;
  return <>{children}</>;
}
