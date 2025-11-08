import { Request, Response } from "express";
import { pool } from "../config/config";

export const makeOrder = async (
    req: Request,
    res: Response
)=>{
    console.log("makeOrder");
    console.log(req.body); 

    const cid = req.body.cid;
    const met = req.body.method;
    const code = req.body.code;

    // create an order
    const query_string: string = `
        INSERT INTO Orders (payment_method, code)
        VALUES ('${met}', '${code}')
        RETURNING id
    `
    const r1 = await pool.query(query_string);

    // make order items by copy item in cart
    const q2_string: string = `
        INSERT INTO OrderItems (order_id, p_id, price_at_purchase, quantity)
        SELECT ${r1.rows[0].id}, c.p_id, c.quantity, c.price_per_unit 
        FROM CartItems c
        WHERE c.c_id = ${cid}
    `;

    // update product in stock
    const q3_string: string = `
        UPDATE Products p
        SET quantity_on_hand = p.quantity_on_hand - o.quantity
        FROM OrderItems o
        WHERE o.p_id = p.id
        AND o.order_id = ${r1.rows[0].id};
    `
    const r3 = await pool.query(q3_string);

    res.status(200).json({ok:true});
}