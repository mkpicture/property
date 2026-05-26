import React, { createContext, useContext, useState } from "react";
import { formatCurrency as formatCurrencyLib, CURRENCY_SYMBOL } from "@/lib/currency";

interface CurrencyContextType {
  currency: string;
  setCurrency: (currency: string) => void;
  formatCurrency: (amount: number | string, options?: any) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<string>(() => {
    return localStorage.getItem("app_currency") || CURRENCY_SYMBOL;
  });

  const setCurrency = (newCurrency: string) => {
    setCurrencyState(newCurrency);
    localStorage.setItem("app_currency", newCurrency);
  };

  const formatCurrency = (amount: number | string, options: any = {}) => {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) {
      return options.showSymbol ?? true ? `0 ${currency}` : "0";
    }

    if (currency !== "FCFA") {
      const formatted = new Intl.NumberFormat(options.locale || "fr-FR", {
        minimumFractionDigits: options.decimals ?? 0,
        maximumFractionDigits: options.decimals ?? 0,
      }).format(numAmount);
      return options.showSymbol ?? true ? `${formatted} ${currency}` : formatted;
    }

    return formatCurrencyLib(amount, options);
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
};
