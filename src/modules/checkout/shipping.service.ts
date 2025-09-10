import { Injectable } from '@nestjs/common';
import { CheckoutRepository } from './repositories/checkout.repository';
import axios from 'axios';
import { SelectQuery } from 'src/db/postgres.client';

@Injectable()
export class ShippingService {
  constructor(private readonly checkoutRepository: CheckoutRepository) { }

  async calculateShipping(items: any[], countryId: number): Promise<number> {
    console.log("🚀 ~ ShippingService ~ calculateShipping ~ items:", items)
    // Simplified shipping calculation based on weight and country
    //TODO: Replace with real shipping API integration
    const totalWeight = items.reduce((sum, item) => {
      return sum + (item?.weight || 0.5) * item.quantity;
    }, 0);

    // Basic shipping cost calculation
    let shippingCost = countryId === 3 ? 50 : 200; // Domestic vs International

    if (totalWeight > 2) {
      shippingCost += (totalWeight - 2) * (countryId === 3 ? 20 : 50);
    }

    return shippingCost;
  }

  async getShippingMethods(countryId?: number) {
    return await this.checkoutRepository.getShippingMethods(countryId);
  }

  async getTrackingInfo(trackingNumber: string, providerId: number) {
    const query = `
      SELECT * FROM shipping_providers 
      WHERE id = $1 AND is_active = true
    `;
    const providers = await SelectQuery(query, [providerId]);
    const provider = providers[0];

    if (!provider) {
      return { error: 'Provider not found' };
    }

    try {
      let trackingData: any;

      switch (provider.code) {
        case 'delivery':
          trackingData = await this.getDeliveryTracking(trackingNumber);
          break;
        case 'shiprocket':
          trackingData = await this.getShipRocketTracking(trackingNumber);
          break;
        default:
          return { error: 'Tracking not available' };
      }

      return {
        trackingNumber,
        provider: provider.name,
        status: trackingData.status,
        lastUpdate: trackingData.lastUpdate,
        events: trackingData.events || []
      };
    } catch (error) {
      return { error: 'Failed to fetch tracking information' };
    }
  }

  private async getDeliveryTracking(trackingNumber: string) {
    // Mock implementation - replace with actual Delivery API
    return {
      status: 'In Transit',
      lastUpdate: new Date(),
      events: [
        {
          date: new Date(),
          status: 'Package picked up',
          location: 'Origin Facility'
        }
      ]
    };
  }

  private async getShipRocketTracking(trackingNumber: string) {
    try {
      const response = await axios.get(
        `https://apiv2.shiprocket.in/v1/external/courier/track/awb/${trackingNumber}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.SHIPROCKET_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        status: response.data.tracking_data?.track_status,
        lastUpdate: response.data.tracking_data?.last_update_date,
        events: response.data.tracking_data?.shipment_track || []
      };
    } catch (error) {
      throw new Error('ShipRocket API error');
    }
  }
}
