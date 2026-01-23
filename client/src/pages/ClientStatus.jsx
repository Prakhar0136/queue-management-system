import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";

// 🔧 HELPER: Auto-detects your Network IP
const getBaseUrl = () => {
  const { hostname } = window.location;
  return `http://${hostname}:5000`;
};

const ClientStatus = () => {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Fetch Ticket Data
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

    // 2. Real-time Updates
    const socket = io(getBaseUrl());
    socket.on("queue-update", fetchTicket);

    return () => socket.disconnect();
  }, [id]);

  if (loading)
    return (
      <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center">
        <div className="animate-pulse">Loading Status...</div>
      </div>
    );

  if (!ticket)
    return (
      <div className="min-h-screen bg-neutral-900 text-white flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-3xl font-bold text-red-500 mb-4">
          Ticket Not Found
        </h2>
        <p className="text-neutral-400">
          We couldn't find ticket ID: <br />{" "}
          <span className="font-mono text-sm text-neutral-500">{id}</span>
        </p>
        <p className="mt-8 text-sm text-neutral-500">
          Try creating a new ticket on the home page.
        </p>
      </div>
    );

  const getStatusColor = (status) => {
    switch (status) {
      case "waiting":
        return "bg-yellow-500 text-black";
      case "serving":
        return "bg-green-500 text-white animate-pulse";
      case "completed":
        return "bg-neutral-600 text-neutral-400";
      default:
        return "bg-blue-500 text-white";
    }
  };

  return (
    <div className="min-h-screen bg-neutral-800 text-white p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-md bg-white text-black rounded-3xl shadow-2xl overflow-hidden">
        {/* HEADER */}
        <div className="bg-black text-white p-6 text-center">
          <h2 className="text-xs uppercase tracking-[0.3em] text-neutral-400">
            Your Token
          </h2>
          <h1 className="text-6xl font-bold font-mono tracking-tighter mt-2">
            {ticket.tokenNumber}
          </h1>
        </div>

        {/* STATUS */}
        <div className="p-8 space-y-6">
          <div
            className={`text-center py-4 rounded-xl font-bold uppercase tracking-widest text-lg shadow-inner ${getStatusColor(ticket.status)}`}
          >
            {ticket.status === "serving" ? "It's Your Turn!" : ticket.status}
          </div>

          <div className="bg-neutral-100 p-6 rounded-xl text-center">
            <p className="text-xs uppercase text-neutral-500 font-bold mb-2">
              Estimated Wait
            </p>
            <p className="text-3xl font-bold text-neutral-800">
              {ticket.status === "serving"
                ? "0"
                : ticket.estimatedWaitTime || 10}{" "}
              <span className="text-sm font-normal text-neutral-500">mins</span>
            </p>
            <p className="text-xs text-neutral-400 mt-2">
              People ahead: {ticket.peopleAhead}
            </p>
          </div>
        </div>
      </div>

      <p className="mt-8 text-neutral-500 text-xs uppercase tracking-widest">
        Do not close this page
      </p>
    </div>
  );
};

export default ClientStatus;
