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
}

export interface Customer {
  id: number;
  name: string;
  contact: string;
  phone: string;
  address: string;
  salesman: string;
  payment_cycle: string;
  tax_included: number;
  rebate_percent: number;
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
  order_id: number;
  status: string;
  delivery_date: string;
  created_at?: string;
  delivery_no?: string;
  customer_id?: number;
  delivery_person?: string;
  delivery_time?: string;
  address?: string;
  signed?: number;
  signed_at?: string;
  work_order_id?: number;
}

export interface FinanceRecord {
  id: number;
  type: string;
  amount: number;
  ref_no: string;
  remark: string;
  created_at?: string;
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