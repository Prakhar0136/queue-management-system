import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

// 🔧 HELPER: Automatically detect if we are on localhost or network
const getBaseUrl = () => {
  const { hostname } = window.location;
  return `http://${hostname}:5000`;
};

const Home = () => {
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);

  // 🆕 Inputs
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    // 🔧 USE DYNAMIC BASE URL
    axios
      .get(`${getBaseUrl()}/api/services`)
      .then((res) => setServices(res.data))
      .catch((err) => console.error(err));
  }, []);

  const handleJoinQueue = async (e) => {
    e.preventDefault();
    if (!selectedService) return;
    setLoading(true);

    try {
      const res = await axios.post(`${getBaseUrl()}/api/queue/join`, {
        serviceId: selectedService._id,
        name: name,
        phone: phone,
        email: email,
      });

      navigate(`/ticket/${res.data._id}`);
    } catch (err) {
      console.error("Booking Error:", err);
      alert("Failed to join queue. Check backend console.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-800 font-sans text-white overflow-x-hidden">
      {/* HEADER */}
      <header className="relative pt-20 pb-16 px-6 md:px-20 border-b border-white/20">
        <div className="max-w-7xl mx-auto">
          <p className="text-neutral-400 uppercase tracking-[0.3em] text-sm mb-4 animate-fade-in">
            Welcome To
          </p>
          <h1 className="text-5xl md:text-7xl font-bold uppercase tracking-tighter mb-6 leading-tight">
            Service <br /> <span className="text-white/50">Terminal</span>
          </h1>
          <p className="max-w-xl text-neutral-300 text-lg font-light leading-relaxed">
            Select a service category below. Please have your documents ready.
          </p>
        </div>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-6 md:px-20 py-16">
        {!selectedService ? (
          // GRID VIEW
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <button
                key={service._id}
                onClick={() => setSelectedService(service)}
                className="group text-left w-full relative bg-black/20 border border-white/10 p-8 hover:bg-white hover:text-black transition-all duration-500 overflow-hidden"
              >
                <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out z-0"></div>
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <span className="text-4xl filter grayscale group-hover:grayscale-0 transition-all duration-300">
                        {service.icon || "📋"}
                      </span>
                      <span className="text-xs font-mono border border-white/30 group-hover:border-black/30 px-2 py-1 rounded-full uppercase">
                        {service.estimatedTime || 10} min
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold uppercase tracking-wide mb-2">
                      {service.name}
                    </h3>
                  </div>
                  <div className="mt-8 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                    <span className="text-xs font-bold uppercase tracking-widest">
                      Get Token
                    </span>
                    <span className="text-lg">→</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          // FORM VIEW
          <div className="max-w-lg mx-auto bg-black/40 border border-white/10 p-10 backdrop-blur-md animate-fade-in">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
              <div className="flex items-center gap-4">
                <span className="text-3xl">{selectedService.icon || "📋"}</span>
                <h2 className="text-2xl font-bold uppercase tracking-widest">
                  {selectedService.name}
                </h2>
              </div>
              <button
                onClick={() => setSelectedService(null)}
                className="text-xs text-neutral-400 hover:text-white uppercase tracking-widest"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleJoinQueue} className="space-y-6">
              {/* NAME INPUT */}
              <div>
                <label className="block text-xs uppercase tracking-widest text-neutral-500 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  className="w-full bg-neutral-900 border border-white/10 p-4 text-white focus:outline-none focus:border-white/50 transition-colors"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {/* PHONE INPUT */}
              <div>
                <label className="block text-xs uppercase tracking-widest text-neutral-500 mb-2">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  required
                  className="w-full bg-neutral-900 border border-white/10 p-4 text-white focus:outline-none focus:border-white/50 transition-colors"
                  placeholder="Enter 10-digit number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              {/* EMAIL INPUT */}
              <div>
                <label className="block text-xs uppercase tracking-widest text-neutral-500 mb-2">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  className="w-full bg-neutral-900 border border-white/10 p-4 text-white focus:outline-none focus:border-white/50 transition-colors"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-black font-bold uppercase tracking-widest py-4 hover:bg-neutral-200 transition-colors mt-4 disabled:opacity-50"
              >
                {loading ? "Processing..." : "Confirm & Print"}
              </button>
            </form>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/10 bg-black/20">
        <div className="max-w-7xl mx-auto px-6 md:px-20 py-16 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h4 className="text-xl font-bold uppercase tracking-widest mb-2">
              Public Display
            </h4>
            <p className="text-neutral-400 text-sm max-w-md">
              View the current queue status.
            </p>
          </div>
          <div className="flex gap-4">
            <Link
              to="/display"
              className="px-8 py-4 bg-white text-black font-bold rounded-lg uppercase tracking-widest hover:bg-neutral-300 transition-colors"
            >
              View Board
            </Link>
            <button
              onClick={() => navigate("/admin-login")}
              className="px-8 py-4 bg-transparent border border-white/30 rounded-lg text-white font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all"
            >
              Request Access
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
