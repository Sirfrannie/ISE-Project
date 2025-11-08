import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { server_url } from "../config/config";
import "../App.css";

interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string | null;
  qty: number; // ใช้เป็นจำนวนชิ้นต่อรายการ (ถ้า server ส่งมา)
}

/* ===== localStorage helpers ===== */
function readCart(): CartItem[] {
  try {
    const raw = localStorage.getItem("cart");
    const arr: any = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
function writeCart(items: CartItem[]) {
  localStorage.setItem("cart", JSON.stringify(items));
}

export default function Cart() {
  const nav = useNavigate();

  const [items, setItems] = useState<CartItem[]>([]);
  const [cid, setCid] = useState<string | null>(null);

  /* ดึง cart id จาก user แค่ครั้งแรก */
  useEffect(() => {
    try {
      const uraw = localStorage.getItem("user");
      const u = uraw ? JSON.parse(uraw) : null;
      setCid(u?.cart ?? null);
    } catch {
      setCid(null);
    }
  }, []);

  /* โหลดรายการจาก server เมื่อมี cid */
  useEffect(() => {
    if (!cid) return;
    const getServerData = async () => {
      try {
        const res = await fetch(`${server_url}/cart/get`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cid }),
        });
        if (!res.ok) throw new Error(`โหลดข้อมูลตะกร้าไม่สำเร็จ (${res.status})`);

        // ✅ normalize ให้รองรับหลายรูปแบบ
        const json = await res.json();
        const list: CartItem[] = Array.isArray(json)
          ? json
          : Array.isArray(json?.items)
          ? json.items
          : json && typeof json === "object"
          ? [json as CartItem]
          : [];

        setItems(list);
        writeCart(list);
      } catch {
        // fallback local
        setItems(readCart());
      }
    };
    getServerData();
  }, [cid]);

  /* ===== รวมรายการสำหรับแสดงผล =====
     - ใช้ key = id:name กันกรณี id ชนกัน
     - รองรับ qty จาก server (ถ้าไม่ส่งมา → นับเป็น 1)  */
  const agg: CartItem[] = useMemo(() => {
    const map = new Map<string, CartItem>();
    for (const p of items) {
      const key = `${p.id}:${p.name}`;
      const addQty = Math.max(1, Number((p as any).qty ?? 1));
      const existed = map.get(key);
      if (existed) {
        existed.qty += addQty;
      } else {
        map.set(key, { ...p, qty: addQty });
      }
    }
    return Array.from(map.values());
  }, [items]);

  // ลำดับ id ตามการพบครั้งแรก (คงไว้ตามโค้ดเดิม)
  const order = useMemo(() => {
    const seen = new Set<number>();
    const arr: number[] = [];
    for (const it of items) {
      if (!seen.has(it.id)) {
        seen.add(it.id);
        arr.push(it.id);
      }
    }
    return arr;
  }, [items]);

  // === โค้ดด้านล่าง “ตรรกะเดิมทั้งหมด” ไม่ยุ่ง UI ===

  const updateQty = async (it: CartItem, qty: number) => {
    const id: number = it.id;
    try {
      const res = await fetch(`${server_url}/cart/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cid: cid, pid: id, qty: qty-it.qty }),
      });

      if (!res.ok) throw new Error("ลบสินค้าไม่สำเร็จ");

    } catch (err) {
      console.error(err);
      alert("ไม่สามารถลบสินค้าได้");
    } 
    const clamped = Math.max(qty, 0);

    const countMap = new Map<number, number>();
    for (const it of items) {
      countMap.set(it.id, (countMap.get(it.id) || 0) + 1);
    }
    countMap.set(id, clamped);

    const templateMap = new Map<number, CartItem>();
    for (const it of items) {
      if (!templateMap.has(it.id)) templateMap.set(it.id, it);
    }

    const newList: CartItem[] = [];
    for (const pid of order) {
      const tmpl = templateMap.get(pid);
      if (!tmpl) continue;
      const c = countMap.get(pid) || 0;
      for (let k = 0; k < c; k++) {
        newList.push({ ...tmpl, qty: 1 }); // เก็บแถวละ 1 ตามตรรกะเดิม
      }
    }

    setItems(newList);
    writeCart(newList);
  };

  const removeItem = async (it: CartItem) => {
    const id = it.id;
     if (!cid) return; // no cart id, stop
  
    try {
      console.log(`cid = ${cid}, pid = ${it.id}`);
      const res = await fetch(`${server_url}/cart/remove`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cid: cid, pid: it.id }),
      });

      if (!res.ok) throw new Error("ลบสินค้าไม่สำเร็จ");

    } catch (err) {
      console.error(err);
      alert("ไม่สามารถลบสินค้าได้");
    } 
    const countMap = new Map<number, number>();
    for (const it of items) {
      countMap.set(it.id, (countMap.get(it.id) || 0) + 1);
    }
    countMap.set(id, 0);

    const templateMap = new Map<number, CartItem>();
    for (const it of items) {
      if (!templateMap.has(it.id)) templateMap.set(it.id, it);
    }

    const newList: CartItem[] = [];
    for (const pid of order) {
      if (pid === id) continue;
      const tmpl = templateMap.get(pid);
      if (!tmpl) continue;
      const c = countMap.get(pid) || 0;
      for (let k = 0; k < c; k++) {
        newList.push({ ...tmpl, qty: 1 });
      }
    }

    setItems(newList);
    writeCart(newList);
  };

  const clearCart = async () => {
    setItems([]);
    writeCart([]);
    const res = await fetch(`${server_url}/cart/clear`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cid }),
    });
    if (!res.ok) throw new Error(`ลบข้อมูลตะกร้าไม่สำเร็จ (${res.status})`);
  };

  const { subtotal, count } = useMemo(() => {
    const c = agg.reduce((s, a) => s + a.qty, 0);
    const sub = agg.reduce((s, a) => s + a.qty * a.price, 0);
    return { subtotal: sub, count: c };
  }, [agg]);

  const checkout = () => {
    nav("/checkout");
  };

  return (
    <div className="cart-shell">
      <div className="cart-card">
        <div style={{ marginBottom: "12px" }}>
          <button
            className="back-btn"
            onClick={() => nav("/shop")}
            style={{
              background: "#f4b871",
              border: "none",
              padding: "8px 14px",
              borderRadius: "10px",
              fontWeight: "900",
              cursor: "pointer",
            }}
          >
            🔙 กลับไปหน้าร้านค้า
          </button>
        </div>

        <header className="cart-header">
          <h1>ตะกร้าสินค้า</h1>
          <div className="cart-actions">
            {items.length > 0 && (
              <button className="cart-clear" onClick={clearCart}>
                ล้างตะกร้า
              </button>
            )}
          </div>
        </header>

        {agg.length === 0 ? (
          <div className="cart-empty">
            <div className="cart-icon">🛒</div>
            <p>ยังไม่มีสินค้าในตะกร้า</p>
          </div>
        ) : (
          <>
            <ul className="cart-list">
              {agg.map((it) => (
                <li key={`${it.id}:${it.name}`} className="cart-row">
                  <div className="cart-thumb">
                    <img src={it.image} alt={it.name} />
                  </div>
                  <div className="cart-info">
                    <div className="cart-name" title={it.name}>{it.name}</div>
                    <div className="cart-cat">{it.category}</div>
                  </div>
                  <div className="cart-price">
                    {it.price.toLocaleString()} <span>บาท</span>
                  </div>
                  <div className="cart-qty">
                    <button onClick={() => updateQty(it, it.qty - 1)} disabled={it.qty <= 1}>−</button>
                    <span>{it.qty}</span>
                    <button onClick={() => updateQty(it, it.qty + 1)}>＋</button>
                  </div>
                  <div className="cart-total">
                    {(it.qty * it.price).toLocaleString()} <span>บาท</span>
                  </div>
                  <div className="cart-remove">
                    <button onClick={() => removeItem(it)}>ลบ</button>
                  </div>
                </li>
              ))}
            </ul>

            <footer className="cart-footer">
              <div className="cart-sum">
                <div>จำนวนสินค้า: <b>{count}</b> ชิ้น</div>
                <div>ยอดรวม: <b>{subtotal.toLocaleString()}</b> บาท</div>
              </div>
              <button className="btn-checkout" onClick={checkout}>ชำระเงิน</button>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}