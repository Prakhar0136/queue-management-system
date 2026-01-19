import { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";

const Display = () => {
  const [servingTickets, setServingTickets] = useState([]);

  const fetchDisplayData = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/queue/display");
      setServingTickets(res.data);
    } catch (err) {
      console.error("Error fetching display:", err);
    }
  };

  useEffect(() => {
    fetchDisplayData();

    const socket = io("http://localhost:5000");

    // We listen to a global event or just listen to all services?
    // A smarter way: backend emits a 'global-update' event.
    // Or simpler: We listen to specific service channels if we knew them.
    // Hack for now: Just poll every 5 seconds OR listen to specific IDs if possible.

    // Let's trust the 'polling' approach for the TV screen to ensure it never gets "stuck"
    // (TVs run for 24 hours, sockets sometimes disconnect).
    const interval = setInterval(fetchDisplayData, 3000); // Check every 3 seconds

    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-10 font-mono">
      <header className="flex justify-between items-center border-b-4 border-yellow-500 pb-6 mb-10">
        <h1 className="text-5xl font-bold uppercase tracking-wider text-yellow-400">
          🏛️ Public Display
        </h1>
        <div className="text-2xl text-gray-400">
          {new Date().toLocaleTimeString()}
        </div>
      </header>

      {servingTickets.length === 0 ? (
        <div className="text-center text-4xl text-gray-600 mt-20">
          All Counters Free
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servingTickets.map((ticket) => (
            <div
              key={ticket._id}
              className="bg-gray-800 border-l-8 border-green-500 rounded-lg p-6 shadow-2xl transform transition-all scale-100 hover:scale-105"
            >
              <div className="text-gray-400 text-sm uppercase mb-2 tracking-widest">
                Token Number
              </div>
              <div className="text-7xl font-bold text-white mb-4">
                #{ticket.tokenNumber}
              </div>

              <div className="flex items-center justify-between border-t border-gray-700 pt-4">
                <div className="text-xl text-yellow-400">
                  {ticket.serviceType.name}
                </div>
                <div className="bg-green-600 text-white px-3 py-1 rounded text-sm font-bold animate-pulse">
                  NOW SERVING
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Display;
