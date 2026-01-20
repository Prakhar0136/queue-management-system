import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";

const Status = () => {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);

  useEffect(() => {
    fetchTicketDetails();

    const socket = io("http://localhost:5000");

    // Listen for updates specifically for this service type
    socket.on("queue-update", () => fetchTicketDetails());

    return () => socket.disconnect();
  }, [id]);

  const fetchTicketDetails = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/queue/details/${id}`,
      );
      setTicket(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGPSCheckIn = async () => {
    // In a real app, you would check navigator.geolocation here
    try {
      await axios.put(`http://localhost:5000/api/queue/checkin/${id}`);
      fetchTicketDetails();
    } catch (err) {
      console.error(err);
    }
  };

  if (!ticket)
    return (
      <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center">
        Loading Ticket...
      </div>
    );

  return (
    <div className="min-h-screen bg-neutral-800 font-sans text-white p-6 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* HEADER CARD */}
        <div className="bg-black/40 border border-white/10 p-8 rounded-2xl text-center backdrop-blur-md">
          <p className="text-neutral-400 uppercase tracking-[0.3em] text-xs mb-4">
            Your Token
          </p>
          <h1 className="text-7xl font-bold font-mono text-white mb-2">
            #{ticket.tokenNumber}
          </h1>
          <div className="inline-block px-3 py-1 bg-white/10 rounded-full text-[10px] uppercase tracking-widest border border-white/20">
            {ticket.serviceType.name}
          </div>
        </div>

        {/* STATUS INDICATOR */}
        <div className="grid grid-cols-2 gap-4">
          {/* People Ahead */}
          <div className="bg-neutral-700/50 p-6 rounded-xl text-center border border-white/5">
            <span className="block text-3xl font-bold mb-1">
              {ticket.peopleAhead}
            </span>
            <span className="text-[10px] uppercase tracking-widest text-neutral-400">
              People Ahead
            </span>
          </div>

          {/* ⏳ AI ESTIMATED WAIT TIME */}
          <div className="bg-blue-600/20 p-6 rounded-xl text-center border border-blue-500/30 relative overflow-hidden">
            {/* Glowing Effect */}
            <div className="absolute inset-0 bg-blue-500/10 animate-pulse"></div>

            <span className="relative z-10 block text-3xl font-bold text-blue-200 mb-1">
              {ticket.status === "serving"
                ? "NOW"
                : `${ticket.estimatedWaitTime} min`}
            </span>
            <span className="relative z-10 text-[10px] uppercase tracking-widest text-blue-300">
              Est. Wait Time
            </span>
          </div>
        </div>

        {/* PROGRESS BAR */}
        <div className="bg-black/40 p-6 rounded-xl border border-white/10">
          <div className="flex justify-between text-xs uppercase tracking-widest text-neutral-500 mb-4">
            <span>Status</span>
            <span
              className={
                ticket.status === "arriving"
                  ? "text-yellow-500"
                  : ticket.status === "waiting"
                    ? "text-blue-500"
                    : ticket.status === "serving"
                      ? "text-green-500"
                      : "text-neutral-500"
              }
            >
              {ticket.status}
            </span>
          </div>

          {/* Visual Steps */}
          <div className="flex gap-2 h-2 mb-2">
            <div
              className={`flex-1 rounded-full ${["arriving", "waiting", "serving", "completed"].includes(ticket.status) ? "bg-white" : "bg-white/10"}`}
            ></div>
            <div
              className={`flex-1 rounded-full ${["waiting", "serving", "completed"].includes(ticket.status) ? "bg-white" : "bg-white/10"}`}
            ></div>
            <div
              className={`flex-1 rounded-full ${["serving", "completed"].includes(ticket.status) ? "bg-green-500" : "bg-white/10"}`}
            ></div>
          </div>
        </div>

        {/* GPS CHECK-IN BUTTON (Only if Arriving) */}
        {ticket.status === "arriving" && (
          <button
            onClick={handleGPSCheckIn}
            className="w-full py-4 bg-white text-black font-bold uppercase tracking-widest rounded-xl hover:bg-neutral-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]"
          >
            Tap to Check-In
          </button>
        )}
      </div>
    </div>
  );
};

export default Status;
