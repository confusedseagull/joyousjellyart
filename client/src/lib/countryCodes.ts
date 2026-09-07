// Country dial codes for the phone number inputs at checkout. Singapore is
// listed first since that's where this business operates and the vast
// majority of customers will be local; the rest follow roughly by regional
// relevance then alphabetically.
export interface CountryCode {
  code: string; // ISO 3166-1 alpha-2
  dialCode: string;
  flag: string;
  name: string;
}

export const COUNTRY_CODES: CountryCode[] = [
  { code: "SG", dialCode: "+65", flag: "🇸🇬", name: "Singapore" },
  { code: "MY", dialCode: "+60", flag: "🇲🇾", name: "Malaysia" },
  { code: "ID", dialCode: "+62", flag: "🇮🇩", name: "Indonesia" },
  { code: "TH", dialCode: "+66", flag: "🇹🇭", name: "Thailand" },
  { code: "VN", dialCode: "+84", flag: "🇻🇳", name: "Vietnam" },
  { code: "PH", dialCode: "+63", flag: "🇵🇭", name: "Philippines" },
  { code: "HK", dialCode: "+852", flag: "🇭🇰", name: "Hong Kong" },
  { code: "TW", dialCode: "+886", flag: "🇹🇼", name: "Taiwan" },
  { code: "CN", dialCode: "+86", flag: "🇨🇳", name: "China" },
  { code: "JP", dialCode: "+81", flag: "🇯🇵", name: "Japan" },
  { code: "KR", dialCode: "+82", flag: "🇰🇷", name: "South Korea" },
  { code: "IN", dialCode: "+91", flag: "🇮🇳", name: "India" },
  { code: "AU", dialCode: "+61", flag: "🇦🇺", name: "Australia" },
  { code: "NZ", dialCode: "+64", flag: "🇳🇿", name: "New Zealand" },
  { code: "GB", dialCode: "+44", flag: "🇬🇧", name: "United Kingdom" },
  { code: "US", dialCode: "+1", flag: "🇺🇸", name: "United States" },
  { code: "CA", dialCode: "+1", flag: "🇨🇦", name: "Canada" },
  { code: "AE", dialCode: "+971", flag: "🇦🇪", name: "United Arab Emirates" },
  { code: "SA", dialCode: "+966", flag: "🇸🇦", name: "Saudi Arabia" },
  { code: "FR", dialCode: "+33", flag: "🇫🇷", name: "France" },
  { code: "DE", dialCode: "+49", flag: "🇩🇪", name: "Germany" },
  { code: "IT", dialCode: "+39", flag: "🇮🇹", name: "Italy" },
  { code: "ES", dialCode: "+34", flag: "🇪🇸", name: "Spain" },
  { code: "NL", dialCode: "+31", flag: "🇳🇱", name: "Netherlands" },
  { code: "CH", dialCode: "+41", flag: "🇨🇭", name: "Switzerland" },
  { code: "SE", dialCode: "+46", flag: "🇸🇪", name: "Sweden" },
  { code: "MM", dialCode: "+95", flag: "🇲🇲", name: "Myanmar" },
  { code: "KH", dialCode: "+855", flag: "🇰🇭", name: "Cambodia" },
  { code: "LA", dialCode: "+856", flag: "🇱🇦", name: "Laos" },
  { code: "BN", dialCode: "+673", flag: "🇧🇳", name: "Brunei" },
  { code: "MO", dialCode: "+853", flag: "🇲🇴", name: "Macau" },
  { code: "PK", dialCode: "+92", flag: "🇵🇰", name: "Pakistan" },
  { code: "BD", dialCode: "+880", flag: "🇧🇩", name: "Bangladesh" },
  { code: "LK", dialCode: "+94", flag: "🇱🇰", name: "Sri Lanka" },
  { code: "NP", dialCode: "+977", flag: "🇳🇵", name: "Nepal" },
  { code: "ZA", dialCode: "+27", flag: "🇿🇦", name: "South Africa" },
  { code: "BR", dialCode: "+55", flag: "🇧🇷", name: "Brazil" },
  { code: "MX", dialCode: "+52", flag: "🇲🇽", name: "Mexico" },
  { code: "RU", dialCode: "+7", flag: "🇷🇺", name: "Russia" },
];

export const DEFAULT_COUNTRY_DIAL_CODE = "+65";
