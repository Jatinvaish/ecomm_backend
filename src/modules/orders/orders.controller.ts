import {
  Controller,
  Post,
  Put,
  Body,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
  ValidationPipe,
  UsePipes,
  ParseIntPipe
} from '@nestjs/common';
import { ApiResponse, ApiResponseFormat } from 'src/common/utils/common-response';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RoleGuard, Roles, VendorGuard, RequireActiveVendor, AdminGuard } from 'src/common/guards/role.guard';
import { OrdersService } from './orders.service';
import { OrderFiltersDto, UpdateOrderStatusDto, UpdateVendorOrderDto } from './dto/orders.dto';

@Controller('orders')
@UseGuards(AuthGuard, RoleGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // ==================== ADMIN ENDPOINTS ====================

  /**
   * Get all orders (Admin only)
   * POST /orders/admin/all
   */
  @Post('admin/all')
  @UseGuards(AdminGuard)
  @Roles('admin', 'super_admin')
  async getAllOrders(
    @Body() filters: OrderFiltersDto
  ): Promise<ApiResponseFormat<any>> {
    try {
      const orders = await this.ordersService.getAllOrders(filters);
      return ApiResponse.success(orders, 'Orders retrieved successfully');
    } catch (error) {
      console.error('Get all orders error:', error);
      return ApiResponse.error('Failed to retrieve orders');
    }
  }

  /**
   * Get order details (Admin)
   * POST /orders/admin/details
   */
  @Post('admin/details')
  @UseGuards(AdminGuard)
  @Roles('admin', 'super_admin')
  async getAdminOrderDetails(
    @Body('id', ParseIntPipe) orderId: number
  ): Promise<ApiResponseFormat<any>> {
    try {
      const order = await this.ordersService.getCustomerOrderDetails(orderId, undefined);
      return ApiResponse.success(order, 'Order details retrieved successfully');
    } catch (error) {
      console.error('Get admin order details error:', error);
      return ApiResponse.error(error.message || 'Failed to retrieve order details');
    }
  }

  /**
   * Update order status (Admin only)
   * POST /orders/admin/update-status
   */
  @Post('admin/update-status')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminGuard)
  @Roles('admin', 'super_admin')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async updateOrderStatus(
    @Body() data: { id: number } & UpdateOrderStatusDto
  ): Promise<ApiResponseFormat<any>> {
    try {
      const { id, ...updateData } = data;
      const order = await this.ordersService.updateOrderStatus(id, updateData);
      return ApiResponse.success(order, 'Order status updated successfully');
    } catch (error) {
      console.error('Update order status error:', error);
      return ApiResponse.error(error.message || 'Failed to update order status');
    }
  }

  /**
   * Get order analytics (Admin only)
   * POST /orders/admin/analytics
   */
  @Post('admin/analytics')
  @UseGuards(AdminGuard)
  @Roles('admin', 'super_admin')
  async getOrderAnalytics(
    @Body() data: { start_date?: string; end_date?: string }
  ): Promise<ApiResponseFormat<any>> {
    try {
      const analytics = await this.ordersService.getOrderAnalytics(data.start_date, data.end_date);
      return ApiResponse.success(analytics, 'Order analytics retrieved successfully');
    } catch (error) {
      console.error('Get order analytics error:', error);
      return ApiResponse.error('Failed to retrieve order analytics');
    }
  }

  // ==================== VENDOR ENDPOINTS ====================

  /**
   * Get vendor orders
   * POST /orders/vendor/all
   */
  @Post('vendor/all')
  @UseGuards(VendorGuard)
  @RequireActiveVendor()
  @Roles('vendor')
  async getVendorOrders(
    @Request() req: any,
    @Body() filters: OrderFiltersDto
  ): Promise<ApiResponseFormat<any>> {
    try {
      const vendorId = req.vendor.id;
      const orders = await this.ordersService.getVendorOrders(vendorId, filters);
      return ApiResponse.success(orders, 'Vendor orders retrieved successfully');
    } catch (error) {
      console.error('Get vendor orders error:', error);
      return ApiResponse.error('Failed to retrieve vendor orders');
    }
  }

  /**
   * Get vendor order details
   * POST /orders/vendor/details
   */
  @Post('vendor/details')
  @UseGuards(VendorGuard)
  @RequireActiveVendor()
  @Roles('vendor')
  async getVendorOrderDetails(
    @Body('id', ParseIntPipe) orderId: number,
    @Request() req: any
  ): Promise<ApiResponseFormat<any>> {
    try {
      const vendorId = req.vendor.id;
      console.log("🚀 ~ OrdersController ~ getVendorOrderDetails ~ vendorId:", vendorId)
      const order = await this.ordersService.getVendorOrderDetails(orderId, vendorId);
      return ApiResponse.success(order, 'Vendor order details retrieved successfully');
    } catch (error) {
      console.error('Get vendor order details error:', error);
      return ApiResponse.error(error.message || 'Failed to retrieve order details');
    }
  }

  /**
   * Update vendor order status
   * POST /orders/vendor/update-status
   */
  @Post('vendor/update-status')
  @HttpCode(HttpStatus.OK)
  @UseGuards(VendorGuard)
  @RequireActiveVendor()
  @Roles('vendor')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async updateVendorOrderStatus(
    @Request() req: any,
    @Body() data: { vendorOrderId: number } & UpdateVendorOrderDto
  ): Promise<ApiResponseFormat<any>> {
    try {
      const vendorId = req.vendor.id;
      const { vendorOrderId, ...updateData } = data;
      const vendorOrder = await this.ordersService.updateVendorOrderStatus(
        vendorOrderId,
        vendorId,
        updateData
      );
      return ApiResponse.success(vendorOrder, 'Vendor order status updated successfully');
    } catch (error) {
      console.error('Update vendor order status error:', error);
      return ApiResponse.error(error.message || 'Failed to update vendor order status');
    }
  }

  /**
   * Get vendor analytics
   * POST /orders/vendor/analytics
   */
  @Post('vendor/analytics')
  @UseGuards(VendorGuard)
  @RequireActiveVendor()
  @Roles('vendor')
  async getVendorAnalytics(
    @Request() req: any,
    @Body() data: { start_date?: string; end_date?: string }
  ): Promise<ApiResponseFormat<any>> {
    try {
      const vendorId = req.vendor.id;
      const analytics = await this.ordersService.getVendorAnalytics(vendorId, data.start_date, data.end_date);
      return ApiResponse.success(analytics, 'Vendor analytics retrieved successfully');
    } catch (error) {
      console.error('Get vendor analytics error:', error);
      return ApiResponse.error('Failed to retrieve vendor analytics');
    }
  }

  // ==================== CUSTOMER ENDPOINTS ====================

  /**
   * Get customer orders
   * POST /orders/my-orders
   */
  @Post('my-orders')
  @Roles('customer', 'vendor', 'admin')
  async getMyOrders(
    @Request() req: any,
    @Body() filters: OrderFiltersDto
  ): Promise<ApiResponseFormat<any>> {
    try {
      const userId = req.user.id;
      const orders = await this.ordersService.getCustomerOrders(userId, filters);
      return ApiResponse.success(orders, 'Customer orders retrieved successfully');
    } catch (error) {
      console.error('Get customer orders error:', error);
      return ApiResponse.error('Failed to retrieve customer orders');
    }
  }

  /**
   * Get customer order details
   * POST /orders/my-orders/details
   */
  @Post('my-orders/details')
  @Roles('customer', 'vendor', 'admin')
  async getMyOrderDetails(
    @Body('id', ParseIntPipe) orderId: number,
    @Request() req: any
  ): Promise<ApiResponseFormat<any>> {
    try {
      const userId = req.user.id;
      const order = await this.ordersService.getCustomerOrderDetails(orderId, userId);
      return ApiResponse.success(order, 'Order details retrieved successfully');
    } catch (error) {
      console.error('Get customer order details error:', error);
      return ApiResponse.error(error.message || 'Failed to retrieve order details');
    }
  }

  // ==================== TRACKING ENDPOINTS ====================

  /**
   * Get order tracking (Customer)
   * POST /orders/track
   */
  @Post('track')
  @Roles('customer', 'vendor', 'admin')
  async trackOrder(
    @Body('id', ParseIntPipe) orderId: number,
    @Request() req: any
  ): Promise<ApiResponseFormat<any>> {
    try {
      const userId = req.user.id;
      const userRoles = req.user.roles?.map((role: any) => role.slug) || [];
      
      // Admin can track any order, customers can only track their own
      const trackingUserId = userRoles.includes('admin') ? undefined : userId;
      
      const tracking = await this.ordersService.getOrderTracking(orderId, trackingUserId);
      return ApiResponse.success(tracking, 'Order tracking retrieved successfully');
    } catch (error) {
      console.error('Track order error:', error);
      return ApiResponse.error(error.message || 'Failed to retrieve order tracking');
    }
  }

  /**
   * Get detailed tracking with external APIs
   * POST /orders/track/detailed
   */
  @Post('track/detailed')
  @Roles('customer', 'vendor', 'admin')
  async getDetailedTracking(
    @Body('id', ParseIntPipe) orderId: number,
    @Request() req: any
  ): Promise<ApiResponseFormat<any>> {
    try {
      const userId = req.user.id;
      const userRoles = req.user.roles?.map((role: any) => role.slug) || [];
      
      // Admin can track any order, customers can only track their own
      const trackingUserId = userRoles.includes('admin') ? undefined : userId;
      
      const detailedTracking = await this.ordersService.getDetailedTracking(orderId, trackingUserId);
      return ApiResponse.success(detailedTracking, 'Detailed tracking retrieved successfully');
    } catch (error) {
      console.error('Get detailed tracking error:', error);
      return ApiResponse.error(error.message || 'Failed to retrieve detailed tracking');
    }
  }

  // ==================== GENERAL ENDPOINTS ====================

  /**
   * Get order by ID (role-based access)
   * POST /orders/details
   */
  @Post('details')
  @Roles('customer', 'vendor', 'admin')
  async getOrderById(
    @Body('id', ParseIntPipe) orderId: number,
    @Request() req: any
  ): Promise<ApiResponseFormat<any>> {
    try {
      const userId = req.user.id;
      const userRoles = req.user.roles?.map((role: any) => role.slug) || [];
      
      let order;
      
      if (userRoles.includes('admin')) {
        // Admin can view any order
        order = await this.ordersService.getCustomerOrderDetails(orderId, undefined);
      } else if (userRoles.includes('vendor') && req.vendor) {
        // Vendor can view orders they're involved in
        order = await this.ordersService.getVendorOrderDetails(orderId, req.vendor.id);
      } else {
        // Customer can only view their own orders
        order = await this.ordersService.getCustomerOrderDetails(orderId, userId);
      }
      
      return ApiResponse.success(order, 'Order retrieved successfully');
    } catch (error) {
      console.error('Get order by ID error:', error);
      return ApiResponse.error(error.message || 'Failed to retrieve order');
    }
  }
}