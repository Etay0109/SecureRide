import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import NotificationBell from "../components/NotificationBell";
import { getStoredUser } from "../utils/auth";

export default function AdminPage() {
  const navigate = useNavigate();
  const [user] = useState(getStoredUser);
  const [activeTab, setActiveTab] = useState("pending");

  const [pendingUsers, setPendingUsers] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectMode, setRejectMode] = useState(null); // "block" or "changes"
  const [rejectReason, setRejectReason] = useState("");
  const [imageModal, setImageModal] = useState(null);

  const [blockedUsers, setBlockedUsers] = useState([]);
  const [blockedLoading, setBlockedLoading] = useState(true);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const [chatUser, setChatUser] = useState(null);
  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!user?.is_admin) {
      navigate("/", { replace: true });
      return;
    }
    fetchPendingUsers();
    fetchBlockedUsers();
  }, []);

  useEffect(() => {
    if (activeChat) {
      fetchMessages(activeChat);
      pollRef.current = setInterval(() => fetchMessages(activeChat), 3000);
      return () => clearInterval(pollRef.current);
    }
    return () => clearInterval(pollRef.current);
  }, [activeChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ── Pending registrations ── */

  async function fetchPendingUsers() {
    try {
      const res = await fetch("/api/admin/pending-registrations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setPendingUsers(await res.json());
    } catch {
      /* ignore */
    } finally {
      setPendingLoading(false);
    }
  }

  async function handleApprove(userId) {
    if (!confirm("Approve this registration?")) return;
    try {
      const res = await fetch(`/api/admin/registrations/${userId}/approve`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to approve");
      setPendingUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      alert(err.message);
    }
  }

  function openRejectDialog(userId) {
    setRejectTarget(userId);
    setRejectMode(null);
    setRejectReason("");
  }

  async function handleRejectAction() {
    if (!rejectReason.trim()) {
      alert("Please enter a reason");
      return;
    }
    const endpoint =
      rejectMode === "block"
        ? `/api/admin/registrations/${rejectTarget}/permanently-block`
        : `/api/admin/registrations/${rejectTarget}/request-changes`;
    try {
      const res = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: rejectReason.trim() }),
      });
      if (!res.ok) throw new Error("Failed to process rejection");
      setPendingUsers((prev) => prev.filter((u) => u.id !== rejectTarget));
      setRejectTarget(null);
      setRejectMode(null);
      setRejectReason("");
    } catch (err) {
      alert(err.message);
    }
  }

  /* ── Blocked users ── */

  async function fetchBlockedUsers() {
    try {
      const res = await fetch("/api/admin/blocked-users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load");
      setBlockedUsers(await res.json());
    } catch {
      /* ignore */
    } finally {
      setBlockedLoading(false);
    }
  }

  async function handleUnblock(userId) {
    if (!confirm("Are you sure you want to unblock this user?")) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}/unblock`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to unblock");
      setBlockedUsers((prev) => prev.filter((u) => u.id !== userId));
      if (activeChat && chatUser?.id === userId) {
        setActiveChat(null);
        setChatUser(null);
        setMessages([]);
      }
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleKeepBlocked(userId) {
    try {
      await fetch(`/api/admin/users/${userId}/block`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("User remains blocked.");
    } catch (err) {
      alert(err.message);
    }
  }

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
    } catch (err) {
      alert(err.message);
    }
  }

  async function fetchMessages(convId) {
    try {
      const res = await fetch(`/api/chat/conversations/${convId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setMessages(await res.json());
    } catch {
      /* ignore */
    }
  }

  async function handleSendMessage(e) {
    e.preventDefault();
    if (!newMsg.trim() || !activeChat) return;
    setSendingMsg(true);
    try {
      const res = await fetch(`/api/chat/conversations/${activeChat}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newMsg.trim() }),
      });
      if (!res.ok) throw new Error("Failed to send");
      const msg = await res.json();
      setMessages((prev) => [...prev, msg]);
      setNewMsg("");
    } catch (err) {
      alert(err.message);
    } finally {
      setSendingMsg(false);
    }
  }

  if (!user?.is_admin) return null;

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface antialiased">
      {/* Nav */}
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

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-surface-container-high/50 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === "pending"
                ? "bg-white text-primary shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-lg">how_to_reg</span>
            Pending Registrations
            {pendingUsers.length > 0 && (
              <span className="ml-1 text-[11px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                {pendingUsers.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("blocked")}
            className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === "blocked"
                ? "bg-white text-primary shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-lg">block</span>
            Blocked Users
            {blockedUsers.length > 0 && (
              <span className="ml-1 text-[11px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                {blockedUsers.length}
              </span>
            )}
          </button>
        </div>

        {/* ────────────── PENDING REGISTRATIONS TAB ────────────── */}
        {activeTab === "pending" && (
          <div>
            {pendingLoading ? (
              <div className="p-8 text-center text-on-surface-variant text-sm">Loading...</div>
            ) : pendingUsers.length === 0 ? (
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-green-600 text-3xl">check_circle</span>
                </div>
                <p className="font-bold text-on-surface mb-1">No pending registrations</p>
                <p className="text-sm text-on-surface-variant">All registration requests have been reviewed.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {pendingUsers.map((pu) => (
                  <div
                    key={pu.id}
                    className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 overflow-hidden hover:shadow-lg hover:shadow-primary/5 transition-all"
                  >
                    {/* ID card image */}
                    {pu.id_card_image && (
                      <div
                        className="h-40 bg-surface-container-high cursor-pointer relative group"
                        onClick={() => setImageModal(pu.id_card_image)}
                      >
                        <img
                          src={pu.id_card_image}
                          alt="ID Card"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="material-symbols-outlined text-white text-3xl">zoom_in</span>
                        </div>
                      </div>
                    )}

                    <div className="p-5">
                      {/* User details */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-amber-600 text-xl">person</span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-on-surface text-sm truncate">
                            {pu.first_name} {pu.last_name}
                          </p>
                          <p className="text-xs text-on-surface-variant truncate">{pu.email}</p>
                        </div>
                      </div>

                      <div className="space-y-1.5 mb-4">
                        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                          <span className="material-symbols-outlined text-sm">badge</span>
                          <span>ID: {pu.id_number}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                          <span className="material-symbols-outlined text-sm">calendar_today</span>
                          <span>Registered: {new Date(pu.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(pu.id)}
                          className="flex-1 py-2 bg-green-600 text-white rounded-lg font-bold text-xs hover:bg-green-700 transition-all flex items-center justify-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">check</span>
                          Approve
                        </button>
                        <button
                          onClick={() => openRejectDialog(pu.id)}
                          className="flex-1 py-2 bg-white text-red-600 border border-red-200 rounded-lg font-bold text-xs hover:bg-red-50 hover:border-red-300 transition-all flex items-center justify-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">close</span>
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ────────────── BLOCKED USERS TAB ────────────── */}
        {activeTab === "blocked" && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Blocked Users List */}
            <div className="lg:col-span-2">
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 overflow-hidden">
                <div className="px-5 py-4 border-b border-outline-variant/20 flex items-center justify-between">
                  <h2 className="font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-red-500 text-lg">block</span>
                    Blocked Users
                  </h2>
                  <span className="text-xs font-bold bg-red-100 text-red-700 px-2.5 py-1 rounded-full">
                    {blockedUsers.length}
                  </span>
                </div>

                {blockedLoading ? (
                  <div className="p-8 text-center text-on-surface-variant text-sm">Loading...</div>
                ) : blockedUsers.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                      <span className="material-symbols-outlined text-green-600 text-2xl">check_circle</span>
                    </div>
                    <p className="font-semibold text-on-surface text-sm">No blocked users</p>
                    <p className="text-xs text-on-surface-variant mt-1">All clear — no accounts are currently blocked.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-outline-variant/10 max-h-[60vh] overflow-y-auto">
                    {blockedUsers.map((bu) => (
                      <div
                        key={bu.id}
                        className={`p-4 hover:bg-surface-container-high/50 transition-colors cursor-pointer ${
                          chatUser?.id === bu.id ? "bg-primary/5 border-l-4 border-l-primary" : ""
                        }`}
                        onClick={() => handleOpenChat(bu)}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                            <span className="material-symbols-outlined text-red-500 text-lg">person_off</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-on-surface text-sm truncate">
                              {bu.first_name} {bu.last_name}
                            </p>
                            <p className="text-xs text-on-surface-variant truncate">{bu.email}</p>
                          </div>
                        </div>
                        {bu.blocked_reason && (
                          <div className="flex items-start gap-1.5 px-3 py-2 rounded-lg bg-red-50 border border-red-100 mb-2">
                            <span className="material-symbols-outlined text-red-400 text-sm mt-0.5">warning</span>
                            <p className="text-xs text-red-700 leading-relaxed">{bu.blocked_reason}</p>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleUnblock(bu.id); }}
                            className="flex-1 py-1.5 bg-green-600 text-white rounded-lg font-bold text-xs hover:bg-green-700 transition-all flex items-center justify-center gap-1"
                          >
                            <span className="material-symbols-outlined text-sm">lock_open</span>
                            Unblock
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleKeepBlocked(bu.id); }}
                            className="flex-1 py-1.5 bg-white text-red-600 border border-red-200 rounded-lg font-bold text-xs hover:bg-red-50 transition-all flex items-center justify-center gap-1"
                          >
                            <span className="material-symbols-outlined text-sm">block</span>
                            Keep Blocked
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Chat Panel */}
            <div className="lg:col-span-3">
              <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 overflow-hidden h-[70vh] flex flex-col">
                {activeChat && chatUser ? (
                  <>
                    <div className="px-5 py-4 border-b border-outline-variant/20 flex items-center justify-between bg-white">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center">
                          <span className="material-symbols-outlined text-red-500 text-lg">person_off</span>
                        </div>
                        <div>
                          <p className="font-bold text-on-surface text-sm">
                            {chatUser.first_name} {chatUser.last_name}
                          </p>
                          <p className="text-xs text-red-500 font-medium">Blocked User</p>
                        </div>
                      </div>
                      <button
                        onClick={() => { setActiveChat(null); setChatUser(null); setMessages([]); }}
                        className="text-on-surface-variant hover:text-on-surface transition-colors"
                      >
                        <span className="material-symbols-outlined">close</span>
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-surface-container-high/30">
                      {messages.length === 0 && (
                        <div className="text-center py-8 text-on-surface-variant text-sm">
                          No messages yet. Start the conversation.
                        </div>
                      )}
                      {messages.map((msg) => {
                        const isAdmin = msg.sender_id === user.id;
                        return (
                          <div key={msg.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                              isAdmin
                                ? "bg-primary text-white rounded-br-md"
                                : "bg-white text-on-surface border border-outline-variant/20 rounded-bl-md"
                            }`}>
                              <p className="whitespace-pre-wrap">{msg.content}</p>
                              <p className={`text-[10px] mt-1 ${isAdmin ? "text-white/60" : "text-on-surface-variant"}`}>
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={handleSendMessage} className="p-3 border-t border-outline-variant/20 flex gap-2 bg-white">
                      <input
                        type="text"
                        value={newMsg}
                        onChange={(e) => setNewMsg(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-low text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                      />
                      <button
                        type="submit"
                        disabled={sendingMsg || !newMsg.trim()}
                        className="px-4 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50 flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-lg">send</span>
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-on-surface-variant">
                    <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center mb-4">
                      <span className="material-symbols-outlined text-3xl">forum</span>
                    </div>
                    <p className="font-semibold text-on-surface mb-1">Admin Chat</p>
                    <p className="text-sm text-center max-w-xs">
                      Select a blocked user from the list to start a conversation and investigate the case.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Reject / Request Changes modal ── */}
      {rejectTarget && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setRejectTarget(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 animate-[fadeIn_0.2s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            {!rejectMode ? (
              <>
                <h3 className="text-lg font-bold text-on-surface mb-1 flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-500">gavel</span>
                  Reject Registration
                </h3>
                <p className="text-sm text-on-surface-variant mb-5">
                  Choose how to handle this rejection:
                </p>
                <div className="space-y-3">
                  <button
                    onClick={() => setRejectMode("changes")}
                    className="w-full p-4 rounded-xl border-2 border-amber-200 bg-amber-50/50 hover:bg-amber-50 hover:border-amber-300 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3 mb-1">
                      <span className="material-symbols-outlined text-amber-600">edit_note</span>
                      <span className="font-bold text-on-surface text-sm">Request Changes</span>
                    </div>
                    <p className="text-xs text-on-surface-variant pl-9">
                      The user can update their details and resubmit for approval.
                    </p>
                  </button>
                  <button
                    onClick={() => setRejectMode("block")}
                    className="w-full p-4 rounded-xl border-2 border-red-200 bg-red-50/50 hover:bg-red-50 hover:border-red-300 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3 mb-1">
                      <span className="material-symbols-outlined text-red-600">block</span>
                      <span className="font-bold text-on-surface text-sm">Permanently Block</span>
                    </div>
                    <p className="text-xs text-on-surface-variant pl-9">
                      The user will never be able to access the website.
                    </p>
                  </button>
                </div>
                <button
                  onClick={() => setRejectTarget(null)}
                  className="w-full mt-4 py-2.5 bg-surface-container-high text-on-surface rounded-xl font-bold text-sm hover:bg-surface-container-highest transition-all"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold text-on-surface mb-1 flex items-center gap-2">
                  <span className={`material-symbols-outlined ${rejectMode === "block" ? "text-red-500" : "text-amber-500"}`}>
                    {rejectMode === "block" ? "block" : "edit_note"}
                  </span>
                  {rejectMode === "block" ? "Permanently Block User" : "Request Changes"}
                </h3>
                <p className="text-sm text-on-surface-variant mb-4">
                  {rejectMode === "block"
                    ? "This user will be permanently blocked. Please provide a reason."
                    : "The user will be asked to update their registration. Please describe what needs to be fixed."}
                </p>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder={
                    rejectMode === "block"
                      ? "Enter the blocking reason..."
                      : "e.g. The ID image is blurry, please upload a clearer photo..."
                  }
                  rows={3}
                  className={`w-full px-4 py-3 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-on-surface text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all resize-none ${
                    rejectMode === "block"
                      ? "focus:ring-red-400/40 focus:border-red-400"
                      : "focus:ring-amber-400/40 focus:border-amber-400"
                  }`}
                  autoFocus
                />
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => setRejectMode(null)}
                    className="flex-1 py-2.5 bg-surface-container-high text-on-surface rounded-xl font-bold text-sm hover:bg-surface-container-highest transition-all"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleRejectAction}
                    className={`flex-1 py-2.5 text-white rounded-xl font-bold text-sm transition-all ${
                      rejectMode === "block"
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-amber-600 hover:bg-amber-700"
                    }`}
                  >
                    {rejectMode === "block" ? "Permanently Block" : "Request Changes"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── ID card image modal ── */}
      {imageModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setImageModal(null)}
        >
          <div className="relative max-w-3xl max-h-[85vh] mx-4" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setImageModal(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-red-50 transition-colors z-10"
            >
              <span className="material-symbols-outlined text-slate-700 text-lg">close</span>
            </button>
            <img
              src={imageModal}
              alt="ID Card"
              className="max-w-full max-h-[85vh] rounded-xl shadow-2xl object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
