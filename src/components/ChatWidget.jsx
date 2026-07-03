import { useState, useEffect, useRef } from "react";
import { getStoredUser } from "../utils/auth";
import ConversationList from "./chat/ConversationList";
import ActiveChat from "./chat/ActiveChat";

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
    const interval = setInterval(() => setUser(getStoredUser()), 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleOpenChat(e) {
      const convId = e.detail?.conversationId;
      setOpen(true);
      if (convId) { setActiveId(convId); setView("chat"); }
      else setView("list");
    }
    window.addEventListener("openChat", handleOpenChat);
    return () => window.removeEventListener("openChat", handleOpenChat);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!open || !user || !token) return;
    loadConversations();
    listPollRef.current = setInterval(loadConversations, 6000);
    return () => clearInterval(listPollRef.current);
  }, [open, user]);

  useEffect(() => {
    clearInterval(msgPollRef.current);
    if (!activeId || view !== "chat") { setActiveConv(null); setMessages([]); return; }
    setLoadingMessages(true);
    loadActiveConversation();
    loadMessages();
    markAsRead();
    msgPollRef.current = setInterval(() => { loadMessages(); markAsRead(); }, 3000);
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
      const res = await fetch("/api/chat/conversations", { headers: { Authorization: `Bearer ${t}` } });
      if (res.ok) setConversations(await res.json());
    } catch {} finally { setLoadingList(false); }
  }

  async function loadActiveConversation() {
    try {
      const res = await fetch(`/api/chat/conversations/${activeId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { backToList(); return; }
      setActiveConv(await res.json());
    } catch { backToList(); }
  }

  async function loadMessages() {
    try {
      const res = await fetch(`/api/chat/conversations/${activeId}/messages`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setMessages(await res.json());
    } catch {} finally { setLoadingMessages(false); }
  }

  async function markAsRead() {
    try {
      await fetch(`/api/chat/conversations/${activeId}/read`, { method: "PUT", headers: { Authorization: `Bearer ${token}` } });
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
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: newMessage.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setSendError(data?.detail || "Failed to send");
        return;
      }
      setMessages((prev) => [...prev, await res.json()]);
      setNewMessage("");
      loadConversations();
    } catch { setSendError("Failed to send message. Please try again."); }
    finally { setSending(false); }
  }

  async function handleDelete(convId, e) {
    e.stopPropagation();
    if (!confirm("Delete this chat and all messages?")) return;
    setDeletingId(convId);
    try {
      const res = await fetch(`/api/chat/conversations/${convId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to delete");
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (activeId === convId) backToList();
    } catch (err) { alert(err.message); }
    finally { setDeletingId(null); }
  }

  function openConversation(id) { setActiveId(id); setView("chat"); }
  function backToList() { setActiveId(null); setActiveConv(null); setMessages([]); setView("list"); }

  if (!user) return null;

  return (
    <>
      {!open && (
        <button
          onClick={() => { setOpen(true); setView("list"); }}
          className="fixed bottom-6 right-6 z-[200] w-14 h-14 rounded-full bg-primary text-white shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 hover:scale-105 transition-all flex items-center justify-center"
        >
          <span className="material-symbols-outlined text-2xl">chat</span>
        </button>
      )}
      {open && (
        <div className="fixed bottom-6 right-6 z-[200] w-[370px] h-[520px] bg-white rounded-2xl shadow-2xl shadow-black/20 border border-outline-variant/20 flex flex-col overflow-hidden">
          {view === "list" ? (
            <ConversationList
              conversations={conversations}
              query={search}
              setQuery={setSearch}
              loadingList={loadingList}
              onSelect={openConversation}
              onDelete={handleDelete}
              deletingId={deletingId}
              onClose={() => setOpen(false)}
            />
          ) : (
            <ActiveChat
              conversation={activeConv}
              messages={messages}
              user={user}
              loadingMessages={loadingMessages}
              sendError={sendError}
              newMsg={newMessage}
              setNewMsg={setNewMessage}
              sending={sending}
              onSend={handleSend}
              onBack={backToList}
              onClose={() => setOpen(false)}
              messagesEndRef={messagesEndRef}
            />
          )}
        </div>
      )}
    </>
  );
}
