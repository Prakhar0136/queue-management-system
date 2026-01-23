import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Pages
import Home from "./pages/Home";
import Ticket from "./pages/Ticket";
import Display from "./pages/Display";

// Admin Pages (We will build these next)
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import TicketTracker from "./pages/TicketTracker";

function App() {
  return (
    <Router>
      <Routes>
        {/* Client Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/ticket/:id" element={<Ticket />} />
        <Route path="/display" element={<Display />} />

        {/* Admin Routes */}
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/track/:id" element={<TicketTracker />} />
      </Routes>
    </Router>
  );
}

export default App;
