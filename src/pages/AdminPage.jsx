import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/ui/PageHeader";
import PendingRegistrationsList from "../components/admin/PendingRegistrationsList";
import BlockedUsersList from "../components/admin/BlockedUsersList";
import AdminChatPanel from "../components/admin/AdminChatPanel";
import { api } from "../utils/api";
import { useAuth } from "../context/AuthContext";

export default function AdminPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("pending");
  const [imageModal, setImageModal] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [chatUser, setChatUser] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [blockedCount, setBlockedCount] = useState(0);

  useEffect(() => {
    if (!user?.is_admin) navigate("/", { replace: true });
  }, []);

  async function handleOpenChat(blockedUser) {
    setChatUser(blockedUser);
    try {
      const { conversation_id } = await api(`/admin/chat/${blockedUser.id}`, { method: "POST" });
      setActiveChat(conversation_id);
    } catch (err) { alert(err.message); }
  }

  if (!user?.is_admin) return null;

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface antialiased">
      <PageHeader activePage="admin" />

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
          <PendingRegistrationsList onImageView={setImageModal} onCountChange={setPendingCount} />
        )}
        {activeTab === "blocked" && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2">
              <BlockedUsersList
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
