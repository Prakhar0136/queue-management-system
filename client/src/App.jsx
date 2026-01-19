import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import JoinQueue from './pages/JoinQueue'; // Import this
import Status from "./pages/Status";
import Admin from "./pages/Admin";
import Display from "./pages/Display";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100 text-gray-900 font-sans">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/join/:id" element={<JoinQueue />} /> {/* New Route */}
          <Route path="/status/:id" element={<Status />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/display" element={<Display />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;