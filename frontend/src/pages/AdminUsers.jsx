import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import API from "../api/api"
import AdminLayout from "../components/AdminLayout"
import ActionToast from "../components/ActionToast"
import { notifyAuthChanged } from "../utils/authEvents"
import { resolveMediaUrl } from "../utils/resolveMediaUrl"

function formatMoney(value){
    return `$${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatOrderStatus(status){
    if(!status) return "Pending"
    return status.charAt(0) + status.slice(1).toLowerCase()
}

function UserDetailDialog({ user, orders, ordersLoading, ordersError, onClose }){
    if(!user || typeof document === "undefined") return null

    return createPortal(
        <div
            className="mp-modal-backdrop"
            role="presentation"
            onMouseDown={(event) => {
                if(event.target === event.currentTarget) onClose()
            }}
        >
            <div className="mp-modal" role="dialog" aria-modal="true" aria-label="User details">
                <div className="mp-modal-title">User details</div>
                <div className="ad-user-detail-layout">
                    <div className="ad-user-detail-col">
                        <div className="ad-detail-grid">
                            <div className="ad-detail-row">
                                <span className="ad-detail-label">Username</span>
                                <span className="ad-detail-value">{user.username || "-"}</span>
                            </div>
                            <div className="ad-detail-row">
                                <span className="ad-detail-label">Email</span>
                                <span className="ad-detail-value">{user.email || "-"}</span>
                            </div>
                            <div className="ad-detail-row">
                                <span className="ad-detail-label">First name</span>
                                <span className="ad-detail-value">{user.firstName || "-"}</span>
                            </div>
                            <div className="ad-detail-row">
                                <span className="ad-detail-label">Last name</span>
                                <span className="ad-detail-value">{user.lastName || "-"}</span>
                            </div>
                            <div className="ad-detail-row">
                                <span className="ad-detail-label">Phone</span>
                                <span className="ad-detail-value">{user.phone || "-"}</span>
                            </div>
                            <div className="ad-detail-row">
                                <span className="ad-detail-label">Role</span>
                                <span className="ad-detail-value">{user.role || "-"}</span>
                            </div>
                            <div className="ad-detail-row">
                                <span className="ad-detail-label">Wallet</span>
                                <span className="ad-detail-value">{user.wallet ?? "-"}</span>
                            </div>
                            <div className="ad-detail-row">
                                <span className="ad-detail-label">Enabled</span>
                                <span className="ad-detail-value">{String(Boolean(user.enabled))}</span>
                            </div>
                            <div className="ad-detail-row">
                                <span className="ad-detail-label">Email verified</span>
                                <span className="ad-detail-value">{String(Boolean(user.emailVerified))}</span>
                            </div>
                            <div className="ad-detail-row">
                                <span className="ad-detail-label">Created</span>
                                <span className="ad-detail-value">{user.createdAt ? new Date(user.createdAt).toLocaleString() : "-"}</span>
                            </div>
                        </div>
                    </div>

                    <div className="ad-user-detail-col">
                        <div className="ad-order-section">
                            <div className="ad-order-head">
                                <div className="mp-modal-title" style={{ fontSize: 20 }}>Order history</div>
                                <div className="ad-list-meta">
                                    {ordersLoading ? "Loading..." : `${orders.length} order${orders.length === 1 ? "" : "s"}`}
                                </div>
                            </div>

                            {ordersError ? (
                                <div className="pd-flash" style={{ background: "#fff2f2", borderColor: "#f1c1c1", color: "#7a0b0b" }}>
                                    {ordersError}
                                </div>
                            ) : ordersLoading ? (
                                <div className="pd-muted">Loading order history...</div>
                            ) : orders.length === 0 ? (
                                <div className="pd-muted">No orders yet.</div>
                            ) : (
                                <div className="ad-order-list">
                                    {orders.map((order) => (
                                        <article className="ad-order-card" key={order.orderId}>
                                            <div className="ad-order-top">
                                                <div>
                                                    <div className="ad-list-title" style={{ fontSize: 16 }}>Order #{order.orderId}</div>
                                                    <div className="ad-list-meta">{order.createdAt ? new Date(order.createdAt).toLocaleString() : "-"}</div>
                                                </div>
                                                <div className="ad-pill">{formatOrderStatus(order.status)}</div>
                                            </div>

                                            <div className="ad-order-meta">
                                                <span><strong>Total:</strong> {formatMoney(order.totalAmount)}</span>
                                                <span><strong>Ship to:</strong> {[order.shippingCity, order.shippingCountry].filter(Boolean).join(", ") || "-"}</span>
                                            </div>

                                            <div className="ad-order-items">
                                                {(order.items || []).map((item, index) => (
                                                    <div className="ad-order-item" key={`${order.orderId}-${item.productId || index}`}>
                                                        <div className="ad-order-thumb">
                                                            {item.imagePath ? <img src={resolveMediaUrl(item.imagePath)} alt={item.productName} /> : null}
                                                        </div>
                                                        <div className="ad-order-copy">
                                                            <div className="ad-detail-value">{item.productName}</div>
                                                            <div className="ad-list-meta">Qty {item.quantity}</div>
                                                        </div>
                                                        <div className="ad-detail-value">{formatMoney(item.price)}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="mp-modal-actions">
                    <button className="mp-btn mp-btn-primary" type="button" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>,
        document.body
    )
}

function DeleteUserDialog({ user, loading, onCancel, onConfirm }){
    if(!user || typeof document === "undefined") return null

    return createPortal(
        <div
            className="mp-modal-backdrop"
            role="presentation"
            onMouseDown={(event) => {
                if(event.target === event.currentTarget) onCancel()
            }}
        >
            <div className="mp-modal mp-modal-center" role="dialog" aria-modal="true" aria-label="Delete user confirmation">
                <div className="mp-modal-title">Delete user</div>
                <div className="mp-modal-text">
                    {`Do you want to delete ${user.username || "this user"} and all related records? This cannot be undone.`}
                </div>
                <div className="mp-modal-actions">
                    <button className="mp-btn mp-ghost-link" type="button" onClick={onCancel} disabled={loading}>
                        Cancel
                    </button>
                    <button className="mp-btn mp-remove-btn" type="button" onClick={onConfirm} disabled={loading}>
                        {loading ? "Deleting..." : "Delete user"}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    )
}



export default function AdminUsers(){
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [query, setQuery] = useState("")
    const [roleFilter, setRoleFilter] = useState("ALL")
    const [selectedUser, setSelectedUser] = useState(null)
    const [selectedUserOrders, setSelectedUserOrders] = useState([])
    const [selectedUserOrdersLoading, setSelectedUserOrdersLoading] = useState(false)
    const [selectedUserOrdersError, setSelectedUserOrdersError] = useState("")
    const [deleteTarget, setDeleteTarget] = useState(null)
    const [actionMessage, setActionMessage] = useState("")
    const [deletingId, setDeletingId] = useState(null)
    const [roleMenuOpen, setRoleMenuOpen] = useState(false)
    const roleMenuRef = useRef(null)

    useEffect(() => {
        let cancelled = false

        const load = async () => {
            setLoading(true)
            setError("")
            try{
                const res = await API.get("/admin")
                if(cancelled) return
                setUsers(Array.isArray(res.data) ? res.data : [])
            }catch(err){
                if(err?.response?.status === 401){
                    localStorage.removeItem("token")
                    notifyAuthChanged()
                }
                if(!cancelled) setError("Failed to load users.")
            }finally{
                if(!cancelled) setLoading(false)
            }
        }

        load()
        return () => { cancelled = true }
    }, [])

    useEffect(() => {
        const handlePointerDown = (event) => {
            if(!roleMenuRef.current) return
            if(!roleMenuRef.current.contains(event.target)) setRoleMenuOpen(false)
        }

        const handleKeyDown = (event) => {
            if(event.key === "Escape") setRoleMenuOpen(false)
        }

        document.addEventListener("pointerdown", handlePointerDown)
        document.addEventListener("keydown", handleKeyDown)

        return () => {
            document.removeEventListener("pointerdown", handlePointerDown)
            document.removeEventListener("keydown", handleKeyDown)
        }
    }, [])

    useEffect(() => {
        let cancelled = false

        const loadOrders = async () => {
            if(!selectedUser?.id){
                setSelectedUserOrders([])
                setSelectedUserOrdersError("")
                setSelectedUserOrdersLoading(false)
                return
            }

            setSelectedUserOrdersLoading(true)
            setSelectedUserOrdersError("")
            try{
                const res = await API.get(`/admin/users/${selectedUser.id}/orders`)
                if(cancelled) return
                setSelectedUserOrders(Array.isArray(res.data) ? res.data : [])
            }catch{
                if(cancelled) return
                setSelectedUserOrders([])
                setSelectedUserOrdersError("Failed to load order history.")
            }finally{
                if(!cancelled) setSelectedUserOrdersLoading(false)
            }
        }

        loadOrders()
        return () => { cancelled = true }
    }, [selectedUser?.id])

    

    const roles = useMemo(() => {
        return ["ALL", ...new Set(users.map((user) => user?.role).filter(Boolean))]
    }, [users])

    const filteredUsers = useMemo(() => {
        const q = query.trim().toLowerCase()
        return users.filter((user) => {
            if(roleFilter !== "ALL" && user?.role !== roleFilter) return false
            if(!q) return true
            const haystack = [
                user?.username,
                user?.email,
                user?.firstName,
                user?.lastName,
                user?.phone
            ].join(" ").toLowerCase()
            return haystack.includes(q)
        })
    }, [users, query, roleFilter])

    const handleDeleteUser = async () => {
        if(!deleteTarget?.id || deletingId) return

        setDeletingId(deleteTarget.id)
        setActionMessage("")
        try{
            await API.delete(`/admin/users/${deleteTarget.id}`)
            setUsers((current) => current.filter((item) => item.id !== deleteTarget.id))
            if(selectedUser?.id === deleteTarget.id) setSelectedUser(null)
            setActionMessage("User deleted.")
            setDeleteTarget(null)
        }catch(err){
            const message = err?.response?.data?.message || err?.response?.data || "Failed to delete user."
            setActionMessage(String(message))
        }finally{
            setDeletingId(null)
        }
    }

    return (
        <AdminLayout title="Users" subtitle="Search and filter all registered accounts.">
            <section className="ad-panel">
                <div className="ad-toolbar">
                    <label className="ad-search">
                        <span>Search</span>
                        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Username, email, phone..." />
                    </label>

                    <label className="ad-select">
                        <span>Role</span>
                        <div className={`ad-dropdown ${roleMenuOpen ? "is-open" : ""}`} ref={roleMenuRef}>
                            <button
                                className="ad-dropdown-trigger"
                                type="button"
                                aria-haspopup="menu"
                                aria-expanded={roleMenuOpen}
                                onClick={() => setRoleMenuOpen((current) => !current)}
                            >
                                <span>{roleFilter}</span>
                            </button>

                            <div className="ad-dropdown-menu" role="menu" aria-label="Role filter">
                                {roles.map((role) => (
                                    <button
                                        key={role}
                                        className="ad-dropdown-item"
                                        type="button"
                                        role="menuitemradio"
                                        aria-checked={roleFilter === role}
                                        data-active={roleFilter === role}
                                        onClick={() => {
                                            setRoleFilter(role)
                                            setRoleMenuOpen(false)
                                        }}
                                    >
                                        {role}
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

                
    {actionMessage && actionMessage.toLowerCase() !== "user deleted." && (actionMessage.toLowerCase().includes("failed") || actionMessage.toLowerCase().includes("not_allowed")) ? (
        <div className="pd-flash" style={{ background: "#fff2f2", borderColor: "#f1c1c1", color: "#7a0b0b" }}>
            {actionMessage}
        </div>
    ) : null}

                <div className="ad-results">
                    <div className="ad-results-count">
                        {loading ? "Loading users..." : `${filteredUsers.length} user${filteredUsers.length === 1 ? "" : "s"} found`}
                    </div>
                </div>

                <div className="ad-list">
                    {loading ? (
                        <div className="pd-muted">Loading...</div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="pd-muted">No users match the current filter.</div>
                    ) : (
                        filteredUsers.map((user) => (
                            <article key={user.id} className="ad-user-card">
                                <button
                                    type="button"
                                    className="ad-user-main"
                                    onClick={() => setSelectedUser(user)}
                                >
                                    <div className="ad-user-mainline">
                                        <div className="ad-user-copy">
                                            <div className="ad-list-title">{user.username}</div>
                                            <div className="ad-list-meta">{user.email || "-"}</div>
                                            <div className="ad-list-meta">
                                                {(user.firstName || user.lastName)
                                                    ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                                                    : "Name not completed"}
                                            </div>
                                        </div>
                                        <div className="ad-user-side">
                                            <div className="ad-pill">{user.role || "-"}</div>
                                            <div className="ad-list-meta">Phone: {user.phone || "-"}</div>
                                        </div>
                                    </div>
                                </button>

                                <div className="ad-user-footer">
                                    <div className="ad-user-summary">
                                        <span className="ad-user-summary-item">
                                            {user.enabled ? "Enabled" : "Disabled"}
                                        </span>
                                        <span className="ad-user-summary-item">
                                            {user.emailVerified ? "Verified" : "Unverified"}
                                        </span>
                                        <span className="ad-user-summary-item">
                                            {(user.firstName || user.lastName)
                                                ? "Profile complete"
                                                : "Profile incomplete"}
                                        </span>
                                    </div>

                                {user.role !== "ADMIN" ? (
                                    <div className="ad-user-actions">
                                        <button
                                            className="mp-btn mp-remove-btn"
                                            type="button"
                                            onClick={() => setDeleteTarget(user)}
                                            disabled={deletingId === user.id}
                                        >
                                            Delete user
                                        </button>
                                    </div>
                                ) : null}
                                </div>
                            </article>
                        ))
                    )}
                </div>
            </section>

            <UserDetailDialog
                user={selectedUser}
                orders={selectedUserOrders}
                ordersLoading={selectedUserOrdersLoading}
                ordersError={selectedUserOrdersError}
                onClose={() => setSelectedUser(null)}
            />
            <DeleteUserDialog
                user={deleteTarget}
                loading={deletingId === deleteTarget?.id}
                onCancel={() => {
                    if(deletingId) return
                    setDeleteTarget(null)
                }}
                onConfirm={handleDeleteUser}
            />
            <ActionToast message={actionMessage} onClose={() => setActionMessage("")} />
        </AdminLayout>
    )
}



