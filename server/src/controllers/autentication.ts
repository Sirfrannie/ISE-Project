import { Request, Response } from "express";
import crypto from "crypto";
import { User } from "../models/user";
import { pool } from "../config/config";


export const userLogin = async(
    req: Request,
    res: Response
)=>{
    console.log("/auth/userlogin");
    console.log(req.body.email); 
    const user_email = req.body.email;
    const user_password = req.body.password;
    
    const query_string = `
        SELECT u.id, u.f_name, u.l_name, u.img_url, u.email, u.hashed_password, r.type_name, c.id AS cid, u.img_url
        FROM Users u 
        INNER JOIN Carts c ON c.u_id = u.id
        INNER JOIN UserTypes r ON u.u_type = r.id
        WHERE u.email = '${user_email}'
    `;
    // query user with an email from database
    const result = await pool.query(
        query_string
    );
    
    const result_user = result.rows[0];
    console.log(result_user);
    console.log(result.rows.length);
    // check is there a user with this email on database
    if (result.rows.length === 0){
        return res.status(401).json({ ok: false, error: "อีเมล์ไม่ถูกต้อง" });
    }

    // const result_user = result.rows[0];
    // check if the password match
    if (result.rows[0].hashed_password !== user_password){
        return res.status(401).json({ ok: false, error: "รหัสผ่านไม่ถูกต้อง" });
    }
    const user: User = {
        id: result_user.id,
        firstName: result_user.f_name,
        lastName: result_user.l_name,
        role: result_user.type_name,
        cart: result_user.cid,
        email: result_user.email,
        avatarUrl: result_user.img_url
    };
    // generate random token    
    const token: string = crypto.randomBytes(32).toString("hex");

    res.status(200).json({ ok: true, user: user, token: token});
}