import { useEffect, useMemo, useRef, useState } from "react"
import API from "../api/api"
import AdminLayout from "../components/AdminLayout"
import { notifyAuthChanged } from "../utils/authEvents"

const SHOP_STATUSES = ["PENDING", "ACTIVE", "SUSPENDED"]

export default function AdminShops(){
    const [shops, setShops] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [message, setMessage] = useState("")
    const [query, setQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState("ALL")
    const [statusMenuOpen, setStatusMenuOpen] = useState(false)
    const [updatingId, setUpdatingId] = useState(null)
    const [deletingId, setDeletingId] = useState(null)
    const statusMenuRef = useRef(null)

    const loadShops = async () => {
        setLoading(true)
        setError("")
        try{
            const res = await API.get("/admin/shops")
            setShops(Array.isArray(res.data) ? res.data : [])
        }catch(err){
            if(err?.response?.status === 401){
                localStorage.removeItem("token")
                notifyAuthChanged()
            }
            setError("Failed to load shops.")
        }finally{
            setLoading(false)
        }
    }

    useEffect(() => {
        loadShops()
    }, [])

    useEffect(() => {
        const handlePointerDown = (event) => {
            if(!statusMenuRef.current) return
            if(!statusMenuRef.current.contains(event.target)) setStatusMenuOpen(false)
        }

        const handleKeyDown = (event) => {
            if(event.key === "Escape") setStatusMenuOpen(false)
        }

        document.addEventListener("pointerdown", handlePointerDown)
        document.addEventListener("keydown", handleKeyDown)
        return () => {
            document.removeEventListener("pointerdown", handlePointerDown)
            document.removeEventListener("keydown", handleKeyDown)
        }
    }, [])

    const filteredShops = useMemo(() => {
        const q = query.trim().toLowerCase()
        return shops.filter((shop) => {
            if(statusFilter !== "ALL" && shop?.status !== statusFilter) return false
            if(!q) return true
            const haystack = [
                shop?.name,
                shop?.slug,
                shop?.vendor?.user?.username,
                shop?.vendor?.user?.email
            ].join(" ").toLowerCase()
            return haystack.includes(q)
        })
    }, [shops, query, statusFilter])

    const handleShopStatus = async (shopId, status) => {
        if(updatingId) return
        setUpdatingId(shopId)
        setMessage("")
        try{
            await API.put(`/admin/shops/${shopId}/status`, { status })
            setMessage(`Shop updated to ${status}.`)
            await loadShops()
        }catch{
            setMessage("Failed to update shop.")
        }finally{
            setUpdatingId(null)
        }
    }

    const handleDeleteShop = async (shopId) => {
        if(deletingId) return
        setDeletingId(shopId)
        setMessage("")
        try{
            await API.delete(`/admin/shops/${shopId}`)
            setShops((current) => current.filter((item) => item.id !== shopId))
            setMessage("Shop deleted.")
        }catch{
            setMessage("Failed to delete shop.")
        }finally{
            setDeletingId(null)
        }
    }

    return (
        <AdminLayout title="Shops" subtitle="Search shops, control status, and remove storefronts when needed.">
            <section className="ad-panel">
                <div className="ad-toolbar">
                    <label className="ad-search">
                        <span>Search</span>
                        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Shop, slug, vendor..." />
                    </label>

                    <label className="ad-select">
                        <span>Status</span>
                        <div className={`ad-dropdown ${statusMenuOpen ? "is-open" : ""}`} ref={statusMenuRef}>
                            <button
                                className="ad-dropdown-trigger"
                                type="button"
                                aria-haspopup="menu"
                                aria-expanded={statusMenuOpen}
                                onClick={() => setStatusMenuOpen((current) => !current)}
                            >
                                <span>{statusFilter}</span>
                            </button>

                            <div className="ad-dropdown-menu" role="menu" aria-label="Shop status filter">
                                {["ALL", ...SHOP_STATUSES].map((status) => (
                                    <button
                                        key={status}
                                        className="ad-dropdown-item"
                                        type="button"
                                        role="menuitemradio"
                                        aria-checked={statusFilter === status}
                                        data-active={statusFilter === status}
                                        onClick={() => {
                                            setStatusFilter(status)
                                            setStatusMenuOpen(false)
                                        }}
                                    >
                                        {status}
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
                        {loading ? "Loading shops..." : `${filteredShops.length} shop${filteredShops.length === 1 ? "" : "s"} found`}
                    </div>
                </div>

                <div className="ad-list">
                    {loading ? (
                        <div className="pd-muted">Loading...</div>
                    ) : filteredShops.length === 0 ? (
                        <div className="pd-muted">No shops match the current filter.</div>
                    ) : (
                        filteredShops.map((shop) => (
                            <article key={shop.id} className="ad-list-card">
                                <div className="ad-list-main">
                                    <div className="ad-list-title">{shop.name || "-"}</div>
                                    <div className="ad-list-meta">Slug: {shop.slug || "-"}</div>
                                    <div className="ad-list-meta">Vendor: {shop?.vendor?.user?.username || "-"}</div>
                                    <div className="ad-list-meta">{shop.description || "No description"}</div>
                                </div>
                                <div className="ad-list-side">
                                    <div className={`ad-pill ad-pill-${String(shop?.status || "").toLowerCase()}`}>{shop?.status || "-"}</div>
                                    <div className="ad-status-row ad-status-row-compact">
                                        {SHOP_STATUSES.map((status) => (
                                            <button
                                                key={status}
                                                className="mp-btn mp-ghost-link"
                                                type="button"
                                                onClick={() => handleShopStatus(shop.id, status)}
                                                disabled={updatingId === shop.id || shop?.status === status}
                                            >
                                                {status}
                                            </button>
                                        ))}
                                        <button
                                            className="mp-btn mp-remove-btn"
                                            type="button"
                                            onClick={() => handleDeleteShop(shop.id)}
                                            disabled={deletingId === shop.id}
                                        >
                                            {deletingId === shop.id ? "Deleting..." : "Delete"}
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

