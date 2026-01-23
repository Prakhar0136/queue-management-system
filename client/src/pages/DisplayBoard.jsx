import { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";

// 🔧 HELPER: Auto-detects your Network IP
const getBaseUrl = () => {
  const { hostname } = window.location;
  return `http://${hostname}:5000`;
};

const DisplayBoard = () => {
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        // ✅ FIX: Use dynamic IP
        const res = await axios.get(`${getBaseUrl()}/api/queue/display`);
        setTickets(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchTickets();
    // ✅ FIX: Connect to dynamic IP
    const socket = io(getBaseUrl());
    socket.on("queue-update", fetchTickets);

    return () => socket.disconnect();
  }, []);

  // Filter logic
  const serving = tickets.filter((t) => t.status === "serving");
  const waiting = tickets
    .filter((t) => t.status === "waiting" || t.status === "arriving")
    .slice(0, 5); // Show top 5

  return (
    <div className="min-h-screen bg-neutral-900 text-white font-sans overflow-hidden p-8 flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-end border-b border-white/20 pb-6 mb-12">
        <div>
          <p className="text-neutral-400 uppercase tracking-[0.4em] text-xs mb-2">
            Public Announcement
          </p>
          <h1 className="text-5xl font-bold uppercase tracking-tighter">
            Live Status
          </h1>
        </div>
        <div className="text-right">
          <p className="text-xl font-mono">{new Date().toLocaleTimeString()}</p>
          <p className="text-neutral-500 uppercase tracking-widest text-xs">
            Local Time
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 flex-grow">
        {/* NOW SERVING SECTION */}
        <div>
          <h2 className="text-2xl font-bold uppercase tracking-widest mb-8 flex items-center gap-3">
            <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
            Now Serving
          </h2>

          <div className="space-y-4">
            {serving.length === 0 ? (
              <div className="p-12 border border-dashed border-white/10 text-center text-neutral-500 uppercase tracking-widest">
                Please Wait
              </div>
            ) : (
              serving.map((ticket) => (
                <div
                  key={ticket._id}
                  className="bg-white text-black p-6 flex justify-between items-center shadow-[0_0_30px_rgba(255,255,255,0.1)] rounded-lg animate-fade-in-up"
                >
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                      Token
                    </p>
                    <p className="text-6xl font-bold tracking-tighter">
                      #{ticket.tokenNumber}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                      Counter
                    </p>
                    <p className="text-2xl font-bold uppercase">
                      {ticket.serviceType?.name || "General"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* UP NEXT SECTION */}
        <div>
          <h2 className="text-2xl font-bold uppercase tracking-widest mb-8 text-neutral-400">
            Up Next
          </h2>

          <div className="space-y-2">
            {waiting.map((ticket, index) => (
              <div
                key={ticket._id}
                className="flex justify-between items-center p-4 border-b border-white/10 text-neutral-300"
              >
                <div className="flex items-center gap-6">
                  <span className="text-neutral-600 font-mono text-sm">
                    0{index + 1}
                  </span>
                  <span className="text-3xl font-bold text-white">
                    #{ticket.tokenNumber}
                  </span>
                </div>
                <span className="text-sm uppercase tracking-widest text-neutral-500">
                  {ticket.serviceType?.name || "General"}
                </span>
              </div>
            ))}
            {waiting.length === 0 && (
              <p className="text-neutral-600 italic mt-8">Queue is empty</p>
            )}
          </div>
        </div>
      </div>

      {/* Footer Scroller */}
      <div className="fixed bottom-0 left-0 w-full bg-black border-t border-white/20 py-3 overflow-hidden">
        <div className="whitespace-nowrap animate-marquee text-xs uppercase tracking-[0.3em] text-neutral-400">
          Please keep your identification documents ready • Do not leave your
          baggage unattended • Report suspicious activity to security •
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          display: inline-block;
          animation: marquee 20s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default DisplayBoard;
