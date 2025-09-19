import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { OrdersRepository } from './orders.repository';
import { OrderFiltersDto, UpdateOrderStatusDto, UpdateVendorOrderDto } from './dto/orders.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly ordersRepository: OrdersRepository) {}

  // ==================== ADMIN METHODS ====================

  /**
   * Get all orders (Admin only)
   */
  async getAllOrders(filters: OrderFiltersDto) {
    return await this.ordersRepository.getAllOrders(filters);
  }

  /**
   * Update order status (Admin only)
   */
  async updateOrderStatus(orderId: number, updateData: UpdateOrderStatusDto) {
    const order = await this.ordersRepository.updateOrderStatus(
      orderId,
      updateData.status,
      updateData.notes
    );

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  // ==================== VENDOR METHODS ====================

  /**
   * Get orders for a specific vendor
   */
  async getVendorOrders(vendorId: number, filters: OrderFiltersDto) {
    return await this.ordersRepository.getVendorOrders(vendorId, filters);
  }

  /**
   * Get vendor order details
   */
  async getVendorOrderDetails(orderId: number, vendorId: number) {
    const order = await this.ordersRepository.getOrderDetails(orderId, undefined, vendorId);
    
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check if vendor has access to this order
    const hasAccess = order.vendor_orders.some((vo: any) => vo.vendor_id === vendorId);
    if (!hasAccess) {
      throw new ForbiddenException('Access denied to this order');
    }

    return order;
  }

  /**
   * Update vendor order status
   */
  async updateVendorOrderStatus(vendorOrderId: number, vendorId: number, updateData: UpdateVendorOrderDto) {
    // First verify the vendor owns this order
    const vendorOrderQuery = `
      SELECT vo.*, o.id as order_id 
      FROM vendor_orders vo 
      JOIN orders o ON vo.order_id = o.id 
      WHERE vo.id = $1 AND vo.vendor_id = $2
    `;
    
    // For now, we'll update directly - in a real implementation, you'd verify ownership first
    const vendorOrder = await this.ordersRepository.updateVendorOrderStatus(
      vendorOrderId,
      updateData.status,
      updateData.tracking_number,
      updateData.shipping_provider_id,
      updateData.notes
    );

    if (!vendorOrder) {
      throw new NotFoundException('Vendor order not found or access denied');
    }

    return vendorOrder;
  }

  // ==================== CUSTOMER METHODS ====================

  /**
   * Get customer orders
   */
  async getCustomerOrders(userId: number, filters: OrderFiltersDto) {
    return await this.ordersRepository.getCustomerOrders(userId, filters);
  }

  /**
   * Get customer order details
   */
  async getCustomerOrderDetails(orderId: number, userId: number) {
    const order = await this.ordersRepository.getOrderDetails(orderId, userId);
    
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  // ==================== TRACKING METHODS ====================

  /**
   * Get order tracking information
   */
  async getOrderTracking(orderId: number, userId?: number) {
    const trackingInfo = await this.ordersRepository.getOrderTracking(orderId, userId);
    
    if (!trackingInfo.length) {
      throw new NotFoundException('Order not found');
    }

    return trackingInfo;
  }

  /**
   * Get tracking details with external API integration
   */
  async getDetailedTracking(orderId: number, userId?: number) {
    const trackingInfo = await this.getOrderTracking(orderId, userId);
    
    // Enhance with external tracking data
    const enhancedTracking = await Promise.all(
      trackingInfo.map(async (info: any) => {
        if (info.tracking_number && info.shipping_provider_code) {
          try {
            // Here you would integrate with shipping provider APIs
            const externalTracking = await this.getExternalTrackingData(
              info.tracking_number,
              info.shipping_provider_code
            );
            
            return {
              ...info,
              external_tracking: externalTracking
            };
          } catch (error) {
            return {
              ...info,
              external_tracking: { error: 'Unable to fetch external tracking data' }
            };
          }
        }
        return info;
      })
    );

    return enhancedTracking;
  }

  /**
   * Get external tracking data from shipping providers
   */
  private async getExternalTrackingData(trackingNumber: string, providerCode: string) {
    // Mock implementation - replace with actual API calls
    switch (providerCode) {
      case 'delivery':
        return this.getDeliveryTrackingData(trackingNumber);
      case 'shiprocket':
        return this.getShipRocketTrackingData(trackingNumber);
      default:
        return { error: 'Provider not supported' };
    }
  }

  /**
   * Get Delivery.com tracking data
   */
  private async getDeliveryTrackingData(trackingNumber: string) {
    // Mock implementation - replace with actual Delivery.com API
    return {
      status: 'In Transit',
      estimated_delivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      last_update: new Date(),
      events: [
        {
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
          status: 'Package picked up',
          location: 'Origin Facility',
          description: 'Package has been picked up from the sender'
        },
        {
          timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
          status: 'In transit',
          location: 'Sorting Facility',
          description: 'Package is being processed at sorting facility'
        },
        {
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          status: 'Out for delivery',
          location: 'Local Delivery Hub',
          description: 'Package is out for delivery'
        }
      ]
    };
  }

  /**
   * Get ShipRocket tracking data
   */
  private async getShipRocketTrackingData(trackingNumber: string) {
    // Mock implementation - replace with actual ShipRocket API
    return {
      status: 'Delivered',
      estimated_delivery: new Date(),
      last_update: new Date(),
      events: [
        {
          timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
          status: 'Shipped',
          location: 'Mumbai Hub',
          description: 'Package shipped from Mumbai'
        },
        {
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
          status: 'In transit',
          location: 'Delhi Hub',
          description: 'Package reached Delhi hub'
        },
        {
          timestamp: new Date(),
          status: 'Delivered',
          location: 'Customer Address',
          description: 'Package delivered successfully'
        }
      ]
    };
  }

  // ==================== ANALYTICS METHODS ====================

  /**
   * Get order analytics for admin
   */
  async getOrderAnalytics(startDate?: string, endDate?: string) {
    // This would typically involve complex queries for analytics
    // For now, returning a mock structure
    return {
      total_orders: 0,
      total_revenue: 0,
      average_order_value: 0,
      orders_by_status: {},
      orders_by_date: [],
      top_products: [],
      top_vendors: []
    };
  }

  /**
   * Get vendor analytics
   */
  async getVendorAnalytics(vendorId: number, startDate?: string, endDate?: string) {
    // Mock implementation for vendor analytics
    return {
      total_orders: 0,
      total_revenue: 0,
      commission_earned: 0,
      average_order_value: 0,
      orders_by_status: {},
      orders_by_date: [],
      top_products: []
    };
  }
}