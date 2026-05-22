import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import VerifyOwnership from "./pages/VerifyOwnership";
import ProfilePage from "./pages/ProfilePage";
import SellPage from "./pages/SellPage";
import BuyPage from "./pages/BuyPage";
import ListingDetailPage from "./pages/ListingDetailPage";
import AdminPage from "./pages/AdminPage";
import AboutPage from "./pages/AboutPage";
import ChatWidget from "./components/ChatWidget";
import BlockedBanner from "./components/BlockedBanner";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/verify" element={<ProtectedRoute><VerifyOwnership /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/sell" element={<ProtectedRoute><SellPage /></ProtectedRoute>} />
        <Route path="/buy" element={<ProtectedRoute><BuyPage /></ProtectedRoute>} />
        <Route path="/listing/:id" element={<ListingDetailPage />} />
        <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
        <Route path="/about" element={<AboutPage />} />
      </Routes>
      <ChatWidget />
      <BlockedBanner />
    </BrowserRouter>
  );
}

export default App;
