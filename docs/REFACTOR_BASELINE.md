# Refactor Baseline

This document describes the current state of every file that will be modified during the
SecureRide refactor. Its purpose is to ensure no existing logic is silently lost.

---

## Frontend — Pages

### `src/App.jsx`
Defines `ProtectedRoute` (checks `localStorage` token + `user.blocked`; redirects to "/" if
either fails) and the top-level router. Mounts `<ChatWidget>` and `<BlockedBanner>` globally
outside routes. Imports `getStoredUser` from `utils/auth`. No fetch calls.

### `src/pages/LandingPage.jsx`
State: `showLogin`, `showRegister`, `user` (from `getStoredUser`), `vehicleCount`. Fetches
`GET /api/stats` on mount (no auth) to get `vehicles_verified`. Defines `openLogin`,
`openRegister`, `handleLogout` locally. Mounts `<LoginModal>` and `<RegisterModal>` directly.
"Get Started" button navigates to `/buy` if logged in, else calls `openRegister()`.

### `src/pages/BuyPage.jsx`
State: `showLogin`, `showRegister`, `user`, `listings`, `loading`, `recommendations`,
`recsLoading`, filter/sort state. Fetches `GET /api/sell/listings` (no auth, silent on error)
and `GET /api/recommendations/?limit=6` (with auth, re-fetches when `user` or `location.key`
changes). Defines `handleLogout`, `openLogin`, `openRegister` locally. Mounts both modals.
Empty-state block at lines 107-115 is a custom div (no `<EmptyState>` component).

### `src/pages/SellPage.jsx`
State: `showLogin`, `showRegister`, `user`, `vehicles`, `loading`, form fields, `submitLoading`,
`submitError`, `success`. Fetches `GET /api/sell/available-vehicles` (with auth) in `fetchVehicles`
— called on mount if token exists, and also passed as the `onLoginSuccess` callback so vehicles
reload after login. `handleSubmit` posts to `POST /api/sell/`. Local logout/modal functions.

### `src/pages/ProfilePage.jsx`
State: `showLogin`, `showRegister`, `user`, `profile`, `vehicles`, `loadingProfile`. Fetches
`GET /api/auth/me` in `fetchProfile` (redirects to "/" on failure). Fetches
`GET /api/verify/my-vehicles` in `fetchVehicles`. Both called on mount. `onLoginSuccess` callback
at lines 122-127 calls both `fetchProfile()` and `fetchVehicles()` — this will be replaced by a
`useEffect(..., [user])` after modal migration. Passes `navigate` prop to `<ActiveListingsSection>`.

### `src/pages/AboutPage.jsx`
State: `showLogin`, `showRegister`, `user`. No API calls. Defines `handleLogout`, `openLogin`,
`openRegister`. Mounts both modals.

### `src/pages/ListingDetailPage.jsx`
State: `showLogin`, `showRegister`, `user`, `listing`, `loading`, `error`, photo/edit/save/delete
state, `trades`, `buyingLoading`. Three `useEffect` blocks: (1) fetch listing by id, (2) fetch
trades for listing, (3) track `view` interaction. `handleSaveEdit` PUTs to
`/api/sell/listings/${id}`. `handleDelete` DELETEs the listing and navigates to `/buy`.
`handleEditPhotoFiles` converts files via FileReader (no size/count guard). `handleBuyNow` POSTs
to `/api/trades/`. `handleTradeAction` PUTs to `/api/trades/${tradeId}/${action}`. `handleOpenChat`
POSTs to `/api/chat/conversations` then dispatches `openChat` event. Passes `user`, `listing`, and
`onOpenLogin` props to `<ListingDetailActions>`.

### `src/pages/VerifyOwnership.jsx`
State: `user` (redirects to "/" if null), `frameNumber`, `vehicleType`, `brand`, `model`, `color`,
`additionalDetails`, `error`, `submitting`, `success`. Validates frame number regex on submit.
Posts to `POST /api/verify/` with auth. Error handling at lines 51-57: checks
`res.status === 403 && data.detail?.startsWith("BLOCKED")` — if true, dispatches
`accountBlocked` event with `data.detail` as reason. Defines `openLogin`, `openRegister`,
`handleLogout`. Mounts both modals.

