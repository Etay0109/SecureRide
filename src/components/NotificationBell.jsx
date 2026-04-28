import { useState, useEffect, useRef } from "react";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [totalUnread, setTotalUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    fetchUnread();
    pollRef.current = setInterval(fetchUnread, 5000);
    return () => clearInterval(pollRef.current);
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function fetchUnread() {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch("/api/chat/unread", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setTotalUnread(data.total_unread);
      setNotifications(data.notifications);
    } catch {
      // silent
    }
  }

  function timeAgo(dateStr) {
    if (!dateStr) return "";
    const now = new Date();
    const then = new Date(dateStr);
    const diff = Math.floor((now - then) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  function truncate(str, len) {
    if (!str) return "";
    return str.length > len ? str.slice(0, len) + "..." : str;
  }

  function openChatWidget(conversationId) {
    setOpen(false);
    window.dispatchEvent(new CustomEvent("openChat", { detail: { conversationId } }));
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-9 h-9 rounded-full hover:bg-primary/10 flex items-center justify-center transition-colors"
      >
        <span className="material-symbols-outlined text-on-surface text-xl">notifications</span>
        {totalUnread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1 leading-none">
            {totalUnread > 99 ? "99+" : totalUnread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl shadow-black/15 border border-outline-variant/20 z-[100] overflow-hidden">
          <div className="px-4 py-3 border-b border-outline-variant/20 flex items-center justify-between">
            <h3 className="font-bold text-on-surface text-sm">Notifications</h3>
            {totalUnread > 0 && (
              <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                {totalUnread} new
              </span>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <span className="material-symbols-outlined text-on-surface-variant/30 text-4xl mb-2 block">notifications_off</span>
                <p className="text-sm text-on-surface-variant">No new messages</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.conversation_id}
                  onClick={() => openChatWidget(n.conversation_id)}
                  className="w-full text-left px-4 py-3 hover:bg-surface-container-high/50 transition-colors flex items-start gap-3 border-b border-outline-variant/10 last:border-b-0"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-primary text-lg">person</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-on-surface truncate">
                        {n.sender_first_name} {n.sender_last_name}
                      </p>
                      <span className="text-[10px] text-on-surface-variant flex-shrink-0">
                        {timeAgo(n.last_message_at)}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant truncate mt-0.5">
                      {n.listing_title}
                    </p>
                    <p className="text-xs text-on-surface mt-0.5 truncate">
                      {truncate(n.last_message, 60)}
                    </p>
                    {n.unread_count > 1 && (
                      <span className="inline-block mt-1 text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                        {n.unread_count} messages
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          <button
            onClick={() => openChatWidget(null)}
            className="block w-full text-center py-2.5 text-xs font-bold text-primary hover:bg-primary/5 border-t border-outline-variant/20 transition-colors"
          >
            View All Chats
          </button>
        </div>
      )}
    </div>
  );
}
