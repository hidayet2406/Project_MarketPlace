import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Link, useNavigate } from "react-router-dom"
import useMe from "../hooks/useMe"
import { notifyAuthChanged } from "../utils/authEvents"
import { notifyCartChanged } from "../utils/cartEvents"

function LogoutDialog({ open, username, onCancel, onLogout }){
    if(!open || typeof document === "undefined") return null

    return createPortal(
        <div
            className="mp-modal-backdrop"
            role="presentation"
            onMouseDown={(event) => {
                if(event.target === event.currentTarget) onCancel()
            }}
        >
            <div className="mp-modal mp-modal-center" role="dialog" aria-modal="true" aria-label="Logout confirmation">
                <div className="mp-modal-title">Logout</div>
                <div className="mp-modal-text">
                    {username ? `Do you want to log out of ${username}'s account?` : "Do you want to log out of your account?"}
                </div>
                <div className="mp-modal-actions">
                    <button className="mp-btn mp-ghost-link" type="button" onClick={onCancel}>
                        Cancel
                    </button>
                    <button className="mp-btn mp-btn-primary" type="button" onClick={onLogout}>
                        Log out
                    </button>
                </div>
            </div>
        </div>,
        document.body
    )
}

export default function UserMenu(){
    const navigate = useNavigate()
    const { me } = useMe()
    const rootRef = useRef(null)

    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isLogoutOpen, setIsLogoutOpen] = useState(false)

    useEffect(() => {
        const handlePointerDown = (event) => {
            if(!rootRef.current) return
            if(!rootRef.current.contains(event.target)) setIsMenuOpen(false)
        }

        const handleKeyDown = (event) => {
            if(event.key !== "Escape") return
            setIsMenuOpen(false)
            setIsLogoutOpen(false)
        }

        document.addEventListener("pointerdown", handlePointerDown)
        document.addEventListener("keydown", handleKeyDown)

        return () => {
            document.removeEventListener("pointerdown", handlePointerDown)
            document.removeEventListener("keydown", handleKeyDown)
        }
    }, [])

    useEffect(() => {
        if(!isLogoutOpen) return undefined

        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = "hidden"

        return () => {
            document.body.style.overflow = previousOverflow
        }
    }, [isLogoutOpen])

    const closeAll = () => {
        setIsMenuOpen(false)
        setIsLogoutOpen(false)
    }

    const handleLogout = () => {
        localStorage.removeItem("token")
        notifyCartChanged()
        notifyAuthChanged()
        closeAll()
        navigate("/")
    }

    if(!me?.username){
        return (
            <Link
                className="mp-btn mp-btn-ghost"
                to="/login"
                style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}
            >
                Sign in
            </Link>
        )
    }

    return (
        <>
            <div className={`mp-usermenu ${isMenuOpen ? "is-open" : ""}`} ref={rootRef}>
                <button
                    className="mp-user mp-usermenu-btn"
                    type="button"
                    aria-haspopup="menu"
                    aria-expanded={isMenuOpen}
                    onClick={() => setIsMenuOpen((current) => !current)}
                >
                    <b>{me.username}</b>
                </button>

                <div className="mp-usermenu-pop" role="menu" aria-label="User menu">
                    {me?.role === "ADMIN" ? (
                        <Link
                            className="mp-usermenu-item"
                            to="/admin"
                            role="menuitem"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Admin panel
                        </Link>
                    ) : null}

                    {me?.role === "VENDOR" ? (
                        <Link
                            className="mp-usermenu-item"
                            to="/shop/panel"
                            role="menuitem"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Shop panel
                        </Link>
                    ) : null}

                    <Link
                        className="mp-usermenu-item"
                        to="/me"
                        role="menuitem"
                        onClick={() => setIsMenuOpen(false)}
                    >
                        Account
                    </Link>

                    <button
                        className="mp-usermenu-item mp-usermenu-danger"
                        type="button"
                        role="menuitem"
                        onClick={() => {
                            setIsMenuOpen(false)
                            setIsLogoutOpen(true)
                        }}
                    >
                        Logout
                    </button>
                </div>
            </div>

            <LogoutDialog
                open={isLogoutOpen}
                username={me.username}
                onCancel={() => setIsLogoutOpen(false)}
                onLogout={handleLogout}
            />
        </>
    )
}
