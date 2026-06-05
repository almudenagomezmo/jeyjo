"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type WishlistSessionContextValue = {
  hasSession: boolean;
  loginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
};

const WishlistSessionContext = createContext<WishlistSessionContextValue | null>(null);

export function WishlistSessionProvider({
  hasSession,
  children,
}: {
  hasSession: boolean;
  children: React.ReactNode;
}) {
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const openLoginModal = useCallback(() => setLoginModalOpen(true), []);
  const closeLoginModal = useCallback(() => setLoginModalOpen(false), []);

  const value = useMemo(
    () => ({ hasSession, loginModalOpen, openLoginModal, closeLoginModal }),
    [hasSession, loginModalOpen, openLoginModal, closeLoginModal],
  );

  return (
    <WishlistSessionContext.Provider value={value}>{children}</WishlistSessionContext.Provider>
  );
}

export function useWishlistSession() {
  const ctx = useContext(WishlistSessionContext);
  if (!ctx) {
    throw new Error("useWishlistSession must be used within WishlistSessionProvider");
  }
  return ctx;
}
