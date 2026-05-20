import { Link } from "react-router-dom"
import UserMenu from "./UserMenu"
import useCartCount from "../hooks/useCartCount"
import "../styles/main.css"

function CartIcon(){
    return (
        <svg className="mp-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M7 8h15l-1.5 8.5a2 2 0 0 1-2 1.5H9a2 2 0 0 1-2-1.7L5.4 4.5A1.8 1.8 0 0 0 3.6 3H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M9.5 22a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" fill="currentColor" opacity="0.85"/>
            <path d="M18.5 22a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" fill="currentColor" opacity="0.85"/>
        </svg>
    )
}

export default function Navbar(){
    const cartCount = useCartCount()

    return (
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
    )
}
