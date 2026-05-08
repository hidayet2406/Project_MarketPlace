import { Link } from "react-router-dom"
import "../styles/main.css"

export default function NotFound(){
    return (
        <div className="mp-shell">
            <header className="mp-topbar">
                <div className="mp-container mp-topbar-inner">
                    <Link className="mp-brand" to="/">
                        <div className="mp-mark" aria-hidden="true" />
                        <div className="mp-brand-name">NovaMart</div>
                    </Link>
                </div>
            </header>

            <main className="mp-container" style={{ paddingTop: 40, textAlign: "center" }}>
                <h1 className="mp-h1">404 - Page Not Found</h1>
                <p className="mp-lede" style={{ margin: "20px auto" }}>
                    The page you are looking for does not exist or has been moved.
                </p>
                <Link to="/" className="mp-btn mp-btn-primary" style={{ display: "inline-block", textDecoration: "none" }}>
                    Go to Homepage
                </Link>
            </main>
        </div>
    )
}
