import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { ChatFab } from "./ChatFab";

export function Layout() {
  return (
    <div className="app-shell">
      <Header />
      <Outlet />
      {/* ChatFab renders null when logged out */}
      <ChatFab />
    </div>
  );
}
