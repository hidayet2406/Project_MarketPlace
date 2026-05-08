import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import API from "../api/api"
import AdminLayout from "../components/AdminLayout"
import { notifyAuthChanged } from "../utils/authEvents"

export default function AdminProducts(){
    const navigate = useNavigate()
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [message, setMessage] = useState("")
    const [query, setQuery] = useState("")
    const [shopFilter, setShopFilter] = useState("ALL")
    const [shopMenuOpen, setShopMenuOpen] = useState(false)
    const [deletingId, setDeletingId] = useState(null)
    const shopMenuRef = useRef(null)

    const loadProducts = async () => {
        setLoading(true)
        setError("")
        try{
            const res = await API.get("/admin/products")
            setProducts(Array.isArray(res.data) ? res.data : [])
        }catch(err){
            if(err?.response?.status === 401){
                localStorage.removeItem("token")
                notifyAuthChanged()
            }
            setError("Failed to load products.")
        }finally{
            setLoading(false)
        }
    }

    useEffect(() => {
        loadProducts()
    }, [])

    useEffect(() => {
        const handlePointerDown = (event) => {
            if(!shopMenuRef.current) return
            if(!shopMenuRef.current.contains(event.target)) setShopMenuOpen(false)
        }

        const handleKeyDown = (event) => {
            if(event.key === "Escape") setShopMenuOpen(false)
        }

        document.addEventListener("pointerdown", handlePointerDown)
        document.addEventListener("keydown", handleKeyDown)
        return () => {
            document.removeEventListener("pointerdown", handlePointerDown)
            document.removeEventListener("keydown", handleKeyDown)
        }
    }, [])

    const shops = useMemo(() => {
        return ["ALL", ...new Set(products.map((product) => product?.shop?.name).filter(Boolean))]
    }, [products])

    const filteredProducts = useMemo(() => {
        const q = query.trim().toLowerCase()
        return products.filter((product) => {
            if(shopFilter !== "ALL" && product?.shop?.name !== shopFilter) return false
            if(!q) return true
            const haystack = [
                product?.name,
                product?.description,
                product?.category?.name,
                product?.shop?.name
            ].join(" ").toLowerCase()
            return haystack.includes(q)
        })
    }, [products, query, shopFilter])

    const handleDeleteProduct = async (productId) => {
        if(deletingId) return
        setDeletingId(productId)
        setMessage("")
        try{
            await API.delete(`/admin/products/${productId}`)
            setProducts((current) => current.filter((item) => item.id !== productId))
            setMessage("Product deleted.")
        }catch{
            setMessage("Failed to delete product.")
        }finally{
            setDeletingId(null)
        }
    }

    return (
        <AdminLayout title="Products" subtitle="Inspect all products, filter by shop, open details, or remove them.">
            <section className="ad-panel">
                <div className="ad-toolbar">
                    <label className="ad-search">
                        <span>Search</span>
                        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Product, category, shop..." />
                    </label>

                    <label className="ad-select">
                        <span>Shop</span>
                        <div className={`ad-dropdown ${shopMenuOpen ? "is-open" : ""}`} ref={shopMenuRef}>
                            <button
                                className="ad-dropdown-trigger"
                                type="button"
                                aria-haspopup="menu"
                                aria-expanded={shopMenuOpen}
                                onClick={() => setShopMenuOpen((current) => !current)}
                            >
                                <span>{shopFilter}</span>
                            </button>

                            <div className="ad-dropdown-menu" role="menu" aria-label="Product shop filter">
                                {shops.map((shop) => (
                                    <button
                                        key={shop}
                                        className="ad-dropdown-item"
                                        type="button"
                                        role="menuitemradio"
                                        aria-checked={shopFilter === shop}
                                        data-active={shopFilter === shop}
                                        onClick={() => {
                                            setShopFilter(shop)
                                            setShopMenuOpen(false)
                                        }}
                                    >
                                        {shop}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </label>
                </div>

                {error ? <div className="pd-flash" style={{ background: "#fff2f2", borderColor: "#f1c1c1", color: "#7a0b0b" }}>{error}</div> : null}
                
    {message ? <div className="pd-flash" style={message.toLowerCase().includes("failed") ? { background: "#fff2f2", borderColor: "#f1c1c1", color: "#7a0b0b" } : undefined}>{message}</div> : null}

                <div className="ad-results">
                    <div className="ad-results-count">
                        {loading ? "Loading products..." : `${filteredProducts.length} product${filteredProducts.length === 1 ? "" : "s"} found`}
                    </div>
                </div>

                <div className="ad-list">
                    {loading ? (
                        <div className="pd-muted">Loading...</div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="pd-muted">No products match the current filter.</div>
                    ) : (
                        filteredProducts.map((product) => (
                            <article key={product.id} className="ad-list-card">
                                <div className="ad-list-main">
                                    <div className="ad-list-title">{product.name || "-"}</div>
                                    <div className="ad-list-meta">Shop: {product?.shop?.name || "-"}</div>
                                    <div className="ad-list-meta">Category: {product?.category?.name || "-"}</div>
                                    <div className="ad-list-meta">{product.description || "No description"}</div>
                                </div>
                                <div className="ad-list-side">
                                    <div className="ad-pill">${Number(product?.price || 0).toFixed(2)}</div>
                                    <div className="ad-list-meta">Stock: {product?.stock ?? "-"}</div>
                                    <div className="ad-status-row">
                                        <button className="mp-btn mp-ghost-link" type="button" onClick={() => navigate(`/product/${product.id}`)}>
                                            Open
                                        </button>
                                        <button
                                            className="mp-btn mp-remove-btn"
                                            type="button"
                                            onClick={() => handleDeleteProduct(product.id)}
                                            disabled={deletingId === product.id}
                                        >
                                            {deletingId === product.id ? "Deleting..." : "Delete"}
                                        </button>
                                    </div>
                                </div>
                            </article>
                        ))
                    )}
                </div>
            </section>
        </AdminLayout>
    )
}

