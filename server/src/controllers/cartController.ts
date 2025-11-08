import { Request, Response } from "express";
import { Cart, CartItem } from "../models/cart";
import { Product } from "../models/product";
import { hashids, pool } from "../config/config";
import Hashids from "hashids";

export const getCart = async(
    req: Request,
    res: Response
)=>{
    console.log("get cart");
    const cart_id = req.body.cid;
    /* to check if the items already in cart */
    const q_s1: string = (`
        SELECT p.id, p.product_name, p.price, p.img_url, c.quantity
        FROM Products p 
        LEFT OUTER JOIN CartItems c ON p.id = c.p_id
        WHERE c.c_id = ${cart_id}
    ` 
    );
    const r = await pool.query( q_s1 );
    const products: CartItem[]= r.rows.map((row)=>({
        id: row.id,
        name: row.product_name,
        price: row.price,
        image: row.img_url,
        category: null,
        qty: row.quantity,
    }));

    console.log(products);
    res.status(200).json(products);
};

// export const getCart;
export const addToCart = async(
    req: Request,
    res: Response
)=>{
    // console.log(req.body);
    const product_id = req.body.pid;
    const cart_id = req.body.cid;
    const qty = req.body.qty;
    const price = req.body.price;

    /* to check if the items already in cart */
    const q_s1: string = (`
        SELECT * FROM CartItems
        WHERE c_id = ${cart_id} AND p_id = ${product_id}
    ` 
    );
    const r = await pool.query( q_s1 );
    /* if not in cart yet, insert it */
    if (r.rows.length === 0){
        const query_string: string = `
            INSERT INTO CartItems (c_id, p_id, quantity, price_per_unit)
            VALUES (${cart_id}, ${product_id}, ${qty}, ${price})
        `;
        const result = await pool.query(query_string); 
        console.log(`inserted ${result}`);
        return res.status(200).json({ok:true});
    }
    /* if it exit add the quantity */
    else {
        const query_string: string = `
            UPDATE CartItems SET quantity = quantity + ${qty} 
            WHERE c_id = ${cart_id} AND p_id = ${product_id}
        `;
        const result = await pool.query(query_string); 
        console.log(`updated ${result}`);
        return res.status(200).json({ok:true});
    }
    // console.log(r.rows.length);

    return res.status(400).json({ok:false});
};

export const removeFromCart = async (
    req: Request,
    res: Response
)=>{
    const product_id = req.body.pid;
    const cart_id = req.body.cid;

    console.log("remove from cart");
    console.log(cart_id, product_id);
    /* check if exist */
    const q_s1: string = (`
        SELECT * FROM CartItems
        WHERE c_id = ${cart_id} AND p_id = ${product_id}
    ` 
    );
    const r = await pool.query( q_s1 );
    /* if not in cart yet, insert it */
    if (r.rows.length !== 0){
        const query_string: string = `
            DELETE FROM CartItems 
            WHERE c_id = ${cart_id} AND p_id = ${product_id}
        `;
        const result = await pool.query(query_string); 
        console.log(`cart Item deleted: ${result}`);
        return res.status(200).json({ok:true});
    }
    return res.status(400).json({ok:false});
}

export const clearCart = async (
    req: Request,
    res: Response
)=>{
    const cart_id = req.body.cid;

    /* check if exist */
    const q_s1: string = (`
        SELECT * FROM CartItems
        WHERE c_id = ${cart_id} 
    ` 
    );
    const r = await pool.query( q_s1 );
    /* if not in cart yet, insert it */
    if (r.rows.length !== 0){
        const query_string: string = `
            DELETE FROM CartItems 
            WHERE c_id = ${cart_id}
        `;
        const result = await pool.query(query_string); 
        console.log(`cart Item deleted: ${result}`);
        return res.status(200).json({ok:true});
    }
    return res.status(400).json({ok:false});
}