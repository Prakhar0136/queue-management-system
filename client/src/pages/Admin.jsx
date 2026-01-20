import { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";

const Admin = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState("");
  const [queue, setQueue] = useState([]);
  const [currentToken, setCurrentToken] = useState(null);

  // 1. SECURITY: Check if logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  // 2. Fetch Services
  useEffect(() => {
    axios.get("http://localhost:5000/api/services").then((res) => {
      setServices(res.data);
      if (res.data.length > 0) setSelectedService(res.data[0]._id);
    });
  }, []);

  // 3. Fetch Queue Data
  const fetchQueue = async () => {
    if (!selectedService) return;
    try {
      const res = await axios.get(
        `http://localhost:5000/api/queue/list/${selectedService}`,
      );

      const serving = res.data.find((q) => q.status === "serving");
      const waiting = res.data.filter((q) => q.status === "waiting");

      setCurrentToken(serving || null);
      setQueue(waiting);
    } catch (err) {
      console.error(err);
    }
  };

  // 4. Real-time Listener
  useEffect(() => {
    fetchQueue();
    const socket = io("http://localhost:5000");
    if (selectedService) {
      socket.on(`queue-update-${selectedService}`, () => fetchQueue());
    }
    return () => socket.disconnect();
  }, [selectedService]);

  // 5. Text-to-Speech
  const announceToken = (tokenNum) => {
    const speech = new SpeechSynthesisUtterance(
      `Token Number ${tokenNum}, please proceed to the counter.`,
    );
    speech.lang = "en-IN";
    window.speechSynthesis.speak(speech);
  };

  // 6. Handle "Call Next" with Security Token
  const handleNext = async () => {
    if (queue.length === 0) return;
    const nextPerson = queue[0];
    const token = localStorage.getItem("token");

    // Config: Attach the token to the request
    const config = {
      headers: { "x-auth-token": token },
    };

    try {
      // Mark current as completed
      if (currentToken) {
        await axios.put(
          `http://localhost:5000/api/queue/update/${currentToken._id}`,
          { status: "completed" },
          config,
        );
      }

      // Mark next as serving
      await axios.put(
        `http://localhost:5000/api/queue/update/${nextPerson._id}`,
        { status: "serving" },
        config,
      );

      announceToken(nextPerson.tokenNumber);
      fetchQueue();
    } catch (err) {
      if (err.response && err.response.status === 401) {
        alert("Session expired. Please login again.");
        navigate("/login");
      }
    }
  };

  // 7. Handle "Mark Completed" with Security Token
  const handleCompleteCurrent = async () => {
    if (!currentToken) return;
    const token = localStorage.getItem("token");
    const config = { headers: { "x-auth-token": token } };

    try {
      await axios.put(
        `http://localhost:5000/api/queue/update/${currentToken._id}`,
        { status: "completed" },
        config,
      );
      fetchQueue();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            👮 Admin Dashboard
          </h1>
          <div className="flex gap-4">
            <select
              className="p-2 rounded border"
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
            >
              {services.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                localStorage.removeItem("token");
                navigate("/login");
              }}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 text-sm"
            >
              Logout
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* LEFT: Current Serving Area */}
          <div className="bg-white p-8 rounded-xl shadow-lg border-t-8 border-green-500 flex flex-col items-center justify-center text-center">
            <h2 className="text-xl text-gray-500 font-semibold mb-4">
              CURRENTLY SERVING
            </h2>
            {currentToken ? (
              <>
                <div className="text-8xl font-bold text-green-600 mb-2">
                  {currentToken.tokenNumber}
                </div>
                <p className="text-gray-400 mb-8">
                  Phone: {currentToken.phone}
                </p>
                <button
                  onClick={handleCompleteCurrent}
                  className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-green-700 transition"
                >
                  ✅ Mark Completed
                </button>
              </>
            ) : (
              <p className="text-gray-400 text-xl italic">Counter is Free</p>
            )}
          </div>

          {/* RIGHT: Waiting List */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-700">
                Waiting Queue ({queue.length})
              </h2>
              <button
                onClick={handleNext}
                disabled={queue.length === 0}
                className={`px-6 py-2 rounded-lg font-bold text-white transition
                  ${queue.length === 0 ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
              >
                📢 Call Next
              </button>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {queue.map((q) => (
                <div
                  key={q._id}
                  className="flex justify-between p-4 bg-gray-50 rounded border hover:bg-blue-50 transition"
                >
                  <div>
                    <span className="font-bold text-lg mr-4">
                      #{q.tokenNumber}
                    </span>
                    <span className="text-gray-500 text-sm">{q.phone}</span>
                  </div>
                  <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs">
                    Waiting
                  </span>
                </div>
              ))}
              {queue.length === 0 && (
                <p className="text-center text-gray-400 py-10">
                  No one is waiting!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
