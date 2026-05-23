import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import "../styles/main.css"
import { canReviewProduct, getProduct } from "../api/products"
import { addCartItem } from "../api/cart"
import { addProductReview, getProductReviews } from "../api/reviews"
import { notifyCartChanged } from "../utils/cartEvents"
import useCartCount from "../hooks/useCartCount"
import useMe from "../hooks/useMe"
import UserMenu from "../components/UserMenu"
import ActionToast from "../components/ActionToast"
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

function StarIcon({ filled }){
    return (
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path
                d="M12 17.3 18.2 21l-1.7-7.1L22 9.2l-7.3-.6L12 2 9.3 8.6 2 9.2l5.5 4.7L5.8 21 12 17.3Z"
                fill={filled ? "#f59e0b" : "none"}
                stroke={filled ? "#f59e0b" : "#c7c7c7"}
                strokeWidth="1.6"
                strokeLinejoin="round"
            />
        </svg>
    )
}

function Stars({ value, onChange, readOnly = false, label = "Rating" }){
    const v = Math.max(0, Math.min(5, Number(value) || 0))

    if(readOnly){
        return (
            <div className="pd-stars" aria-label={`${label} ${v} out of 5`}>
                {Array.from({ length: 5 }).map((_, i) => (
                    <span className="pd-star" key={i} aria-hidden="true">
                        <StarIcon filled={i + 1 <= v} />
                    </span>
                ))}
            </div>
        )
    }

    return (
        <div className="pd-stars" role="radiogroup" aria-label={label}>
            {Array.from({ length: 5 }).map((_, i) => {
                const n = i + 1
                return (
                    <button
                        key={n}
                        type="button"
                        className={`pd-starbtn ${n <= v ? "is-on" : ""}`}
                        onClick={() => onChange?.(n)}
                        aria-label={`${n} star${n === 1 ? "" : "s"}`}
                    >
                        <StarIcon filled={n <= v} />
                    </button>
                )
            })}
        </div>
    )
}

