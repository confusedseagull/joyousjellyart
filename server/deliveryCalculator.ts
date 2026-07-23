import { makeRequest } from './_core/map';

const SHOP_ADDRESS = '2 Jln Lokam, #01-27 KENSINGTON SQUARE, Singapore 537846';

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
    // Use Google Maps Distance Matrix API to calculate distance
    const response = await makeRequest('/maps/api/distancematrix/json', {
      origins: SHOP_ADDRESS,
      destinations: customerAddress,
      units: 'metric',
    }) as any;

    if (response.status !== 'OK') {
      throw new Error(`Distance Matrix API error: ${response.status}`);
    }

    const element = response.rows[0]?.elements[0];
    
    if (!element || element.status !== 'OK') {
      throw new Error('Unable to calculate distance to the provided address');
    }

    // Distance in meters, convert to kilometers
    const distanceInKm = element.distance.value / 1000;

    // Calculate fee based on distance tiers
    let fee: number;
    let distanceTier: string;

    if (distanceInKm <= 5) {
      fee = 18;
      distanceTier = '5km and below';
    } else if (distanceInKm <= 10) {
      fee = 19;
      distanceTier = '5-10km';
    } else if (distanceInKm <= 20) {
      fee = 22;
      distanceTier = '10-20km';
    } else {
      fee = 25;
      distanceTier = 'Over 20km';
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
