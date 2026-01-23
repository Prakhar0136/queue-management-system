import { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";

// 🔧 HELPER: Connection to Render Backend
const getBaseUrl = () => {
  if (window.location.hostname === "localhost") {
    return "http://localhost:5000";
  }
  return "https://queue-management-system-fdj5.onrender.com";
};

const AdminDashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [view, setView] = useState("dashboard");
  const [now, setNow] = useState(new Date());
  const navigate = useNavigate();

  // 1. Auth Check & Setup
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/admin-login");
    } else {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      fetchData();
    }
  }, [navigate]);

  // 2. Data Fetching & Socket
  useEffect(() => {
    const socket = io(getBaseUrl());

    socket.on("queue-update", () => {
      console.log("🔔 Socket Update Received");
      fetchData();
    });

    const timer = setInterval(() => setNow(new Date()), 60000);

    return () => {
      socket.disconnect();
      clearInterval(timer);
    };
  }, []);

  const fetchData = () => {
    fetchTickets();
    fetchAnalytics();
  };

  const fetchTickets = async () => {
    try {
      const res = await axios.get(`${getBaseUrl()}/api/queue/display`);
      console.log("🎫 Tickets Loaded:", res.data); // Debug Log
      setTickets(res.data);
    } catch (err) {
      console.error("Error fetching tickets:", err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get(`${getBaseUrl()}/api/queue/analytics`);
      setStats(res.data);
    } catch (err) {
      console.warn("Analytics not loaded");
    }
  };

  // 🔊 VOICE ANNOUNCEMENT
  const announceToken = (tokenNumber, serviceName) => {
    const message = `Token Number ${tokenNumber}, please proceed to ${serviceName}`;
    const speech = new SpeechSynthesisUtterance(message);
    speech.lang = "en-US";
    speech.rate = 0.9;
    window.speechSynthesis.speak(speech);
  };

  // 3. Actions
  const updateStatus = async (id, status, ticket = null) => {
    try {
      await axios.put(`${getBaseUrl()}/api/queue/update/${id}`, { status });

      if (status === "serving" && ticket) {
        announceToken(
          ticket.tokenNumber,
          ticket.serviceType?.name || "Counter",
        );
      }
      fetchData();
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/admin-login");
  };

  // 👻 GHOST DETECTION
  const getGhostStatus = (createdAt) => {
    const created = new Date(createdAt);
    const diffMins = Math.floor((now - created) / 60000);

    if (diffMins > 30) return "ghost"; // >30 mins
    if (diffMins > 10) return "risk"; // >10 mins
    return "fresh";
  };

  const waitingTickets = tickets.filter(
    (t) => t.status === "waiting" || t.status === "arriving",
  );
  const servingTickets = tickets.filter((t) => t.status === "serving");

  return (
    <div className="min-h-screen bg-neutral-800 text-white font-sans p-6 md:p-12 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

      {/* HEADER */}
      <nav className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end mb-16 border-b border-white/10 pb-6">
        <div>
          <p className="text-neutral-400 uppercase tracking-[0.3em] text-xs mb-2">
            System Administrator
          </p>
          <h1 className="text-4xl font-bold uppercase tracking-tighter leading-none">
            {view === "dashboard" ? "Control Terminal" : "System Analytics"}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-6 mt-6 md:mt-0">
          <div className="flex bg-black/50 rounded-lg p-1 border border-white/10">
            <button
              onClick={() => setView("dashboard")}
              className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-widest transition-all ${
                view === "dashboard"
                  ? "bg-white text-black shadow-lg"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Live Queue
            </button>
            <button
              onClick={() => setView("analytics")}
              className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-widest transition-all ${
                view === "analytics"
                  ? "bg-white text-black shadow-lg"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Analytics
            </button>
          </div>
          <button
            onClick={logout}
            className="px-6 py-3 border border-white/30 rounded text-xs font-bold uppercase hover:bg-red-500 hover:border-red-500 transition-all"
          >
            Log Out
          </button>
        </div>
      </nav>

      {/* DASHBOARD VIEW */}
      {view === "dashboard" && (
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-12 animate-fade-in">
          {/* LEFT: WAITING LIST */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-4 mb-8">
              <h2 className="text-xl font-bold uppercase tracking-widest">
                Waiting List
              </h2>
              <div className="h-[1px] flex-grow bg-white/20"></div>
            </div>

            {waitingTickets.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center bg-black/10 border border-white/10 rounded-lg text-neutral-400">
                <p className="uppercase tracking-widest text-xs">
                  No pending requests
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {waitingTickets.map((ticket) => {
                  const ghostStatus = getGhostStatus(ticket.createdAt);
                  return (
                    <div
                      key={ticket._id}
                      className={`group bg-black/50 border p-6 hover:bg-white hover:text-black transition-all duration-300 flex justify-between items-center relative overflow-hidden ${
                        ghostStatus === "ghost"
                          ? "border-red-500/50"
                          : ghostStatus === "risk"
                            ? "border-yellow-500/50"
                            : "border-white/20"
                      }`}
                    >
                      {/* Ghost Bars */}
                      {ghostStatus === "ghost" && (
                        <div
                          className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"
                          title="Ghost"
                        ></div>
                      )}
                      {ghostStatus === "risk" && (
                        <div
                          className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-500"
                          title="Delayed"
                        ></div>
                      )}

                      <div>
                        <div className="flex items-center gap-3">
                          <span className="text-3xl font-bold tracking-tight">
                            #{ticket.tokenNumber}
                          </span>
                          {ticket.status === "arriving" && (
                            <span className="text-[10px] bg-white/10 border border-white/20 px-2 py-1 rounded-full uppercase">
                              Arriving
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col mt-1">
                          <p className="text-sm font-bold">
                            {ticket.customerName || ticket.phone}
                          </p>
                          <p className="text-xs text-neutral-400 group-hover:text-neutral-600 uppercase tracking-widest">
                            {ticket.serviceType?.name || "General"}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          updateStatus(ticket._id, "serving", ticket)
                        }
                        className="px-6 py-3 border border-white/30 text-white group-hover:border-black group-hover:text-black text-xs font-bold uppercase hover:bg-black hover:!text-white transition-all"
                      >
                        Call
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT: ACTIVE SERVING */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <h2 className="text-xl font-bold uppercase tracking-widest">
                Active
              </h2>
              <div className="h-[1px] flex-grow bg-white/20"></div>
            </div>

            <div className="space-y-6">
              {servingTickets.map((ticket) => (
                <div
                  key={ticket._id}
                  className="bg-white text-black p-8 shadow-2xl relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-10 text-9xl font-bold pointer-events-none select-none">
                    #
                  </div>
                  <div className="relative z-10">
                    <div className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">
                      Now Serving
                    </div>
                    <div className="text-6xl font-bold mb-4">
                      #{ticket.tokenNumber}
                    </div>
                    <div className="mb-6">
                      <p className="font-bold text-lg">{ticket.customerName}</p>
                      <p className="text-sm text-neutral-500">{ticket.phone}</p>
                    </div>
                    <button
                      onClick={() => updateStatus(ticket._id, "completed")}
                      className="w-full py-4 border-2 border-black text-black font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all"
                    >
                      Complete
                    </button>
                  </div>
                </div>
              ))}
              {servingTickets.length === 0 && (
                <div className="py-12 border border-dashed border-white/20 text-center text-neutral-400">
                  <p className="text-xs uppercase tracking-widest">
                    Counters Idle
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ANALYTICS VIEW */}
      {view === "analytics" && (
        <div className="relative z-10 animate-fade-in max-w-4xl mx-auto">
          {/* STATS ROW */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-black/50 border border-white/10 p-8 flex flex-col items-center justify-center text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-2">
                Total Served Today
              </p>
              <h3 className="text-6xl font-bold">{stats?.totalServed || 0}</h3>
            </div>
            <div className="bg-black/50 border border-white/10 p-8 flex flex-col items-center justify-center text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-2">
                Most Popular Service
              </p>
              <h3 className="text-3xl font-bold">
                {stats?.mostPopular || "N/A"}
              </h3>
            </div>
          </div>

          {/* CHART SECTION */}
          <div className="bg-white/5 border border-white/10 p-8 rounded-lg relative">
            <h3 className="text-xl font-bold uppercase tracking-widest mb-8">
              Hourly Traffic
            </h3>

            <div className="h-64 flex items-end justify-between gap-1 relative z-10">
              {stats?.chartData?.map((count, hour) => {
                const height = Math.min((count / 10) * 100, 100);
                return (
                  <div
                    key={hour}
                    className="flex-1 h-full flex flex-col justify-end group relative"
                  >
                    {/* Tooltip */}
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-black text-xs font-bold py-1 px-2 rounded pointer-events-none transition-opacity">
                      {count} visitors
                    </div>
                    {/* Bar */}
                    <div
                      style={{ height: `${height}%` }}
                      className={`w-full transition-all duration-500 ${
                        count > 0
                          ? "bg-white hover:bg-green-400"
                          : "bg-white/10 h-[1px]"
                      }`}
                    ></div>
                    {/* Hour Label */}
                    <span className="text-[10px] text-neutral-500 mt-2 text-center hidden sm:block">
                      {hour}:00
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Background Grid Lines */}
            <div className="absolute inset-0 z-0 flex flex-col justify-between p-8 opacity-10 pointer-events-none">
              <div className="w-full h-[1px] bg-white"></div>
              <div className="w-full h-[1px] bg-white"></div>
              <div className="w-full h-[1px] bg-white"></div>
              <div className="w-full h-[1px] bg-white"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
