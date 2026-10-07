import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { calculateDeliveryFee } from './deliveryCalculator';
import { resetOneMapCache } from './_core/oneMap';

// The shop's default postal code (see DEFAULT_SETTINGS in settings.ts).
const SHOP_POSTAL = '537846';

// Fake OneMap: every postal code resolves to a point, and the route lookup
// returns whatever driving distance the test asks for.
function mockOneMap({ drivingMeters, routingFails = false }: { drivingMeters: number; routingFails?: boolean }) {
  const calls: string[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: URL | string) => {
      const url = new URL(input.toString());
      calls.push(url.pathname);
      if (url.pathname.endsWith('/elastic/search')) {
        const searchVal = url.searchParams.get('searchVal')!;
        const known = /^\d{6}$/.test(searchVal);
        // The shop sits at 1.3456,103.8827; a customer is ~2km east of it.
        const lng = searchVal === SHOP_POSTAL ? '103.8827' : '103.9007';
        return Response.json({
          found: known ? 1 : 0,
          results: known ? [{ POSTAL: searchVal, LATITUDE: '1.3456', LONGITUDE: lng }] : [],
        });
      }
      if (url.pathname.endsWith('/routingsvc/route')) {
        if (routingFails) return new Response('boom', { status: 500 });
        return Response.json({ status: 0, route_summary: { total_distance: drivingMeters } });
      }
      throw new Error(`unexpected request: ${url}`);
    })
  );
  return calls;
}

describe('Delivery Cost Calculator', () => {
  beforeEach(() => {
    resetOneMapCache();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('charges the lowest tier for an address within 5km', async () => {
    mockOneMap({ drivingMeters: 3200 });
    const result = await calculateDeliveryFee('1 Jln Lokam, Singapore 537846');

    expect(result.distance).toBe(3.2);
    expect(result.fee).toBe(18);
    expect(result.distanceTier).toBe('5km and below');
  });

  it('charges the 5-10km tier', async () => {
    mockOneMap({ drivingMeters: 7500 });
    const result = await calculateDeliveryFee('313 Orchard Road, Singapore 238895');

    expect(result.fee).toBe(19);
    expect(result.distanceTier).toBe('5-10km');
  });

  it('charges the 10-20km tier', async () => {
    mockOneMap({ drivingMeters: 15000 });
    const result = await calculateDeliveryFee('80 Airport Boulevard, Singapore 819642');

    expect(result.fee).toBe(22);
    expect(result.distanceTier).toBe('10-20km');
  });

  it('charges the beyond-tier fee past the last tier', async () => {
    mockOneMap({ drivingMeters: 27000 });
    const result = await calculateDeliveryFee('1 Tuas South Avenue 1, Singapore 637601');

    expect(result.fee).toBe(25);
    expect(result.distanceTier).toBe('Over 20km');
  });

  it('rounds the distance to 1 decimal place', async () => {
    mockOneMap({ drivingMeters: 4249 });
    const result = await calculateDeliveryFee('1 Jln Lokam, Singapore 537846');

    expect(result.distance).toBe(4.2);
  });

  it('falls back to a straight-line estimate when routing is unavailable', async () => {
    mockOneMap({ drivingMeters: 0, routingFails: true });
    const result = await calculateDeliveryFee('5 Somewhere Road, Singapore 538000');

    // ~2km apart as the crow flies, so still the lowest tier.
    expect(result.distance).toBeGreaterThan(0);
    expect(result.distance).toBeLessThan(5);
    expect(result.fee).toBe(18);
  });

  it('rejects an address OneMap cannot find', async () => {
    mockOneMap({ drivingMeters: 1000 });

    await expect(calculateDeliveryFee('Invalid Address 12345')).rejects.toThrow();
  });
});
