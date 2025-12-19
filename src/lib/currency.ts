/**
 * Utilitaires pour le formatage des devises en FCFA
 */

const CURRENCY_SYMBOL = 'FCFA';
const CURRENCY_CODE = 'XOF';

/**
 * Formate un montant en FCFA
 * @param amount - Montant en nombre
 * @param options - Options de formatage
 * @returns Montant formaté avec le symbole FCFA
 */
export function formatCurrency(
  amount: number | string,
  options: {
    showSymbol?: boolean;
    decimals?: number;
    locale?: string;
  } = {}
): string {
  const {
    showSymbol = true,
    decimals = 0,
    locale = 'fr-FR',
  } = options;

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return showSymbol ? `0 ${CURRENCY_SYMBOL}` : '0';
  }

  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(numAmount);

  return showSymbol ? `${formatted} ${CURRENCY_SYMBOL}` : formatted;
}

/**
 * Formate un montant en FCFA avec séparateurs de milliers
 * @param amount - Montant en nombre
 * @returns Montant formaté (ex: "1 500 000 FCFA")
 */
export function formatFCFA(amount: number | string): string {
  return formatCurrency(amount, { showSymbol: true, decimals: 0 });
}

/**
 * Parse un montant depuis une chaîne formatée
 * @param value - Chaîne formatée (ex: "1 500 000 FCFA")
 * @returns Montant en nombre
 */
export function parseCurrency(value: string): number {
  // Retirer le symbole et les espaces, garder seulement les chiffres
  const cleaned = value.replace(/[^\d,.-]/g, '').replace(/,/g, '.');
  return parseFloat(cleaned) || 0;
}

export { CURRENCY_SYMBOL, CURRENCY_CODE };

