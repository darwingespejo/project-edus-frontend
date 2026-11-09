export function isGmailAddress(email: string) {
  return /^(?:[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+)@(?:gmail\.com|googlemail\.com)$/i.test(email.trim().toLowerCase());
}
