import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const Home = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch services from your backend
    const fetchServices = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/services");
        setServices(res.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching services:", err);
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <header className="text-center mb-10">
        <h1 className="text-4xl font-bold text-blue-700 mb-2">
          🏛️ Queue Sahayak
        </h1>
        <p className="text-gray-600">
          Smart Queue Management for Government Services
        </p>
      </header>

      {loading ? (
        <div className="text-center text-xl">Loading Services...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.map((service) => (
            <div
              key={service._id}
              className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition cursor-pointer border-l-4 border-blue-500"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">
                  {service.icon} {service.name}
                </h2>
                <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  Active
                </span>
              </div>

              <div className="text-gray-600 mb-4">
                <p>
                  Avg Wait:{" "}
                  <span className="font-bold text-black">
                    {service.averageTime} mins
                  </span>{" "}
                  / person
                </p>
              </div>

              <Link
                to={`/join/${service._id}`}
                className="block w-full text-center bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Join Queue
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
