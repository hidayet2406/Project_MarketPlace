import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { Link, useNavigate } from "react-router-dom"
import "../styles/main.css"
import API from "../api/api"
import UserMenu from "../components/UserMenu"
import useCartCount from "../hooks/useCartCount"
import { notifyAuthChanged } from "../utils/authEvents"
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

function InfoRow({ label, value }){
    return (
        <div className="ud-row">
            <div className="ud-label">{label}</div>
            <div className="ud-value">{value || "-"}</div>
        </div>
    )
}

function RemoveProductDialog({ open, productName, onCancel, onConfirm, loading }){
    if(!open || typeof document === "undefined") return null

    return createPortal(
        <div
            className="mp-modal-backdrop"
            role="presentation"
            onMouseDown={(event) => {
                if(event.target === event.currentTarget) onCancel()
            }}
        >
            <div className="mp-modal mp-modal-center" role="dialog" aria-modal="true" aria-label="Remove product confirmation">
                <div className="mp-modal-title">Remove product</div>
                <div className="mp-modal-text">
                    {productName ? `Do you want to remove ${productName} from your shop?` : "Do you want to remove this product from your shop?"}
                </div>
                <div className="mp-modal-actions">
                    <button className="mp-btn mp-ghost-link" type="button" onClick={onCancel} disabled={loading}>
                        Cancel
                    </button>
                    <button className="mp-btn mp-remove-btn" type="button" onClick={onConfirm} disabled={loading}>
                        {loading ? "Removing..." : "Remove"}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    )
}

