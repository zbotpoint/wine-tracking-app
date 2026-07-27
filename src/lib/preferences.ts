const LAST_CURRENCY_KEY = 'wineLog.lastCurrency'

export function getLastCurrency(): string {
  return localStorage.getItem(LAST_CURRENCY_KEY) ?? 'CAD'
}

export function rememberCurrency(currency: string | null) {
  if (currency) localStorage.setItem(LAST_CURRENCY_KEY, currency)
}

// Local date, not UTC: logging at 11 pm must not land on tomorrow. en-CA
// formats as YYYY-MM-DD.
export function todayISO(): string {
  return new Intl.DateTimeFormat('en-CA').format(new Date())
}
