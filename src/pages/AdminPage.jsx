import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import NotificationBell from "../components/NotificationBell";
import { getStoredUser } from "../utils/auth";
import PendingRegistrationsList from "../components/admin/PendingRegistrationsList";
import BlockedUsersList from "../components/admin/BlockedUsersList";
import AdminChatPanel from "../components/admin/AdminChatPanel";

export default function AdminPage() {
  const navigate = useNavigate();
  const [user] = useState(getStoredUser);
  const [activeTab, setActiveTab] = useState("pending");
  const [imageModal, setImageModal] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [chatUser, setChatUser] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [blockedCount, setBlockedCount] = useState(0);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!user?.is_admin) navigate("/", { replace: true });
  }, []);

  async function handleOpenChat(blockedUser) {
    setChatUser(blockedUser);
    try {
      const res = await fetch(`/api/admin/chat/${blockedUser.id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to start chat");
      const { conversation_id } = await res.json();
      setActiveChat(conversation_id);
    } catch (err) { alert(err.message); }
  }

  if (!user?.is_admin) return null;

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface antialiased">
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-lg shadow-[0_20px_40px_rgba(25,28,29,0.05)]">
        <div className="flex justify-between items-center px-8 h-20 max-w-screen-2xl mx-auto">
          <Link to="/" className="text-2xl font-black tracking-tighter text-slate-900">Secure Ride</Link>
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-slate-500 hover:text-slate-900 transition-colors tracking-tight">Home</Link>
            <Link to="/buy" className="text-slate-500 hover:text-slate-900 transition-colors tracking-tight">Buy</Link>
            <Link to="/sell" className="text-slate-500 hover:text-slate-900 transition-colors tracking-tight">Sell</Link>
            <Link to="/verify" className="text-slate-500 hover:text-slate-900 transition-colors tracking-tight">Verify Ownership</Link>
            <Link to="/admin" className="text-primary font-semibold tracking-tight">Admin</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/profile" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center group-hover:ring-2 group-hover:ring-red-300 transition-all">
                <span className="material-symbols-outlined text-red-600 text-lg">admin_panel_settings</span>
              </div>
              <span className="text-sm font-semibold text-on-surface hidden sm:inline group-hover:text-primary transition-colors">
                {user.first_name} {user.last_name}
              </span>
            </Link>
            <NotificationBell />
          </div>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-6xl mx-auto px-6 pt-28 pb-16">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center">
            <span className="material-symbols-outlined text-red-600 text-3xl">shield_person</span>
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Admin Dashboard</h1>
            <p className="text-on-surface-variant text-sm">Manage registrations, blocked users and investigate reports</p>
          </div>
        </div>

        <div className="flex gap-1 mb-6 bg-surface-container-high/50 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === "pending" ? "bg-white text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`}
          >
            <span className="material-symbols-outlined text-lg">how_to_reg</span>
            Pending Registrations
            {pendingCount > 0 && <span className="ml-1 text-[11px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{pendingCount}</span>}
          </button>
          <button
            onClick={() => setActiveTab("blocked")}
            className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === "blocked" ? "bg-white text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`}
          >
            <span className="material-symbols-outlined text-lg">block</span>
            Blocked Users
            {blockedCount > 0 && <span className="ml-1 text-[11px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{blockedCount}</span>}
          </button>
        </div>

        {activeTab === "pending" && (
          <PendingRegistrationsList token={token} onImageView={setImageModal} onCountChange={setPendingCount} />
        )}
        {activeTab === "blocked" && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2">
              <BlockedUsersList
                token={token}
                activeChatUserId={chatUser?.id}
                onSelectUser={handleOpenChat}
                onCountChange={setBlockedCount}
                onUnblocked={(userId) => {
                  if (chatUser?.id === userId) { setActiveChat(null); setChatUser(null); }
                }}
              />
            </div>
            <div className="lg:col-span-3">
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 overflow-hidden h-[70vh] flex flex-col">
                <AdminChatPanel
                  activeChat={activeChat}
                  chatUser={chatUser}
                  token={token}
                  currentUserId={user?.id}
                  onClose={() => { setActiveChat(null); setChatUser(null); }}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {imageModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setImageModal(null)}>
          <div className="relative max-w-3xl max-h-[85vh] mx-4" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setImageModal(null)} className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-red-50 transition-colors z-10">
              <span className="material-symbols-outlined text-slate-700 text-lg">close</span>
            </button>
            <img src={imageModal} alt="ID Card" className="max-w-full max-h-[85vh] rounded-xl shadow-2xl object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
