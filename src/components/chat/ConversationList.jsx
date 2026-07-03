import { timeAgo } from "../../utils/chatFormatters";

export default function ConversationList({ conversations, query, setQuery, loadingList, onSelect, onDelete, deletingId, onClose }) {
  const filtered = conversations.filter((c) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      (c.other_user_first_name || "").toLowerCase().includes(q) ||
      (c.other_user_last_name || "").toLowerCase().includes(q) ||
      (c.listing_title || "").toLowerCase().includes(q)
    );
  });

  return (
    <>
      <div className="flex-shrink-0 bg-primary px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-white text-xl">forum</span>
          <h3 className="font-bold text-white text-sm">My Chats</h3>
          {conversations.length > 0 && (
            <span className="text-[10px] font-bold text-white/70 bg-white/20 px-1.5 py-0.5 rounded-full">{conversations.length}</span>
          )}
        </div>
        <button onClick={onClose} className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors">
          <span className="material-symbols-outlined text-white text-lg">close</span>
        </button>
      </div>
      <div className="px-3 pt-3 pb-2 flex-shrink-0">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-base">search</span>
          <input
            type="text" placeholder="Search..." value={query} onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-surface-container-high/50 border-none text-xs placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loadingList ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 px-4">
            <span className="material-symbols-outlined text-on-surface-variant/25 text-3xl block mb-2">{query ? "search_off" : "chat_bubble_outline"}</span>
            <p className="text-xs text-on-surface-variant">{query ? "No matches" : "No conversations yet"}</p>
          </div>
        ) : (
          filtered.map((conv) => (
            <button key={conv.id} onClick={() => onSelect(conv.id)} className="w-full text-left flex items-center gap-2.5 px-3 py-2.5 hover:bg-surface-container-high/40 transition-colors relative group">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-primary text-base">person</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <p className="text-xs font-bold text-on-surface truncate">{conv.other_user_first_name} {conv.other_user_last_name}</p>
                  <span className="text-[9px] text-on-surface-variant flex-shrink-0">{timeAgo(conv.last_message_at || conv.created_at)}</span>
                </div>
                <p className="text-[10px] text-primary/60 font-medium truncate">{conv.listing_title}</p>
                <p className="text-[11px] text-on-surface-variant truncate">{conv.last_message || "No messages yet"}</p>
              </div>
              <div className="absolute right-1.5 top-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => onDelete(conv.id, e)} disabled={deletingId === conv.id}
                  className="w-6 h-6 rounded-full bg-white shadow-sm hover:bg-red-50 flex items-center justify-center" title="Delete chat"
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
  );
}
