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

  // 1. SECURITY
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  // 2. Fetch Services (Will now fetch 9 items)
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

  // 6. Handle "Call Next"
  const handleNext = async () => {
    if (queue.length === 0) return;
    const nextPerson = queue[0];
    const token = localStorage.getItem("token");

    const config = {
      headers: { "x-auth-token": token },
    };

    try {
      if (currentToken) {
        await axios.put(
          `http://localhost:5000/api/queue/update/${currentToken._id}`,
          { status: "completed" },
          config,
        );
      }

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

  // 7. Handle "Mark Completed"
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
    // BACKGROUND: Solid Concrete Gray
    <div className="min-h-screen w-full bg-neutral-600 text-white p-6 overflow-hidden relative font-sans">
      <div className="max-w-7xl mx-auto relative z-10">
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-12 border-b border-white/60 pb-6">
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <div className="h-10 w-1 bg-white rounded-full"></div>
            <h1 className="text-3xl font-bold tracking-[0.2em] uppercase text-white drop-shadow-sm">
              Command Center
            </h1>
          </div>

          <div className="flex gap-4 items-center">
            {/* Styled Select Dropdown */}
            <div className="relative group">
              <select
                className="appearance-none bg-black/60 border border-white/60 text-white py-2 pl-4 pr-10 rounded-lg focus:outline-none focus:bg-black/80 transition-all cursor-pointer backdrop-blur-md"
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
              >
                {services.map((s) => (
                  <option
                    key={s._id}
                    value={s._id}
                    className="bg-neutral-800 text-white"
                  >
                    {s.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-3 pointer-events-none text-white">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>

            <button
              onClick={() => {
                localStorage.removeItem("token");
                navigate("/login");
              }}
              className="border border-red-500/80 text-red-100 bg-red-500/20 px-6 py-2 rounded-lg hover:bg-red-500/40 transition duration-300 text-sm font-semibold tracking-wider uppercase shadow-lg"
            >
              Logout
            </button>
          </div>
        </header>

        {/* DASHBOARD GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT: Current Serving */}
          <div className="bg-black/60 backdrop-blur-xl border border-white/60 rounded-2xl p-10 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden">
            <h2 className="text-sm font-bold text-neutral-400 tracking-[0.2em] mb-8 relative z-10 uppercase">
              Now Serving
            </h2>

            {currentToken ? (
              <div className="relative z-10 animate-fade-in-up w-full flex flex-col items-center">
                <div className="text-9xl font-bold text-white mb-4 tracking-tighter drop-shadow-lg">
                  {currentToken.tokenNumber}
                </div>
                <p className="text-neutral-300 mb-10 text-lg font-light tracking-wide bg-white/10 px-4 py-1 rounded-full border border-white/20">
                  Customer:{" "}
                  <span className="text-white font-medium ml-2">
                    {currentToken.phone}
                  </span>
                </p>

                <button
                  onClick={handleCompleteCurrent}
                  className="px-10 py-3 rounded-lg border border-green-500/80 text-green-100 bg-green-600/20 hover:bg-green-600/40 transition-all duration-300 font-bold tracking-widest uppercase text-sm shadow-lg w-full md:w-auto"
                >
                  ✓ Mark Complete
                </button>
              </div>
            ) : (
              <div className="relative z-10 py-12">
                <div className="text-6xl text-neutral-500 mb-4 opacity-50">
                  ⏸
                </div>
                <p className="text-neutral-400 text-xl font-light tracking-wide">
                  Counter is Idle
                </p>
              </div>
            )}
          </div>

          {/* RIGHT: Waiting List */}
          <div className="bg-black/60 backdrop-blur-xl border border-white/60 rounded-2xl p-8 shadow-2xl flex flex-col h-[500px]">
            <div className="flex justify-between items-center mb-8 border-b border-white/20 pb-4">
              <h2 className="text-xl font-bold text-white tracking-wider flex items-center gap-3">
                <span>Waiting Queue</span>
                <span className="bg-white text-black text-xs font-bold px-2 py-1 rounded-md">
                  {queue.length}
                </span>
              </h2>

              <button
                onClick={handleNext}
                disabled={queue.length === 0}
                className={`
                  px-8 py-3 rounded-lg font-bold shadow-lg transform transition-all duration-300 tracking-wide text-sm
                  ${
                    queue.length === 0
                      ? "bg-neutral-800 text-neutral-500 cursor-not-allowed border border-white/10"
                      : "bg-white text-black hover:bg-neutral-200 hover:scale-[1.02]"
                  }
                `}
              >
                CALL NEXT 📢
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-grow">
              {queue.map((q, index) => (
                <div
                  key={q._id}
                  className="flex justify-between items-center p-4 bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 hover:border-white/40 transition-all duration-300"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold text-white border border-white/10">
                      {index + 1}
                    </div>
                    <div>
                      <span className="font-bold text-2xl text-white mr-4 block leading-none">
                        #{q.tokenNumber}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="block text-neutral-400 text-xs mb-1 uppercase tracking-wider">
                      Phone
                    </span>
                    <span className="text-neutral-200 text-sm font-mono">
                      {q.phone}
                    </span>
                  </div>
                </div>
              ))}

              {queue.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-neutral-500">
                  <p className="text-lg italic">All Caught Up</p>
                  <p className="text-sm opacity-50">No customers in queue</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
