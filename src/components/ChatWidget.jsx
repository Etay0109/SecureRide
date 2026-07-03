import { useState, useEffect, useRef } from "react";
import { getStoredUser } from "../utils/auth";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState("list");
  const [activeId, setActiveId] = useState(null);
  const [user, setUser] = useState(getStoredUser);

  const [conversations, setConversations] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");

  const messagesEndRef = useRef(null);
  const msgPollRef = useRef(null);
  const listPollRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const u = getStoredUser();
      setUser(u);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleOpenChat(e) {
      const convId = e.detail?.conversationId;
      setOpen(true);
      if (convId) {
        setActiveId(convId);
        setView("chat");
      } else {
        setView("list");
      }
    }
    window.addEventListener("openChat", handleOpenChat);
    return () => window.removeEventListener("openChat", handleOpenChat);
  }, []);

  // --- List polling ---
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!open || !user || !token) return;
    loadConversations();
    listPollRef.current = setInterval(loadConversations, 6000);
    return () => clearInterval(listPollRef.current);
  }, [open, user]);

  // --- Message polling for active chat ---
  useEffect(() => {
    clearInterval(msgPollRef.current);
    if (!activeId || view !== "chat") {
      setActiveConv(null);
      setMessages([]);
      return;
    }
    setLoadingMessages(true);
    loadActiveConversation();
    loadMessages();
    markAsRead();

    msgPollRef.current = setInterval(() => {
      loadMessages();
      markAsRead();
    }, 3000);
    return () => clearInterval(msgPollRef.current);
  }, [activeId, view]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const token = localStorage.getItem("token");

  async function loadConversations() {
    const t = localStorage.getItem("token");
    if (!t) return;
    try {
      const res = await fetch("/api/chat/conversations", {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (!res.ok) return;
      setConversations(await res.json());
    } catch {} finally {
      setLoadingList(false);
    }
  }

  async function loadActiveConversation() {
    try {
      const res = await fetch(`/api/chat/conversations/${activeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { backToList(); return; }
      setActiveConv(await res.json());
    } catch { backToList(); }
  }

  async function loadMessages() {
    try {
      const res = await fetch(`/api/chat/conversations/${activeId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      setMessages(await res.json());
    } catch {} finally {
      setLoadingMessages(false);
    }
  }

  async function markAsRead() {
    try {
      await fetch(`/api/chat/conversations/${activeId}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {}
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;
    setSendError("");
    setSending(true);
    try {
      const res = await fetch(`/api/chat/conversations/${activeId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newMessage.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setSendError(data?.detail || "Failed to send");
        return;
      }
      const msg = await res.json();
      setMessages((prev) => [...prev, msg]);
      setNewMessage("");
      loadConversations();
    } catch {
      setSendError("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  }

  async function handleDelete(convId, e) {
    e.stopPropagation();
    if (!confirm("Delete this chat and all messages?")) return;
    setDeletingId(convId);
    try {
      const res = await fetch(`/api/chat/conversations/${convId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete");
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (activeId === convId) backToList();
    } catch (err) {
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  function openConversation(id) {
    setActiveId(id);
    setView("chat");
  }

  function backToList() {
    setActiveId(null);
    setActiveConv(null);
    setMessages([]);
    setView("list");
  }

  function timeAgo(dateStr) {
    if (!dateStr) return "";
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60) return "now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  function formatTime(dateStr) {
    return new Date(dateStr).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  function groupMessagesByDate(msgs) {
    const groups = [];
    let cur = null;
    for (const m of msgs) {
      const label = formatDate(m.created_at);
      if (label !== cur) { cur = label; groups.push({ date: label, messages: [] }); }
      groups[groups.length - 1].messages.push(m);
    }
    return groups;
  }

  const filtered = conversations.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (c.other_user_first_name || "").toLowerCase().includes(q) ||
      (c.other_user_last_name || "").toLowerCase().includes(q) ||
      (c.listing_title || "").toLowerCase().includes(q)
    );
  });

  if (!user) return null;

  return (
    <>
      {/* Floating bubble */}
      {!open && (
        <button
          onClick={() => { setOpen(true); setView("list"); }}
          className="fixed bottom-6 right-6 z-[200] w-14 h-14 rounded-full bg-primary text-white shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 hover:scale-105 transition-all flex items-center justify-center"
        >
          <span className="material-symbols-outlined text-2xl">chat</span>
        </button>
      )}

      {/* Widget panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-[200] w-[370px] h-[520px] bg-white rounded-2xl shadow-2xl shadow-black/20 border border-outline-variant/20 flex flex-col overflow-hidden">
          {view === "list" ? (
            /* ──────── CONVERSATION LIST ──────── */
            <>
              {/* Header */}
              <div className="flex-shrink-0 bg-primary px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-white text-xl">forum</span>
                  <h3 className="font-bold text-white text-sm">My Chats</h3>
                  {conversations.length > 0 && (
                    <span className="text-[10px] font-bold text-white/70 bg-white/20 px-1.5 py-0.5 rounded-full">
                      {conversations.length}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <span className="material-symbols-outlined text-white text-lg">close</span>
                </button>
              </div>

              {/* Search */}
              <div className="px-3 pt-3 pb-2 flex-shrink-0">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-base">search</span>
                  <input
                    type="text"
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-surface-container-high/50 border-none text-xs placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto">
                {loadingList ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="text-center py-10 px-4">
                    <span className="material-symbols-outlined text-on-surface-variant/25 text-3xl block mb-2">
                      {search ? "search_off" : "chat_bubble_outline"}
                    </span>
                    <p className="text-xs text-on-surface-variant">
                      {search ? "No matches" : "No conversations yet"}
                    </p>
                  </div>
                ) : (
                  filtered.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => openConversation(conv.id)}
                      className="w-full text-left flex items-center gap-2.5 px-3 py-2.5 hover:bg-surface-container-high/40 transition-colors relative group"
                    >
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-primary text-base">person</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-bold text-on-surface truncate">
                            {conv.other_user_first_name} {conv.other_user_last_name}
                          </p>
                          <span className="text-[9px] text-on-surface-variant flex-shrink-0">
                            {timeAgo(conv.last_message_at || conv.created_at)}
                          </span>
                        </div>
                        <p className="text-[10px] text-primary/60 font-medium truncate">{conv.listing_title}</p>
                        <p className="text-[11px] text-on-surface-variant truncate">
                          {conv.last_message || "No messages yet"}
                        </p>
                      </div>
                      {/* Delete on hover */}
                      <div className="absolute right-1.5 top-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => handleDelete(conv.id, e)}
                          disabled={deletingId === conv.id}
                          className="w-6 h-6 rounded-full bg-white shadow-sm hover:bg-red-50 flex items-center justify-center"
                          title="Delete chat"
                        >
                          {deletingId === conv.id ? (
                            <div className="w-3 h-3 border-2 border-red-300 border-t-red-500 rounded-full animate-spin" />
                          ) : (
                            <span className="material-symbols-outlined text-on-surface-variant/40 hover:text-red-500 text-xs">delete</span>
                          )}
                        </button>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </>
          ) : (
            /* ──────── ACTIVE CHAT ──────── */
            <>
              {/* Chat header */}
              <div className="flex-shrink-0 bg-primary px-3 py-2.5 flex items-center gap-2">
                <button
                  onClick={backToList}
                  className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors flex-shrink-0"
                >
                  <span className="material-symbols-outlined text-white text-lg">arrow_back</span>
                </button>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-white text-sm truncate">
                    {activeConv?.other_user_first_name} {activeConv?.other_user_last_name}
                  </p>
                  <p className="text-[10px] text-white/70 truncate">
                    {activeConv?.listing_title}
                    {activeConv?.listing_price > 0 && <> &middot; ₪{activeConv.listing_price.toLocaleString()}</>}
                  </p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors flex-shrink-0"
                >
                  <span className="material-symbols-outlined text-white text-lg">close</span>
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-3 py-3 bg-surface">
                {loadingMessages ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                        <span className="material-symbols-outlined text-primary text-2xl">chat</span>
                      </div>
                      <p className="font-semibold text-on-surface text-xs mb-0.5">Start the conversation</p>
                      <p className="text-[10px] text-on-surface-variant">
                        Say hello to {activeConv?.other_user_first_name || "the other party"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {groupMessagesByDate(messages).map((group) => (
                      <div key={group.date}>
                        <div className="flex items-center gap-2 my-3">
                          <div className="flex-1 h-px bg-outline-variant/20" />
                          <span className="text-[9px] font-semibold text-on-surface-variant/50 uppercase tracking-wider">
                            {group.date}
                          </span>
                          <div className="flex-1 h-px bg-outline-variant/20" />
                        </div>
                        {group.messages.map((msg) => {
                          const isMine = msg.sender_id === user?.id;
                          return (
                            <div key={msg.id} className={`flex mb-2 ${isMine ? "justify-end" : "justify-start"}`}>
                              <div
                                className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                                  isMine
                                    ? "bg-primary text-white rounded-br-md"
                                    : "bg-white text-on-surface rounded-bl-md shadow-sm"
                                }`}
                              >
                                <p className="text-xs leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                                <p className={`text-[9px] mt-0.5 text-right ${isMine ? "text-white/50" : "text-on-surface-variant/40"}`}>
                                  {formatTime(msg.created_at)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input */}
              <div className="flex-shrink-0 bg-white border-t border-outline-variant/20 px-3 py-2">
                {sendError && (
                  <p className="text-[10px] text-red-600 font-medium mb-1.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">block</span>
                    {sendError}
                  </p>
                )}
                <form onSubmit={handleSend} className="flex items-end gap-2">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend(e);
                      }
                    }}
                    placeholder="Type a message..."
                    rows={1}
                    className="flex-1 resize-none rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all max-h-20"
                    style={{ overflow: "auto" }}
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                  >
                    <span className="material-symbols-outlined text-sm">
                      {sending ? "hourglass_empty" : "send"}
                    </span>
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
