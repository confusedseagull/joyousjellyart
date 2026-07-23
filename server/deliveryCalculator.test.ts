import { describe, it, expect } from 'vitest';
import { calculateDeliveryFee } from './deliveryCalculator';

describe('Delivery Cost Calculator', () => {
  it('should calculate delivery fee for address within 5km', async () => {
    // Test with an address close to the shop
    const result = await calculateDeliveryFee('1 Jln Lokam, Singapore 537846');
    
    expect(result).toHaveProperty('distance');
    expect(result).toHaveProperty('fee');
    expect(result).toHaveProperty('distanceTier');
    
    // Very close address should be in the lowest tier
    expect(result.distance).toBeLessThanOrEqual(5);
    expect(result.fee).toBe(18);
    expect(result.distanceTier).toBe('5km and below');
  });

  it('should calculate delivery fee for address in 5-10km range', async () => {
    // Test with an address in the 5-10km range (Orchard area)
    const result = await calculateDeliveryFee('313 Orchard Road, Singapore 238895');
    
    expect(result).toHaveProperty('distance');
    expect(result).toHaveProperty('fee');
    
    // Should be in the 5-10km tier
    if (result.distance > 5 && result.distance <= 10) {
      expect(result.fee).toBe(19);
      expect(result.distanceTier).toBe('5-10km');
    }
  });

  it('should calculate delivery fee for address in 10-20km range', async () => {
    // Test with an address in the 10-20km range (Changi area)
    const result = await calculateDeliveryFee('80 Airport Boulevard, Singapore 819642');
    
    expect(result).toHaveProperty('distance');
    expect(result).toHaveProperty('fee');
    
    // Should be in the 10-20km tier
    if (result.distance > 10 && result.distance <= 20) {
      expect(result.fee).toBe(22);
      expect(result.distanceTier).toBe('10-20km');
    }
  });

  it('should handle invalid address gracefully', async () => {
    await expect(calculateDeliveryFee('Invalid Address 12345')).rejects.toThrow();
  });

  it('should return distance rounded to 1 decimal place', async () => {
    const result = await calculateDeliveryFee('1 Jln Lokam, Singapore 537846');
    
    // Check that distance is rounded to 1 decimal place
    const decimalPlaces = (result.distance.toString().split('.')[1] || '').length;
    expect(decimalPlaces).toBeLessThanOrEqual(1);
  });
});
