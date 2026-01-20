import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const JoinQueue = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [serviceName, setServiceName] = useState("");

  // Optional: Fetch service name just to display it nicely
  useEffect(() => {
    // You might want to fetch the specific service details here to show the name
    // For now we will just rely on the ID or fetch if needed.
    const fetchService = async () => {
      try {
        // Assuming you have an endpoint for single service or just iterate list
        const res = await axios.get("http://localhost:5000/api/services");
        const service = res.data.find((s) => s._id === id);
        if (service) setServiceName(service.name);
      } catch (err) {
        console.error(err);
      }
    };
    fetchService();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await axios.post("http://localhost:5000/api/queue/join", {
        phone,
        serviceId: id,
      });
      navigate(`/status/${res.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
      setLoading(false);
    }
  };

  return (
    // BACKGROUND: Solid Concrete Gray (Matches Home/Admin)
    <div className="min-h-screen w-full flex items-center justify-center bg-neutral-600 px-4 relative overflow-hidden">
      {/* Decorative Blur */}
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* THE CARD */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-black/60 backdrop-blur-xl border border-white/60 p-8 rounded-2xl shadow-2xl w-full relative">
          {/* Header */}
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white tracking-[0.2em] mb-2 uppercase">
              Get Token
            </h2>
            <div className="h-1 w-16 bg-white mx-auto rounded-full mb-4"></div>
            {serviceName && (
              <p className="text-neutral-400 text-sm uppercase tracking-widest">
                For:{" "}
                <span className="text-white font-bold border-b border-white/20 pb-1">
                  {serviceName}
                </span>
              </p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded mb-6 text-center text-sm font-mono">
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Input Field */}
            <div className="relative group">
              <label className="text-neutral-400 text-xs font-bold ml-1 mb-2 block uppercase tracking-wider">
                Mobile Number
              </label>
              <input
                type="tel"
                required
                placeholder="98765 43210"
                className="w-full bg-white/10 border border-white/20 rounded-lg text-white placeholder-neutral-500 py-4 pl-4 pr-4 focus:outline-none focus:bg-white/20 focus:border-white/50 transition-all duration-300 text-lg tracking-widest font-mono"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <div className="absolute right-4 bottom-4 text-neutral-500 pointer-events-none">
                📞
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full font-bold py-4 rounded-lg shadow-lg transform transition-all duration-300 tracking-[0.15em] uppercase text-sm
                ${
                  loading
                    ? "bg-neutral-500 text-neutral-300 cursor-wait"
                    : "bg-white text-black hover:bg-neutral-200 hover:scale-[1.02] active:scale-95"
                }
              `}
            >
              {loading ? "Processing..." : "Confirm & Join"}
            </button>
          </form>

          {/* Cancel Link */}
          <div className="mt-8 text-center">
            <button
              onClick={() => navigate("/")}
              className="text-neutral-500 text-xs hover:text-white uppercase tracking-widest transition-colors duration-300 border-b border-transparent hover:border-white pb-1"
            >
              Cancel Operation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JoinQueue;
