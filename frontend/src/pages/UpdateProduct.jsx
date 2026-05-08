import { useEffect, useRef, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import "../styles/main.css"
import API from "../api/api"
import { getCategories } from "../api/categories"
import { getProduct } from "../api/products"
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

export default function UpdateProduct(){
    const { id } = useParams()
    const navigate = useNavigate()
    const cartCount = useCartCount()
    const fileInputRef = useRef(null)

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [flash, setFlash] = useState("")
    const [saving, setSaving] = useState(false)
    const [uploadingImage, setUploadingImage] = useState(false)
    const [categories, setCategories] = useState([])
    const [product, setProduct] = useState(null)
    const [form, setForm] = useState({
        name: "",
        description: "",
        price: "",
        stock: "",
        imagePath: "",
        categoryName: ""
    })

    useEffect(() => {
        let cancelled = false

        const load = async () => {
            setLoading(true)
            setError("")
            try{
                const [productRes, categoriesRes] = await Promise.all([
                    getProduct(id),
                    getCategories()
                ])

                if(cancelled) return
                setProduct(productRes || null)
                setCategories(Array.isArray(categoriesRes) ? categoriesRes : [])
                setForm({
                    name: productRes?.name || "",
                    description: productRes?.description || "",
                    price: productRes?.price ?? "",
                    stock: productRes?.stock ?? "",
                    imagePath: productRes?.imagePath || "",
                    categoryName: productRes?.category?.name || ""
                })
            }catch(err){
                if(err?.response?.status === 401){
                    localStorage.removeItem("token")
                    notifyAuthChanged()
                    if(!cancelled) setError("Authentication required.")
                    return
                }
                if(!cancelled) setError("Failed to load product.")
            }finally{
                if(!cancelled) setLoading(false)
            }
        }

        load()
        return () => { cancelled = true }
    }, [id])

    const handleChange = (event) => {
        const { name, value } = event.target
        setForm((current) => ({ ...current, [name]: value }))
    }

    const handleImagePick = async (event) => {
        const file = event.target.files?.[0]
        if(!file) return

        const payload = new FormData()
        payload.append("file", file)

        setUploadingImage(true)
        setFlash("")

        try{
            const res = await API.post("/shop/products/image", payload, {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            })
            setForm((current) => ({ ...current, imagePath: String(res.data || "") }))
        }catch(err){
            const message = err?.response?.data?.message || err?.response?.data || "Failed to upload image."
            setFlash(String(message))
            if(fileInputRef.current) fileInputRef.current.value = ""
        }finally{
            setUploadingImage(false)
        }
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        if(saving) return

        if(!form.categoryName){
            setFlash("Please select a category.")
            return
        }

        setSaving(true)
        setFlash("")

        try{
            await API.put(`/shop/products/${id}/${encodeURIComponent(form.categoryName)}`, {
                name: form.name,
                description: form.description,
                price: form.price,
                stock: form.stock,
                imagePath: form.imagePath
            })
            navigate(`/product/${id}`)
        }catch(err){
            const message = err?.response?.data?.message || err?.response?.data || "Failed to update product."
            setFlash(String(message))
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
                    <Link to="/shop/panel" className="pd-crumb-link">Shop panel</Link>
                    <span className="pd-sep" aria-hidden="true">/</span>
                    <span className="pd-crumb pd-crumb-current">Update product</span>
                </nav>

                {loading ? (
                    <section className="pd-card">
                        <div className="pd-muted">Loading...</div>
                    </section>
                ) : error ? (
                    <div className="pd-flash" style={{ background: "#fff2f2", borderColor: "#f1c1c1", color: "#7a0b0b" }}>
                        {error}
                    </div>
                ) : (
                    <section className="pd-card">
                        <div className="ud-head">
                            <h1 className="pd-title" style={{ fontSize: 22 }}>Update product</h1>
                            <div className="pd-muted">Edit {product?.name || "your product"}.</div>
                        </div> {flash ? <div className="pd-flash" style={flash.toLowerCase().includes("failed") || flash.toLowerCase().includes("please") ? { background: "#fff2f2", borderColor: "#f1c1c1", color: "#7a0b0b", marginBottom: 10 } : { marginBottom: 10 }}>{flash}</div> : null}

                        <form className="ud-form" onSubmit={handleSubmit}>
                            <div
                                role="button"
                                tabIndex={0}
                                onClick={() => fileInputRef.current?.click()}
                                onKeyDown={(event) => {
                                    if(event.key === "Enter" || event.key === " "){
                                        event.preventDefault()
                                        fileInputRef.current?.click()
                                    }
                                }}
                                style={{
                                    width: 220,
                                    height: 220,
                                    borderRadius: 16,
                                    border: "1px dashed #c9b38d",
                                    background: "#fffaf0",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    overflow: "hidden",
                                    cursor: "pointer"
                                }}
                                aria-label="Choose product image"
                            >
                                {form.imagePath ? (
                                    <img
                                        src={resolveMediaUrl(form.imagePath)}
                                        alt="Product preview"
                                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                                    />
                                ) : (
                                    <div style={{ textAlign: "center", padding: 16 }}>
                                        <div style={{ fontWeight: 900, color: "#7a5a2d", marginBottom: 8 }}>
                                            {uploadingImage ? "Uploading..." : "Add the photo"}
                                        </div>
                                        <div className="pd-muted">Click the image frame</div>
                                    </div>
                                )}
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                style={{ display: "none" }}
                                onChange={handleImagePick}
                            />

                            <div className="ud-grid">
                                <label className="ud-input-wrap">
                                    <span className="ud-label">Product name</span>
                                    <input name="name" value={form.name} onChange={handleChange} placeholder="Product name" />
                                </label>
                                <label className="ud-input-wrap">
                                    <span className="ud-label">Category</span>
                                    <select name="categoryName" value={form.categoryName} onChange={handleChange}>
                                        <option value="">Select category</option>
                                        {categories.map((category) => (
                                            <option key={category.id} value={category.name}>{category.name}</option>
                                        ))}
                                    </select>
                                </label>
                                <label className="ud-input-wrap">
                                    <span className="ud-label">Price</span>
                                    <input name="price" value={form.price} onChange={handleChange} placeholder="99.99" inputMode="decimal" />
                                </label>
                                <label className="ud-input-wrap">
                                    <span className="ud-label">Stock</span>
                                    <input name="stock" value={form.stock} onChange={handleChange} placeholder="10" inputMode="numeric" />
                                </label>
                            </div>

                            <label className="ud-input-wrap">
                                <span className="ud-label">Description</span>
                                <input name="description" value={form.description} onChange={handleChange} placeholder="Short product description" />
                            </label>

                            <div className="pd-actions" style={{ marginTop: 12 }}>
                                <button className="mp-btn mp-btn-primary" type="submit" disabled={saving || uploadingImage}>
                                    {saving ? "Updating..." : "Update product"}
                                </button>
                                <button className="mp-btn mp-ghost-link" type="button" onClick={() => navigate(`/product/${id}`)} disabled={saving || uploadingImage}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </section>
                )}
            </main>
        </div>
    )
}

