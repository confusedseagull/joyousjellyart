import { getDistanceMatrix } from './_core/map';
import { getOrCreateBusinessSettings } from './settings';

interface DeliveryFeeResult {
  distance: number; // in kilometers
  fee: number; // in SGD
  distanceTier: string;
}

/**
 * Calculate delivery fee based on distance from shop
 * @param customerAddress Customer's delivery address
 * @returns Delivery fee details including distance and cost
 */
export async function calculateDeliveryFee(
  customerAddress: string
): Promise<DeliveryFeeResult> {
  try {
    const settings = await getOrCreateBusinessSettings();

    // Use Google Maps Distance Matrix API to calculate distance
    const response = await getDistanceMatrix(settings.shopAddressForDistance, customerAddress);

    if (response.status !== 'OK') {
      throw new Error(`Distance Matrix API error: ${response.status}`);
    }

    const element = response.rows[0]?.elements[0];

    if (!element || element.status !== 'OK') {
      throw new Error('Unable to calculate distance to the provided address');
    }

    // Distance in meters, convert to kilometers
    const distanceInKm = element.distance.value / 1000;

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