### `src/pages/AdminPage.jsx`
State: `user` (no modal, reads localStorage once), `activeTab`, `imageModal`, `activeChat`,
`chatUser`, `pendingCount`, `blockedCount`. Redirects non-admins immediately. Lines 41-63 render
a hand-rolled `<nav>` that duplicates the PageHeader layout — different styling (bg-white/80,
h-20, red avatar, `admin_panel_settings` icon, no logout button). `handleOpenChat` posts to
`POST /api/admin/chat/${blockedUser.id}`. No `useAuth`, no modals.

---

## Frontend — Components

### `src/components/ui/PageHeader.jsx`
Props: `user`, `onLogout`, `onOpenLogin`, `onOpenRegister`, `activePage`. Shows nav links only if
`user` is set; admin link only if `user.is_admin`. Shows red ring + `person_off` icon if
`user.blocked`. Login/SignUp buttons call `onOpenLogin`/`onOpenRegister`. No internal API calls.

### `src/components/ui/EmptyState.jsx`
Props: `icon`, `title`, `description`, `actionLabel`, `actionTo`. All static — no dynamic text or
children prop. Currently lacks an overridable description.

### `src/components/ChatWidget.jsx`
State: `open`, `view` ("list"|"chat"), `activeId`, `user` (from `getStoredUser`), `conversations`,
`loadingList`, `search`, `deletingId`, `activeConv`, `messages`, `loadingMessages`,
`newMessage`, `sending`, `sendError`. Line 28-31: `useEffect` with `setInterval(2000)` polls
localStorage to refresh `user`. Line 33-42: listens for `openChat` custom event. Lines 44-50:
when open and user exists, loads conversations and polls every 6s. Lines 52-61: when `activeId`
changes, loads messages + marks read, polls every 3s. All fetch calls use `localStorage.getItem("token")`
directly. Returns `null` if `!user`. Dispatches no events but listens for `openChat`.

### `src/components/BlockedBanner.jsx`
State: `user`, `blocked`, `reason`. Lines 12-44: on mount, fetches `GET /api/auth/me` and syncs
blocked state to localStorage. Lines 46-59: listens for `accountBlocked` window event, updates
blocked+reason state and localStorage. Lines 61-70: `setInterval(500)` watches for token removal
from localStorage; if token gone, clears blocked state — this is the interval to delete. Lines
72-77: `useEffect` redirects to "/" when `blocked` and not on "/". The "Open Chat" button
dispatches the `openChat` event. Returns `null` if `!blocked`.

### `src/components/LoginModal.jsx`
Props: `onClose`, `onSwitchToRegister`, `onLoginSuccess`. State: `error`, `loading`,
`changesRequested`. POSTs to `POST /api/auth/login`. On success: stores token+user in
localStorage, dispatches `accountBlocked` if user is blocked, calls `onLoginSuccess`. Error
handling at line 26: if `message.startsWith("__CHANGES_REQUESTED__|")`, sets `changesRequested`
state with email, password, reason extracted by `replace("__CHANGES_REQUESTED__|", "")`.
Delegates to `<ChangesRequestedFlow>` if `changesRequested` is set.

### `src/components/RegisterModal.jsx`
Props: `onClose`, `onSwitchToLogin`, `onRegisterSuccess`. State: `error`, `loading`, `pending`,
`idCardImage`. POSTs to `POST /api/auth/register`. Error handling: checks 422 array for
field-specific messages, otherwise uses `data.detail`. On success, sets `pending=true` (shows
"pending approval" screen). `onRegisterSuccess` is NOT called here (no auto-login).

### `src/components/NotificationBell.jsx`
State: `notifications`, `totalUnread`, `open`. Polls `GET /api/chat/unread` every 5s. Local
`timeAgo` function (lines 40-49): returns "just now" / "5m ago" / "2h ago" / "3d ago".
Local `truncate` helper. Dispatches `openChat` event with `conversationId` on click. No auth
state; reads token from localStorage directly in `fetchUnread`.

