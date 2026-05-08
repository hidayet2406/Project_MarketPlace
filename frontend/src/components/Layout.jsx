import Navbar from "./Navbar"

export default function Layout({ children }){
    return (
        <div className="mp-shell">
            <Navbar />
            <main>
                {children}
            </main>
        </div>
    )
}
