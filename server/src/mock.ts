import Hashids from "hashids";
import dotenv from 'dotenv';
dotenv.config();
interface registerData{
    id: number,
    f_name: string,
    l_name: string,
    image_url: string | null,

    user_name: string,
    email: string,
    password: string
}
const newuser: registerData = {
    id: 66050033,
    f_name: "Jacob",
    l_name: "Laganda",
    image_url: null,

    user_name: "jc",
    email: "jc.in.th",
    password: "jc1234"
};

const hashsalt = process.env.HASH_SALT;
console.log(`mock hashsalt ${hashsalt}`);
const hashids: Hashids = new Hashids(hashsalt, 20);

const addPerson = async () =>{
    const hash_cid: string = hashids.encode(1);
    const hash_pid: string = hashids.encode(1);
    const url: string = "http://localhost:3001/auth/login";
    console.log(`sending request to url: ${url}`);
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ "email", "pasword"});
    })

    console.log(`res.ok: ${res.ok}`);
};
addPerson();