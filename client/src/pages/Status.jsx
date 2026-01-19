import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";

const Status = () => {
  const { id } = useParams(); // This is the Ticket ID
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkInLoading, setCheckInLoading] = useState(false);

  // 1. Function to fetch latest data
  const fetchTicketDetails = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/queue/details/${id}`,
      );
      setTicket(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching ticket:", err);
      setLoading(false);
    }
  };

  // 2. Initial Load & Real-Time Listener
  useEffect(() => {
    fetchTicketDetails();

    const socket = io("http://localhost:5000");

    // Only listen if we know the service ID
    if (ticket) {
      socket.on(`queue-update-${ticket.serviceType._id}`, () => {
        console.log("Queue updated! Refreshing data...");
        fetchTicketDetails();
      });
    }

    return () => socket.disconnect();
  }, [id, ticket?.serviceType?._id]); // Re-run listener if ticket ID or Service ID changes

  // 3. GPS Check-In Logic
  const handleCheckIn = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setCheckInLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;

        // --- CONFIGURATION ---
        // For testing, these coordinates don't matter much because we use a huge radius below.
        // For a real interview demo, replace these with the actual lat/long of the "Office".
        const officeLat = 28.6304;
        const officeLng = 77.2177;

        // Haversine Formula to calculate distance in meters
        const R = 6371e3;
        const φ1 = (userLat * Math.PI) / 180;
        const φ2 = (officeLat * Math.PI) / 180;
        const Δφ = ((officeLat - userLat) * Math.PI) / 180;
        const Δλ = ((officeLng - userLng) * Math.PI) / 180;

        const a =
          Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
          Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c; // Distance in meters

        console.log(`User is ${distance} meters away.`);

        // --- DISTANCE CHECK ---
        // I have set this to 500,000 meters (500km) so it works for you immediately while testing at home.
        // CHANGE THIS to 500 (meters) when you want to demonstrate strict geofencing.
        if (distance < 500000) {
          try {
            await axios.put(`http://localhost:5000/api/queue/checkin/${id}`);
            // After check-in success, refresh data to update UI to "Waiting"
            fetchTicketDetails();
            alert("✅ Check-in Successful! You are now in the queue.");
          } catch (err) {
            console.error(err);
            alert("Check-in failed on server.");
          }
        } else {
          alert(
            `📍 You are too far away! (${Math.round(distance)}m). Please come closer to the office.`,
          );
        }
        setCheckInLoading(false);
      },
      (error) => {
        alert(
          "⚠️ Unable to retrieve location. Please allow GPS access in your browser settings.",
        );
        setCheckInLoading(false);
      },
    );
  };

  if (loading)
    return (
      <div className="text-center mt-20 text-xl font-semibold text-gray-500">
        Loading your ticket...
      </div>
    );
  if (!ticket)
    return (
      <div className="text-center mt-20 text-red-500 text-xl font-bold">
        Ticket not found
      </div>
    );

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center p-6">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden text-center transition-all duration-300">
        {/* Header Section */}
        <div
          className={`${ticket.status === "arriving" ? "bg-gray-600" : "bg-blue-600"} text-white p-6 transition-colors duration-300`}
        >
          <h2 className="text-xl font-medium opacity-90">Your Token Number</h2>
          <h1 className="text-6xl font-bold mt-2 tracking-wider">
            #{ticket.tokenNumber}
          </h1>
          <div className="mt-4 inline-block bg-white/20 backdrop-blur-sm px-4 py-1 rounded-full text-sm font-medium">
            {ticket.serviceType.name}
          </div>
        </div>

        {/* Info Body */}
        <div className="p-8 space-y-6">
          {/* SCENARIO 1: User needs to Check In */}
          {ticket.status === "arriving" && (
            <div className="text-center animate-fadeIn">
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-xl mb-6 text-sm text-left">
                <p className="font-bold mb-1">🚦 Not in Queue Yet</p>
                You have secured a token, but you are not visible to the counter
                staff yet.
                <br />
                <br />
                <strong>
                  Please click the button below when you reach the office.
                </strong>
              </div>

              <button
                onClick={handleCheckIn}
                disabled={checkInLoading}
                className={`w-full py-4 rounded-xl font-bold shadow-lg text-white transition-all transform hover:scale-105 active:scale-95
                    ${checkInLoading ? "bg-gray-400 cursor-wait" : "bg-blue-600 hover:bg-blue-700 animate-pulse"}
                `}
              >
                {checkInLoading
                  ? "Verifying Location..."
                  : "📍 I am at the Office (Check In)"}
              </button>
            </div>
          )}

          {/* SCENARIO 2: User is Waiting / Serving / Completed */}
          {ticket.status !== "arriving" && (
            <div className="animate-fadeIn">
              <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                <span className="text-gray-500 font-medium">
                  Current Status
                </span>
                <span
                  className={`font-bold px-3 py-1 rounded-full text-xs tracking-wide uppercase
                  ${ticket.status === "waiting" ? "bg-blue-100 text-blue-700" : ""}
                  ${ticket.status === "serving" ? "bg-green-100 text-green-700 animate-pulse" : ""}
                  ${ticket.status === "completed" ? "bg-gray-100 text-gray-700" : ""}
                `}
                >
                  {ticket.status}
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-gray-100 pb-4 mt-4">
                <span className="text-gray-500 font-medium">People Ahead</span>
                <span className="font-bold text-3xl text-gray-800">
                  {ticket.peopleAhead}
                </span>
              </div>

              <div className="flex justify-between items-center pb-2 mt-4">
                <span className="text-gray-500 font-medium">
                  Est. Wait Time
                </span>
                <span className="font-bold text-xl text-blue-600">
                  {ticket.peopleAhead * ticket.serviceType.averageTime} mins
                </span>
              </div>

              {ticket.status === "serving" && (
                <div className="mt-6 bg-green-50 text-green-800 p-4 rounded-xl border border-green-200 font-bold">
                  📢 It is your turn! Please go to the counter.
                </div>
              )}
            </div>
          )}

          <p className="text-xs text-gray-300 mt-6 font-mono">
            ID: {ticket._id}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Status;
