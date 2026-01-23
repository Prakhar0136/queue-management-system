import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";

const TicketTracker = () => {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔧 HELPER: Auto-detect Network IP
  // 🔧 HELPER: Swaps between Local and Live Backend automatically
  const getBaseUrl = () => {
    if (window.location.hostname === "localhost") {
      // Development (Local)
      return "http://localhost:5000";
    } else if (window.location.hostname.startsWith("192.168")) {
      // Local WiFi Testing
      return `http://${window.location.hostname}:5000`;
    } else {
      // 🚀 Production (When you deploy to Vercel/Netlify)
      // PUT YOUR LIVE BACKEND URL HERE LATER
      return "https://your-backend-app.onrender.com";
    }
  };

  useEffect(() => {
    fetchTicketDetails();

    // Real-time updates
    const socket = io(getBaseUrl());
    socket.on("queue-update", () => {
      fetchTicketDetails();
    });

    return () => socket.disconnect();
  }, [id]);

  // Triggers when status changes to "serving"
  useEffect(() => {
    if (ticket?.status === "serving") {
      // 📳 Haptic Feedback (Vibrate phone)
      if (navigator.vibrate) navigator.vibrate([500, 200, 500]);

      // 🔊 Play Sound
      const audio = new Audio("/notification.mp3");
      audio.play().catch((e) => console.log("Audio permission needed"));
    }
  }, [ticket?.status]);

  const fetchTicketDetails = async () => {
    try {
      const res = await axios.get(`${getBaseUrl()}/api/queue/details/${id}`);
      setTicket(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSnooze = async () => {
    if (!window.confirm("Move back 1 spot in line?")) return;

    try {
      await axios.post(`${getBaseUrl()}/api/queue/snooze/${id}`);
    } catch (err) {
      alert(err.response?.data?.msg || "Action unavailable");
    }
  };

  // ⏳ LOADING SCREEN (Matches Dashboard BG)
  if (loading)
    return (
      <div className="min-h-screen bg-neutral-800 text-neutral-400 flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mb-4"></div>
        <p className="text-xs font-bold uppercase tracking-[0.3em]">
          Connecting...
        </p>
      </div>
    );

  // 🚨 STATUS: SERVING (Matches "Active" Card in Dashboard - White/Black)
  if (ticket.status === "serving") {
    return (
      <div className="min-h-screen bg-neutral-800 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

        <div className="relative z-10 bg-white text-black w-full max-w-md p-10 shadow-2xl animate-pulse">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-9xl font-bold pointer-events-none select-none">
            !
          </div>

          <p className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">
            Status Update
          </p>
          <h1 className="text-6xl font-bold mb-4">GO NOW</h1>
          <div className="h-[2px] bg-black w-12 mb-8"></div>

          <div className="mb-8">
            <p className="text-lg font-bold uppercase tracking-wide">
              Please Proceed To
            </p>
            <p className="text-4xl font-bold">
              {ticket.serviceType?.name || "Counter"}
            </p>
          </div>

          <div className="bg-black text-white p-4 text-center">
            <p className="text-xs uppercase tracking-[0.3em] mb-1 text-neutral-400">
              Your Token
            </p>
            <p className="text-4xl font-bold">#{ticket.tokenNumber}</p>
          </div>
        </div>
      </div>
    );
  }

  // 🕒 STATUS: WAITING (Matches Dashboard "Waiting List" Style)
  return (
    <div className="min-h-screen bg-neutral-800 text-white font-sans p-6 flex flex-col items-center relative overflow-hidden">
      {/* Background Glow (Same as Dashboard) */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

      {/* Header */}
      <div className="relative z-10 w-full max-w-md mb-12 mt-4 border-b border-white/10 pb-6 flex justify-between items-end">
        <div>
          <p className="text-neutral-400 uppercase tracking-[0.3em] text-xs mb-1">
            Live Tracker
          </p>
          <h1 className="text-2xl font-bold uppercase tracking-tighter">
            Terminal {id.slice(-4)}
          </h1>
        </div>
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mb-2"></div>
      </div>

      <div className="relative z-10 w-full max-w-md flex-1 flex flex-col">
        {/* Main Ticket Display (Matches Dashboard List Items) */}
        <div className="bg-black/50 border border-white/20 p-8 text-center mb-8 hover:bg-white/5 transition-colors">
          <p className="text-xs text-neutral-400 font-bold uppercase tracking-[0.3em] mb-4">
            Current Token
          </p>
          <h1 className="text-7xl font-bold tracking-tight text-white mb-2">
            #{ticket.tokenNumber}
          </h1>
          <p className="text-sm text-neutral-400 uppercase tracking-widest border-t border-white/10 pt-4 mt-4 inline-block">
            {ticket.serviceType?.name}
          </p>
        </div>

        {/* Stats Grid (Matches Dashboard Analytics Grid) */}
        <div className="grid grid-cols-2 gap-4 mb-12">
          <div className="bg-white/5 border border-white/10 p-6 flex flex-col items-center justify-center text-center">
            <h3 className="text-4xl font-bold mb-1">{ticket.peopleAhead}</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
              Ahead of you
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 p-6 flex flex-col items-center justify-center text-center">
            <h3 className="text-4xl font-bold mb-1">
              {ticket.estimatedWaitTime}
              <span className="text-lg">m</span>
            </h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
              Est. Wait
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-auto">
          <div className="flex justify-between text-[10px] uppercase font-bold text-neutral-500 mb-2 tracking-widest">
            <span>Queue</span>
            <span>Service</span>
          </div>
          <div className="w-full h-[2px] bg-white/10">
            <div
              className="h-full bg-white transition-all duration-1000 shadow-[0_0_10px_white]"
              style={{
                width: `${Math.max(5, 100 - ticket.peopleAhead * 10)}%`,
              }}
            ></div>
          </div>
        </div>

        {/* Snooze Button (Matches Dashboard "Log Out" / Action Button Style) */}
        {ticket.status === "waiting" && (
          <button
            onClick={handleSnooze}
            className="w-full mt-8 px-6 py-4 border border-white/30 text-white text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-black hover:border-white transition-all duration-300"
          >
            Delay My Turn (Snooze)
          </button>
        )}
      </div>
    </div>
  );
};;

export default TicketTracker;
