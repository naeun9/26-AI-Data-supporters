import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppStateProvider } from "./state/AppState";
import { Layout } from "./components/Layout";
import { BareLayout } from "./components/BareLayout";
import { RequireAuth } from "./components/RequireAuth";
import { Toast } from "./components/Toast";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { TestPage } from "./pages/TestPage";
import { ResultPage } from "./pages/ResultPage";
import { NoticesPage } from "./pages/NoticesPage";
import { NoticeDetailPage } from "./pages/NoticeDetailPage";
import { ChatPage } from "./pages/ChatPage";
import { DashboardPage } from "./pages/DashboardPage";
import { MyPage } from "./pages/MyPage";

function App() {
  return (
    <AppStateProvider>
      <BrowserRouter>
        <Toast />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/notices" element={<NoticesPage />} />
            <Route path="/notices/:sn" element={<NoticeDetailPage />} />
            <Route
              path="/chat"
              element={
                <RequireAuth>
                  <ChatPage />
                </RequireAuth>
              }
            />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/my" element={<MyPage />} />
          </Route>
          <Route element={<BareLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route
              path="/test"
              element={
                <RequireAuth>
                  <TestPage />
                </RequireAuth>
              }
            />
            <Route path="/test/result" element={<ResultPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppStateProvider>
  );
}

export default App;
