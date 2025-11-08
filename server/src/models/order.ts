import { Product } from "./product";
import { CartItem } from "./cart";

export interface Order{
    id: number;
    create_at: string;
    order_status: string;
    subtotal: number;
    items: CartItem[] | null;
};