function ShopPanel(){
    const navigate = useNavigate()
    const cartCount = useCartCount()

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [flash, setFlash] = useState("")
    const [shop, setShop] = useState(null)
    const [vendorRequest, setVendorRequest] = useState(null)
    const [products, setProducts] = useState([])
    const [deletingId, setDeletingId] = useState(null)
    const [removeTarget, setRemoveTarget] = useState(null)

    useEffect(() => {
        let cancelled = false

        const load = async () => {
            setLoading(true)
            setError("")
            try{
                const [shopRes, vendorRes, productsRes] = await Promise.all([
                    API.get("/shop/my"),
                    API.get("/user/vendor"),
                    API.get("/shop/products")
                ])

                if(cancelled) return

                setShop(shopRes.data || null)
                setVendorRequest(vendorRes.data || null)
                setProducts(Array.isArray(productsRes.data) ? productsRes.data : [])
            }catch(err){
                if(err?.response?.status === 401){
                    localStorage.removeItem("token")
                    notifyAuthChanged()
                    if(!cancelled) setError("Authentication required.")
                    return
                }
                if(!cancelled) setError("Failed to load shop panel.")
            }finally{
                if(!cancelled) setLoading(false)
            }
        }

        load()
        return () => { cancelled = true }
    }, [])

    useEffect(() => {
        if(!removeTarget) return undefined

        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = "hidden"

        return () => {
            document.body.style.overflow = previousOverflow
        }
    }, [removeTarget])

    const approved = vendorRequest?.status === "APPROVED"

    const handleDeleteProduct = async (productId) => {
        if(deletingId) return

        setDeletingId(productId)
        setFlash("")

        try{
            await API.delete(`/shop/products/${productId}`)
            setProducts((current) => current.filter((item) => item.id !== productId))
            setFlash("Product removed.")
            setRemoveTarget(null)
        }catch(err){
            const message = err?.response?.data?.message || err?.response?.data || "Failed to remove product."
            setFlash(String(message))
        }finally{
            setDeletingId(null)
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
                <nav className="pd-breadcrumb" aria-label="Breadcrumb" style={{ paddingTop: 12 }}>
                    <Link to="/" className="pd-crumb-link">Home</Link>
                    <span className="pd-sep" aria-hidden="true">/</span>
                    <Link to="/me" className="pd-crumb-link">Account</Link>
                    <span className="pd-sep" aria-hidden="true">/</span>
                    <span className="pd-crumb pd-crumb-current">Shop panel</span>
                </nav>

                {loading ? (
                    <section className="pd-card">
                        <div className="pd-muted">Loading...</div>
                    </section>
                ) : error ? (
                    <div className="pd-flash" style={{ background: "#fff2f2", borderColor: "#f1c1c1", color: "#7a0b0b" }}>
                        {error}
                    </div>
                ) : !approved ? (
                    <section className="pd-card">
                        <h1 className="pd-title">Shop panel</h1>
                        <p className="pd-muted">Your vendor request must be approved first.</p>
                    </section>
                ) : !shop?.name ? (
                    <section className="pd-card">
                        <h1 className="pd-title">Shop panel</h1>
                        <p className="pd-muted">You have not created a shop yet.</p>
                        <div className="pd-actions" style={{ marginTop: 12 }}>
                            <button className="mp-btn mp-btn-primary" type="button" onClick={() => navigate("/shop/create")}>
                                Create shop
                            </button>
                        </div>
                    </section>
                ) : (
                    <>
                        <section className="pd-card">
                            <div className="ud-head">
                                <h1 className="pd-title" style={{ fontSize: 22 }}>{shop.name}</h1>
                            </div>

                            <div className="ud-grid">
                                <InfoRow label="Shop name" value={shop.name} />
                                <InfoRow label="Slug" value={shop.slug} />
                                <InfoRow label="Status" value={shop.status} />
                                <InfoRow label="Description" value={shop.description} />
                            </div>
                        </section>

                        <section className="pd-card">
                            <div className="ud-head">
                                <h2 className="pd-title" style={{ fontSize: 18 }}>Products</h2>
                                <div className="pd-muted">Products currently attached to this shop.</div>
                            </div>

                            
    {flash ? <div className="pd-flash" style={flash.toLowerCase().includes("failed") || flash.toLowerCase().includes("please") ? { background: "#fff2f2", borderColor: "#f1c1c1", color: "#7a0b0b", marginBottom: 10 } : { marginBottom: 10 }}>{flash}</div> : null}
                            <div className="pd-actions" style={{ marginBottom: 12 }}>
                                <button className="mp-btn mp-btn-primary" type="button" onClick={() => navigate("/shop/products/new")}>
                                    Add product
                                </button>
                            </div>

                            {products.length === 0 ? (
                                <div className="pd-muted">No products yet.</div>
                            ) : (
                                <div style={{ display: "grid", gap: 10 }}>
                                    {products.map((product) => (
                                        <div key={product.id} className="ud-row">
                                            <div style={{ display: "grid", gridTemplateColumns: "84px 1fr auto", gap: 12, alignItems: "center" }}>
                                                <div style={{ width: 84, height: 84, borderRadius: 8, overflow: "hidden", border: "1px solid #d5d9d9", background: "#f3f3f3" }}>
                                                    {product?.imagePath ? (
                                                        <img
                                                            src={resolveMediaUrl(product.imagePath)}
                                                            alt={product.name}
                                                            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                                                        />
                                                    ) : null}
                                                </div>
                                                <div style={{ display: "grid", gap: 6 }}>
                                                    <div className="ud-value">{product.name}</div>
                                                    <div className="pd-muted">{product.description || "-"}</div>
                                                    <div className="pd-muted">
                                                        Category: <b>{product?.category?.name || "-"}</b>
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: "right", display: "grid", gap: 6 }}>
                                                    <div className="ud-value">${Number(product.price || 0).toFixed(2)}</div>
                                                    <div className="pd-muted">Stock: {product.stock ?? "-"}</div>
                                                    <button className="mp-btn mp-ghost-link" type="button" onClick={() => navigate(`/product/${product.id}`)}>
                                                        Open
                                                    </button>
                                                    <button
                                                        className="mp-btn mp-remove-btn"
                                                        type="button"
                                                        onClick={() => setRemoveTarget(product)}
                                                        disabled={deletingId === product.id}
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </>
                )}
            </main>

            <RemoveProductDialog
                open={!!removeTarget}
                productName={removeTarget?.name}
                loading={deletingId === removeTarget?.id}
                onCancel={() => {
                    if(deletingId) return
                    setRemoveTarget(null)
                }}
                onConfirm={() => {
                    if(!removeTarget?.id) return
                    handleDeleteProduct(removeTarget.id)
                }}
            />
        </div>
    )
}

export default ShopPanel

