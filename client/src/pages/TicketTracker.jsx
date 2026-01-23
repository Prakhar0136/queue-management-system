import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";

const TicketTracker = () => {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to get Base URL
  const getBaseUrl = () => {
    const { hostname } = window.location;
    return `http://${hostname}:5000`;
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
      const audio = new Audio("/notification.mp3"); // Make sure this file exists in /public
      audio.play().catch((e) => console.log("Audio permission needed"));
    }
  }, [ticket?.status]);

  const fetchTicketDetails = async () => {
    try {
      // We use the /details route we fixed earlier
      const res = await axios.get(`${getBaseUrl()}/api/queue/details/${id}`);
      setTicket(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading...
      </div>
    );

  // 🎨 STATUS: SERVING (The "Go Now" Screen)
  if (ticket.status === "serving") {
    return (
      <div className="min-h-screen bg-green-500 text-black flex flex-col items-center justify-center p-6 text-center animate-pulse">
        <h1 className="text-6xl font-black mb-4">GO!</h1>
        <p className="text-2xl font-bold uppercase mb-8">It is your turn</p>

        <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-sm">
          <p className="text-sm text-neutral-500 font-bold uppercase tracking-widest mb-2">
            Proceed To
          </p>
          <p className="text-4xl font-bold mb-6">
            {ticket.serviceType?.name || "Counter"}
          </p>
          <div className="border-t border-dashed border-neutral-300 my-4"></div>
          <p className="text-8xl font-black">#{ticket.tokenNumber}</p>
        </div>
        <p className="mt-12 font-bold animate-bounce">
          Please proceed immediately
        </p>
      </div>
    );
  }

  const handleSnooze = async () => {
    if (
      !window.confirm(
        "Are you sure? This will move you BEHIND the next person.",
      )
    )
      return;

    try {
      await axios.post(`${getBaseUrl()}/api/queue/snooze/${id}`);
      // Success feedback is handled by the socket update, but we can alert locally too
    } catch (err) {
      alert(
        err.response?.data?.msg ||
          "Could not snooze. Maybe you are last in line?",
      );
    }
  };
  // 🎨 STATUS: WAITING (The "Relax" Screen)
  // 🎨 STATUS: WAITING (The "Relax" Screen)
  return (
    <div className="min-h-screen bg-neutral-900 text-white font-sans p-6 flex flex-col items-center">
      {/* Header */}
      <div className="w-full flex justify-between items-center mb-12 mt-4">
        <div className="text-xs font-bold uppercase tracking-widest text-neutral-500">
          Live Status
        </div>
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
      </div>

      {/* Main Ticket Card */}
      <div className="bg-neutral-800 border border-white/10 w-full max-w-sm rounded-2xl p-8 relative overflow-hidden mb-8">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>

        <div className="text-center">
          <p className="text-sm text-neutral-400 font-bold uppercase tracking-widest mb-2">
            Your Token
          </p>
          <h1 className="text-7xl font-bold text-white mb-2">
            #{ticket.tokenNumber}
          </h1>
          <p className="text-blue-400 font-medium">
            {ticket.serviceType?.name}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
        <div className="bg-white/5 p-6 rounded-xl border border-white/10 text-center">
          <p className="text-3xl font-bold">{ticket.peopleAhead}</p>
          <p className="text-[10px] uppercase tracking-widest text-neutral-400 mt-1">
            People Ahead
          </p>
        </div>
        <div className="bg-white/5 p-6 rounded-xl border border-white/10 text-center">
          <p className="text-3xl font-bold">
            {ticket.estimatedWaitTime}
            <span className="text-sm align-top">m</span>
          </p>
          <p className="text-[10px] uppercase tracking-widest text-neutral-400 mt-1">
            Est. Wait
          </p>
        </div>
      </div>

      {/* Progress Bar Visual */}
      <div className="w-full max-w-sm mt-12">
        <div className="flex justify-between text-xs text-neutral-500 mb-2 font-bold uppercase">
          <span>In Queue</span>
          <span>Your Turn</span>
        </div>
        <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-1000"
            style={{ width: `${Math.max(10, 100 - ticket.peopleAhead * 10)}%` }}
          ></div>
        </div>
      </div>

      {/* 👇👇👇 THIS WAS MISSING! ADD THIS BUTTON SECTION 👇👇👇 */}
      {ticket.status === "waiting" && (
        <div className="w-full max-w-sm mt-8 pb-12">
          <button
            onClick={handleSnooze}
            className="w-full group bg-neutral-800 hover:bg-neutral-700 active:scale-95 border border-white/10 text-neutral-300 py-4 rounded-xl flex items-center justify-center gap-3 transition-all"
          >
            <div className="bg-neutral-700 group-hover:bg-neutral-600 p-2 rounded-lg">
              💤
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-white">
                Need a bathroom break?
              </p>
              <p className="text-[10px] text-neutral-400 uppercase tracking-wider">
                Tap to Move Back 1 Spot
              </p>
            </div>
          </button>
        </div>
      )}
      {/* 👆👆👆 END OF BUTTON SECTION 👆👆👆 */}
    </div>
  );
};;

export default TicketTracker;
