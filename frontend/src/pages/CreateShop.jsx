import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import "../styles/main.css"
import API from "../api/api"
import UserMenu from "../components/UserMenu"
import useCartCount from "../hooks/useCartCount"
import { notifyAuthChanged } from "../utils/authEvents"

function CartIcon(props){
    return (
        <svg className="mp-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
            <path d="M7 8h15l-1.5 8.5a2 2 0 0 1-2 1.5H9a2 2 0 0 1-2-1.7L5.4 4.5A1.8 1.8 0 0 0 3.6 3H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M9.5 22a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" fill="currentColor" opacity="0.85"/>
            <path d="M18.5 22a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" fill="currentColor" opacity="0.85"/>
        </svg>
    )
}

function CreateShop(){
    const navigate = useNavigate()
    const cartCount = useCartCount()

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [vendorRequest, setVendorRequest] = useState(null)
    const [shop, setShop] = useState(null)
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState({
        name: "",
        slug: "",
        description: ""
    })

    useEffect(() => {
        let cancelled = false

        const load = async () => {
            setLoading(true)
            setError("")
            try{
                const [vendorRes, shopRes] = await Promise.all([
                    API.get("/user/vendor"),
                    API.get("/shop/my")
                ])

                if(cancelled) return

                setVendorRequest(vendorRes.data || null)
                setShop(shopRes.data || null)

                if(shopRes.data?.name){
                    navigate("/shop/panel", { replace: true })
                }
            }catch(err){
                if(err?.response?.status === 401){
                    localStorage.removeItem("token")
                    notifyAuthChanged()
                    if(!cancelled) setError("Authentication required.")
                    return
                }
                if(!cancelled) setError("Failed to load shop setup.")
            }finally{
                if(!cancelled) setLoading(false)
            }
        }

        load()
        return () => { cancelled = true }
    }, [navigate])

    const approved = vendorRequest?.status === "APPROVED"

    const handleChange = (event) => {
        const { name, value } = event.target
        setForm((current) => ({ ...current, [name]: value }))
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        if(saving) return

        setSaving(true)
        setError("")

        try{
            await API.post("/shop", {
                name: form.name,
                slug: form.slug,
                description: form.description
            })
            navigate("/shop/panel")
        }catch(err){
            const message = err?.response?.data?.message || err?.response?.data || "Failed to create shop."
            setError(String(message))
        }finally{
            setSaving(false)
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
                    <span className="pd-crumb pd-crumb-current">Create shop</span>
                </nav>

                {loading ? (
                    <section className="pd-card">
                        <div className="pd-muted">Loading...</div>
                    </section>
                ) : !approved ? (
                    <section className="pd-card">
                        <h1 className="pd-title">Create shop</h1>
                        <p className="pd-muted">Your vendor request must be approved before you can create a shop.</p>
                    </section>
                ) : (
                    <section className="pd-card">
                        <div className="ud-head">
                            <h1 className="pd-title" style={{ fontSize: 22 }}>Create your shop</h1>
                            <div className="pd-muted">Set your seller storefront name, slug, and description.</div>
                        </div>

                        {shop?.name ? (
                            <div className="pd-flash">You already have a shop.</div>
                        ) : null}

                        {error ? (
                            <div className="pd-flash" style={{ background: "#fff2f2", borderColor: "#f1c1c1", color: "#7a0b0b", marginBottom: 10 }}>
                                {error}
                            </div>
                        ) : null}

                        <form className="ud-form" onSubmit={handleSubmit}>
                            <div className="ud-grid">
                                <label className="ud-input-wrap">
                                    <span className="ud-label">Shop name</span>
                                    <input name="name" value={form.name} onChange={handleChange} placeholder="Example: Nova Home" />
                                </label>
                                <label className="ud-input-wrap">
                                    <span className="ud-label">Slug</span>
                                    <input name="slug" value={form.slug} onChange={handleChange} placeholder="example: nova-home" />
                                </label>
                            </div>

                            <label className="ud-input-wrap">
                                <span className="ud-label">Description</span>
                                <input name="description" value={form.description} onChange={handleChange} placeholder="Short summary for your shop" />
                            </label>

                            <div className="pd-actions" style={{ marginTop: 12 }}>
                                <button className="mp-btn mp-btn-primary" type="submit" disabled={saving || !!shop?.name}>
                                    {saving ? "Creating..." : "Create shop"}
                                </button>
                                <button className="mp-btn mp-ghost-link" type="button" onClick={() => navigate("/me")}>
                                    Back
                                </button>
                            </div>
                        </form>
                    </section>
                )}
            </main>
        </div>
    )
}

export default CreateShop
