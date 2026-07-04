import { createContext, useContext, useState } from "react";
import { getStoredUser } from "../utils/auth";
import LoginModal from "../components/LoginModal";
import RegisterModal from "../components/RegisterModal";

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }

  function openLogin() { setShowRegister(false); setShowLogin(true); }
  function openRegister() { setShowLogin(false); setShowRegister(true); }
  function closeModals() { setShowLogin(false); setShowRegister(false); }

  return (
    <AuthContext.Provider value={{ user, setUser, logout, openLogin, openRegister }}>
      {children}
      {showLogin && (
        <LoginModal
          onClose={closeModals}
          onSwitchToRegister={openRegister}
          onLoginSuccess={(userData) => { closeModals(); setUser(userData); }}
        />
      )}
      {showRegister && (
        <RegisterModal
          onClose={closeModals}
          onSwitchToLogin={openLogin}
          onRegisterSuccess={(userData) => { closeModals(); setUser(userData); }}
        />
      )}
    </AuthContext.Provider>
  );
}