### `src/components/trades/TradeCard.jsx`
Props: `trade`, `isBuyer`, `isSeller`, `onAction`. Derives `isPending`/`isAccepted` from
`trade.status`. Shows confirmation checklist for `accepted` state ("Seller confirmed transfer" /
"Buyer confirmed transfer"). Action buttons: Accept Trade / Reject (seller, pending), Cancel
Request (buyer, pending), "I Confirm I Received/Transferred the Vehicle" (not-yet-confirmed,
accepted), "You confirmed — waiting for the other party" (already confirmed), "Trade Did Not
Happen" (accepted, with `confirm()` dialog). Used in `TradesHistorySection` (full history).

### `src/components/trades/TradeStatusCard.jsx`
Props: `trade`, `role` ("buyer"|"seller"), `onAction`. Returns `null` for any status other than
`pending_seller` or `accepted`. Compact layout. `pending_seller` panel: amber bg, shows buyer
name or waiting message. `accepted` panel: blue bg, shows "Seller confirmed transfer ✓" and
"Buyer confirmed receipt ✓" (note "receipt" label, vs TradeCard's "Buyer confirmed transfer").
"You confirmed — waiting for {firstName}" (shows first name only, vs TradeCard's full phrase).
Button labels identical to TradeCard. Used in `ListingDetailActions` for compact trade display.

### `src/components/listing/ListingDetailActions.jsx`
Props: `isOwnListing`, `user`, `listing`, `editing`, `deleting`, `saving`, `buyingLoading`,
`myActiveTrade`, `pendingTradesForSeller`, `acceptedTradeForSeller`, `onStartEditing`,
`onCancelEditing`, `onSaveEdit`, `onDelete`, `onBuyNow`, `onTradeAction`, `onOpenLogin`,
`onOpenChat`. Renders TradeStatusCard components. The `user`, `listing`, `onOpenLogin` props are
accepted but currently only `onOpenLogin` is used (in "Buy Now" block).

### `src/components/listing/ListingEditForm.jsx`
Local `DetailRow` (side-by-side: `flex justify-between items-center`, label in `span.text-sm
text-on-surface-variant`, value with optional `mono`/`capitalize` props). Local `EditField`
helper. Local `inputCls = "w-full px-3 py-2 rounded-lg ..."` — **smaller** than other instances
(rounded-lg, px-3/py-2, text-sm). No API calls; controlled entirely by parent.

### `src/components/profile/AccountDetailsSection.jsx`
Local `DetailRow` (stacked: `div > p.uppercase.tracking-wider + p.font-medium`). Local
`inputCls = "w-full px-4 py-3 rounded-xl ... bg-surface-container-low ..."`. Local `btnCls`.
Two API calls: `PUT /api/auth/email` and `PUT /api/auth/password`. Updates localStorage user
on email change via `getStoredUser()`.

### `src/components/profile/ActiveListingsSection.jsx`
Props: `token`, `navigate`. Uses `navigate` prop (from `ProfilePage`) for navigation. Fetches
`GET /api/sell/my-listings`. `handleDelete` calls `DELETE /api/sell/listings/${id}` with confirm
dialog. Client-side search and pagination (5 per page).

### `src/components/profile/TradesHistorySection.jsx`
Props: `user`, `token`, `onVehicleTransferred`. Fetches `GET /api/trades/my`. Calls
`PUT /api/trades/${id}/${action}` via `handleAction`. Calls `onVehicleTransferred()` when trade
completes (status === "completed"). Renders `<TradeCard>`.

### `src/components/profile/VehiclesSection.jsx`
Props: `token`, `vehicles`, `onVehiclesChange`. Local `VEHICLE_ICONS` constant. Calls
`DELETE /api/verify/${frame}` and `PUT /api/verify/${frame}/toggle-stolen`. Triggers
`onVehiclesChange()` after mutations.

### `src/components/sell/VehicleSelectionStep.jsx`
Props: `vehicles`, `onSelect`. Local `VEHICLE_ICONS` constant. Shows vehicle grid with icon.
Lines 10-27: custom empty-state block (no `<EmptyState>` component): icon + "No vehicles yet"
title + link text.

### `src/components/sell/ListingFormStep.jsx`
Local `VEHICLE_ICONS` and `inputCls = "w-full px-4 py-3 rounded-xl ... bg-surface-container-low ..."`.
No API calls; pure form.

### `src/components/sell/PhotoUploader.jsx`
Props: `photos`, `setPhotos`. Accepts image/* files via drag-drop or click. Uses `FileReader`
for base64 conversion. No size or count limit currently. UI mentions "up to 10MB" in placeholder
text.

### `src/components/auth/RegistrationForm.jsx`
Local `inputCls = "... bg-surface-container-lowest ..."` (differs from other `inputCls` — uses
`bg-surface-container-lowest` not `bg-surface-container-low`). ID card handler: no size guard.

### `src/components/auth/ChangesRequestedFlow.jsx`
Handles re-submission flow after admin requests changes. Contains ID card image handler (no size
guard). Posts to `POST /api/auth/resubmit`.

### `src/components/admin/AdminChatPanel.jsx`
Props: `activeChat`, `chatUser`, `token`, `currentUserId`, `onClose`. Line ~44: `const newMsg =
await res.json()` shadows the outer `newMsg` state variable (lint warning). Polls messages.
Posts to `POST /api/chat/conversations/${activeChat}/messages`.

### `src/components/listing/ListingCard.jsx`
Local `VEHICLE_ICONS` constant.

### `src/components/listing/ListingPhotoGallery.jsx`
Likely has local `VEHICLE_ICONS` constant.

### `src/components/admin/BlockedUsersList.jsx`
Fetches blocked users. No modal state.

### `src/components/admin/PendingRegistrationsList.jsx`
Fetches pending registrations. No modal state.

---

## Backend

### `backend/routes/auth.py`
Defines password helpers, JWT creation/decode, and 4 dependency functions:
- `get_current_user_id` (lines 137-140): unused; only decodes JWT and returns user ID string.
- `get_current_user` (lines 144-154): unused; returns `User` object, no blocked/status check.
  Duplicates `require_auth`.
- `require_auth` (lines 183-193): used widely; validates JWT, fetches User, raises 401 if not
  found. Does NOT check `blocked` or `registration_status`.
- `require_active_user` (lines 158-179): used for write operations; validates JWT + fetches User
  + raises 403 if `user.blocked` (with `user.blocked_reason` as message) or
  `registration_status != "approved"`. Contains a third copy of the fetch-user-or-401 block.
- `require_admin`: wraps `require_active_user`, adds `is_admin` check.
- Login endpoint (lines 99-134): raises `f"__CHANGES_REQUESTED__|{reason}"` when
  `registration_status == "changes_requested"`.

### `backend/routes/admin.py`
- `pending_registration_count` (lines 137-145): `GET /pending-count` — unused, returns `{"count": N}`.
- All other endpoints used normally. No changes needed except removing the one endpoint.

### `backend/routes/verify.py`
- `verify_ownership` (lines 52-111): blocks user account if stolen vehicle, then raises 403 with
  `detail="BLOCKED: This vehicle is reported as stolen. Your account has been blocked pending
  investigation."` (string prefix).

### `backend/routes/sell.py`
- `listing_to_response` (lines 16-42): converts `Listing + Vehicle + User` → `ListingResponse`.
  Fields: `id`, `frame_number`, `seller_id`, `condition`, `ownership_duration`, `price`, `city`,
  `address`, `description`, `photos` (JSON-parsed), `created_at`, `vehicle_brand`, `vehicle_model`,
  `vehicle_type`, `vehicle_color`, `seller_first_name`, `seller_last_name`.
  No `vehicle_id`, `year`, or `is_active` fields.
- Used in `create_listing`, `all_listings`, `get_listing`, `my_listings`, `update_listing`.

### `backend/routes/recommendations.py`
- `_listing_to_recommended` (lines 100-127): same fields as `listing_to_response` plus
  `score=round(score, 4)`. Returns `RecommendedListingResponse`.
- Recommendation algorithm: cosine similarity on weighted one-hot feature vectors.

### `backend/schemas.py`
- `RecommendedListingResponse` (lines 178-196): currently duplicates all 18 fields of
  `ListingResponse` (lines 99-116) plus `score: float = 0.0`. Should extend `ListingResponse`.
- `CreateListingRequest.photos` and `UpdateListingRequest.photos`: no validators yet.
- `RegisterRequest.id_card_image` and `ResubmitRegistrationRequest.id_card_image`: no size validators.

### `backend/routes/chat.py`
- `list_conversations` (lines 63-127): for each conversation (N), fires: 1 query for other_user,
  1 for listing+vehicle title, 1 for last message. N+1 pattern.
- `get_conversation` (lines 131-177): for a single conversation, fetches other_user, then
  listing+vehicle (if listing_id exists). Returns dict (not schema). Includes `listing_price`.
- `get_unread_notifications` (lines 261-337): for each conversation (N), fires: 1 count query,
  1 for last unread message, 1 for other_user, 1 for listing+vehicle. N+1+1+1 pattern.
- `_conversation_title` logic (duplicated in 3 places): if `conv.is_admin_chat` → "Admin Support";
  else join `Listing+Vehicle` on `frame_number`, format `f"{v.brand or 'Unknown'} {v.model or ''}"
  .strip()`, return `""` if no row.
- `Conversation` model has `buyer_last_read_at` and `seller_last_read_at` (nullable timestamps)
  for per-role read tracking.

### `backend/routes/trade.py`
- `trade_to_response` (lines 15-45): for each trade, fires 3 queries (vehicle, buyer, seller).
  Snapshot fallback: `(vehicle.brand if vehicle else None) or trade.vehicle_brand_snapshot`.
- `my_trades` and `trades_for_listing` call `trade_to_response` per trade: N+3 queries each.
- Error message strings (verbatim, must be preserved):
  - accept: "Only the seller can accept" / "Trade is not in pending state"
  - reject: "Only the seller can reject" / "Trade is not in pending state"
  - cancel: "Only the buyer can cancel" / "Trade cannot be cancelled in current state"
  - abort: "Not a participant in this trade" / "Only accepted trades can be aborted"
  - confirm-transfer: "Only the seller can confirm transfer" / "Trade must be accepted first"
  - confirm-receipt: "Only the buyer can confirm receipt" / "Trade must be accepted first"
  - all: 404 "Trade not found"

### `backend/routes/__init__.py`
Currently an empty package marker (one blank line). No changes needed.

---

## Key Invariants

- **`user.blocked_reason`** is the string displayed in BlockedBanner. It must come through as-is
  from the backend; never default to a hardcoded string that replaces the real reason.
- **`accountBlocked` custom event** carries `{ reason }` in `detail`. BlockedBanner and
  VerifyOwnership both dispatch it; BlockedBanner listens for it.
- **`openChat` custom event** carries an optional `{ conversationId }` in `detail`.
  NotificationBell and ListingDetailPage dispatch it; ChatWidget listens.
- **Trade snapshots**: after a trade completes, the vehicle record is updated and the listing
  deleted; `TradeResponse` uses snapshot columns (`vehicle_brand_snapshot`, etc.) as fallback.
- **`ConversationResponse` `listing_id` field** is serialized as `""` (empty string) when null,
  not as JSON `null` — this must be preserved in the N+1 fix.
- **Confirmation labels differ between variants**: TradeCard says "Buyer confirmed transfer",
  TradeStatusCard says "Buyer confirmed receipt". Both are shown to different users in different
  contexts and must be preserved exactly.
- **`inputCls` is NOT uniform** across the 4 files: RegistrationForm uses `bg-surface-container-lowest`;
  ListingEditForm uses `rounded-lg px-3 py-2 text-sm` (compact). The constants.js extraction
  should cover only the two files that share the same string (AccountDetailsSection + ListingFormStep).
  RegistrationForm and ListingEditForm have distinct variants that need separate treatment.
