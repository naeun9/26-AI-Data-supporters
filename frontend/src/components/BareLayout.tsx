import { Outlet } from "react-router-dom";
import { ChatFab } from "./ChatFab";

export function BareLayout() {
  return (
    <div className="app-shell">
      <Outlet />
      <ChatFab />
    </div>
  );
}
