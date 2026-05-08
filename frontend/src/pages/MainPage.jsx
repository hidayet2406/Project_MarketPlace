import { useEffect, useMemo, useRef, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import "../styles/main.css"
import { getAllProducts } from "../api/products"
import { getCategories } from "../api/categories"
import useCartCount from "../hooks/useCartCount"
import UserMenu from "../components/UserMenu"
import { resolveMediaUrl } from "../utils/resolveMediaUrl"

function MagnifierIcon(props){
    return (
        <svg className="mp-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
            <path d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" stroke="currentColor" strokeWidth="2" opacity="0.95"/>
            <path d="M16.2 16.2 21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
    )
}

function CartIcon(props){
    return (
        <svg className="mp-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
            <path d="M7 8h15l-1.5 8.5a2 2 0 0 1-2 1.5H9a2 2 0 0 1-2-1.7L5.4 4.5A1.8 1.8 0 0 0 3.6 3H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M9.5 22a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" fill="currentColor" opacity="0.85"/>
            <path d="M18.5 22a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" fill="currentColor" opacity="0.85"/>
        </svg>
    )
}

function MainPage(){

    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const cartCount = useCartCount()
    const catMenuRef = useRef(null)

    const [activeCategory, setActiveCategory] = useState("all")
    const [query, setQuery] = useState("")
    const [email, setEmail] = useState("")

    const [categories, setCategories] = useState([])
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [catOpen, setCatOpen] = useState(false)

    // Support deep links like "/?category=Men" (used by ProductDetail breadcrumb).
    useEffect(() => {
        const c = (searchParams.get("category") || "").trim()
        const q = (searchParams.get("q") || "").trim()
        if(c) setActiveCategory(c)
        if(q) setQuery(q)

    }, [searchParams])

    const visibleProducts = useMemo(() => {
        const q = query.trim().toLowerCase()
        return products.filter((p) => {
            const categoryName = p?.category?.name || ""
            if(activeCategory !== "all" && categoryName !== activeCategory) return false
            if(!q) return true
            const name = (p?.name || "").toLowerCase()
            const desc = (p?.description || "").toLowerCase()
            return name.includes(q) || desc.includes(q)
        })
    }, [activeCategory, query, products])

    useEffect(() => {
        let cancelled = false

        const load = async () => {
            setLoading(true)
            setError("")
            try{
                const [cats, prods] = await Promise.all([
                    getCategories(),
                    getAllProducts(),
                ])
                if(cancelled) return

                setCategories(Array.isArray(cats) ? cats : [])
                setProducts(Array.isArray(prods) ? prods : [])
            }catch{
                if(cancelled) return
                setError("Failed to load products. Is the backend running on http://localhost:8080 ?")
            }finally{
                if(!cancelled) setLoading(false)
            }
        }

        load()
        return () => { cancelled = true }
    }, [searchParams])

    useEffect(() => {
        const onDocMouseDown = (e) => {
            if(!catMenuRef.current) return
            if(!catMenuRef.current.contains(e.target)){
                setCatOpen(false)
            }
        }

        const onKeyDown = (e) => {
            if(e.key === "Escape") setCatOpen(false)
        }

        document.addEventListener("mousedown", onDocMouseDown)
        document.addEventListener("keydown", onKeyDown)
        return () => {
            document.removeEventListener("mousedown", onDocMouseDown)
            document.removeEventListener("keydown", onKeyDown)
        }
    }, [searchParams])

    const clearFilters = () => {
        setActiveCategory("all")
        setQuery("")
    }

    const onNewsletterSubmit = (e) => {
        e.preventDefault()
        const value = email.trim()
        if(!value || !value.includes("@")){
            alert("Please enter a valid email.")
            return
        }
        alert("Thanks! You'll hear from us soon.")
        setEmail("")
    }

    return (
        <div className="mp-shell">
            <div className="mp-grid-noise" aria-hidden="true" />

            <header className="mp-topbar">
                <div className="mp-container mp-topbar-inner">
                    <Link className="mp-brand" to="/" aria-label="Go to homepage">
                        <div className="mp-mark" aria-hidden="true" />
                        <div className="mp-brand-name">NovaMart</div>
                    </Link>

                    <div className="mp-searchrow">
                        <div
                            className={`mp-catmenu ${catOpen ? "is-open" : ""}`}
                            ref={catMenuRef}
                        >
                            <button
                                className="mp-chip mp-catmenu-btn"
                                type="button"
                                aria-haspopup="menu"
                                aria-expanded={catOpen}
                                onClick={() => setCatOpen((v) => !v)}
                            >
                                <span className="mp-hamb" aria-hidden="true">
                                    <span />
                                    <span />
                                    <span />
                                </span>
                                <span className="mp-catmenu-label">
                                    {activeCategory === "all" ? "All" : (activeCategory || "All")}
                                </span>
                            </button>

                            <div className="mp-catmenu-pop" role="menu">
                                    <button
                                        className="mp-catmenu-item"
                                        type="button"
                                        role="menuitem"
                                        data-active={activeCategory === "all"}
                                        onClick={() => { setActiveCategory("all"); setCatOpen(false) }}
                                    >
                                        All
                                    </button>
                                    {categories.map((c) => (
                                        <button
                                            key={c.id}
                                            className="mp-catmenu-item"
                                            type="button"
                                            role="menuitem"
                                            data-active={activeCategory === c.name}
                                            onClick={() => { setActiveCategory(c.name); setCatOpen(false) }}
                                        >
                                            {c.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                        <div className="mp-search" role="search">
                            <MagnifierIcon />
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search products..."
                                aria-label="Search products"
                            />
                        </div>
                    </div>

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
                <section className="mp-hero">
                    <div className="mp-hero-card">
                        <div className="mp-hero-grid">
                            <div>
                                <div className="mp-kicker mp-fade" data-delay="1">
                                    <span className="mp-kicker-badge">Spring '26</span>
                                    <span>Fresh essentials, fast shipping.</span>
                                </div>

                                <h1 className="mp-h1 mp-fade" data-delay="2">
                                    Shop the <span>clean</span> look. Keep the <span>bold</span> feel.
                                </h1>

                                <p className="mp-lede mp-fade" data-delay="3">
                                    Curated drops for everyday life: apparel, home, and small upgrades that look expensive without trying.
                                </p>

                                <div className="mp-cta mp-fade" data-delay="3">
                                    <button
                                        className="mp-btn mp-btn-primary"
                                        type="button"
                                        onClick={() => {
                                            const c = categories.find((x) => String(x?.name || "").toLowerCase().includes("new"))
                                            setActiveCategory(c?.name || "all")
                                        }}
                                    >
                                        Explore new arrivals
                                    </button>
                                    <button
                                        className="mp-btn mp-btn-ghost"
                                        type="button"
                                        onClick={() => {
                                            const c = categories.find((x) => String(x?.name || "").toLowerCase().includes("sale"))
                                            setActiveCategory(c?.name || "all")
                                        }}
                                    >
                                        Browse sale
                                    </button>
                                    {(activeCategory !== "all" || query) ? (
                                        <button className="mp-btn mp-btn-ghost" type="button" onClick={clearFilters}>
                                            Clear filters
                                        </button>
                                    ) : null}
                                </div>
                            </div>

                            <div className="mp-hero-art" aria-hidden="true" />
                        </div>
                    </div>
                </section>

                <section className="mp-features">
                    <div className="mp-feature-row">
                        <div className="mp-feature">
                            <p className="mp-feature-title">Free shipping over $75</p>
                            <p className="mp-feature-desc">Trackable delivery and protective packaging on every order.</p>
                        </div>
                        <div className="mp-feature">
                            <p className="mp-feature-title">30-day returns</p>
                            <p className="mp-feature-desc">Try it at home. If it is not right, send it back.</p>
                        </div>
                        <div className="mp-feature">
                            <p className="mp-feature-title">Secure checkout</p>
                            <p className="mp-feature-desc">Token-based auth is ready. Payments can be wired next.</p>
                        </div>
                    </div>
                </section>

                <section className="mp-section">
                    <div className="mp-section-head">
                        <div>
                            <h2 className="mp-h2">Trending products</h2>
                            <p className="mp-sub">
                                {visibleProducts.length} item{visibleProducts.length === 1 ? "" : "s"} found
                                {activeCategory !== "all" ? ` in "${activeCategory}"` : ""}
                                {query ? ` for "${query}"` : ""}.
                            </p>
                        </div>
                    </div>

                    {error ? <div className="pd-flash" style={{ background: "#fff2f2", borderColor: "#f1c1c1", color: "#7a0b0b" }}>{error}</div> : null}

                    <div className="mp-products" aria-live="polite">
                        {loading ? (
                            <div className="pd-muted">Loading...</div>
                        ) : visibleProducts.map((p) => (
                            <article className="mp-card" key={p.id}>
                                <button
                                    className="mp-img"
                                    data-tone="cool"
                                    type="button"
                                    onClick={() => navigate(`/product/${p.id}`)}
                                    aria-label={`Open ${p.name}`}
                                >
                                    <div className="mp-pill">{p?.category?.name || "Product"}</div>
                                    {p?.imagePath ? <img className="mp-img-el" src={resolveMediaUrl(p.imagePath)} alt={p.name} /> : null}
                                </button>
                                <div className="mp-card-body">
                                    <h3 className="mp-title">
                                        <button className="mp-title-btn" type="button" onClick={() => navigate(`/product/${p.id}`)}>
                                            {p.name}
                                        </button>
                                    </h3>
                                    <div className="mp-meta">
                                        <div className="mp-price">${Number(p.price || 0).toFixed(2)}</div>
                                        <div className="mp-rating">{p.stock != null ? `Stock ${p.stock}` : ""}</div>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="mp-section">
                    <div className="mp-news">
                        <div>
                            <h3>Get early access</h3>
                            <p>Drop alerts, small discounts, and new category launches.</p>
                        </div>
                        <form onSubmit={onNewsletterSubmit}>
                            <input
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                aria-label="Email address"
                            />
                            <button className="mp-btn mp-btn-primary" type="submit">Subscribe</button>
                        </form>
                    </div>
                </section>

            </main>

            <footer className="mp-footer mp-home-footer">
                <div className="mp-home-footer-inner">
                    <div className="mp-home-footer-top">
                        <div className="mp-home-footer-brand">
                            <div className="mp-home-footer-mark" aria-hidden="true" />
                            <div>
                                <div className="mp-home-footer-title">NovaMart</div>
                                <p className="mp-home-footer-text">
                                    Clean shopping, trusted vendors, and a storefront that stays easy to use.
                                </p>
                            </div>
                        </div>

                        <div className="mp-home-footer-grid">
                            <div className="mp-home-footer-col">
                                <h4>Shop</h4>
                                <Link to="/">Home</Link>
                                <button type="button" onClick={() => setActiveCategory("all")}>All products</button>
                                <button type="button" onClick={() => setQuery("")}>Fresh picks</button>
                            </div>

                            <div className="mp-home-footer-col">
                                <h4>Account</h4>
                                <Link to="/login">Login</Link>
                                <Link to="/register">Register</Link>
                                <Link to="/me">My account</Link>
                            </div>

                            <div className="mp-home-footer-col">
                                <h4>Highlights</h4>
                                <span>Fast shipping</span>
                                <span>Vendor storefronts</span>
                                <span>Simple checkout flow</span>
                            </div>
                        </div>
                    </div>

                    <div className="mp-home-footer-bottom">
                        <div>� 2026 NovaMart</div>
                        <div className="mp-home-footer-bottom-links">
                            <span>Home / Categories / Products</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}

export default MainPage


