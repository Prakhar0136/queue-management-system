import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import JoinQueue from './pages/JoinQueue'; // Import this

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100 text-gray-900 font-sans">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/join/:id" element={<JoinQueue />} /> {/* New Route */}
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;