import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import "../styles/main.css"
import API from "../api/api"
import UserMenu from "../components/UserMenu"
import ActionToast from "../components/ActionToast"
import useCartCount from "../hooks/useCartCount"
import { notifyAuthChanged } from "../utils/authEvents"

function CartIcon(props){
    return (
        <svg className="mp-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
            <path d="M7 8h15l-1.5 8.5a2 2 0 0 1-2 1.5H9a2 2 0 0 1-2-1.7L5.4 4.5A1.8 1.8 0 0 0 3.6 3H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M9.5 22a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" fill="currentColor" opacity="0.85"/>
            <path d="M18.5 22a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" fill="currentColor" opacity="0.85"/>
        </svg>
    )
}

function Row({ label, value }){
    return (
        <div className="ud-row">
            <div className="ud-label">{label}</div>
            <div className="ud-value">{value || "-"}</div>
        </div>
    )
}

function getRoleLabel(role){
    if(!role) return "User"
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()
}



function UserDetail(){

    const navigate = useNavigate()
    const cartCount = useCartCount()

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [me, setMe] = useState(null)
    const [editing, setEditing] = useState(false)
    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState("")
    const [saveSuccess, setSaveSuccess] = useState("")
    const [toastMessage, setToastMessage] = useState("")
    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        phone: ""
    })
    const [addressEditing, setAddressEditing] = useState(false)
    const [addressSaving, setAddressSaving] = useState(false)
    const [addressError, setAddressError] = useState("")
    const [addressSuccess, setAddressSuccess] = useState("")
    const [addressForm, setAddressForm] = useState({
        street: "",
        city: "",
        state: "",
        country: "",
        zipCode: ""
    })
    const [savedAddress, setSavedAddress] = useState({
        street: "",
        city: "",
        state: "",
        country: "",
        zipCode: ""
    })
    const [vendorRequest, setVendorRequest] = useState(null)
    const [vendorLoading, setVendorLoading] = useState(false)
    const [vendorError, setVendorError] = useState("")
    const [vendorSuccess, setVendorSuccess] = useState("")
    const [shop, setShop] = useState(null)

    useEffect(() => {
        let cancelled = false

        const token = localStorage.getItem("token")
        if(!token){
            setMe(null)
            setError("Authentication required.")
            setLoading(false)
            return
        }

        const load = async () => {
            setLoading(true)
            setError("")
            try{
                const [meRes, vendorRes, shopRes, addressRes] = await Promise.all([
                    API.get("/user/findMe"),
                    API.get("/user/vendor"),
                    API.get("/shop/my"),
                    API.get("/user/address")
                ])
                if(!cancelled){
                    setMe(meRes.data)
                    setForm({
                        firstName: meRes.data?.firstName || "",
                        lastName: meRes.data?.lastName || "",
                        phone: meRes.data?.phone || ""
                    })
                    const nextAddress = {
                        street: addressRes.data?.street || "",
                        city: addressRes.data?.city || "",
                        state: addressRes.data?.state || "",
                        country: addressRes.data?.country || "",
                        zipCode: addressRes.data?.zipCode || ""
                    }
                    setAddressForm(nextAddress)
                    setSavedAddress(nextAddress)
                    setVendorRequest(vendorRes.data || null)
                    setShop(shopRes.data || null)
                }
            }catch(err){
                if(err?.response?.status === 401){
                    localStorage.removeItem("token")
                    notifyAuthChanged()
                    if(!cancelled){
                        setMe(null)
                        setError("Authentication required.")
                        setLoading(false)
                    }
                    return
                }
                if(!cancelled) setError("Failed to load user.")
            }finally{
                if(!cancelled) setLoading(false)
            }
        }

        load()
        return () => { cancelled = true }
    }, [navigate])

    useEffect(() => {
        if(!toastMessage) return undefined

        const timeout = window.setTimeout(() => {
            setToastMessage("")
            setSaveSuccess("")
            setAddressSuccess("")
        }, 1800)

        return () => window.clearTimeout(timeout)
    }, [toastMessage])

    const handleFormChange = (e) => {
        const { name, value } = e.target
        setForm((prev) => ({ ...prev, [name]: value }))
    }

    const handleAddressFormChange = (e) => {
        const { name, value } = e.target
        setAddressForm((prev) => ({ ...prev, [name]: value }))
    }

    const handleProfileSave = async (e) => {
        e.preventDefault()
        if(saving) return

        setSaving(true)
        setSaveError("")
        setSaveSuccess("")

        try{
            const res = await API.put("/user/profile", form)
            setMe(res.data)
            setForm({
                firstName: res.data?.firstName || "",
                lastName: res.data?.lastName || "",
                phone: res.data?.phone || ""
            })
            setEditing(false)
            setSaveSuccess("Profile updated.")
            setToastMessage("Profile updated.")
        }catch(err){
            if(err?.response?.status === 401){
                localStorage.removeItem("token")
                notifyAuthChanged()
                setMe(null)
                setError("Authentication required.")
                return
            }
            setSaveError("Failed to update profile.")
        }finally{
            setSaving(false)
        }
    }

    const handleVendorRequest = async () => {
        if(vendorLoading) return
        setVendorLoading(true)
        setVendorError("")
        setVendorSuccess("")
        try{
            const res = await API.post("/user/vendor")
            setVendorRequest(res.data)
            setVendorSuccess("Vendor request submitted.")
        }catch(err){
            if(err?.response?.status === 401){
                localStorage.removeItem("token")
                notifyAuthChanged()
                setMe(null)
                setError("Authentication required.")
                return
            }
            setVendorError("Failed to submit vendor request.")
        }finally{
            setVendorLoading(false)
        }
    }

    const handleAddressSave = async (e) => {
        e.preventDefault()
        if(addressSaving) return

        setAddressSaving(true)
        setAddressError("")
        setAddressSuccess("")

        try{
            const res = await API.put("/user/address", addressForm)
            setAddressForm({
                street: res.data?.street || "",
                city: res.data?.city || "",
                state: res.data?.state || "",
                country: res.data?.country || "",
                zipCode: res.data?.zipCode || ""
            })
            setSavedAddress({
                street: res.data?.street || "",
                city: res.data?.city || "",
                state: res.data?.state || "",
                country: res.data?.country || "",
                zipCode: res.data?.zipCode || ""
            })
            setAddressEditing(false)
            setAddressSuccess("Address updated.")
            setToastMessage("Address updated.")
        }catch(err){
            if(err?.response?.status === 401){
                localStorage.removeItem("token")
                notifyAuthChanged()
                setMe(null)
                setError("Authentication required.")
                return
            }
            setAddressError("Failed to update address.")
        }finally{
            setAddressSaving(false)
        }
    }

    const vendorStatusLabel = vendorRequest?.status
        ? vendorRequest.status.charAt(0).toUpperCase() + vendorRequest.status.slice(1).toLowerCase()
        : ""

    const vendorRequestedAt = vendorRequest?.created_at
        ? new Date(vendorRequest.created_at).toLocaleString()
        : ""

    const vendorApproved = vendorRequest?.status === "APPROVED" || me?.role === "VENDOR"

    const missingVendorProfileFields = [
        !String(me?.firstName || "").trim() ? "first name" : null,
        !String(me?.lastName || "").trim() ? "last name" : null,
        !String(me?.phone || "").trim() ? "phone number" : null
    ].filter(Boolean)

    const vendorProfileComplete = missingVendorProfileFields.length === 0
    const profileName = me?.username || "User"
    const profileInitial = (profileName.charAt(0) || "U").toUpperCase()

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

            <main className="mp-container ud-page">
                <nav className="pd-breadcrumb" aria-label="Breadcrumb" style={{ paddingTop: 12 }}>
                    <Link to="/" className="pd-crumb-link">Home</Link>
                    <span className="pd-sep" aria-hidden="true">/</span>
                    <span className="pd-crumb pd-crumb-current">Account</span>
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
                    <>
                        <section className="pd-card">
                            <div className="ud-hero">
                                <div className="ud-avatar" aria-hidden="true">{profileInitial}</div>
                                <div className="ud-hero-copy">
                                    <div className="ud-role-badge">{getRoleLabel(me?.role)}</div>
                                    <h1 className="pd-title" style={{ fontSize: 20 }}>{profileName}</h1>
                                </div>
                            </div>

                            <div className="ud-head">
                                <h1 className="pd-title" style={{ fontSize: 20 }}>Your account</h1>
                            </div>

                            {saveError ? (
                                <div className="pd-flash" style={{ background: "#fff2f2", borderColor: "#f1c1c1", color: "#7a0b0b", marginBottom: 10 }}>
                                    {saveError}
                                </div>
                            ) : null}

                            

                            {editing ? (
                                <form className="ud-form" onSubmit={handleProfileSave}>
                                    <div className="ud-grid">
                                        <label className="ud-input-wrap">
                                            <input
                                                name="firstName"
                                                value={form.firstName}
                                                onChange={handleFormChange}
                                                placeholder="First name"
                                                aria-label="First name"
                                            />
                                        </label>
                                        <label className="ud-input-wrap">
                                            <input
                                                name="lastName"
                                                value={form.lastName}
                                                onChange={handleFormChange}
                                                placeholder="Last name"
                                                aria-label="Last name"
                                            />
                                        </label>
                                        <Row label="Email" value={me?.email} />
                                        <label className="ud-input-wrap">
                                            <input
                                                name="phone"
                                                value={form.phone}
                                                onChange={handleFormChange}
                                                placeholder="Phone"
                                                aria-label="Phone"
                                            />
                                        </label>
                                    </div>

                                    <div className="pd-actions" style={{ marginTop: 12 }}>
                                        <button className="mp-btn mp-btn-primary" type="submit" disabled={saving}>
                                            {saving ? "Saving..." : "Save changes"}
                                        </button>
                                        <button
                                            className="mp-btn mp-ghost-link"
                                            type="button"
                                            onClick={() => {
                                                setEditing(false)
                                                setSaveError("")
                                                setForm({
                                                    firstName: me?.firstName || "",
                                                    lastName: me?.lastName || "",
                                                    phone: me?.phone || ""
                                                })
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <>
                                    <div className="ud-grid">
                                        <Row label="First name" value={me?.firstName} />
                                        <Row label="Last name" value={me?.lastName} />
                                        <Row label="Email" value={me?.email} />
                                        <Row label="Phone" value={me?.phone} />
                                    </div>

                                    <div className="pd-actions" style={{ marginTop: 12 }}>
                                        <button className="mp-btn mp-btn-primary" type="button" onClick={() => {
                                            setSaveError("")
                                            setSaveSuccess("")
                                            setEditing(true)
                                        }}>
                                            {me?.firstName || me?.lastName || me?.phone ? "Edit profile" : "Complete profile"}
                                        </button>
                                    </div>
                                </>
                            )}
                        </section>

                        <section className="pd-card">
                            <div className="ud-head">
                                <h2 className="pd-title" style={{ fontSize: 18 }}>Address</h2>
                                <div className="pd-muted">Manage your shipping address.</div>
                            </div>

                            {addressError ? (
                                <div className="pd-flash" style={{ background: "#fff2f2", borderColor: "#f1c1c1", color: "#7a0b0b", marginBottom: 10 }}>
                                    {addressError}
                                </div>
                            ) : null}

                            

                            {addressEditing ? (
                                <form className="ud-form" onSubmit={handleAddressSave}>
                                    <div className="ud-grid">
                                        <label className="ud-input-wrap">
                                            <input
                                                name="street"
                                                value={addressForm.street}
                                                onChange={handleAddressFormChange}
                                                placeholder="Street"
                                                aria-label="Street"
                                            />
                                        </label>
                                        <label className="ud-input-wrap">
                                            <input
                                                name="city"
                                                value={addressForm.city}
                                                onChange={handleAddressFormChange}
                                                placeholder="City"
                                                aria-label="City"
                                            />
                                        </label>
                                        <label className="ud-input-wrap">
                                            <input
                                                name="state"
                                                value={addressForm.state}
                                                onChange={handleAddressFormChange}
                                                placeholder="State"
                                                aria-label="State"
                                            />
                                        </label>
                                        <label className="ud-input-wrap">
                                            <input
                                                name="country"
                                                value={addressForm.country}
                                                onChange={handleAddressFormChange}
                                                placeholder="Country"
                                                aria-label="Country"
                                            />
                                        </label>
                                        <label className="ud-input-wrap">
                                            <input
                                                name="zipCode"
                                                value={addressForm.zipCode}
                                                onChange={handleAddressFormChange}
                                                placeholder="Zip code"
                                                aria-label="Zip code"
                                            />
                                        </label>
                                    </div>

                                    <div className="pd-actions" style={{ marginTop: 12 }}>
                                        <button className="mp-btn mp-btn-primary" type="submit" disabled={addressSaving}>
                                            {addressSaving ? "Saving..." : "Save address"}
                                        </button>
                                        <button
                                            className="mp-btn mp-ghost-link"
                                            type="button"
                                            onClick={() => {
                                                setAddressEditing(false)
                                                setAddressError("")
                                                setAddressForm(savedAddress)
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <>
                                    <div className="ud-grid">
                                        <Row label="Street" value={addressForm.street} />
                                        <Row label="City" value={addressForm.city} />
                                        <Row label="State" value={addressForm.state} />
                                        <Row label="Country" value={addressForm.country} />
                                        <Row label="Zip code" value={addressForm.zipCode} />
                                    </div>

                                    <div className="pd-actions" style={{ marginTop: 12 }}>
                                        <button className="mp-btn mp-btn-primary" type="button" onClick={() => {
                                            setAddressError("")
                                            setAddressSuccess("")
                                            setAddressEditing(true)
                                        }}>
                                            {addressForm.street || addressForm.city || addressForm.state || addressForm.country || addressForm.zipCode ? "Edit address" : "Add address"}
                                        </button>
                                    </div>
                                </>
                            )}
                        </section>

                        {me?.role !== "ADMIN" ? (
                            <section className="pd-card">
                                <div className="ud-head">
                                    <h2 className="pd-title" style={{ fontSize: 18 }}>Vendor request</h2>
                                    <div className="pd-muted">Request access to sell products on NovaMart.</div>
                                </div>

                                {!vendorProfileComplete && !vendorRequest?.status ? (
                                    <div className="pd-flash" style={{ background: "#fff7e6", borderColor: "#f1d2a3", color: "#7a4b00" }}>
                                        Complete your {missingVendorProfileFields.join(", ")} before requesting vendor access.
                                    </div>
                                ) : null}

                                {vendorRequest?.status ? (
                                    <div className="pd-box" style={{ marginBottom: 10 }}>
                                        <div className="pd-box-row">
                                            <div><strong>Status:</strong> {vendorStatusLabel || "Approved"}</div>
                                            {vendorRequestedAt ? <div><strong>Requested:</strong> {vendorRequestedAt}</div> : null}
                                        </div>
                                    </div>
                                ) : null}

                                {vendorApproved ? (
                                    <div className="pd-box" style={{ marginBottom: 10 }}>
                                        <div className="pd-box-row">
                                            <div><strong>Seller access:</strong> Approved</div>
                                            <div>{shop?.name ? `Shop ready: ${shop.name}` : "You can create your shop now."}</div>
                                        </div>
                                    </div>
                                ) : null}

                                {vendorError ? (
                                    <div className="pd-flash" style={{ background: "#fff2f2", borderColor: "#f1c1c1", color: "#7a0b0b" }}>
                                        {vendorError}
                                    </div>
                                ) : null}

                                

                                <div className="pd-actions" style={{ marginTop: 10 }}>
                                    {vendorApproved ? (
                                        <button
                                            className="mp-btn mp-btn-primary"
                                            type="button"
                                            onClick={() => navigate(shop?.name ? "/shop/panel" : "/shop/create")}
                                        >
                                            {shop?.name ? "Open shop panel" : "Create shop"}
                                        </button>
                                    ) : (
                                        <button
                                            className="mp-btn mp-btn-primary"
                                            onClick={handleVendorRequest}
                                            disabled={vendorLoading || !!vendorRequest?.status || !vendorProfileComplete}
                                        >
                                            {vendorLoading
                                                ? "Requesting..."
                                                : vendorRequest?.status
                                                    ? "Request submitted"
                                                    : !vendorProfileComplete
                                                        ? "Complete profile first"
                                                        : "Request vendor access"}
                                        </button>
                                    )}

                                    {!vendorProfileComplete && !vendorRequest?.status ? (
                                        <button
                                            className="mp-btn mp-ghost-link"
                                            type="button"
                                            onClick={() => {
                                                setSaveError("")
                                                setSaveSuccess("")
                                                setEditing(true)
                                            }}
                                        >
                                            Complete profile
                                        </button>
                                    ) : null}
                                </div>
                            </section>
                        ) : null}
                    </>
                )}

                <footer className="mp-footer">
                    <div className="mp-footer-row">
                        <div>NovaMart. Built for your e-commerce MVP.</div>
                    </div>
                </footer>
            </main>

            <ActionToast message={toastMessage} onClose={() => setToastMessage("")} />
        </div>
    )
}

export default UserDetail



