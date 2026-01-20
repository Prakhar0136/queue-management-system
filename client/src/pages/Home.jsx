import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom"; // Added useNavigate
import axios from "axios";

const Home = () => {
  const [services, setServices] = useState([]);
  const navigate = useNavigate(); // Initialize navigation

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/services")
      .then((res) => setServices(res.data))
      .catch((err) => console.error(err));
  }, []);

  return (
    // BACKGROUND: Concrete Gray
    <div className="min-h-screen bg-neutral-800 font-sans text-white overflow-x-hidden">
      {/* HEADER HERO SECTION */}
      <header className="relative pt-20 pb-16 px-6 md:px-20 border-b border-white/20">
        <div className="max-w-7xl mx-auto">
          <p className="text-neutral-400 uppercase tracking-[0.3em] text-sm mb-4 animate-fade-in">
            government of india 
          </p>
          <h1 className="text-5xl md:text-7xl font-bold uppercase tracking-tighter mb-6 leading-tight">
            Service <br /> <span className="text-white/50">Terminal</span>
          </h1>
          
          <p className="max-w-xl text-neutral-300 text-lg font-light leading-relaxed">
            Select a service category below to generate your token. Please have
            your identification documents ready before proceeding.
          </p>
        </div>

        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
      </header>

      {/* MAIN GRID */}
      <main className="max-w-7xl mx-auto px-6 md:px-20 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <Link
              to={`/join/${service._id}`}
              key={service._id}
              className="group relative bg-black/20 border border-white/10 p-8 hover:bg-white hover:text-black transition-all duration-500 overflow-hidden"
            >
              {/* Hover Effect Background */}
              <div className="absolute inset-0 bg-white translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out z-0"></div>

              {/* Content */}
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <span className="text-4xl filter grayscale group-hover:grayscale-0 transition-all duration-300">
                      {service.icon}
                    </span>
                    <span className="text-xs font-mono border border-white/30 group-hover:border-black/30 px-2 py-1 rounded-full uppercase">
                      {service.averageTime} min
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
            </Link>
          ))}
        </div>
      </main>

      {/* FOOTER ACTIONS */}
      <footer className="border-t border-white/10 bg-black/20">
        <div className="max-w-7xl mx-auto px-6 md:px-20 py-16 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h4 className="text-xl font-bold uppercase tracking-widest mb-2">
              Public Display
            </h4>
            <p className="text-neutral-400 text-sm max-w-md">
              View the current queue status on the large display screen.
            </p>
          </div>

          <div className="flex gap-4">
            <Link
              to="/display"
              className="px-8 py-4 bg-white text-black font-bold rounded-lg uppercase tracking-widest hover:bg-neutral-300 transition-colors"
            >
              View Board
            </Link>

            {/* UPDATED BUTTON: This now navigates to the admin login */}
            <button
              onClick={() => navigate("/admin-login")}
              className="px-8 py-4 bg-transparent border border-white/30 rounded-lg text-white font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all duration-300"
            >
              Request Access
            </button>
          </div>
        </div>

        <div className="text-center py-6 text-neutral-300 text-[10px] uppercase tracking-[0.2em] border-t border-white/5">
          Restricted System • Authorized Use Only
        </div>
      </footer>
    </div>
  );
};

export default Home;
