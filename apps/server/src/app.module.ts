import { Module, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import Database from 'better-sqlite3';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { CustomersModule } from './customers/customers.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { WarehouseEntriesModule } from './warehouse_entries/warehouse_entries.module';
import { WorkOrdersModule } from './work_orders/work_orders.module';
import { ProductionOrdersModule } from './production_orders/production_orders.module';
import { PurchasesModule } from './purchases/purchases.module';
import { DeliveriesModule } from './deliveries/deliveries.module';
import { MaterialsModule } from './materials/materials.module';
import { PersonnelModule } from './personnel/personnel.module';
import { SettingsModule } from './settings/settings.module';
import { KnifeDiesModule } from './knife_dies/knife_dies.module';
import { ColorPrintsModule } from './color_prints/color_prints.module';
import { SpecOptionsModule } from './spec_options/spec_options.module';
import { ActionLogModule } from './action_logs/action_logs.module';
import { ErrorLogModule } from './error_logs/error_logs.module';
import { FinanceRecordModule } from './finance_records/finance_records.module';
import { FinanceFixedItemModule } from './finance_fixed_items/finance_fixed_items.module';
import { OutsourcingOrderModule } from './outsourcing_orders/outsourcing_orders.module';
import { OutsourcingEntryModule } from './outsourcing_entries/outsourcing_entries.module';
import { PermissionModule } from './permissions/permissions.module';
import { PrintItemModule } from './print_items/print_items.module';
import { PrintItemImageModule } from './print_item_images/print_item_images.module';
import { ProductCustomerCodeModule } from './product_customer_codes/product_customer_codes.module';
import { PurchaseItemModule } from './purchase_items/purchase_items.module';
import { ReconciliationBillModule } from './reconciliation_bills/reconciliation_bills.module';
import { ReconciliationItemModule } from './reconciliation_items/reconciliation_items.module';
import { ShipmentScheduleModule } from './shipment_schedules/shipment_schedules.module';
import { StockLogModule } from './stock_logs/stock_logs.module';
import { TrackingEventModule } from './tracking_events/tracking_events.module';
import { WorkOrderMaterialModule } from './work_order_materials/work_order_materials.module';
import { WorkshopInventoryModule } from './workshop_inventory/workshop_inventory.module';
import { WorkshopInventoryLogModule } from './workshop_inventory_logs/workshop_inventory_logs.module';
import { UploadsModule } from './uploads/uploads.module';
import { ExcelModule } from './excel/excel.module';
import { PrintModule } from './print/print.module';
import { ReportModule } from './report/report.module';
import { PurchaseReqModule } from './purchase_req/purchase_req.module';
import { ImageLibraryModule } from './image_library/image_library.module';
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
import { Company } from './entities/company';

const DB_PATH = process.env.DB_PATH || '/home/ubuntu/data/erp-system/erp.db';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: DB_PATH,
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
        Company,
      ],
      synchronize: false,
      logging: false,
    }),
    AuthModule,
    ProductsModule,
    OrdersModule,
    CustomersModule,
    SuppliersModule,
    WarehouseEntriesModule,
    WorkOrdersModule,
    ProductionOrdersModule,
    PurchasesModule,
    DeliveriesModule,
    MaterialsModule,
    PersonnelModule,
    SettingsModule,
    KnifeDiesModule,
    ColorPrintsModule,
    SpecOptionsModule,
    ActionLogModule,
    ErrorLogModule,
    FinanceRecordModule,
    FinanceFixedItemModule,
    OutsourcingOrderModule,
    OutsourcingEntryModule,
    PermissionModule,
    PrintItemModule,
    PrintItemImageModule,
    ProductCustomerCodeModule,
    PurchaseItemModule,
    ReconciliationBillModule,
    ReconciliationItemModule,
    ShipmentScheduleModule,
    StockLogModule,
    TrackingEventModule,
    WorkOrderMaterialModule,
    WorkshopInventoryModule,
    WorkshopInventoryLogModule,
    UploadsModule,
    ExcelModule,
    PrintModule,
    ReportModule,
    PurchaseReqModule,
    ImageLibraryModule,
  ],
})
export class AppModule implements OnModuleInit, OnModuleDestroy {
  private sqliteDb: InstanceType<typeof Database> | null = null;

  constructor(private dataSource: DataSource) {}

  onModuleInit() {
    // 创建独立的 better-sqlite3 连接来配置 pragma
    try {
      this.sqliteDb = new Database(DB_PATH);
      
      // 启用 WAL 模式 - 关键：确保数据在重启时不丢失
      this.sqliteDb.pragma('journal_mode = WAL');
      // synchronous = NORMAL - 性能和安全的平衡点
      this.sqliteDb.pragma('synchronous = NORMAL');
      // busy timeout - 防止并发写入时立即失败
      this.sqliteDb.pragma('busy_timeout = 5000');
      
      const journalMode = this.sqliteDb.pragma('journal_mode', { simple: true });
      const syncMode = this.sqliteDb.pragma('synchronous', { simple: true });
      console.log(`[SQLite] WAL mode: ${journalMode}, synchronous: ${syncMode}`);
      
      // 关闭独立连接（pragma 已持久化到数据库文件）
      this.sqliteDb.close();
      this.sqliteDb = null;
    } catch (err) {
      console.error('[SQLite] Error configuring pragmas:', err.message);
    }
  }

  onModuleDestroy() {
    // 优雅关闭时 checkpoint WAL
    if (this.sqliteDb) {
      try {
        this.sqliteDb.pragma('wal_checkpoint(TRUNCATE)');
        this.sqliteDb.close();
      } catch {}
    }
  }
}
