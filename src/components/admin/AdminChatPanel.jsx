import { useState, useEffect, useRef } from "react";

export default function AdminChatPanel({ activeChat, chatUser, token, currentUserId, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    if (activeChat) {
      fetchMessages();
      pollRef.current = setInterval(fetchMessages, 3000);
      return () => clearInterval(pollRef.current);
    }
    return () => clearInterval(pollRef.current);
  }, [activeChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function fetchMessages() {
    if (!activeChat) return;
    try {
      const res = await fetch(`/api/chat/conversations/${activeChat}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setMessages(await res.json());
    } catch { /* ignore */ }
  }

  async function handleSendMessage(e) {
    e.preventDefault();
    if (!newMsg.trim() || !activeChat) return;
    setSendingMsg(true);
    try {
      const res = await fetch(`/api/chat/conversations/${activeChat}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: newMsg.trim() }),
      });
      if (!res.ok) throw new Error("Failed to send");
      setMessages((prev) => [...prev, await res.json()]);
      setNewMsg("");
    } catch (err) { alert(err.message); }
    finally { setSendingMsg(false); }
  }

  if (!activeChat || !chatUser) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-on-surface-variant">
        <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-3xl">forum</span>
        </div>
        <p className="font-semibold text-on-surface mb-1">Admin Chat</p>
        <p className="text-sm text-center max-w-xs">Select a blocked user from the list to start a conversation and investigate the case.</p>
      </div>
    );
  }

  return (
    <>
      <div className="px-5 py-4 border-b border-outline-variant/20 flex items-center justify-between bg-white">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center">
            <span className="material-symbols-outlined text-red-500 text-lg">person_off</span>
          </div>
          <div>
            <p className="font-bold text-on-surface text-sm">{chatUser.first_name} {chatUser.last_name}</p>
            <p className="text-xs text-red-500 font-medium">Blocked User</p>
          </div>
        </div>
        <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-surface-container-high/30">
        {messages.length === 0 && (
          <div className="text-center py-8 text-on-surface-variant text-sm">No messages yet. Start the conversation.</div>
        )}
        {messages.map((msg) => {
          const isAdmin = msg.sender_id === currentUserId;
          return (
            <div key={msg.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${isAdmin ? "bg-primary text-white rounded-br-md" : "bg-white text-on-surface border border-outline-variant/20 rounded-bl-md"}`}>
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
          type="text" value={newMsg} onChange={(e) => setNewMsg(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-low text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
        />
        <button type="submit" disabled={sendingMsg || !newMsg.trim()} className="px-4 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50 flex items-center gap-1">
          <span className="material-symbols-outlined text-lg">send</span>
        </button>
      </form>
    </>
  );
}
