import { BrowserRouter, Routes, Route } from "react-router-dom";
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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/verify" element={<VerifyOwnership />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/sell" element={<SellPage />} />
        <Route path="/buy" element={<BuyPage />} />
        <Route path="/listing/:id" element={<ListingDetailPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/about" element={<AboutPage />} />
      </Routes>
      <ChatWidget />
      <BlockedBanner />
    </BrowserRouter>
  );
}

export default App;
