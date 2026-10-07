import { getDistanceMatrix } from './_core/map';
import { drivingDistance } from './_core/oneMap';
import { ENV } from './_core/env';
import { getOrCreateBusinessSettings } from './settings';

interface DeliveryFeeResult {
  distance: number; // in kilometers
  fee: number; // in SGD
  distanceTier: string;
}

// OneMap (free, Singapore addresses) first; Google Maps only if OneMap is
// unreachable and a Google key happens to be configured.
async function measureDistanceKm(shopAddress: string, customerAddress: string): Promise<number> {
  try {
    return (await drivingDistance(shopAddress, customerAddress)).km;
  } catch (oneMapError) {
    if (!ENV.googleMapsApiKey) throw oneMapError;
    console.warn('OneMap failed, trying Google Maps:', (oneMapError as Error).message);
    const response = await getDistanceMatrix(shopAddress, customerAddress);
    const element = response.rows[0]?.elements[0];
    if (response.status !== 'OK' || !element || element.status !== 'OK') {
      throw new Error('Unable to calculate distance to the provided address');
    }
    return element.distance.value / 1000;
  }
}

/**
 * Calculate delivery fee based on driving distance from shop
 * @param customerAddress Customer's delivery address
 * @returns Delivery fee details including distance and cost
 */
export async function calculateDeliveryFee(
  customerAddress: string
): Promise<DeliveryFeeResult> {
  try {
    const settings = await getOrCreateBusinessSettings();

    const distanceInKm = await measureDistanceKm(settings.shopAddressForDistance, customerAddress);

    // Calculate fee based on the admin-configured distance tiers, in
    // ascending maxKm order — the first tier the distance fits under wins.
    const tiers = [...settings.deliveryTiers].sort((a, b) => a.maxKm - b.maxKm);
    let fee = settings.beyondTierFee;
    let distanceTier = tiers.length > 0 ? `Over ${tiers[tiers.length - 1].maxKm}km` : 'N/A';
    let prevMax = 0;
    for (const tier of tiers) {
      if (distanceInKm <= tier.maxKm) {
        fee = tier.fee;
        distanceTier = prevMax === 0 ? `${tier.maxKm}km and below` : `${prevMax}-${tier.maxKm}km`;
        break;
      }
      prevMax = tier.maxKm;
    }

    return {
      distance: Math.round(distanceInKm * 10) / 10, // Round to 1 decimal place
      fee,
      distanceTier,
    };
  } catch (error) {
    console.error('Error calculating delivery fee:', error);
    throw new Error('Failed to calculate delivery fee. Please check the address and try again.');
  }
}
