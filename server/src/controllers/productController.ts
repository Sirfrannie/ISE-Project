import { Request, Response } from "express";
import { pool } from "../config/config";
import { Product } from "../models/product";

export const getProducts = async (
    req: Request,
    res: Response
)=>{
    const query_string: string = ` 
        SELECT p.id, p.product_name, p.price, p.img_url, p.quantity_on_hand, c.category_name
        FROM Products p
        INNER JOIN Category c
        ON p.category_id = c.id
        ORDER BY p.product_name`;
    const result = await pool.query(
        query_string 
    )
    // console.log(result.rows);
    // map row to products interface
    const products: Product[] = result.rows.map((row) => ({
        id: row.id,
        name: row.product_name,
        price: row.price,
        image: row.img_url,
        category: row.category_name,
        stock: row.quantity_on_hand,
        active: row.quantity_on_hand > 0
    }));
    res.status(200).json(products);
}
export const addProduct = async (
    req: Request, 
    res: Response
)=>{
    const product_id: number = Number(req.params.id);
    const result = await pool.query(
        "UPDATE Products SET quantity_on_hand = quantity_on_hand + 1 WHERE id = $1",
        [product_id]
    );
}

export const checkStock = async (
    req: Request,
    res: Response,
)=>{
    const cart_id = req.body.cid;

    // get number of product need 
    const q_s1: string = `
        SELECT c.p_id, c.quantity, p.quantity_on_hand
        FROM CartItems c 
        INNER JOIN Products p
        ON c.p_id = p.id
        WHERE c.c_id = ${cart_id}
    `;
    const result = await pool.query(q_s1);
    interface Data {
        id: number;
        need: number;
        have: number;
        avail?: boolean;
    }
    const data: Data[] = result.rows.map((row) =>({
        id: row.p_id,
        need: row.quantity,
        have: row.quantity_on_hand,
        avail: (row.quantity_on_hand - row.quantity) >= 0
    }));

    console.log(result.rows[0])
    let err: boolean = false;
    let prod_ofs: Data[] = [];
    for ( const d of data){
        if (!d.avail){
            prod_ofs.push({
                id: d.id, 
                need: d.need, 
                have: d.have
            });
            err = true;
        }
    }
    if (!err){
        return res.status(200).json({ok: true})
    }
    return res.status(400).json({ok:false, detail: prod_ofs});
} 