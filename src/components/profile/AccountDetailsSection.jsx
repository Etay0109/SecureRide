import { useState } from "react";
import SectionHeading from "../ui/SectionHeading";
import { getStoredUser } from "../../utils/auth";
import { api } from "../../utils/api";
import { inputCls } from "../../utils/constants";
import DetailRow from "../ui/DetailRow";

export default function AccountDetailsSection({ profile, onProfileUpdated, onUserUpdated }) {
  const [editingEmail, setEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState("");

  const [editingPassword, setEditingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const handleEmailUpdate = async (e) => {
    e.preventDefault();
    setEmailError("");
    setEmailSuccess("");
    if (!newEmail.trim()) { setEmailError("Please enter a new email."); return; }
    if (!emailPassword) { setEmailError("Password is required to confirm this change."); return; }
    setEmailLoading(true);
    try {
      const updated = await api("/auth/email", {
        method: "PUT",
        body: { new_email: newEmail, password: emailPassword },
      });
      onProfileUpdated(updated);
      const storedUser = getStoredUser();
      if (storedUser) {
        storedUser.email = updated.email;
        localStorage.setItem("user", JSON.stringify(storedUser));
        onUserUpdated(storedUser);
      }
      setEmailSuccess("Email updated successfully.");
      setEditingEmail(false);
      setNewEmail("");
      setEmailPassword("");
    } catch (err) {
      setEmailError(err.message);
    } finally {
      setEmailLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");
    if (!currentPassword || !newPassword) { setPasswordError("All fields are required."); return; }
    if (newPassword !== confirmPassword) { setPasswordError("New passwords do not match."); return; }
    if (newPassword.length < 8) { setPasswordError("New password must be at least 8 characters."); return; }
    setPasswordLoading(true);
    try {
      await api("/auth/password", {
        method: "PUT",
        body: { current_password: currentPassword, new_password: newPassword },
      });
      setPasswordSuccess("Password updated successfully.");
      setEditingPassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordError(err.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  const btnCls = "px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-60";

  return (
    <section className="mb-10">
      <SectionHeading icon="manage_accounts" title="Account Details" />
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 p-6 space-y-5">
        <DetailRow label="First Name" value={profile?.first_name} />
        <DetailRow label="Last Name" value={profile?.last_name} />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Email</p>
            <p className="text-on-surface font-medium">{profile?.email}</p>
          </div>
          <button
            onClick={() => { setEditingEmail(!editingEmail); setEmailError(""); setEmailSuccess(""); }}
            className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-base">edit</span>
            {editingEmail ? "Cancel" : "Change"}
          </button>
        </div>
        {emailSuccess && <div className="px-4 py-2 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">{emailSuccess}</div>}
        {editingEmail && (
          <form onSubmit={handleEmailUpdate} className="space-y-3 pt-2 border-t border-outline-variant/20">
            {emailError && <div className="px-4 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{emailError}</div>}
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-1">New Email</label>
              <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Enter new email" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-1">Confirm with Password</label>
              <input type="password" value={emailPassword} onChange={(e) => setEmailPassword(e.target.value)} placeholder="Enter your current password" className={inputCls} />
            </div>
            <button type="submit" disabled={emailLoading} className={btnCls}>{emailLoading ? "Saving..." : "Save Email"}</button>
          </form>
        )}
        <div className="flex items-center justify-between pt-2 border-t border-outline-variant/20">
          <div>
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Password</p>
            <p className="text-on-surface font-medium">••••••••</p>
          </div>
          <button
            onClick={() => { setEditingPassword(!editingPassword); setPasswordError(""); setPasswordSuccess(""); }}
            className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-base">lock_reset</span>
            {editingPassword ? "Cancel" : "Change"}
          </button>
        </div>
        {passwordSuccess && <div className="px-4 py-2 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">{passwordSuccess}</div>}
        {editingPassword && (
          <form onSubmit={handlePasswordUpdate} className="space-y-3 pt-2">
            {passwordError && <div className="px-4 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{passwordError}</div>}
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-1">Current Password</label>
              <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-1">New Password</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-on-surface mb-1">Confirm New Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" className={inputCls} />
            </div>
            <button type="submit" disabled={passwordLoading} className={btnCls}>{passwordLoading ? "Saving..." : "Update Password"}</button>
          </form>
        )}
      </div>
    </section>
  );
}
