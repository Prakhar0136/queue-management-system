import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import QRCode from "react-qr-code";

// 🔧 HELPER: Auto-detects your Network IP
const getBaseUrl = () => {
  const { hostname } = window.location;
  return `http://${hostname}:5000`;
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

  if (loading)
    return (
      <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="uppercase tracking-widest">Generating Ticket...</p>
        </div>
      </div>
    );

  if (!ticket)
    return (
      <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center">
        <p className="text-red-500">Ticket not found. Please try again.</p>
      </div>
    );

  // Status Color Logic
  const getStatusColor = (status) => {
    switch (status) {
      case "waiting":
        return "bg-yellow-500 text-black";
      case "serving":
        return "bg-green-500 text-white animate-pulse";
      case "completed":
        return "bg-neutral-600 text-neutral-400";
      default:
        return "bg-blue-500 text-white"; // arriving
    }
  };

  return (
    <div className="min-h-screen bg-neutral-800 text-white p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-md bg-white text-black rounded-3xl shadow-2xl overflow-hidden relative">
        {/* TOP SECTION: TOKEN NUMBER */}
        <div className="bg-black text-white p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
          <h2 className="text-sm uppercase tracking-[0.3em] text-neutral-400 mb-2">
            Token Number
          </h2>
          <h1 className="text-7xl font-bold font-mono tracking-tighter">
            {ticket.tokenNumber}
          </h1>
        </div>

        {/* MIDDLE SECTION: STATUS & INFO */}
        <div className="p-8 space-y-6">
          {/* Status Badge */}
          <div
            className={`text-center py-4 rounded-xl font-bold uppercase tracking-widest text-lg shadow-inner ${getStatusColor(
              ticket.status,
            )}`}
          >
            {ticket.status === "serving" ? "It's Your Turn!" : ticket.status}
          </div>

          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-neutral-100 p-4 rounded-xl">
              <p className="text-xs uppercase text-neutral-500 font-bold mb-1">
                Service
              </p>
              <p className="font-bold text-lg leading-tight">
                {ticket.serviceType?.name || "General"}
              </p>
            </div>
            <div className="bg-neutral-100 p-4 rounded-xl">
              <p className="text-xs uppercase text-neutral-500 font-bold mb-1">
                Wait Time
              </p>
              <p className="font-bold text-lg">
                {ticket.status === "serving"
                  ? "0 min"
                  : `~${ticket.estimatedWaitTime || 10} min`}
              </p>
            </div>
          </div>

          {/* QR CODE */}
          <div className="flex justify-center py-4">
            <div className="p-2 bg-white border-2 border-dashed border-neutral-300 rounded-lg">
              <QRCode
                value={`${window.location.protocol}//${window.location.host}/status/${ticket._id}`}
                size={120}
              />
            </div>
          </div>

          <p className="text-center text-xs text-neutral-400 uppercase tracking-wide">
            People Ahead:{" "}
            <span className="text-black font-bold text-sm">
              {ticket.peopleAhead}
            </span>
          </p>
        </div>

        {/* BOTTOM TEAR-OFF EFFECT */}
        <div className="bg-neutral-100 p-4 border-t border-dashed border-neutral-300 flex justify-between items-center">
          <span className="text-xs text-neutral-400 uppercase">
            Do not close this window
          </span>
          <div className="w-2 h-2 rounded-full bg-green-500 animate-ping"></div>
        </div>
      </div>
    </div>
  );
};

export default Ticket;
