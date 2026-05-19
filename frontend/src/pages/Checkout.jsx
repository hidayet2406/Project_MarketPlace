import { useEffect, useMemo, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import "../styles/main.css"
import { getCart } from "../api/cart"
import API from "../api/api"
import { checkoutWithWallet } from "../api/transactions"
import useCartCount from "../hooks/useCartCount"
import UserMenu from "../components/UserMenu"
import { notifyCartChanged } from "../utils/cartEvents"
import { resolveMediaUrl } from "../utils/resolveMediaUrl"

function CartIcon(props){
    return (
        <svg className="mp-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
            <path d="M7 8h15l-1.5 8.5a2 2 0 0 1-2 1.5H9a2 2 0 0 1-2-1.7L5.4 4.5A1.8 1.8 0 0 0 3.6 3H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M9.5 22a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" fill="currentColor" opacity="0.85"/>
            <path d="M18.5 22a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" fill="currentColor" opacity="0.85"/>
        </svg>
    )
}

const initialForm = {
    country: "Azerbaijan",
    city: "",
    state: "",
    address: "",
    zipCode: "",
    note: "",
    cardName: "",
    cardNumber: "",
    expiry: "",
    cvc: "",
    paymentMethod: "wallet",
}

function Checkout(){
    const navigate = useNavigate()
    const location = useLocation()
    const cartCount = useCartCount()

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [cart, setCart] = useState(null)
    const [me, setMe] = useState(null)
    const [form, setForm] = useState(initialForm)
    const [submitting, setSubmitting] = useState(false)
    const [placed, setPlaced] = useState(false)
    const [placedSummary, setPlacedSummary] = useState(null)

    const signedIn = Boolean(localStorage.getItem("token"))
    let selectedIds;
    selectedIds = Array.isArray(location.state?.selectedIds) ? location.state.selectedIds : [];

    useEffect(() => {
        if(!signedIn){
            setLoading(false)
            return
        }

        let cancelled = false

        const load = async () => {
            setLoading(true)
            setError("")
            try{
                const [cartResult, meResult, addressResult] = await Promise.allSettled([
                    getCart(),
                    API.get("/user/findMe"),
                    API.get("/user/address"),
                ])
                if(cancelled) return

                if(cartResult.status !== "fulfilled"){
                    throw new Error("cart_failed")
                }

                setCart(cartResult.value)

                if(meResult.status === "fulfilled"){
                    setMe(meResult.value.data)
                }else{
                    setMe(null)
                }

                const addressData = addressResult.status === "fulfilled"
                    ? addressResult.value.data
                    : null

                setForm((prev) => ({
                    ...prev,
                    country: addressData?.country || "Azerbaijan",
                    city: addressData?.city || "",
                    state: addressData?.state || "",
                    address: addressData?.street || "",
                    zipCode: addressData?.zipCode || "",
                }))
            }catch{
                if(cancelled) return
                setError("Failed to load checkout items.")
            }finally{
                if(!cancelled) setLoading(false)
            }
        }

        load()
        return () => { cancelled = true }
    }, [signedIn])

    const items = useMemo(() => {
        const list = Array.isArray(cart?.items) ? cart.items : []
        if(selectedIds.length === 0) return list
        return list.filter((item) => selectedIds.includes(item.productId))
    }, [cart, selectedIds])

    const subtotal = useMemo(() => {
        return items.reduce((sum, item) => sum + (Number(item.lineTotal) || 0), 0)
    }, [items])

    const shipping = subtotal >= 150 || subtotal === 0 ? 0 : 12.9
    const total = subtotal + shipping

    const itemCount = useMemo(() => {
        return items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
    }, [items])

    const onChange = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }))
    }

    const submit = async (e) => {
        e.preventDefault()
        if(items.length === 0){
            setError("There are no selected products for checkout.")
            return
        }

        if(form.paymentMethod === "card"){
            setError("Card payments are not integrated yet. Please use wallet.")
            return
        }

        setSubmitting(true)
        setError("")

        try{
            const result = await checkoutWithWallet({
                productIds: items.map((item) => item.productId),
                address: {
                    street: form.address,
                    city: form.city,
                    state: form.state,
                    country: form.country,
                    zipCode: form.zipCode,
                },
                note: form.note,
            })
            setPlacedSummary(result)
            setMe((prev) => prev ? { ...prev, wallet: result.walletBalance } : prev)
            setCart((prev) => {
                if(!prev) return prev
                const purchasedIds = new Set(items.map((item) => item.productId))
                const remainingItems = (prev.items || []).filter((item) => !purchasedIds.has(item.productId))
                const totalQuantity = remainingItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
                const totalAmount = remainingItems.reduce((sum, item) => sum + (Number(item.lineTotal) || 0), 0)
                return {
                    ...prev,
                    items: remainingItems,
                    totalQuantity,
                    totalAmount,
                }
            })
            notifyCartChanged()
            setPlaced(true)
        }catch(err){
            setError(err?.response?.data?.message || "Checkout failed. Please try again.")
        }finally{
            setSubmitting(false)
        }
    }

    return (
        <div className="mp-shell">
            <header className="mp-topbar">
                <div className="mp-container mp-topbar-inner">
                    <Link className="mp-brand" to="/" aria-label="Go to homepage">
                        <div className="mp-mark" aria-hidden="true" />
                        <div className="mp-brand-name">NovaMart</div>
                    </Link>

                    <div className="mp-searchrow" />

                    <div className="mp-right">
                        <UserMenu />

                        <Link to="/cart" className="mp-cart" aria-label="Cart" style={{ textDecoration: "none" }}>
                            <CartIcon />
                            <span style={{ fontWeight: 700, fontSize: 14, color: "#fff" }}>Cart</span>
                            {cartCount > 0 ? <span className="mp-badge">{cartCount}</span> : null}
                        </Link>
                    </div>
                </div>
            </header>

            <main className="mp-container">
                <div className="pd-breadcrumb" style={{ paddingTop: 12 }}>
                    <Link to="/" className="pd-crumb-link">Home</Link>
                    <span className="pd-sep" aria-hidden="true">/</span>
                    <Link to="/cart" className="pd-crumb-link">Cart</Link>
                    <span className="pd-sep" aria-hidden="true">/</span>
                    <span className="pd-crumb pd-crumb-current">Checkout</span>
                </div>

                {!signedIn ? (
                    <section className="pd-card">
                        <h1 className="pd-title">Checkout</h1>
                        <p className="pd-muted">Authentication required to continue checkout.</p>
                    </section>
                ) : loading ? (
                    <section className="pd-card">
                        <div className="pd-muted">Loading checkout...</div>
                    </section>
                ) : placed ? (
                    <section className="pd-card ck-success">
                        <div className="ck-success-badge">Order placed</div>
                        <h1 className="pd-title">Your order is confirmed.</h1>
                        <p className="pd-muted">
                            {(placedSummary?.itemCount || itemCount)} item for ${Number(placedSummary?.totalAmount ?? total).toFixed(2)} is being prepared. A confirmation email will be sent shortly.
                        </p>
                        <p className="pd-muted">
                            Wallet balance: ${Number(placedSummary?.walletBalance ?? me?.wallet ?? 0).toFixed(2)}
                        </p>
                        <div className="pd-actions">
                            <button className="mp-btn mp-btn-primary" type="button" onClick={() => navigate("/")}>
                                Back to home
                            </button>
                            <button className="mp-btn mp-ghost-link" type="button" onClick={() => navigate("/cart")}>
                                Return to cart
                            </button>
                        </div>
                    </section>
                ) : (
                    <>
                        {error ? (
                            <div className="pd-flash" style={{ background: "#fff2f2", borderColor: "#f1c1c1", color: "#7a0b0b" }}>
                                {error}
                            </div>
                        ) : null}

                        <div className="ck-grid">
                            <form className="ck-panel" onSubmit={submit}>
                                <section className="pd-card ck-section">
                                    <div className="ck-section-head">
                                        <div>
                                            <h1 className="pd-title">Checkout</h1>
                                            <p className="pd-muted">Complete delivery and payment details in one step.</p>
                                        </div>
                                        <div className="ck-step">Secure checkout</div>
                                    </div>

                                    <div className="ck-block">
                                        <div className="ck-section-head ck-linked-head">
                                            <div>
                                                <h2 className="pd-h2">Delivery</h2>
                                                <p className="pd-muted">Address fields are linked to your account address.</p>
                                            </div>
                                            <Link className="mp-btn mp-ghost-link" to="/me">
                                                Edit in account
                                            </Link>
                                        </div>
                                        <div className="ck-form-grid ck-form-grid-2">
                                            <label>
                                                <span>Country</span>
                                                <input required value={form.country} onChange={(e) => onChange("country", e.target.value)} />
                                            </label>
                                            <label>
                                                <span>City</span>
                                                <input required value={form.city} onChange={(e) => onChange("city", e.target.value)} />
                                            </label>
                                            <label>
                                                <span>State</span>
                                                <input value={form.state} onChange={(e) => onChange("state", e.target.value)} />
                                            </label>
                                            <label>
                                                <span>Zip code</span>
                                                <input value={form.zipCode} onChange={(e) => onChange("zipCode", e.target.value)} />
                                            </label>
                                        </div>
                                        <div className="ck-form-grid">
                                            <label>
                                                <span>Address</span>
                                                <input required value={form.address} onChange={(e) => onChange("address", e.target.value)} />
                                            </label>
                                            <label>
                                                <span>Delivery note</span>
                                                <textarea rows="3" value={form.note} onChange={(e) => onChange("note", e.target.value)} />
                                            </label>
                                        </div>
                                        <div className="ck-account-meta">
                                            <div><strong>Name:</strong> {[me?.firstName, me?.lastName].filter(Boolean).join(" ") || me?.username || "-"}</div>
                                            <div><strong>Email:</strong> {me?.email || "-"}</div>
                                            <div><strong>Phone:</strong> {me?.phone || "-"}</div>
                                        </div>
                                    </div>

                                    <div className="ck-block">
                                        <h2 className="pd-h2">Payment</h2>
                                        <div className="ck-payment-switch">
                                            <button
                                                className={`ck-pay-btn ${form.paymentMethod === "card" ? "is-active" : ""}`}
                                                type="button"
                                                onClick={() => onChange("paymentMethod", "card")}
                                            >
                                                Credit Card
                                            </button>
                                            <button
                                                className={`ck-pay-btn ${form.paymentMethod === "wallet" ? "is-active" : ""}`}
                                                type="button"
                                                onClick={() => onChange("paymentMethod", "wallet")}
                                            >
                                                Wallet
                                            </button>
                                        </div>

                                        {form.paymentMethod === "card" ? (
                                            <div className="ck-form-grid">
                                                <label>
                                                    <span>Name on card</span>
                                                    <input required value={form.cardName} onChange={(e) => onChange("cardName", e.target.value)} />
                                                </label>
                                                <label>
                                                    <span>Card number</span>
                                                    <input required inputMode="numeric" value={form.cardNumber} onChange={(e) => onChange("cardNumber", e.target.value)} />
                                                </label>
                                                <div className="ck-form-grid ck-form-grid-2">
                                                    <label>
                                                        <span>Expiry</span>
                                                        <input required placeholder="MM/YY" value={form.expiry} onChange={(e) => onChange("expiry", e.target.value)} />
                                                    </label>
                                                    <label>
                                                        <span>CVC</span>
                                                        <input required inputMode="numeric" value={form.cvc} onChange={(e) => onChange("cvc", e.target.value)} />
                                                    </label>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="ck-cash-note">
                                                Available balance: ${Number(me?.wallet || 0).toFixed(2)}. Checkout will create a purchase transaction and deduct the order total from your wallet.
                                            </div>
                                        )}
                                    </div>

                                    <div className="ck-actions">
                                        <button className="mp-btn mp-ghost-link" type="button" onClick={() => navigate("/cart")}>
                                            Back to cart
                                        </button>
                                        <button className="mp-btn mp-btn-primary" type="submit" disabled={submitting || items.length === 0}>
                                            {submitting ? "Processing..." : `Place order - $${total.toFixed(2)}`}
                                        </button>
                                    </div>
                                </section>
                            </form>

                            <aside className="ck-sidebar">
                                <section className="pd-card ck-section">
                                    <h2 className="pd-h2">Order summary</h2>
                                    <div className="ck-mini-list">
                                        {items.length === 0 ? (
                                            <div className="pd-muted">No selected items.</div>
                                        ) : items.map((item) => (
                                            <article className="ck-mini-item" key={item.productId}>
                                                <div className="ck-mini-img">
                                                    {item.imagePath ? <img src={resolveMediaUrl(item.imagePath)} alt={item.name} /> : null}
                                                </div>
                                                <div className="ck-mini-copy">
                                                    <div className="ck-mini-name">{item.name}</div>
                                                    <div className="pd-muted">Qty {item.quantity}</div>
                                                </div>
                                                <div className="ck-mini-price">${Number(item.lineTotal || 0).toFixed(2)}</div>
                                            </article>
                                        ))}
                                    </div>

                                    <div className="ck-summary">
                                        <div className="ct-sum-row">
                                            <span className="pd-muted">Items</span>
                                            <b>{itemCount}</b>
                                        </div>
                                        <div className="ct-sum-row">
                                            <span className="pd-muted">Subtotal</span>
                                            <b>${subtotal.toFixed(2)}</b>
                                        </div>
                                        <div className="ct-sum-row">
                                            <span className="pd-muted">Shipping</span>
                                            <b>{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</b>
                                        </div>
                                        <div className="ck-total-row">
                                            <span>Total</span>
                                            <strong>${total.toFixed(2)}</strong>
                                        </div>
                                    </div>
                                </section>
                            </aside>
                        </div>
                    </>
                )}

                <footer className="mp-footer">
                    <div className="mp-footer-row">
                        <div>NovaMart. Built for your e-commerce MVP.</div>
                    </div>
                </footer>
            </main>
        </div>
    )
}

export default Checkout
