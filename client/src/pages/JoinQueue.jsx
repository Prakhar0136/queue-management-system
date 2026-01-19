import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const JoinQueue = () => {
  const { id } = useParams(); // Get service ID from URL
  const navigate = useNavigate();

  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Call the Backend API
      const res = await axios.post('http://localhost:5000/api/queue/join', {
        phone,
        serviceId: id
      });

      // If successful, redirect to a "Status" page (we will build this next)
      // passing the new queue entry ID
      navigate(`/status/${res.data._id}`);

    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Join the Queue</h2>
        <p className="text-gray-500 mb-6">Enter your details to get a token.</p>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input
              type="tel"
              required
              placeholder="e.g. 9876543210"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg text-white font-semibold shadow-md transition-all
              ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'}
            `}
          >
            {loading ? 'Generating Token...' : 'Get My Token'}
          </button>
        </form>

        <button 
          onClick={() => navigate('/')}
          className="mt-6 w-full text-center text-sm text-gray-500 hover:text-gray-800"
        >
          ← Cancel and Go Back
        </button>
      </div>
    </div>
  );
};

export default JoinQueue;