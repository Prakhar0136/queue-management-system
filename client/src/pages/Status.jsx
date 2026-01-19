import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";

const Status = () => {
  const { id } = useParams(); // This is the Ticket ID
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to fetch latest data
  const fetchTicketDetails = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/queue/details/${id}`,
      );
      setTicket(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching ticket:", err);
    }
  };

  useEffect(() => {
    fetchTicketDetails();

    // --- REAL TIME LISTENER ---
    const socket = io("http://localhost:5000");

    // We can't listen yet because we don't know the serviceId until fetchTicketDetails finishes.
    // So we use a separate effect or just poll for now, BUT proper way:
    // Once ticket is loaded, listen to that specific service channel
    if (ticket) {
      socket.on(`queue-update-${ticket.serviceType._id}`, () => {
        console.log("Queue updated! Refreshing data...");
        fetchTicketDetails(); // Re-fetch data when server says so
      });
    }

    return () => socket.disconnect();
  }, [id, ticket?.serviceType?._id]); // Re-run if ticket loads

  if (loading)
    return (
      <div className="text-center mt-20 text-xl">Loading your ticket...</div>
    );
  if (!ticket)
    return (
      <div className="text-center mt-20 text-red-500">Ticket not found</div>
    );

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center p-6">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden text-center">
        {/* Header */}
        <div className="bg-blue-600 text-white p-6">
          <h2 className="text-xl font-medium opacity-90">Your Token Number</h2>
          <h1 className="text-6xl font-bold mt-2">#{ticket.tokenNumber}</h1>
          <div className="mt-4 inline-block bg-blue-500 px-4 py-1 rounded-full text-sm">
            {ticket.serviceType.name}
          </div>
        </div>

        {/* Info Body */}
        <div className="p-8 space-y-6">
          <div className="flex justify-between items-center border-b border-gray-100 pb-4">
            <span className="text-gray-500">Status</span>
            <span
              className={`font-bold px-3 py-1 rounded-full text-sm
              ${ticket.status === "waiting" ? "bg-yellow-100 text-yellow-700" : ""}
              ${ticket.status === "serving" ? "bg-green-100 text-green-700" : ""}
            `}
            >
              {ticket.status.toUpperCase()}
            </span>
          </div>

          <div className="flex justify-between items-center border-b border-gray-100 pb-4">
            <span className="text-gray-500">People Ahead</span>
            <span className="font-bold text-2xl text-gray-800">
              {ticket.peopleAhead}
            </span>
          </div>

          <div className="flex justify-between items-center pb-2">
            <span className="text-gray-500">Approx Wait Time</span>
            <span className="font-bold text-xl text-blue-600">
              {ticket.peopleAhead * ticket.serviceType.averageTime} mins
            </span>
          </div>

          <p className="text-xs text-gray-400 mt-4">
            Please arrive 5 minutes before your estimated time.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Status;
