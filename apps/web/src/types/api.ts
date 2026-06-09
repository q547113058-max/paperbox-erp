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
  created_at?: string;
}

export interface Delivery {
  id: number;
  order_id: number;
  status: string;
  delivery_date: string;
  created_at?: string;
}

export interface Purchase {
  id: number;
  supplier_id: number;
  status: string;
  total_amount: number;
  created_at: string;
}
