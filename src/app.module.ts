// src/app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MasterApisController } from './modules/master-apis/master-apis.controller';
import { MasterApisService } from './modules/master-apis/master-apis.service';
import { MasterApisModule } from './modules/master-apis/master-apis.module';
import { CategoriesModule } from './modules/category/categories.module';
import { ProductInventoryModule } from './modules/product-inventory/product-inventory.module';
import { TaxesModule } from './modules/taxes/taxes.module';
import { ProductsModule } from './modules/products/products.module';
import { ConfigModule } from '@nestjs/config';  // Import ConfigModule
import { UsersModule } from './modules/users/user.module';
import { VendorsModule } from './modules/vendors/vendors.module';
import { NestjsFormDataModule, MemoryStoredFile } from 'nestjs-form-data';
import { CartModule } from './modules/cart/cart.module';
import { WishlistModule } from './modules/wishlist/wishlist.module';
import { UserAddressModule } from './modules/user-addresses/user-addresses.module';
import { AttributesModule } from './modules/attributes/attributes.module';
import { CheckoutModule } from './modules/checkout/checkout.module';

@Module({
  imports: [
    // MulterModule.register() needs to be added to configure file uploads
    // MulterModule.register({
    //   dest: './uploads', // Specify the destination folder for uploaded files
    // }),
    ConfigModule.forRoot({
      isGlobal: true, // makes ConfigService available globally
      envFilePath: '.env', // optional if your env is in the root
    }),

    NestjsFormDataModule.config({
      isGlobal: true,
      storage: MemoryStoredFile,
      limits: {
        fileSize: 10 * 1024 * 1024,
        files: 10,
        fieldSize: 1024 * 1024,
      },
    }),
    // ... other imports
    MasterApisModule,
    CategoriesModule,
    ProductsModule,
    UsersModule,
    VendorsModule,
    TaxesModule,
    ProductInventoryModule,
    AttributesModule,
    CartModule,
    WishlistModule,
    UserAddressModule,
    CheckoutModule,
  ],
  controllers: [AppController, MasterApisController],
  providers: [AppService, MasterApisService],
})
export class AppModule { }
