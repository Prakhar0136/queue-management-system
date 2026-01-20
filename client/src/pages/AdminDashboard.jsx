import { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [view, setView] = useState("dashboard");
  const [now, setNow] = useState(new Date()); // Timer for Ghost Detection
  const navigate = useNavigate();

  // 1. Auth Check, Data Fetch & Timer
  useEffect(() => {
    const isAuth = localStorage.getItem("adminAuth");
    if (!isAuth) navigate("/admin-login");

    fetchTickets();
    fetchAnalytics();

    const socket = io("http://localhost:5000");
    socket.on("queue-update", () => {
      fetchTickets();
      fetchAnalytics();
    });

    // Update 'now' every minute to refresh Ghost Detection
    const timer = setInterval(() => setNow(new Date()), 60000);

    return () => {
      socket.disconnect();
      clearInterval(timer);
    };
  }, [navigate]);

  const fetchTickets = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/queue/display");
      setTickets(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/queue/analytics");
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // 🔊 FEATURE: VOICE ANNOUNCEMENT
  const announceToken = (token, serviceName) => {
    const message = `Token Number ${token}, please proceed to ${serviceName}`;
    const speech = new SpeechSynthesisUtterance(message);
    speech.lang = "en-US";
    speech.rate = 0.9; // Slightly slower for clarity
    speech.pitch = 1;
    window.speechSynthesis.speak(speech);
  };

  // 2. Actions
  const updateStatus = async (id, status, ticket = null) => {
    try {
      await axios.put(`http://localhost:5000/api/queue/status/${id}`, {
        status,
      });

      // Trigger Voice if calling
      if (status === "serving" && ticket) {
        announceToken(
          ticket.tokenNumber,
          ticket.serviceType?.name || "Counter",
        );
      }

      fetchTickets();
      fetchAnalytics();
    } catch (err) {
      console.error(err);
    }
  };

  const logout = () => {
    localStorage.removeItem("adminAuth");
    navigate("/");
  };

  // 👻 FEATURE: GHOST DETECTION LOGIC
  const getGhostStatus = (createdAt) => {
    const created = new Date(createdAt);
    const diffMins = Math.floor((now - created) / 60000); // Difference in minutes

    if (diffMins > 30) return "ghost"; // Red: Likely gone
    if (diffMins > 10) return "risk"; // Yellow: Might be gone
    return "fresh"; // White: Just arrived
  };

  const waitingTickets = tickets.filter(
    (t) => t.status === "waiting" || t.status === "arriving",
  );
  const servingTickets = tickets.filter((t) => t.status === "serving");

  return (
    <div className="min-h-screen bg-neutral-800 text-white font-sans p-6 md:p-12 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

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
              className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-widest transition-all ${view === "dashboard" ? "bg-white text-black shadow-lg" : "text-neutral-400 hover:text-white"}`}
            >
              Live Queue
            </button>
            <button
              onClick={() => setView("analytics")}
              className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-widest transition-all ${view === "analytics" ? "bg-white text-black shadow-lg" : "text-neutral-400 hover:text-white"}`}
            >
              Analytics
            </button>
          </div>
          <button
            onClick={logout}
            className="px-6 py-3 bg-transparent border border-white/30 rounded text-xs font-bold uppercase tracking-widest hover:bg-red-500 hover:border-red-500 hover:text-white transition-all duration-300"
          >
            Log Out
          </button>
        </div>
      </nav>

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
                      className={`group bg-black/50 border p-6 hover:bg-white hover:text-black transition-all duration-300 flex justify-between items-center relative overflow-hidden
                    ${ghostStatus === "ghost" ? "border-red-500/50" : ghostStatus === "risk" ? "border-yellow-500/50" : "border-white/20"}
                `}
                    >
                      {/* Ghost Indicator Strip */}
                      {ghostStatus === "ghost" && (
                        <div
                          className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"
                          title="Ghost: Likely Abandoned"
                        ></div>
                      )}
                      {ghostStatus === "risk" && (
                        <div
                          className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-500"
                          title="Risk: Long Wait"
                        ></div>
                      )}

                      <div>
                        <div className="flex items-center gap-3">
                          <span className="text-3xl font-bold tracking-tight">
                            #{ticket.tokenNumber}
                          </span>
                          {ticket.status === "arriving" && (
                            <span className="text-[10px] bg-white/10 border border-white/20 px-2 py-1 rounded-full uppercase tracking-widest">
                              Arriving
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-neutral-400 group-hover:text-neutral-600 uppercase tracking-widest">
                            {ticket.serviceType?.name || "Unknown"}
                          </p>
                          {/* Time Indicator */}
                          {ghostStatus === "ghost" && (
                            <span className="text-[10px] text-red-500 font-bold group-hover:text-red-600">
                              ⚠ GHOST?
                            </span>
                          )}
                          {ghostStatus === "risk" && (
                            <span className="text-[10px] text-yellow-500 font-bold group-hover:text-yellow-600">
                              ⚠ DELAYED
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          updateStatus(ticket._id, "serving", ticket)
                        }
                        className="px-6 py-3 bg-transparent border border-white/30 text-white group-hover:border-black group-hover:text-black text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all duration-300"
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
                    <div className="inline-block bg-black text-white px-3 py-1 text-[10px] uppercase tracking-[0.2em] mb-8">
                      {ticket.serviceType?.name || "Unknown"}
                    </div>
                    <button
                      onClick={() => updateStatus(ticket._id, "completed")}
                      className="w-full py-4 border-2 border-black text-black font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all duration-300"
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

      {view === "analytics" && stats && (
        <div className="relative z-10 animate-fade-in">
          {/* Analytics section kept same as before */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <div className="bg-black/50 border border-white/20 p-8">
              <p className="text-neutral-400 text-xs uppercase tracking-widest mb-2">
                Total Served Today
              </p>
              <h3 className="text-5xl font-bold">{stats.totalServed}</h3>
            </div>
            <div className="bg-black/50 border border-white/20 p-8">
              <p className="text-neutral-400 text-xs uppercase tracking-widest mb-2">
                Most Popular Service
              </p>
              <h3
                className="text-3xl font-bold truncate"
                title={stats.mostPopular}
              >
                {stats.mostPopular}
              </h3>
            </div>
            <div className="bg-black/50 border border-white/20 p-8">
              <p className="text-neutral-400 text-xs uppercase tracking-widest mb-2">
                System Status
              </p>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xl font-bold">Online</span>
              </div>
            </div>
          </div>

          <div className="bg-black/50 border border-white/20 p-8 md:p-12">
            <div className="flex justify-between items-end mb-8">
              <h3 className="text-xl font-bold uppercase tracking-widest">
                Traffic Intensity{" "}
                <span className="text-neutral-500 text-sm normal-case">
                  (Hourly)
                </span>
              </h3>
            </div>
            <div className="flex items-end justify-between h-64 gap-1 md:gap-2">
              {stats.chartData.map((count, hour) => {
                const height = Math.min((count / 10) * 100, 100);
                const isPeak = count > 5;
                return (
                  <div
                    key={hour}
                    className="flex-1 flex flex-col items-center group relative"
                  >
                    <div
                      style={{ height: `${height === 0 ? 2 : height}%` }}
                      className={`w-full max-w-[20px] rounded-t-sm transition-all duration-500 ${isPeak ? "bg-white" : "bg-neutral-500/50 group-hover:bg-neutral-300"}`}
                    ></div>
                    <div className="mt-2 text-[8px] md:text-[10px] text-neutral-500 font-mono">
                      {hour}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
