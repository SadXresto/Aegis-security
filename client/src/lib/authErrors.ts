/**
 * Friendly translations for Supabase Auth errors.
 *
 * Matches on the structured error `code` first (AuthApiError), then on known
 * message substrings, so users never see raw API/SQL internals. Anything
 * unrecognized falls back to a generic message — never the raw error text.
 */

const FALLBACK =
  "Something went wrong on our end. Please try again in a moment.";

const FRIENDLY_BY_CODE: Record<string, string> = {
  invalid_credentials:
    "That email and password combination doesn't match our records. Please try again.",
  invalid_login_credentials:
    "That email and password combination doesn't match our records. Please try again.",
  email_not_confirmed:
    "Please verify your email before signing in. Check your inbox for the confirmation link.",
  user_not_found: "We couldn't find an account with that email address.",
  user_already_exists:
    "An account with this email already exists. Try signing in instead.",
  weak_password:
    "That password is too weak. Please use at least 6 characters.",
  same_password:
    "Your new password must be different from your current password.",
  over_email_send_rate_limit:
    "Too many emails have been sent. Please wait about a minute and try again.",
  over_request_rate_limit:
    "Too many attempts. Please wait about a minute and try again.",
  request_timeout: "The request took too long. Please try again.",
  signup_disabled:
    "New sign-ups are temporarily unavailable. Please try again later.",
  signups_not_allowed:
    "New sign-ups are temporarily unavailable. Please try again later.",
  email_address_invalid:
    "That email address doesn't look right. Please double-check it.",
  validation_failed:
    "Please double-check the information you entered and try again.",
  session_expired: "Your session has expired. Please sign in again.",
  refresh_token_not_found: "Your session has expired. Please sign in again.",
  bad_jwt: "Your session is no longer valid. Please sign in again.",
  otp_expired:
    "That link has expired or was already used. Please request a new one.",
};

const MESSAGE_RULES: [RegExp, string][] = [
  [
    /invalid login credentials/i,
    "That email and password combination doesn't match our records. Please try again.",
  ],
  [
    /email not confirmed/i,
    "Please verify your email before signing in. Check your inbox for the confirmation link.",
  ],
  [
    /user already registered/i,
    "An account with this email already exists. Try signing in instead.",
  ],
  [/user not found/i, "We couldn't find an account with that email address."],
  [
    /password should be at least/i,
    "That password is too short. Please use at least 6 characters.",
  ],
  [
    /new password.*same|same as the (old|current|previous)/i,
    "Your new password must be different from your current password.",
  ],
  [
    /rate limit|only request this once every|too many (requests|attempts|emails)/i,
    "You're doing that too often. Please wait about a minute and try again.",
  ],
  [
    /email address .* (is invalid|invalid)/i,
    "That email address doesn't look right. Please double-check it.",
  ],
  [
    /link.*(invalid|expired)|expired|already been used|invalid request/i,
    "That link has expired or was already used. Please request a new one.",
  ],
  [
    /signup(s)? (is )?disabled|not allowed/i,
    "New sign-ups are temporarily unavailable. Please try again later.",
  ],
  [
    /database error|error saving (new )?user/i,
    "We couldn't complete that right now. Please try again in a moment.",
  ],
  [
    /failed to fetch|networkerror|fetch failed|load failed/i,
    "We couldn't reach the authentication service. Check your connection and try again.",
  ],
  [
    /not configured/i,
    "Authentication is not configured yet. Please try again later.",
  ],
];

export function friendlyAuthError(caught: unknown): string {
  if (caught instanceof Error) {
    const code = (caught as { code?: string }).code;
    if (code && FRIENDLY_BY_CODE[code]) return FRIENDLY_BY_CODE[code];

    for (const [pattern, message] of MESSAGE_RULES) {
      if (pattern.test(caught.message)) return message;
    }
  }
  return FALLBACK;
}
