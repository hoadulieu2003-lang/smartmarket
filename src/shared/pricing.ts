type ProductLike = {
  price: any;
  quantity: any;
  is_hidden: boolean;
  discount_type: 'percent' | 'fixed_price' | null;
  discount_value: any;
  discount_start_at: Date | null;
  discount_end_at: Date | null;
};

const num = (v: any): number => (typeof v === 'number' ? v : Number(v));

/** Khuyến mãi đang hiệu lực tại thời điểm now? */
export function isOnSale(p: ProductLike, now = new Date()): boolean {
  if (!p.discount_type || p.discount_value === null || p.discount_value === undefined) return false;
  if (p.discount_start_at && now < p.discount_start_at) return false;
  if (p.discount_end_at && now > p.discount_end_at) return false;
  return true;
}

/** Giá bán cuối cùng. fixed_price: discount_value = GIÁ SAU GIẢM (đã chốt trong PRD). */
export function finalPrice(p: ProductLike, now = new Date()): number {
  const price = num(p.price);
  if (!isOnSale(p, now)) return price;
  if (p.discount_type === 'percent') {
    return Math.round((price * (100 - num(p.discount_value))) / 100);
  }
  return Math.round(num(p.discount_value));
}

export function stockStatus(p: ProductLike): 'in_stock' | 'out_of_stock' {
  return num(p.quantity) > 0 ? 'in_stock' : 'out_of_stock';
}

/** Gắn các field tính toán vào object sản phẩm trả về cho client. */
export function withPricing<T extends ProductLike>(p: T, now = new Date()) {
  return {
    ...p,
    final_price: finalPrice(p, now),
    is_on_sale: isOnSale(p, now),
    stock_status: stockStatus(p),
  };
}
