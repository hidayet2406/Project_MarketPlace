import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import "../styles/main.css"
import API from "../api/api"
import UserMenu from "../components/UserMenu"
import useCartCount from "../hooks/useCartCount"
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

function ShopDetail(){
    const { slug } = useParams()
    const navigate = useNavigate()
    const cartCount = useCartCount()

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [shop, setShop] = useState(null)
    const [products, setProducts] = useState([])

    useEffect(() => {
        let cancelled = false

        const load = async () => {
            setLoading(true)
            setError("")
            try{
                const [shopRes, productsRes] = await Promise.all([
                    API.get(`/shop/${slug}`),
                    API.get(`/shop/${slug}/products`)
                ])

                if(cancelled) return

                setShop(shopRes.data || null)
                setProducts(Array.isArray(productsRes.data) ? productsRes.data : [])
            }catch{
                if(cancelled) return
                setError("Failed to load shop.")
                setShop(null)
                setProducts([])
            }finally{
                if(!cancelled) setLoading(false)
            }
        }

        load()
        return () => { cancelled = true }
    }, [slug])

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
                    <span className="pd-crumb pd-crumb-current">{shop?.name || "Shop"}</span>
                </nav>

                {loading ? (
                    <section className="pd-card">
                        <div className="pd-muted">Loading...</div>
                    </section>
                ) : !shop ? (
                    <section className="pd-card">
                        <h1 className="pd-title">Shop not found</h1>
                        <p className="pd-muted">{error || "This shop does not exist."}</p>
                    </section>
                ) : (
                    <>
                        <section className="pd-card">
                            <div className="ud-head">
                                <h1 className="pd-title" style={{ fontSize: 22 }}>{shop.name}</h1>
                            </div>

                            <div className="ud-grid">
                                <div className="ud-row">
                                    <div className="ud-label">Shop</div>
                                    <div className="ud-value">{shop.name}</div>
                                </div>
                                <div className="ud-row">
                                    <div className="ud-label">Slug</div>
                                    <div className="ud-value">{shop.slug}</div>
                                </div>
                                <div className="ud-row">
                                    <div className="ud-label">Status</div>
                                    <div className="ud-value">{shop.status || "-"}</div>
                                </div>
                                <div className="ud-row">
                                    <div className="ud-label">Description</div>
                                    <div className="ud-value">{shop.description || "-"}</div>
                                </div>
                            </div>
                        </section>

                        <section className="pd-card">
                            <div className="ud-head">
                                <h2 className="pd-title" style={{ fontSize: 18 }}>Products</h2>
                                <div className="pd-muted">{products.length} item{products.length === 1 ? "" : "s"} in this shop.</div>
                            </div>

                            {products.length === 0 ? (
                                <div className="pd-muted">No products yet.</div>
                            ) : (
                                <div className="mp-products">
                                    {products.map((product) => (
                                        <article className="mp-card" key={product.id}>
                                            <button
                                                className="mp-img"
                                                type="button"
                                                onClick={() => navigate(`/product/${product.id}`)}
                                                aria-label={`Open ${product.name}`}
                                            >
                                                <div className="mp-pill">{product?.category?.name || "Product"}</div>
                                                {product?.imagePath ? <img className="mp-img-el" src={resolveMediaUrl(product.imagePath)} alt={product.name} /> : null}
                                            </button>
                                            <div className="mp-card-body">
                                                <h3 className="mp-title">
                                                    <button className="mp-title-btn" type="button" onClick={() => navigate(`/product/${product.id}`)}>
                                                        {product.name}
                                                    </button>
                                                </h3>
                                                <div className="mp-meta">
                                                    <div className="mp-price">${Number(product.price || 0).toFixed(2)}</div>
                                                    <div className="mp-rating">Stock {product.stock ?? "-"}</div>
                                                </div>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </section>
                    </>
                )}
            </main>
        </div>
    )
}

export default ShopDetail
