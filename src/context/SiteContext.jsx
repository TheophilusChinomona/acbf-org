import { createContext, useContext, useState } from 'react';

const SiteContext = createContext();

export function SiteProvider({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <SiteContext.Provider value={{
      mobileMenuOpen,
      setMobileMenuOpen,
      searchOpen,
      setSearchOpen,
    }}>
      {children}
    </SiteContext.Provider>
  );
}

export function useSite() {
  const context = useContext(SiteContext);
  if (!context) {
    throw new Error('useSite must be used within a SiteProvider');
  }
  return context;
}

