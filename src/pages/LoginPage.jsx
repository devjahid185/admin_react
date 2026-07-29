import { useState } from "react";
import AuthLayout from "../layouts/AuthLayout.jsx";
import Button from "../components/Button.jsx";
import Input from "../components/Input.jsx";
import { apiRequest } from "../lib/api.js";

export default function LoginPage({ onLogin, initialError = "" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await apiRequest("/admin/login", {
        method: "POST",
        body: { email, password },
      });
      onLogin(data.token);
    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Admin Login" subtitle="Use your admin credentials to continue">
      <form onSubmit={submit} className="space-y-4">
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Signing in..." : "Login"}
        </Button>
      </form>
      <div className="mt-6 text-xs text-slate-500">This panel is restricted to authorized admins.</div>
    </AuthLayout>
  );
}


