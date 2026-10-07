export const ENV = {
  cookieSecret: process.env.JWT_SECRET ?? "",
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY ?? "",
  // OneMap: email + password let the server renew its own 3-day token;
  // ONEMAP_TOKEN alone works only until that token expires.
  oneMapEmail: process.env.ONEMAP_EMAIL ?? process.env.ONEMAP_API_EMAIL ?? "",
  oneMapPassword: process.env.ONEMAP_PASSWORD ?? process.env.ONEMAP_API_PASSWORD ?? "",
  oneMapToken: process.env.ONEMAP_TOKEN ?? "",
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  orderEmailFrom: process.env.ORDER_EMAIL_FROM ?? "Joyous JellyArt <onboarding@resend.dev>",
};
