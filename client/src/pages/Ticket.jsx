import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import QRCode from "react-qr-code";

// 🔧 HELPER: Auto-detects your Network IP
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

const Ticket = () => {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Fetch Ticket Data using Dynamic IP
    const fetchTicket = async () => {
      try {
        const res = await axios.get(`${getBaseUrl()}/api/queue/details/${id}`);
        setTicket(res.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching ticket:", err);
        setLoading(false);
      }
    };

    fetchTicket();

    // 2. Connect Socket using Dynamic IP
    const socket = io(getBaseUrl());

    socket.on("queue-update", () => {
      fetchTicket(); // Refresh data when queue changes
    });

    return () => socket.disconnect();
  }, [id]);

  // ⏳ LOADING SCREEN (Matches Dashboard)
  if (loading)
    return (
      <div className="min-h-screen bg-neutral-800 text-neutral-400 flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mb-4"></div>
        <p className="text-xs font-bold uppercase tracking-[0.3em]">
          Generating Ticket...
        </p>
      </div>
    );

  // ❌ ERROR SCREEN
  if (!ticket)
    return (
      <div className="min-h-screen bg-neutral-800 text-white flex flex-col items-center justify-center">
        <p className="text-red-500 font-bold uppercase tracking-widest mb-4">
          Ticket Invalid
        </p>
        <p className="text-xs text-neutral-500">Please scan a valid QR code</p>
      </div>
    );

  // Status Color Logic (Adapted for Dark Theme)
  const getStatusStyle = (status) => {
    switch (status) {
      case "waiting":
        return "border-yellow-500 text-yellow-500";
      case "serving":
        return "bg-green-500 text-black border-green-500 animate-pulse";
      case "completed":
        return "border-neutral-600 text-neutral-500";
      default:
        return "border-blue-500 text-blue-500"; // arriving
    }
  };

  return (
    <div className="min-h-screen bg-neutral-800 text-white p-6 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-md bg-black border border-white/20 p-8 shadow-2xl">
        {/* Header Section */}
        <div className="text-center mb-8 border-b border-white/10 pb-6">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-neutral-400 mb-2">
            Digital Token
          </p>
          <h1 className="text-7xl font-bold text-white tracking-tighter">
            #{ticket.tokenNumber}
          </h1>
        </div>

        {/* Status Badge */}
        <div
          className={`w-full text-center py-3 border-2 font-bold uppercase tracking-widest text-sm mb-8 ${getStatusStyle(ticket.status)}`}
        >
          {ticket.status === "serving" ? "Proceed Now" : ticket.status}
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white/5 border border-white/10 p-4 text-center">
            <p className="text-[10px] uppercase font-bold text-neutral-500 tracking-widest mb-1">
              Service
            </p>
            <p className="font-bold text-lg">
              {ticket.serviceType?.name || "General"}
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 p-4 text-center">
            <p className="text-[10px] uppercase font-bold text-neutral-500 tracking-widest mb-1">
              Wait Time
            </p>
            <p className="font-bold text-lg">
              {ticket.status === "serving"
                ? "0m"
                : `~${ticket.estimatedWaitTime || 10}m`}
            </p>
          </div>
        </div>

        {/* QR Code Section - Needs white bg to be scannable */}
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="bg-white p-4 border-4 border-neutral-700">
            <QRCode
              value={`${window.location.protocol}//${window.location.host}/status/${ticket._id}`}
              size={150}
              fgColor="#000000"
              bgColor="#ffffff"
            />
          </div>
          <p className="text-[10px] uppercase tracking-widest text-neutral-500 mt-4">
            Scan to Track Live
          </p>
        </div>

        {/* Footer Stats */}
        <div className="border-t border-white/10 pt-6 flex justify-between items-center">
          <span className="text-xs font-bold uppercase text-neutral-500 tracking-widest">
            People Ahead
          </span>
          <span className="text-2xl font-bold text-white">
            {ticket.peopleAhead}
          </span>
        </div>
      </div>

      {/* Connection Indicator */}
      <div className="absolute bottom-6 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
        <span className="text-[10px] uppercase tracking-widest text-neutral-500">
          System Connected
        </span>
      </div>
    </div>
  );
};

export default Ticket;
