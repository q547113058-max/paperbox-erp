import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { Account } from './entities/accounts';
import { ActionLog } from './entities/action_logs';
import { ColorPrint } from './entities/color_prints';
import { Customer } from './entities/customers';
import { Delivery } from './entities/deliveries';
import { DeliveryItem } from './entities/delivery_items';
import { ErrorLog } from './entities/error_logs';
import { FinanceFixedItem } from './entities/finance_fixed_items';
import { FinanceRecord } from './entities/finance_records';
import { KnifeDie } from './entities/knife_dies';
import { Material } from './entities/materials';
import { OrderItem } from './entities/order_items';
import { OrderTracking } from './entities/order_tracking';
import { Order } from './entities/orders';
import { OutsourcingEntry } from './entities/outsourcing_entries';
import { OutsourcingOrder } from './entities/outsourcing_orders';
import { Permission } from './entities/permissions';
import { Personnel } from './entities/personnel';
import { PrintItemImage } from './entities/print_item_images';
import { PrintItem } from './entities/print_items';
import { ProductCustomerCode } from './entities/product_customer_codes';
import { ProductionOrder } from './entities/production_orders';
import { Product } from './entities/products';
import { PurchaseItem } from './entities/purchase_items';
import { Purchase } from './entities/purchases';
import { ReconciliationBill } from './entities/reconciliation_bills';
import { ReconciliationItem } from './entities/reconciliation_items';
import { Setting } from './entities/settings';
import { ShipmentSchedule } from './entities/shipment_schedules';
import { SpecOption } from './entities/spec_options';
import { StockLog } from './entities/stock_logs';
import { Supplier } from './entities/suppliers';
import { TrackingEvent } from './entities/tracking_events';
import { WarehouseEntry } from './entities/warehouse_entries';
import { WorkOrderMaterial } from './entities/work_order_materials';
import { WorkOrder } from './entities/work_orders';
import { WorkshopInventory } from './entities/workshop_inventory';
import { WorkshopInventoryLog } from './entities/workshop_inventory_logs';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: '/data/erp-data/erp-system/erp.db',
      entities: [
        Account, ActionLog, ColorPrint, Customer,
        Delivery, DeliveryItem, ErrorLog, FinanceFixedItem,
        FinanceRecord, KnifeDie, Material, OrderItem,
        OrderTracking, Order, OutsourcingEntry, OutsourcingOrder,
        Permission, Personnel, PrintItemImage, PrintItem,
        ProductCustomerCode, ProductionOrder, Product,
        PurchaseItem, Purchase, ReconciliationBill, ReconciliationItem,
        Setting, ShipmentSchedule, SpecOption, StockLog,
        Supplier, TrackingEvent, WarehouseEntry, WorkOrderMaterial,
        WorkOrder, WorkshopInventory, WorkshopInventoryLog,
      ],
      synchronize: false,
      logging: false,
    }),
    AuthModule,
    ProductsModule,
  ],
})
export class AppModule {}
