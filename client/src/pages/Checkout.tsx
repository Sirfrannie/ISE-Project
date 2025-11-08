import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { server_url } from "../config/config";
import "../App.css";


type CartItem = {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  qty: number;
};

// type CartItem = CartItem & { qty: number };

function readCart(): CartItem[] {
  try {
    const raw = localStorage.getItem("cart");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function clearCart() {
  localStorage.removeItem("cart");
}

function genOrderCode() {
  // ตัวอย่าง: ORD-25K7F9
  const part = Date.now().toString(36).toUpperCase().slice(-6);
  return `ORD-${part}`;
}

/** หักสต็อกในแค็ตตาล็อกฝั่ง client (ที่แอดมินจัดการไว้ใน localStorage) */
function deductStockFromCatalog(items: { id: number; qty: number }[]) {
  const KEY = "catalog";
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return;
    const list = JSON.parse(raw) as any[];
    const want = new Map<number, number>();
    for (const it of items) want.set(it.id, (want.get(it.id) || 0) + it.qty);
    const next = list.map((p) =>
      want.has(p.id)
        ? { ...p, stock: Math.max(0, Number(p.stock || 0) - (want.get(p.id) || 0)) }
        : p
    );
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* no-op */
  }
}

export default function Checkout() {
  const nav = useNavigate();
  const [items, setItems] = useState<CartItem[]>([]);
  const [method, setMethod] = useState<"QR" | "PICKUP">("QR");
  const [orderCode, setOrderCode] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const [cid, setCid] = useState<string | null>(null);

  useEffect(() => {
    try {
      const uraw = localStorage.getItem("user");
      const u = uraw ? JSON.parse(uraw) : null;
      setCid(u?.cart ?? null);
    } catch {
      setCid(null);
    }
  }, []);

  useEffect(() => setItems(readCart()), []);

  const agg = useMemo<CartItem[]>(() => {
    const map = new Map<number, CartItem>();
    for (const p of items) {
      const existed = map.get(p.id);
      if (existed) existed.qty += 1;
      else map.set(p.id, { ...p, qty: 1 });
    }
    return Array.from(map.values());
  }, [items]);

  const subtotal = useMemo(
    () => agg.reduce((s, a) => s + a.qty * a.price, 0),
    [agg]
  );

  const confirmPayment = async () => {
    if (items.length === 0) {
      alert("ตะกร้าว่าง กรุณาเลือกสินค้า");
      nav("/shop");
      return;
      
    }
    
    const userRaw = localStorage.getItem("user");
    const user = userRaw ? JSON.parse(userRaw) : null;
    if (!user?.email) {
      alert("กรุณาล็อกอินก่อนชำระเงิน");
      // nav("/login");
      return;
    }

    setProcessing(true);
    try {
      const payload = {
        email: user.email,
        method,
        subtotal,
        cid,
        /*
        items: agg.map((x) => ({
          id: x.id,
          name: x.name,
          price: x.price,
          qty: x.qty,
        })),
        */
      };

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const token = (user && user.token) || localStorage.getItem("token");
      if (token) headers["x-token"] = token;

      const res = await fetch(`${server_url}/product/check`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detail = (data && (data.detail as any[])) || null;
        if (Array.isArray(detail) && detail.length) {
          const msg = detail
            .map(
              (d) =>
                `สินค้า ${d.productId ?? d.id}: ต้องการ ${d.need} มีคงเหลือ ${d.have}`
            )
            .join("\n");
          throw new Error(`สต็อกไม่พอ:\n${msg}`);
        }
        throw new Error(data?.message || data?.error || `HTTP ${res.status}`);
      }

      // สำเร็จ
      const code = genOrderCode();
      setOrderCode(code);

      if (data?.order) {
        localStorage.setItem("lastOrder", JSON.stringify(data.order));
      }

      // make an order
      try {
        const res = await fetch(`${server_url}/order/make`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cid: cid, code: code, method: method }),
        });
        if (!res.ok) throw new Error(`Error (${res.status})`);
      } catch {
        // fallback local
      }

      // nav(`/orders?code=${code}`, { replace: true });

      // หักสต็อกจากแค็ตตาล็อกฝั่ง client ให้ทันที (ฝั่ง server ควรหักของจริงอยู่แล้ว)
      // deductStockFromCatalog(payload.items.map((it) => ({ id: it.id, qty: it.qty })));
      
      await fetch(`${server_url}/cart/clear`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cid }),
      });
      // เคลียร์ตะกร้า
      clearCart();
    if (!res.ok) throw new Error(`ลบข้อมูลตะกร้าไม่สำเร็จ (${res.status})`);
    } catch (e: any) {
      alert(e?.message || "สั่งซื้อไม่สำเร็จ");
    } finally {
      setProcessing(false);
    }
  };

  const goShop = () => nav("/shop");

  return (
    <div className="checkout-shell">
      <div className="checkout-card">
        {/* back */}
        <div style={{ marginBottom: 12 }}>
          <button className="back-btn" onClick={goShop}>🔙 กลับไปหน้าร้านค้า</button>
        </div>

        <header className="checkout-header">
          <h1>ชำระเงิน</h1>
        </header>

        {orderCode ? (
          <div className="paid-box">
            <div className="paid-title">ชำระเงินสำเร็จ</div>
            <div className="paid-code">
              รหัสคำสั่งซื้อ: <b>{orderCode}</b>
              <button
                className="copy-btn"
                onClick={() => navigator.clipboard.writeText(orderCode)}
              >
                คัดลอกรหัส
              </button>
            </div>
            <p>นำรหัสนี้ไปแสดงเมื่อมารับสินค้าที่หน้าร้าน</p>
            <div style={{ marginTop: 10 }}>
              <button className="btn-primary" onClick={goShop}>กลับไปช้อปต่อ</button>
            </div>
          </div>
        ) : (
          <>
            {/* สรุปรายการ */}
            <section className="co-summary">
              <h3>รายการสินค้า</h3>
              {agg.length === 0 ? (
                <div className="cart-empty">
                  <div className="cart-icon">🛒</div>
                  <p>ยังไม่มีสินค้าในตะกร้า</p>
                </div>
              ) : (
                <ul className="co-list">
                  {agg.map((it) => (
                    <li key={it.id} className="co-row">
                      <div className="co-thumb">
                        <img src={it.image} alt={it.name} />
                      </div>
                      <div className="co-info">
                        <div className="co-name" title={it.name}>{it.name}</div>
                        <div className="co-cat">{it.category}</div>
                      </div>
                      <div className="co-qty">x {it.qty}</div>
                      <div className="co-price">
                        {(it.qty * it.price).toLocaleString()} <span>บาท</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <div className="co-total">
                <div>ยอดรวม</div>
                <div className="co-sum">{subtotal.toLocaleString()} <span>บาท</span></div>
              </div>
            </section>

            {/* วิธีชำระ */}
            <section className="co-method">
              <h3>เลือกวิธีชำระเงิน</h3>
              <div className="method-tabs">
                <button
                  className={method === "QR" ? "mtab active" : "mtab"}
                  onClick={() => setMethod("QR")}
                >
                  สแกน QR พร้อมเพย์
                </button>
                <button
                  className={method === "PICKUP" ? "mtab active" : "mtab"}
                  onClick={() => setMethod("PICKUP")}
                >
                  ชำระเมื่อมารับของ
                </button>
              </div>

              {method === "QR" ? (
                <div className="qr-box">
                  <div className="qr-left">
                    {/* ใช้ภาพตัวอย่าง วางไฟล์ใน public/images/qr-demo.png */}
                    <div className="qr-img">
                      <img src="/images/qr-demo.png" alt="QR สำหรับชำระเงิน" />
                    </div>
                    <div className="qr-note">
                      ยอดที่ต้องชำระ: <b>{subtotal.toLocaleString()}</b> บาท
                    </div>
                  </div>
                  <div className="qr-right">
                    <ul className="qr-steps">
                      <li>เปิดแอปธนาคาร / พร้อมเพย์</li>
                      <li>สแกน QR ด้านซ้าย</li>
                      <li>ตรวจสอบยอดให้ตรง: <b>{subtotal.toLocaleString()}</b> บาท</li>
                      <li>กดยืนยันชำระ</li>
                    </ul>
                    <div className="qr-warn">* ภาพ QR เป็นตัวอย่าง ในงานจริงให้สร้างแบบไดนามิกตามยอด</div>
                  </div>
                </div>
              ) : (
                <div className="pickup-box">
                  <p>
                    เลือกชำระเงินที่หน้าร้าน:
                    ระบบจะออก <b>รหัสคำสั่งซื้อ</b> ให้ทันที
                    กรุณาแสดงรหัสดังกล่าวเมื่อมารับสินค้าและชำระเงินที่เคาน์เตอร์
                  </p>
                </div>
              )}
            </section>

            {/* ปุ่มยืนยัน */}
            <div className="co-actions">
              <button
                className="btn-primary"
                onClick={confirmPayment}
                disabled={processing || agg.length === 0}
              >
                {processing ? "กำลังดำเนินการ..." : method === "QR" ? "ยืนยันการชำระ" : "ยืนยันการสั่งซื้อ"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
