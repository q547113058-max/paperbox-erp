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
}

export interface FinanceRecord {
  id: number;
  type: string;
  amount: number;
  ref_no: string;
  remark: string;
  created_at?: string;
}
