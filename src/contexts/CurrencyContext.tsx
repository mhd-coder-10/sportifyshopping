import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface Currency {
  code: string;
  symbol: string;
  name: string;
  rate: number; // Rate relative to INR (base currency)
}

const currencies: Currency[] = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', rate: 1 },
  { code: 'USD', symbol: '$', name: 'US Dollar', rate: 0.012 },
  { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.011 },
  { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.0095 },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', rate: 0.044 },
];

interface CurrencyContextType {
  currency: Currency;
  currencies: Currency[];
  setCurrency: (code: string) => void;
  convertPrice: (priceInINR: number) => number;
  formatPrice: (priceInINR: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  const [currency, setCurrencyState] = useState<Currency>(currencies[0]);
  const { user, profile, updateProfile } = useAuth();

  // Load currency from profile when user logs in
  useEffect(() => {
    if (profile?.preferred_currency) {
      const savedCurrency = currencies.find(c => c.code === profile.preferred_currency);
      if (savedCurrency) {
        setCurrencyState(savedCurrency);
      }
    }
  }, [profile]);

  // Load from localStorage for non-logged-in users
  useEffect(() => {
    if (!user) {
      const savedCode = localStorage.getItem('preferred_currency');
      if (savedCode) {
        const savedCurrency = currencies.find(c => c.code === savedCode);
        if (savedCurrency) {
          setCurrencyState(savedCurrency);
        }
      }
    }
  }, [user]);

  const setCurrency = async (code: string) => {
    const newCurrency = currencies.find(c => c.code === code);
    if (newCurrency) {
      setCurrencyState(newCurrency);
      localStorage.setItem('preferred_currency', code);
      
      // Save to profile if logged in
      if (user) {
        await updateProfile({ preferred_currency: code });
      }
    }
  };

  const convertPrice = (priceInINR: number): number => {
    return priceInINR * currency.rate;
  };

  const formatPrice = (priceInINR: number): string => {
    const converted = convertPrice(priceInINR);
    return `${currency.symbol}${converted.toFixed(2)}`;
  };

  return (
    <CurrencyContext.Provider value={{
      currency,
      currencies,
      setCurrency,
      convertPrice,
      formatPrice
    }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};