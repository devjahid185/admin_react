import { useState } from "react";
import "./App.css";
import LoginPage from "./pages/LoginPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import PublicPolicyPage from "./pages/PublicPolicyPage.jsx";
import { API_BASE } from "./lib/config.js";
import ToastCenter from "./components/ToastCenter.jsx";

function useStoredToken() {
  const [token, setToken] = useState(() => localStorage.getItem("admin_token") || "");
  const save = (value) => {
    setToken(value || "");
    if (value) {
      localStorage.setItem("admin_token", value);
    } else {
      localStorage.removeItem("admin_token");
    }
  };
  return [token, save];
}

function App() {
  const [token, setToken] = useStoredToken();
  const path = window.location.pathname.replace(/\/+$/, "") || "/";

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/admin/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
    } catch (_) {}
    setToken("");
  };

  if (path === "/privacy-policy" || path === "/terms-of-service") {
    return <PublicPolicyPage />;
  }

  return token ? (
    <>
      <ToastCenter />
      <DashboardPage token={token} onLogout={handleLogout} />
    </>
  ) : (
    <>
      <ToastCenter />
      <LoginPage
        onLogin={(value) => {
          setToken(value);
        }}
      />
    </>
  );
}

export default App;
