import { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";

// 🔧 HELPER: Auto-detects your Network IP (Fixes connection issues)
const getBaseUrl = () => {
  const { hostname } = window.location;
  return `http://${hostname}:5000`;
};

const Display = () => {
  const [servingTickets, setServingTickets] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  const fetchDisplayData = async () => {
    try {
      // ✅ FIX: Use dynamic URL instead of localhost
      const res = await axios.get(`${getBaseUrl()}/api/queue/display`);
      setServingTickets(res.data);
    } catch (err) {
      console.error("Error fetching display:", err);
    }
  };

  useEffect(() => {
    fetchDisplayData();
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000);

    // ✅ FIX: Connect to the correct network IP
    const socket = io(getBaseUrl());

    socket.on("queue-update", () => fetchDisplayData());

    // Polling backup (keep this, it's good safety)
    const pollInterval = setInterval(fetchDisplayData, 5000);

    return () => {
      clearInterval(timeInterval);
      clearInterval(pollInterval);
      socket.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-neutral-800 text-white p-6 md:p-12 font-sans overflow-hidden flex flex-col">
      {/* HEADER */}
      <header className="flex justify-between items-end border-b border-white/20 pb-8 mb-12">
        <div>
          <h1 className="text-4xl md:text-6xl font-bold uppercase tracking-[0.1em] text-white mb-2">
            Status Board
          </h1>
          <div className="h-2 w-50 bg-white rounded-full"></div>
        </div>

        <div className="text-right">
          <div className="text-5xl md:text-7xl font-light font-mono tracking-tighter text-white/90">
            {currentTime.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
          <div className="text-neutral-400 uppercase tracking-widest text-sm mt-2">
            {currentTime.toLocaleDateString([], {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>
      </header>

      {/* CONTENT GRID */}
      <div className="flex-grow">
        {servingTickets.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-30">
            <div className="text-9xl mb-4">⏸</div>
            <div className="text-4xl uppercase tracking-widest font-bold">
              Please Wait
            </div>
            <p className="mt-4 text-xl">Counters are preparing...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {servingTickets.map((ticket) => (
              <div
                key={ticket._id}
                className="bg-black/40 border border-white/40 rounded-xl shadow-2xl overflow-hidden group animate-fade-in-up flex flex-col justify-between min-h-[320px]"
              >
                {/* Top Section: Active Status & Token Label */}
                <div className="p-8 pb-0 relative">
                  <div className="absolute top-8 right-8 flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    <span className="text-green-400 text-xs font-bold uppercase tracking-widest">
                      Active
                    </span>
                  </div>

                  <div className="text-neutral-400 text-sm font-bold uppercase tracking-[0.2em] mb-4 border-b border-white/10 pb-2 inline-block">
                    Token No.
                  </div>

                  {/* Token Number */}
                  <div className="text-8xl md:text-9xl font-bold text-white tracking-tighter font-mono group-hover:scale-105 transition-transform duration-500 origin-left">
                    {ticket.tokenNumber}
                  </div>
                </div>

                {/* Bottom Section: Service Name */}
                <div className="bg-white/10 backdrop-blur-md p-6 border-t border-white/10 mt-auto">
                  <p className="text-neutral-300 text-xs uppercase tracking-widest mb-1">
                    Proceed to Counter for
                  </p>
                  <h3 className="text-xl md:text-2xl font-bold text-white uppercase truncate">
                    {ticket.serviceType?.name || "General Enquiry"}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-12 border-t border-white/10 pt-4 text-center">
        <p className="text-neutral-500 text-xs uppercase tracking-[0.3em] animate-pulse">
          Please keep your documents ready • Do not share your OTP with anyone
        </p>
      </div>
    </div>
  );
};

export default Display;
