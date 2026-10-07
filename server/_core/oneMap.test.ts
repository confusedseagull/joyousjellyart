import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ENV } from './env';
import { drivingDistance, resetOneMapCache } from './oneMap';

function fakeToken(expiresInSeconds: number): string {
  const payload = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + expiresInSeconds })).toString('base64url');
  return `header.${payload}.signature`;
}

type Handler = (url: URL, init?: RequestInit) => Response | Promise<Response>;

function stubFetch(handler: Handler) {
  const fetchMock = vi.fn(async (input: URL | string, init?: RequestInit) => handler(new URL(input.toString()), init));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const searchHit = (url: URL) =>
  Response.json({ results: [{ POSTAL: url.searchParams.get('searchVal'), LATITUDE: '1.30', LONGITUDE: '103.85' }] });

const routeOk = () => Response.json({ status: 0, route_summary: { total_distance: 5000 } });

describe('OneMap client', () => {
  const original = { ...ENV };

  beforeEach(() => {
    resetOneMapCache();
    ENV.oneMapEmail = '';
    ENV.oneMapPassword = '';
    ENV.oneMapToken = '';
  });

  afterEach(() => {
    Object.assign(ENV, original);
    vi.unstubAllGlobals();
  });

  it('logs in with the account email/password and sends the token it gets back', async () => {
    ENV.oneMapEmail = 'shop@example.com';
    ENV.oneMapPassword = 'secret';
    const token = fakeToken(3 * 24 * 3600);
    const seen: (string | null)[] = [];
    const fetchMock = stubFetch((url, init) => {
      if (url.pathname.endsWith('/getToken')) return Response.json({ access_token: token });
      seen.push(new Headers(init?.headers).get('Authorization'));
      return url.pathname.endsWith('/search') ? searchHit(url) : routeOk();
    });

    const result = await drivingDistance('1 A Road, Singapore 111111', '2 B Road, Singapore 222222');

    expect(result).toEqual({ km: 5, estimated: false });
    expect(seen.every((header) => header === token)).toBe(true);
    // One login serves every call that follows.
    expect(fetchMock.mock.calls.filter(([u]) => u.toString().endsWith('/getToken'))).toHaveLength(1);
  });

  it('fetches a new token when the saved one is about to expire', async () => {
    ENV.oneMapEmail = 'shop@example.com';
    ENV.oneMapPassword = 'secret';
    const logins: string[] = [];
    stubFetch((url) => {
      if (url.pathname.endsWith('/getToken')) {
        const next = fakeToken(logins.length === 0 ? 60 : 3 * 24 * 3600); // first token: 1 minute left
        logins.push(next);
        return Response.json({ access_token: next });
      }
      return url.pathname.endsWith('/search') ? searchHit(url) : routeOk();
    });

    await drivingDistance('1 A Road, Singapore 111111', '2 B Road, Singapore 222222');

    // A token with a minute left is inside the renewal window, so later requests swap it for a new one.
    expect(logins.length).toBeGreaterThanOrEqual(2);
  });

  it('renews and retries once if OneMap rejects the token', async () => {
    ENV.oneMapEmail = 'shop@example.com';
    ENV.oneMapPassword = 'secret';
    const stale = fakeToken(3 * 24 * 3600);
    const fresh = fakeToken(3 * 24 * 3600 + 5);
    let logins = 0;
    stubFetch((url, init) => {
      if (url.pathname.endsWith('/getToken')) return Response.json({ access_token: logins++ === 0 ? stale : fresh });
      if (new Headers(init?.headers).get('Authorization') === stale) return new Response('expired', { status: 401 });
      return url.pathname.endsWith('/search') ? searchHit(url) : routeOk();
    });

    const result = await drivingDistance('1 A Road, Singapore 111111', '2 B Road, Singapore 222222');

    expect(result.estimated).toBe(false);
    expect(logins).toBeGreaterThanOrEqual(2);
  });

  it('uses a pasted ONEMAP_TOKEN while it is still valid', async () => {
    const token = fakeToken(2 * 24 * 3600);
    ENV.oneMapToken = token;
    const seen: (string | null)[] = [];
    stubFetch((url, init) => {
      seen.push(new Headers(init?.headers).get('Authorization'));
      return url.pathname.endsWith('/search') ? searchHit(url) : routeOk();
    });

    await drivingDistance('1 A Road, Singapore 111111', '2 B Road, Singapore 222222');

    expect(seen.length).toBeGreaterThan(0);
    expect(seen.every((header) => header === token)).toBe(true);
  });

  it('does not send an expired pasted token', async () => {
    ENV.oneMapToken = fakeToken(-10);
    const seen: (string | null)[] = [];
    stubFetch((url, init) => {
      seen.push(new Headers(init?.headers).get('Authorization'));
      return url.pathname.endsWith('/search') ? searchHit(url) : routeOk();
    });

    await drivingDistance('1 A Road, Singapore 111111', '2 B Road, Singapore 222222');

    expect(seen.every((header) => header === null)).toBe(true);
  });

  it('looks addresses up by postal code and remembers them', async () => {
    const searches: string[] = [];
    stubFetch((url) => {
      if (url.pathname.endsWith('/search')) {
        searches.push(url.searchParams.get('searchVal')!);
        return searchHit(url);
      }
      return routeOk();
    });

    await drivingDistance('1 A Road, #02-03, Singapore 111111', '2 B Road, Singapore 222222');
    await drivingDistance('1 A Road, #02-03, Singapore 111111', '2 B Road, Singapore 222222');

    expect(searches.sort()).toEqual(['111111', '222222']);
  });
});
