// 后端 Entity 类型对齐
export interface Account {
  id: number;
  username: string;
  real_name: string;
  role: string;
  status: string;
  created_at?: string;
}

export interface Product {
  id: number;
  code: string;
  name: string | null;
  spec: string;
  length: number;
  width: number;
  height: number;
  material: string;
  unit_price: number;
  cost: number;
  stock_qty: number;
  safety_stock: number;
  box_type: string;
  status: string | null;
  product_type: string;
  unit: string;
  knife_die: string;
  created_at: string;
  customer_code: string;
}

export interface Order {
  id: number;
  order_no: string | null;
  customer_id: number;
  status: string;
  total_amount: number;
  total_cost: number;
  profit: number;
  delivery_date: string;
  remark: string;
  created_at: string;
  salesman_id: number;
  customer_order_no: string;
  print_name: string;
  customer_size: string;
  die_size: string;
  quantity: string;
  order_date: string;
  // 纸箱行业核心字段（Phase 1 补全）
  face_supplier: string;
  face_material: string;
  face_size: string;
  face_qty: string;
  face_price: string;
  face_fee: string;
  medium_supplier: string;
  medium_material: string;
  medium_weight: string;
  medium_size: string;
  medium_qty: string;
  medium_price: string;
  print_color: string;
  print_price: string;
  surface_process: string;
  surface_price: string;
  die_price: string;
  outsource_fee: string;
  reference_info: string;
  customer_feedback: string;
  // 金额（Phase 1 补全）
  cost_tax: string;
  cost_no_tax: string;
  price_tax: string;
  price_no_tax: string;
  profit_margin: string;
  total_tax: string;
  total_no_tax: string;
}

export interface Customer {
  id: number;
  name: string;
  contact: string;
  phone: string;
  address: string;
  salesman: string;
  payment_cycle: string;
  payment_days: number;
  settlement_type: string;
  tax_included: number;
  rebate_percent: number;
  credit_limit: number;
  status: string;
  remark: string;
  created_at?: string;
}

export interface Supplier {
  id: number;
  name: string | null;
  contact: string;
  phone: string;
  address: string;
  material_type: string;
  supplier_type: string;
  settlement_type: string;
  credit_limit: number;
  payment_days: number;
  payment_cycle: string;
  rebate_percent: number;
  status: string;
  remark: string;
  created_at?: string;
}

export interface Personnel {
  id: number;
  name: string | null;
  type: string | null;
  phone: string;
  department: string;
  status: string;
  remark: string;
  created_at?: string;
}

export interface Purchase {
  id: number;
  purchase_no: string | null;
  supplier_id: number;
  status: string;
  total_amount: number;
  delivery_date: string;
  remark: string;
  created_at: string;
  ref_type: string;
  ref_id: number;
  work_order_id: number;
  delivery_address: string;
}

export interface PurchaseItem {
  id: number;
  purchase_id: number;
  material_name: string;
  spec: string;
  quantity: number;
  unit_price: number;
  amount: number;
  ref_info: string;
  paper_type: string;
  unit: string;
  delivery_address: string;
}

export interface Supplier {
  id: number;
  name: string;
  contact: string;
  phone: string;
  address: string;
  status: string;
}

export interface WarehouseEntry {
  id: number;
  entry_no: string | null;
  work_order_id: number | null;
  order_id: number;
  product_id: number | null;
  quantity: number | null;
  status: string;
  remark: string;
  created_at: string;
  product_name: string;
}

export interface Delivery {
  id: number;
  delivery_no: string | null;
  order_id: number;
  customer_id: number;
  work_order_id: number;
  work_order_completed_at: string;
  status: string;
  delivery_date: string;
  signed: number;
  signed_at: string;
  remark: string;
  created_at: string;
  delivery_person: string;
  delivery_time: string;
  warehouse_entry_id: number;
  address: string;
  work_order_nos: string;
}

export interface DeliveryItem {
  id: number;
  delivery_id: number;
  product_id: number;
  quantity: number;
  warehouse_entry_id: number;
  unit_price?: number;
  remark?: string;
}

export interface WorkOrder {
  id: number;
  work_order_no: string | null;
  order_id: number;
  product_id: number;
  quantity: number;
  status: string;
  worker: string;
  created_at: string;
  completed_at: string;
  start_date: string;
  end_date: string;
  plan_qty: number;
  completed_qty: number;
  progress: number;
  material: string;
  box_type: string;
  process_name: string;
  remark: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  product_code: string;
  spec: string;
  quantity: number;
  unit_price: number;
  amount: number;
  delivered_qty: number;
  customer_product_code: string;
  delivery_date: string;
  remark: string;
  order_date: string;
}

export interface FinanceRecord {
  id: number;
  type: '应收' | '应付' | '收入' | '支出' | string;
  ref_no: string;
  ref_type: string;
  party_name: string;
  amount: number;
  status: '未结清' | '已结清' | '已冲正' | string;
  due_date: string;
  paid_at: string;
  created_at: string;
  period_type: string;
  category: string;
  description: string;
  canceled_at: string;
  canceled_reason: string;
  canceled_by: string;
}

// ============ 业务流转相关（Phase 4 新增） ============

export interface WorkOrder {
  id: number;
  prod_no: string | null;
  order_id: number;
  product_id: number;
  quantity: number | null;
  material_type: string;
  box_type: string;
  board_length: number;
  board_width: number;
  board_area: number;
  labor_hours: number;
  processes: string;
  status: string;
  priority: string;
  worker: string;
  start_time: string;
  end_time: string;
  completed_qty: number;
  materials_json: string;
  created_at: string;
  entry_code: string;
  finished_spec: string;
}

export interface OutsourcingOrder {
  id: number;
  order_no: string | null;
  work_order_id: number;
  material_name: string;
  material_spec: string;
  quantity: number;
  unit: string;
  supplier_id: number;
  status: string;
  planned_date: string;
  completed_date: string;
  received_qty: number;
  remark: string;
  created_at: string;
  customer_id: number;
  size_structure: string;
  paper_size: string;
  machine_size: string;
  machine_quantity: number;
  finished_quantity: number;
  print_color: string;
  follow_version: string;
  surface_treatment: string;
  unit_price: number;
  is_settled: number;
}

export interface ReconciliationBill {
  id: number;
  bill_no: string | null;
  customer_id: number;
  period_start: string;
  period_end: string;
  total_amount: number;
  total_qty: number;
  status: string;
  confirmed_at: string;
  remark: string;
  created_at: string;
}

export interface ReconciliationItem {
  id: number;
  bill_id: number;
  delivery_id: number;
  delivery_no: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  amount: number;
  delivery_date: string;
  created_at: string;
}

export interface WorkshopInventory {
  id: number;
  material_name: string | null;
  material_spec: string;
  material_type: string | null;
  quantity: number;
  unit: string;
  source_type: string;
  source_id: number;
  work_order_id: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface WorkshopInventoryLog {
  id: number;
  material_name: string | null;
  material_spec: string;
  type: string | null;
  quantity: number | null;
  ref_type: string;
  ref_id: number;
  work_order_id: number;
  remark: string;
  created_at: string;
}