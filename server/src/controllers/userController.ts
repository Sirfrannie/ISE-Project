import { Request, Response } from "express";
import { pool } from "../config/config"
// import { User } from "../models/user"


interface UserData{
    id: number,
    name: string,
    image_url: string 
}
// list of user to send to client
let users: UserData[] = [
    { id: 1, name: "Somsri", image_url: "http://localhost:3001/img/4.jpg"},
    { id: 2, name: "Somsai", image_url: "http://localhost:3001/img/6.jpg"},
    { id: 3, name: "Somorn", image_url: "http://localhost:3001/img/5.jpg"},
];

export const getUser = ((req: Request, res: Response) =>{
    res.status(200).json(users)
});

export const addUser = ((req: Request, res: Response) =>{
    const { name } = req.body;

    if (!name || typeof name !== "string"){
        return res.status(400).json({result: "Error: Invalid name"});
    }

    const newUser = {
        id: users.length + 1,
        name: name,
        image_url: ""
    };
    users.push(newUser);
    res.status(200).json({result: "new User added"});
});

export const addUser2 = (req: Request, res: Response) =>{
    /*
    console.log("from addUser2");
    const newUser = new User();
    console.log(newUser.getName);
    */
};