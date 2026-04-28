import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import NotificationBell from "../components/NotificationBell";

function getStoredUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function AdminPage() {
  const navigate = useNavigate();
  const [user] = useState(getStoredUser);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
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
      setLoading(false);
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
            <p className="text-on-surface-variant text-sm">Manage blocked users and investigate reports</p>
          </div>
        </div>

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

              {loading ? (
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
                  {/* Chat header */}
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

                  {/* Messages */}
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

                  {/* Input */}
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
      </main>
    </div>
  );
}
