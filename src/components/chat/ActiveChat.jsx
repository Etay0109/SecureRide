import { formatTime, groupMessagesByDate } from "../../utils/chatFormatters";

export default function ActiveChat({ conversation, messages, user, loadingMessages, sendError, newMsg, setNewMsg, sending, onSend, onBack, onClose, messagesEndRef }) {
  return (
    <>
      <div className="flex-shrink-0 bg-primary px-3 py-2.5 flex items-center gap-2">
        <button onClick={onBack} className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors flex-shrink-0">
          <span className="material-symbols-outlined text-white text-lg">arrow_back</span>
        </button>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-white text-sm truncate">{conversation?.other_user_first_name} {conversation?.other_user_last_name}</p>
          <p className="text-[10px] text-white/70 truncate">
            {conversation?.listing_title}
            {conversation?.listing_price > 0 && <> &middot; ₪{conversation.listing_price.toLocaleString()}</>}
          </p>
        </div>
        <button onClick={onClose} className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors flex-shrink-0">
          <span className="material-symbols-outlined text-white text-lg">close</span>
        </button>
      </div>

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
              <p className="text-[10px] text-on-surface-variant">Say hello to {conversation?.other_user_first_name || "the other party"}</p>
            </div>
          </div>
        ) : (
          <>
            {groupMessagesByDate(messages).map((group) => (
              <div key={group.date}>
                <div className="flex items-center gap-2 my-3">
                  <div className="flex-1 h-px bg-outline-variant/20" />
                  <span className="text-[9px] font-semibold text-on-surface-variant/50 uppercase tracking-wider">{group.date}</span>
                  <div className="flex-1 h-px bg-outline-variant/20" />
                </div>
                {group.messages.map((msg) => {
                  const isMine = msg.sender_id === user?.id;
                  return (
                    <div key={msg.id} className={`flex mb-2 ${isMine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded-2xl px-3 py-2 ${isMine ? "bg-primary text-white rounded-br-md" : "bg-white text-on-surface rounded-bl-md shadow-sm"}`}>
                        <p className="text-xs leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                        <p className={`text-[9px] mt-0.5 text-right ${isMine ? "text-white/50" : "text-on-surface-variant/40"}`}>{formatTime(msg.created_at)}</p>
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

      <div className="flex-shrink-0 bg-white border-t border-outline-variant/20 px-3 py-2">
        {sendError && (
          <p className="text-[10px] text-red-600 font-medium mb-1.5 flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">block</span>{sendError}
          </p>
        )}
        <form onSubmit={onSend} className="flex items-end gap-2">
          <textarea
            value={newMsg} onChange={(e) => setNewMsg(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(e); } }}
            placeholder="Type a message..." rows={1}
            className="flex-1 resize-none rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all max-h-20"
            style={{ overflow: "auto" }}
          />
          <button
            type="submit" disabled={!newMsg.trim() || sending}
            className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          >
            <span className="material-symbols-outlined text-sm">{sending ? "hourglass_empty" : "send"}</span>
          </button>
        </form>
      </div>
    </>
  );
}
