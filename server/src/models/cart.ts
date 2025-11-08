import { Product } from "./product";

export interface CartItem{
    // item: Product;
    // price_per_unit: number;
    // subtotal: numb  id: number;
    name: string;
    price: number;
    image: string;
    category: string | null;
    qty: number;
};

export interface Cart{
    id: number;
    items: CartItem[] | null;
};
