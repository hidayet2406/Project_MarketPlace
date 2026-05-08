import { useEffect, useMemo, useRef, useState } from "react"
import API from "../api/api"
import AdminLayout from "../components/AdminLayout"
import { notifyAuthChanged } from "../utils/authEvents"

const VENDOR_STATUSES = ["PENDING", "APPROVED", "REJECTED", "SUSPENDED"]

export default function AdminVendors(){
    const [vendors, setVendors] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [message, setMessage] = useState("")
    const [query, setQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState("ALL")
    const [updatingId, setUpdatingId] = useState(null)
    const [statusMenuOpen, setStatusMenuOpen] = useState(false)
    const statusMenuRef = useRef(null)

    const loadVendors = async () => {
        setLoading(true)
        setError("")
        try{
            const res = await API.get("/admin/getVendors")
            setVendors(Array.isArray(res.data) ? res.data : [])
        }catch(err){
            if(err?.response?.status === 401){
                localStorage.removeItem("token")
                notifyAuthChanged()
            }
            setError("Failed to load vendor requests.")
        }finally{
            setLoading(false)
        }
    }

    useEffect(() => {
        loadVendors()
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

    const filteredVendors = useMemo(() => {
        const q = query.trim().toLowerCase()
        return vendors.filter((vendor) => {
            if(vendor?.user?.role === "ADMIN") return false
            if(statusFilter !== "ALL" && vendor?.status !== statusFilter) return false
            if(!q) return true
            const haystack = [
                vendor?.user?.username,
                vendor?.user?.email,
                vendor?.status
            ].join(" ").toLowerCase()
            return haystack.includes(q)
        })
    }, [vendors, query, statusFilter])

    const handleVendorStatus = async (vendorId, status) => {
        if(updatingId) return
        setUpdatingId(vendorId)
        setMessage("")

        try{
            await API.put(`/admin/${vendorId}/updateVendor`, { status })
            setMessage(`Vendor request updated to ${status}.`)
            await loadVendors()
        }catch{
            setMessage("Failed to update vendor request.")
        }finally{
            setUpdatingId(null)
        }
    }

    return (
        <AdminLayout title="Vendor Requests" subtitle="Review submissions, filter by status, and take action fast.">
            <section className="ad-panel">
                <div className="ad-toolbar">
                    <label className="ad-search">
                        <span>Search</span>
                        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Username or email..." />
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

                            <div className="ad-dropdown-menu" role="menu" aria-label="Status filter">
                                {["ALL", ...VENDOR_STATUSES].map((status) => (
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

                {error ? (
                    <div className="pd-flash" style={{ background: "#fff2f2", borderColor: "#f1c1c1", color: "#7a0b0b" }}>
                        {error}
                    </div>
                ) : null}

                
    {message ? <div className="pd-flash" style={message.toLowerCase().includes("failed") ? { background: "#fff2f2", borderColor: "#f1c1c1", color: "#7a0b0b" } : undefined}>{message}</div> : null}

                <div className="ad-results">
                    <div className="ad-results-count">
                        {loading ? "Loading requests..." : `${filteredVendors.length} request${filteredVendors.length === 1 ? "" : "s"} found`}
                    </div>
                </div>

                <div className="ad-list">
                    {loading ? (
                        <div className="pd-muted">Loading...</div>
                    ) : filteredVendors.length === 0 ? (
                        <div className="pd-muted">No vendor requests match the current filter.</div>
                    ) : (
                        filteredVendors.map((vendor) => (
                            <article key={vendor.id} className="ad-list-card">
                                <div className="ad-list-main">
                                    <div className="ad-list-title">{vendor?.user?.username || "Unknown user"}</div>
                                    <div className="ad-list-meta">{vendor?.user?.email || "-"}</div>
                                    <div className="ad-list-meta">
                                        Requested: {vendor?.created_at ? new Date(vendor.created_at).toLocaleString() : "-"}
                                    </div>
                                </div>
                                <div className="ad-list-side">
                                    <div className={`ad-pill ad-pill-${String(vendor?.status || "").toLowerCase()}`}>{vendor?.status || "-"}</div>
                                    <div className="ad-status-row">
                                        {VENDOR_STATUSES.map((status) => (
                                            <button
                                                key={status}
                                                className="mp-btn mp-ghost-link"
                                                type="button"
                                                onClick={() => handleVendorStatus(vendor.id, status)}
                                                disabled={updatingId === vendor.id || vendor?.status === status}
                                            >
                                                {status}
                                            </button>
                                        ))}
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

