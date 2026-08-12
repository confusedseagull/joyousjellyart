export const ENV = {
  cookieSecret: process.env.JWT_SECRET ?? "",
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY ?? "",
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  orderEmailFrom: process.env.ORDER_EMAIL_FROM ?? "Joyous JellyArt <onboarding@resend.dev>",
};
