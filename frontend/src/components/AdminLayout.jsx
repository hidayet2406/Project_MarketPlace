import { Link, useLocation } from "react-router-dom"
import "../styles/main.css"
import "../styles/admin.css"
import UserMenu from "./UserMenu"
import useCartCount from "../hooks/useCartCount"
import useMe from "../hooks/useMe"

function CartIcon(props){
    return (
        <svg className="mp-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
            <path d="M7 8h15l-1.5 8.5a2 2 0 0 1-2 1.5H9a2 2 0 0 1-2-1.7L5.4 4.5A1.8 1.8 0 0 0 3.6 3H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M9.5 22a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" fill="currentColor" opacity="0.85"/>
            <path d="M18.5 22a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" fill="currentColor" opacity="0.85"/>
        </svg>
    )
}

function AdminNavLink({ to, label, currentPath }){
    const active = currentPath === to
    return (
        <Link className={`ad-navlink ${active ? "is-active" : ""}`} to={to}>
            {label}
        </Link>
    )
}

export default function AdminLayout({ title, subtitle, children }){
    const cartCount = useCartCount()
    const { me, loading } = useMe()
    const location = useLocation()

    return (
        <div className="mp-shell ad-shell">
            <header className="mp-topbar ad-topbar">
                <div className="mp-container mp-topbar-inner">
                    <Link className="mp-brand" to="/" aria-label="Go to homepage">
                        <div className="mp-mark" aria-hidden="true" />
                        <div className="mp-brand-name">NovaMart Admin</div>
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

            <main className="mp-container ad-page">
                <nav className="pd-breadcrumb" aria-label="Breadcrumb" style={{ paddingTop: 12 }}>
                    <Link to="/" className="pd-crumb-link">Home</Link>
                    <span className="pd-sep" aria-hidden="true">/</span>
                    <span className="pd-crumb pd-crumb-current">Admin</span>
                </nav>

                {loading ? (
                    <section className="pd-card">
                        <div className="pd-muted">Loading...</div>
                    </section>
                ) : !me?.username ? (
                    <section className="pd-card">
                        <h1 className="pd-title">Admin panel</h1>
                        <p className="pd-muted">Please sign in first.</p>
                    </section>
                ) : me.role !== "ADMIN" ? (
                    <section className="pd-card">
                        <h1 className="pd-title">Admin panel</h1>
                        <p className="pd-muted">You do not have access to this page.</p>
                    </section>
                ) : (
                    <div className="ad-grid">
                        <aside className="ad-sidebar">
                            <div className="ad-sidebar-card">
                                <div className="ad-sidebar-kicker">Control Center</div>
                                <h1 className="ad-sidebar-title">Admin panel</h1>
                                <p className="ad-sidebar-text">Review users, manage vendor requests, and keep catalog structure clean.</p>
                            </div>

                            <nav className="ad-nav" aria-label="Admin sections">
                                <AdminNavLink to="/admin" label="Dashboard" currentPath={location.pathname} />
                                <AdminNavLink to="/admin/users" label="Users" currentPath={location.pathname} />
                                <AdminNavLink to="/admin/vendors" label="Vendor Requests" currentPath={location.pathname} />
                                <AdminNavLink to="/admin/shops" label="Shops" currentPath={location.pathname} />
                                <AdminNavLink to="/admin/products" label="Products" currentPath={location.pathname} />
                            </nav>
                        </aside>

                        <section className="ad-content">
                            <div className="ad-head">
                                <div>
                                    <h1 className="pd-title ad-title">{title}</h1>
                                    {subtitle ? <p className="ad-subtitle">{subtitle}</p> : null}
                                </div>
                            </div>

                            {children}
                        </section>
                    </div>
                )}
            </main>
        </div>
    )
}
