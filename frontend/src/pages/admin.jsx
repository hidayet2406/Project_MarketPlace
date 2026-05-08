import { useEffect, useMemo, useState } from "react"
import API from "../api/api"
import AdminLayout from "../components/AdminLayout"
import ActionToast from "../components/ActionToast"
import { notifyAuthChanged } from "../utils/authEvents"

function StatCard({ label, value, note }){
    return (
        <div className="ad-stat">
            <div className="ad-stat-label">{label}</div>
            <div className="ad-stat-value">{value}</div>
            <div className="ad-stat-note">{note}</div>
        </div>
    )
}

export default function Admin(){
    const [users, setUsers] = useState([])
    const [vendors, setVendors] = useState([])
    const [shops, setShops] = useState([])
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [categoryName, setCategoryName] = useState("")
    const [categoryDescription, setCategoryDescription] = useState("")
    const [categoryLoading, setCategoryLoading] = useState(false)
    const [categoryMessage, setCategoryMessage] = useState("")

    useEffect(() => {
        let cancelled = false

        const load = async () => {
            setLoading(true)
            setError("")
            try{
                const [usersRes, vendorsRes, shopsRes, productsRes] = await Promise.all([
                    API.get("/admin"),
                    API.get("/admin/getVendors"),
                    API.get("/admin/shops"),
                    API.get("/admin/products")
                ])
                if(cancelled) return
                setUsers(Array.isArray(usersRes.data) ? usersRes.data : [])
                setVendors(Array.isArray(vendorsRes.data) ? vendorsRes.data : [])
                setShops(Array.isArray(shopsRes.data) ? shopsRes.data : [])
                setProducts(Array.isArray(productsRes.data) ? productsRes.data : [])
            }catch(err){
                if(err?.response?.status === 401){
                    localStorage.removeItem("token")
                    notifyAuthChanged()
                }
                if(!cancelled) setError("Failed to load dashboard.")
            }finally{
                if(!cancelled) setLoading(false)
            }
        }

        load()
        return () => { cancelled = true }
    }, [])

    const stats = useMemo(() => {
        const approved = vendors.filter((item) => item?.status === "APPROVED").length
        const pending = vendors.filter((item) => item?.status === "PENDING").length
        return {
            users: users.length,
            vendors: vendors.length,
            approved,
            pending,
            shops: shops.length,
            products: products.length
        }
    }, [users, vendors, shops, products])

    const handleCategorySubmit = async (event) => {
        event.preventDefault()
        if(categoryLoading) return

        const payload = {
            name: categoryName.trim(),
            description: categoryDescription.trim()
        }

        if(!payload.name){
            setCategoryMessage("Category name is required.")
            return
        }

        setCategoryLoading(true)
        setCategoryMessage("")

        try{
            const res = await API.post("/admin/insertCategory", payload)
            setCategoryMessage(typeof res.data === "string" ? res.data : "Category created.")
            setCategoryName("")
            setCategoryDescription("")
        }catch{
            setCategoryMessage("Failed to create category.")
        }finally{
            setCategoryLoading(false)
        }
    }

    return (
        <AdminLayout title="Dashboard" subtitle="Track platform health and perform quick admin actions.">
            {error ? (
                <div className="pd-flash" style={{ background: "#fff2f2", borderColor: "#f1c1c1", color: "#7a0b0b" }}>
                    {error}
                </div>
            ) : null}

            <div className="ad-stat-grid">
                <StatCard label="Registered users" value={loading ? "..." : stats.users} note="All accounts in the system" />
                <StatCard label="Vendor requests" value={loading ? "..." : stats.vendors} note="Total submissions" />
                <StatCard label="Approved vendors" value={loading ? "..." : stats.approved} note="Active seller access" />
                <StatCard label="Pending review" value={loading ? "..." : stats.pending} note="Waiting for admin action" />
                <StatCard label="Shops" value={loading ? "..." : stats.shops} note="Current storefront count" />
                <StatCard label="Products" value={loading ? "..." : stats.products} note="Items across all shops" />
            </div>

            <section className="ad-panel">
                <div className="ad-panel-head">
                    <div>
                        <h2 className="ad-panel-title">Create category</h2>
                        <p className="ad-panel-subtitle">Add new storefront categories without leaving the dashboard.</p>
                    </div>
                </div>

                
    {categoryMessage && (categoryMessage.toLowerCase().includes("failed") || categoryMessage.toLowerCase().includes("required")) ? (
        <div className="pd-flash" style={{ background: "#fff2f2", borderColor: "#f1c1c1", color: "#7a0b0b", marginBottom: 10 }}>
            {categoryMessage}
        </div>
    ) : (
        <ActionToast message={categoryMessage} onClose={() => setCategoryMessage("")} />
    )}

                <form className="ad-form" onSubmit={handleCategorySubmit}>
                    <label className="ad-field">
                        <span>Category name</span>
                        <input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder="Example: Electronics" />
                    </label>

                    <label className="ad-field">
                        <span>Description</span>
                        <input value={categoryDescription} onChange={(event) => setCategoryDescription(event.target.value)} placeholder="Short description" />
                    </label>

                    <div className="ad-actions">
                        <button className="mp-btn mp-btn-primary" type="submit" disabled={categoryLoading}>
                            {categoryLoading ? "Saving..." : "Create category"}
                        </button>
                    </div>
                </form>
            </section>
        </AdminLayout>
    )
}



