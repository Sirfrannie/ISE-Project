export interface Product{
    id: number;
    name: string;
    price: number;
    image: string;
    category: string;
    stock?: number;
    active?: boolean;
};