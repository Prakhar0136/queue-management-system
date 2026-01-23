import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// 🔧 HELPER: Auto-detect Network IP
const getBaseUrl = () => {
  const { hostname } = window.location;
  return `http://${hostname}:5000`;
};

const AdminLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    try {
      // ✅ FIX: Call the real server API
      const res = await axios.post(`${getBaseUrl()}/api/auth/login`, {
        username,
        password,
      });

      // ✅ FIX: Save the real JWT token
      localStorage.setItem("token", res.data.token);

      navigate("/admin-dashboard");
    } catch (err) {
      console.error(err);
      setError(true);
      // Reset error animation
      setTimeout(() => setError(false), 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-800 text-white flex items-center justify-center relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-black/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none"></div>

      <div
        className={`w-full max-w-md bg-black/40 border border-white/10 p-12 backdrop-blur-md transition-transform duration-100 ${
          error ? "translate-x-2" : ""
        }`}
      >
        <div className="mb-12 text-center">
          <p className="text-neutral-400 uppercase tracking-[0.3em] text-xs mb-4">
            Restricted Access
          </p>
          <h1 className="text-3xl font-bold uppercase tracking-widest">
            Admin Login
          </h1>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-xs uppercase tracking-widest text-neutral-500 mb-2">
              System ID
            </label>
            <input
              type="text"
              className="w-full bg-neutral-900 border border-white/10 p-4 text-white focus:outline-none focus:border-white/50 transition-colors"
              placeholder="Enter Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-neutral-500 mb-2">
              Password
            </label>
            <input
              type="password"
              className="w-full bg-neutral-900 border border-white/10 p-4 text-white focus:outline-none focus:border-white/50 transition-colors"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          {error && (
            <div className="text-red-500 text-xs uppercase tracking-widest text-center animate-pulse">
              Access Denied: Invalid Credentials
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black font-bold uppercase tracking-widest py-4 hover:bg-neutral-200 transition-colors mt-4 disabled:opacity-50"
          >
            {loading ? "Authenticating..." : "Authenticate"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => navigate("/")}
            className="text-neutral-500 text-xs uppercase tracking-widest hover:text-white transition-colors"
          >
            ← Return to Terminal
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
