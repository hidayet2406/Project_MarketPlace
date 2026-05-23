import { useEffect, useMemo, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import "../styles/main.css"
import { getCart, removeCartItem, setCartItem } from "../api/cart"
import { notifyCartChanged, subscribeToCartChanged } from "../utils/cartEvents"
import { notifyAuthChanged } from "../utils/authEvents"
import useCartCount from "../hooks/useCartCount"
import UserMenu from "../components/UserMenu"
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

function Cart(){

    const navigate = useNavigate()
    const cartCount = useCartCount()

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [cart, setCart] = useState(null)
    const [busyId, setBusyId] = useState(null)
    const [selectedIds, setSelectedIds] = useState([])
    const didInitSelection = useRef(false)

    const signedIn = Boolean(localStorage.getItem("token"))

    const items = useMemo(() => {
        const list = cart?.items
        return Array.isArray(list) ? list : []
    }, [cart])

    // Select all only once on the first successful cart load.
    // After that, preserve user choice and only drop ids that no longer exist.
    useEffect(() => {
        if(items.length === 0){
            setSelectedIds([])
            didInitSelection.current = false
            return
        }

        const itemIds = items.map((it) => it.productId)

        if(!didInitSelection.current){
            setSelectedIds(itemIds)
            didInitSelection.current = true
            return
        }

        setSelectedIds((prev) => prev.filter((id) => itemIds.includes(id)))
    }, [items])

    const selectedItems = useMemo(() => {
        return items.filter(it => selectedIds.includes(it.productId))
    }, [items, selectedIds])

    const totalSelectedAmount = useMemo(() => {
        return selectedItems.reduce((sum, it) => sum + (Number(it.lineTotal) || 0), 0)
    }, [selectedItems])

    const totalSelectedQuantity = useMemo(() => {
        return selectedItems.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0)
    }, [selectedItems])

    const load = async () => {
        setLoading(true)
        setError("")
        try{
            const data = await getCart()
            setCart(data)
        }catch(err){
            const status = err?.response?.status
            if(status === 401){
                localStorage.removeItem("token")
                notifyAuthChanged()
                setCart(null)
                return
            }
            setError("Failed to load cart.")
        }finally{
            setLoading(false)
        }
    }

    useEffect(() => {
        if(!signedIn){
            setLoading(false)
            setCart(null)
            return
        }
        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        const unsub = subscribeToCartChanged(() => {
            if(signedIn) load()
        })
        return () => unsub()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const changeQty = async (productId, nextQty) => {
        if(!signedIn){
            alert("Authentication required.")
            return
        }
        setBusyId(productId)
        try{
            const data = await setCartItem(productId, nextQty)
            setCart(data)
            notifyCartChanged()
        }catch(err){
            const msg = err?.response?.data?.message || err?.response?.data || "Update failed"
            alert(msg)
            await load()
        }finally{
            setBusyId(null)
        }
    }

    const remove = async (productId) => {
        setBusyId(productId)
        try{
            const data = await removeCartItem(productId)
            setCart(data)
            notifyCartChanged()
            setSelectedIds(prev => prev.filter(id => id !== productId))
        }catch(err){
            const status = err?.response?.status
            const msg =
                err?.response?.data?.message ||
                err?.response?.data ||
                err?.message ||
                "Remove failed"
            alert(status ? `Remove failed (${status}): ${msg}` : `Remove failed: ${msg}`)
            await load()
        }finally{
            setBusyId(null)
        }
    }

    const toggleSelect = (productId) => {
        setSelectedIds(prev => 
            prev.includes(productId) 
                ? prev.filter(id => id !== productId) 
                : [...prev, productId]
        )
    }

    const toggleAll = () => {
        if(selectedIds.length === items.length){
            setSelectedIds([])
        } else {
            setSelectedIds(items.map(it => it.productId))
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
                    <span className="pd-crumb pd-crumb-current">Cart</span>
                </div>

                {!signedIn ? (
                    <section className="pd-card">
                        <h1 className="pd-title">Your cart</h1>
                        <p className="pd-muted">Authentication required to view your cart.</p>
                    </section>
                ) : loading ? (
                    <section className="pd-card">
                        <div className="pd-muted">Loading...</div>
                    </section>
                ) : (
                    <>
                        {error ? (
                            <div className="pd-flash" style={{ background: "#fff2f2", borderColor: "#f1c1c1", color: "#7a0b0b" }}>
                                {error}
                            </div>
                        ) : null}

                        <section className="ct-grid">
                            <div className="ct-left">
                                <div className="pd-card">
                                    <div className="ct-head">
                                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                            {items.length > 0 && (
                                                <input 
                                                    className="ct-check"
                                                    type="checkbox" 
                                                    checked={selectedIds.length === items.length}
                                                    onChange={toggleAll}
                                                />
                                            )}
                                            <h1 className="pd-title" style={{ fontSize: 20, margin: 0 }}>Your cart</h1>
                                        </div>
                                        <div className="pd-muted">{items.length} item{items.length === 1 ? "" : "s"}</div>
                                    </div>

                                    {items.length === 0 ? (
                                        <div className="ct-empty">
                                            <div className="pd-muted">Your cart is empty.</div>
                                            <button className="mp-btn mp-btn-primary" type="button" onClick={() => navigate("/")}>Continue shopping</button>
                                        </div>
                                    ) : (
                                        <div className="ct-list">
                                            {items.map((it) => (
                                                <article className="ct-item" key={it.productId} style={{ gridTemplateColumns: "30px 92px 1fr" }}>
                                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                        <input 
                                                            className="ct-check"
                                                            type="checkbox" 
                                                            checked={selectedIds.includes(it.productId)}
                                                            onChange={() => toggleSelect(it.productId)}
                                                        />
                                                    </div>
                                                    <div className="ct-img">
                                                        {it.imagePath ? <img src={resolveMediaUrl(it.imagePath)} alt={it.name} /> : null}
                                                    </div>
                                                    <div className="ct-main">
                                                        <div className="ct-top">
                                                            <div className="ct-name">{it.name}</div>
                                                            <div className="ct-price">${Number(it.price || 0).toFixed(2)}</div>
                                                        </div>
                                                        <div className="ct-actions">
                                                            <div className="pd-qty" aria-label="Quantity">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => changeQty(it.productId, Math.max(0, (it.quantity || 0) - 1))}
                                                                    disabled={busyId === it.productId || (it.quantity || 0) <= 1}
                                                                >
                                                                    -
                                                                </button>
                                                                <input
                                                                    value={it.quantity || 1}
                                                                    onChange={(e) => {
                                                                        const n = Number(e.target.value)
                                                                        const v = Number.isFinite(n) ? n : 1
                                                                        changeQty(it.productId, Math.max(0, Math.floor(v)))
                                                                    }}
                                                                    inputMode="numeric"
                                                                    aria-label="Quantity input"
                                                                    disabled={busyId === it.productId}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => changeQty(it.productId, (it.quantity || 0) + 1)}
                                                                    disabled={busyId === it.productId}
                                                                >
                                                                    +
                                                                </button>
                                                            </div>

                                                            <button
                                                                className="ct-remove"
                                                                type="button"
                                                                onClick={() => remove(it.productId)}
                                                                disabled={busyId === it.productId}
                                                            >
                                                                Remove
                                                            </button>

                                                            <div className="ct-line">
                                                                Line: <b>${Number(it.lineTotal || 0).toFixed(2)}</b>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </article>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <aside className="ct-right">
                                <div className="pd-card">
                                    <h2 className="pd-h2">Summary</h2>
                                    <div className="ct-sum-row">
                                        <span className="pd-muted">Selected Items</span>
                                        <b>{totalSelectedQuantity}</b>
                                    </div>
                                    <div className="ct-sum-row">
                                        <span className="pd-muted">Total</span>
                                        <b>${totalSelectedAmount.toFixed(2)}</b>
                                    </div>
                                    <button
                                        className="mp-btn mp-btn-primary ct-checkout"
                                        type="button"
                                        onClick={() => navigate("/checkout", { state: { selectedIds } })}
                                        disabled={selectedIds.length === 0}
                                    >
                                        Checkout ({selectedIds.length})
                                    </button>
                                    <button className="mp-btn mp-ghost-link ct-continue" type="button" onClick={() => navigate("/")}>
                                        Continue shopping
                                    </button>
                                </div>
                            </aside>
                        </section>
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

export default Cart
