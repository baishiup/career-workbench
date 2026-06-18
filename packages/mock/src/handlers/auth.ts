/**
 * GoTrue（Supabase Auth）mock。
 *
 * 纯 demo：不校验密码，任意账号都登录为同一个固定 mock 用户，
 * 这样 onboarding/简历/职位匹配全都挂在 seed 的那条用户数据上。
 * token / signup 回标准扁平 session（auth-js 的 xform 要 access_token +
 * refresh_token + expires_in），/user 回裸 user 对象，/logout 回 204。
 */

import { http, HttpResponse } from "msw";

import { MOCK_USER_EMAIL, MOCK_USER_ID } from "../db/schema.ts";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

function base64Url(input: string): string {
  return btoa(input).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** 构造一个结构合法（签名是假的、客户端不校验）的 JWT，供 supabase-js 解码使用。 */
function buildAccessToken(expiresAt: number): string {
  const header = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64Url(
    JSON.stringify({
      sub: MOCK_USER_ID,
      email: MOCK_USER_EMAIL,
      role: "authenticated",
      aud: "authenticated",
      iat: Math.floor(Date.now() / 1000),
      exp: expiresAt,
    }),
  );
  return `${header}.${payload}.mock-signature`;
}

function buildMockUser() {
  const timestamp = new Date().toISOString();
  return {
    id: MOCK_USER_ID,
    aud: "authenticated",
    role: "authenticated",
    email: MOCK_USER_EMAIL,
    email_confirmed_at: timestamp,
    phone: "",
    confirmed_at: timestamp,
    last_sign_in_at: timestamp,
    app_metadata: { provider: "email", providers: ["email"] },
    user_metadata: { full_name: "Demo User", email: MOCK_USER_EMAIL },
    identities: [],
    created_at: timestamp,
    updated_at: timestamp,
  };
}

/** 标准扁平 session 响应体。 */
function buildSession() {
  const expiresAt = Math.floor(Date.now() / 1000) + ONE_YEAR_SECONDS;
  return {
    access_token: buildAccessToken(expiresAt),
    token_type: "bearer",
    expires_in: ONE_YEAR_SECONDS,
    expires_at: expiresAt,
    refresh_token: `mock-refresh-${MOCK_USER_ID}`,
    user: buildMockUser(),
  };
}

const tokenHandler = http.post("*/auth/v1/token", () => {
  // password / refresh_token 两种 grant 都回同一个 session。
  return HttpResponse.json(buildSession());
});

const signupHandler = http.post("*/auth/v1/signup", () => {
  // 直接当作已确认邮箱，回带 session 的响应，注册即登录。
  return HttpResponse.json(buildSession());
});

const userHandler = http.get("*/auth/v1/user", () => {
  return HttpResponse.json(buildMockUser());
});

const logoutHandler = http.post("*/auth/v1/logout", () => {
  return new HttpResponse(null, { status: 204 });
});

export const authHandlers = [
  tokenHandler,
  signupHandler,
  userHandler,
  logoutHandler,
];