function ProductDetail(){

    const { id } = useParams()
    const navigate = useNavigate()

    const cartCount = useCartCount()
    const { me } = useMe()

    const [product, setProduct] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    const [qty, setQty] = useState(1)
    const [flash, setFlash] = useState("")

    const [rating, setRating] = useState(5)
    const [text, setText] = useState("")
    const [reviews, setReviews] = useState([])
    const [reviewError, setReviewError] = useState("")
    const [canReview, setCanReview] = useState(false)

    const categoryName = product?.category?.name || ""
    const signedIn = Boolean(me?.username && localStorage.getItem("token"))
    const ownProduct = signedIn && Boolean(
        me?.username &&
        product?.shop?.vendor?.user?.username &&
        String(product.shop.vendor.user.username).toLowerCase() === String(me.username).toLowerCase()
    )

    useEffect(() => {
        let cancelled = false

        const load = async () => {
            setLoading(true)
            setError("")
            try{
                const p = await getProduct(id)
                if(cancelled) return
                setProduct(p)
                const stock = Number(p?.stock)
                if(Number.isFinite(stock)){
                    if(stock <= 0) setQty(1)
                    else setQty(1)
                }else{
                    setQty(1)
                }
            }catch{
                if(cancelled) return
                setError("Failed to load product.")
                setProduct(null)
            }finally{
                if(!cancelled) setLoading(false)
            }
        }

        load()
        return () => { cancelled = true }
    }, [id])

    useEffect(() => {
        let cancelled = false

        const loadReviews = async () => {
            if(!product?.id) return
            try{
                const list = await getProductReviews(product.id)
                if(!cancelled) setReviews(Array.isArray(list) ? list : [])
            }catch{
                if(!cancelled) setReviews([])
            }
        }

        loadReviews()
        return () => { cancelled = true }
    }, [product?.id])

    useEffect(() => {
        let cancelled = false

        const loadReviewPermission = async () => {
            if(!product?.id || !signedIn || ownProduct){
                if(!cancelled) setCanReview(false)
                return
            }

            try{
                const allowed = await canReviewProduct(product.id)
                if(!cancelled) setCanReview(Boolean(allowed))
            }catch{
                if(!cancelled) setCanReview(false)
            }
        }

        loadReviewPermission()
        return () => { cancelled = true }
    }, [ownProduct, product?.id, signedIn])

    useEffect(() => {
        if(!flash) return undefined

        const timeout = window.setTimeout(() => {
            setFlash("")
        }, 1800)

        return () => window.clearTimeout(timeout)
    }, [flash])

    const stock = useMemo(() => {
        const n = Number(product?.stock)
        return Number.isFinite(n) ? n : null
    }, [product?.stock])

    const avgRating = useMemo(() => {
        if(!reviews.length) return 0
        const sum = reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0)
        return sum / reviews.length
    }, [reviews])

    const onAddToCart = async () => {
        if(!product) return

        if(!signedIn){
            alert("Authentication required to add items to cart.")
            return
        }

        if(stock != null && (stock <= 0 || qty > stock)){
            alert("Not enough stock.")
            return
        }

        if(ownProduct){
            alert("You cannot add your own product to cart.")
            return
        }

        try{
            await addCartItem(product.id, qty)
            notifyCartChanged()
            setFlash("Added to cart.")
        }catch(err){
            const msg = err?.response?.data?.message || err?.response?.data || "Add to cart failed"
            alert(msg)
        }
    }

    const onSubmitReview = async (e) => {
        e.preventDefault()
        if(!product) return
        const t = text.trim()
        setReviewError("")

        if(!signedIn){
            alert("Authentication required to write a review.")
            return
        }

        if(ownProduct){
            setReviewError("You cannot review your own product.")
            return
        }

        if(!canReview){
            setReviewError("Only users who purchased this product can review it.")
            return
        }

        if(!t){
            alert("Please write a comment.")
            return
        }

        try{
            await addProductReview(product.id, { name: me.username, rating, text: t })
            const list = await getProductReviews(product.id)
            setReviews(Array.isArray(list) ? list : [])
            setRating(5)
            setText("")
            setFlash("Review submitted.")
        }catch{
            setReviewError("Review submit failed.")
        }
    }

    if(loading){
        return (
            <div className="mp-shell">
                <header className="mp-topbar">
                    <div className="mp-container mp-topbar-inner">
                        <Link className="mp-brand" to="/" aria-label="Go to homepage">
                            <div className="mp-mark" aria-hidden="true" />
                            <div className="mp-brand-name">NovaMart</div>
                        </Link>
                    </div>
                </header>
                <main className="mp-container">
                    <section className="pd-card">
                        <div className="pd-muted">Loading...</div>
                    </section>
                </main>
            </div>
        )
    }

    if(!product){
        return (
            <div className="mp-shell">
                <header className="mp-topbar">
                    <div className="mp-container mp-topbar-inner">
                        <Link className="mp-brand" to="/" aria-label="Go to homepage">
                            <div className="mp-mark" aria-hidden="true" />
                            <div className="mp-brand-name">NovaMart</div>
                        </Link>
                    </div>
                </header>

                <main className="mp-container">
                    <section className="pd-card">
                        <h1 className="pd-title">Product not found</h1>
                        <p className="pd-muted">{error || "This product does not exist."}</p>
                        <button className="mp-btn mp-btn-primary" type="button" onClick={() => navigate("/")}>Back to home</button>
                    </section>
                </main>
            </div>
        )
    }

    return (
        <div className="mp-shell">
            <header className="mp-topbar">
                <div className="mp-container mp-topbar-inner">
                    <Link className="mp-brand" to="/" aria-label="Go to homepage">
                        <div className="mp-mark" aria-hidden="true" />
                        <div className="mp-brand-name">NovaMart</div>
                    </Link>

                    <div className="pd-top-search">
                        <div className="mp-search" role="search" aria-label="Search (not wired)">
                            <MagnifierIcon />
                            <input placeholder="Search products..." aria-label="Search products" />
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
                <nav className="pd-breadcrumb" aria-label="Breadcrumb">
                    <Link to="/" className="pd-crumb-link">Home</Link>
                    <span className="pd-sep" aria-hidden="true">/</span>
                    {categoryName ? (
                        <Link
                            to={`/?category=${encodeURIComponent(categoryName)}`}
                            className="pd-crumb-link"
                            aria-label={`Open category ${categoryName}`}
                        >
                            {categoryName}
                        </Link>
                    ) : (
                        <span className="pd-crumb">Category</span>
                    )}
                    <span className="pd-sep" aria-hidden="true">/</span>
                    <span className="pd-crumb pd-crumb-current">{product.name}</span>
                </nav>

                <section className="pd-card">
                    <div className="pd-grid">
                        <div className="pd-img" data-tone="cool">
                            <div className="mp-pill">{product?.category?.name || "Product"}</div>
                            {product?.imagePath ? <img className="pd-img-el" src={resolveMediaUrl(product.imagePath)} alt={product.name} /> : null}
                        </div>

                        <div className="pd-info">
                            <h1 className="pd-title">{product.name}</h1>
                            <div className="pd-row">
                                <div className="pd-price">${Number(product.price || 0).toFixed(2)}</div>
                                <div className="pd-muted">
                                    {reviews.length ? (
                                        <span className="pd-ratingline">
                                            <Stars value={avgRating} readOnly label="Average rating" />
                                            <span>{avgRating.toFixed(1)} ({reviews.length} reviews)</span>
                                        </span>
                                    ) : "No reviews yet"}
                                </div>
                            </div>
                            <p className="pd-desc">{product.description}</p>

                            {product?.shop?.name && product?.shop?.slug ? (
                                <button
                                    className="pd-box"
                                    type="button"
                                    onClick={() => navigate(`/shop/${encodeURIComponent(product.shop.slug)}`)}
                                    style={{ width: "100%", textAlign: "left", cursor: "pointer", background: "#fff" }}
                                >
                                    <div className="pd-box-row">
                                        <div className="pd-muted"><b>Sold by</b></div>
                                        <div style={{ fontWeight: 900, color: "#111", fontSize: 16 }}>{product.shop.name}</div>
                                        <div className="pd-muted">Open shop page</div>
                                    </div>
                                </button>
                            ) : null}

                            <div className="pd-box">
                                <div className="pd-box-row">
                                    <div className="pd-muted"><b>Category:</b> {product?.category?.name || "-"}</div>
                                    <div className="pd-muted"><b>Stock:</b> {product.stock != null ? product.stock : "-"}</div>
                                    <div className="pd-muted"><b>Shipping:</b> 2-4 business days</div>
                                    <div className="pd-muted"><b>Returns:</b> 30 days</div>
                                </div>
                            </div>

                            <div className="pd-actions">
                                <div className="pd-qty" aria-label="Quantity">
                                    <button
                                        type="button"
                                        onClick={() => setQty((q) => Math.max(1, q - 1))}
                                        disabled={qty <= 1}
                                        aria-label="Decrease quantity"
                                    >
                                        -
                                    </button>
                                    <input
                                        value={qty}
                                        onChange={(e) => {
                                            const n = Number(e.target.value)
                                            const v = Number.isFinite(n) ? n : 1
                                            const clamped = stock != null ? Math.min(Math.max(1, v), Math.max(1, stock)) : Math.max(1, v)
                                            setQty(clamped)
                                        }}
                                        inputMode="numeric"
                                        aria-label="Quantity input"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setQty((q) => {
                                            const next = q + 1
                                            return stock != null ? Math.min(next, Math.max(1, stock)) : next
                                        })}
                                        disabled={stock != null ? qty >= stock : false}
                                        aria-label="Increase quantity"
                                    >
                                        +
                                    </button>
                                </div>
                                <button
                                    className="mp-btn mp-btn-primary"
                                    type="button"
                                    onClick={onAddToCart}
                                    disabled={ownProduct || (stock != null ? stock <= 0 : false)}
                                    title={
                                        ownProduct
                                            ? "You cannot add your own product to cart"
                                            : (stock != null && stock <= 0 ? "Out of stock" : "")
                                    }
                                >
                                    {ownProduct ? "Own product" : "Add to cart"}
                                </button>
                                {ownProduct ? (
                                    <button className="mp-btn mp-ghost-link" type="button" onClick={() => navigate(`/shop/products/${product.id}/edit`)}>
                                        Update product
                                    </button>
                                ) : null}
                                <button className="mp-btn mp-ghost-link" type="button" onClick={() => navigate("/")}>Back</button>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="pd-card">
                    <div className="pd-reviews-head">
                        <h2 className="pd-h2">Reviews</h2>
                        <div className="pd-muted">Share your experience.</div>
                    </div>

                    {reviewError ? (
                        <div className="pd-flash" style={{ background: "#fff2f2", borderColor: "#f1c1c1", color: "#7a0b0b", marginBottom: 10 }}>
                            {reviewError}
                        </div>
                    ) : null}

                    {signedIn && canReview && !ownProduct ? (
                        <form className="pd-form" onSubmit={onSubmitReview}>
                            <div className="pd-form-row">
                                <div className="pd-reviewer">
                                    <div className="pd-reviewer-label">User</div>
                                    <div className="pd-reviewer-name">{me.username}</div>
                                </div>
                                <div className="pd-ratingpick">
                                    <div className="pd-reviewer-label">Rating</div>
                                    <Stars value={rating} onChange={(n) => setRating(n)} label="Select rating" />
                                </div>
                            </div>
                            <label>
                                Comment
                                <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Write your review..." rows={4} />
                            </label>
                            <div className="pd-form-actions">
                                <button className="mp-btn mp-btn-primary" type="submit">Submit review</button>
                            </div>
                        </form>
                    ) : null}

                    <div className="pd-review-list" aria-live="polite">
                        {reviews.length === 0 ? (
                            <div className="pd-muted">No reviews yet.</div>
                        ) : (
                            reviews.map((r) => (
                                <article className="pd-review" key={r.id}>
                                    <div className="pd-review-top">
                                        <div className="pd-review-name">{r.authorName}</div>
                                        <div className="pd-review-right">
                                            <Stars value={r.rating} readOnly label="Review rating" />
                                            <div className="pd-muted">{(r.createdAt || "").slice(0, 10)}</div>
                                        </div>
                                    </div>
                                    <div className="pd-review-text">{r.text}</div>
                                </article>
                            ))
                        )}
                    </div>
                </section>

                <footer className="mp-footer">
                    <div className="mp-footer-row">
                        <div>NovaMart. Built for your e-commerce MVP.</div>
                    </div>
                </footer>
            </main>

            <ActionToast message={flash} onClose={() => setFlash("")} />
        </div>
    )
}

export default ProductDetail

