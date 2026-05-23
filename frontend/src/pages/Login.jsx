import { useState } from "react"
import API from "../api/api"
import { Link, useNavigate } from "react-router-dom"
import "../styles/main.css"
import "../styles/auth.css"
import { notifyAuthChanged } from "../utils/authEvents"
import ActionToast from "../components/ActionToast"

function Login(){

    const navigate = useNavigate()
    const [showPassword, setShowPassword] = useState(false)
    const [showForgot, setShowForgot] = useState(false)
    const [toastMessage, setToastMessage] = useState("")

    const [form,setForm] = useState({
        username:"",
        password:""
    })

    const [resetForm, setResetForm] = useState({
        username: "",
        newPassword: "",
        confirmPassword: ""
    })

    const handleChange = (e)=>{
        setForm({...form,[e.target.name]:e.target.value})
    }

    const handleResetChange = (e) => {
        setResetForm({...resetForm, [e.target.name]: e.target.value})
    }

    const login = async ()=>{
        try{

            const res = await API.post("/auth/login",form)

            const token = String(res.data || "")
            const isJwt = (token.split(".").length === 3)

            if(!isJwt){
                localStorage.removeItem("token")
                setToastMessage("Login failed (invalid token).")
                setTimeout(() => setToastMessage(""), 3000)
                return
            }

            localStorage.setItem("token", token)
            notifyAuthChanged()

            navigate("/")

        }catch(err){
            localStorage.removeItem("token")
            const msg = err?.response?.data?.message || err?.response?.data || "Login failed"
            setToastMessage(msg)
            setTimeout(() => setToastMessage(""), 3000)
        }
    }

    const handleResetPassword = async () => {
        if (!resetForm.username || !resetForm.newPassword || !resetForm.confirmPassword) {
            setToastMessage("Please fill all fields")
            setTimeout(() => setToastMessage(""), 3000)
            return
        }
        if (resetForm.newPassword !== resetForm.confirmPassword) {
            setToastMessage("Passwords do not match")
            setTimeout(() => setToastMessage(""), 3000)
            return
        }
        
        try {
            const res = await API.post("/auth/reset-password", {
                username: resetForm.username,
                newPassword: resetForm.newPassword
            });
            setToastMessage(res.data || "Password reset successful");
            setShowForgot(false);
            setResetForm({ username: "", newPassword: "", confirmPassword: "" });
            setTimeout(() => setToastMessage(""), 3000);
        } catch (err) {
            const msg = err?.response?.data?.message || err?.response?.data || "Reset failed";
            setToastMessage(msg);
            setTimeout(() => setToastMessage(""), 3000);
        }
    }

    return(

        <div className="auth-page">
        <div className="auth-container">
            <h2>Login</h2>

            <input name="username" placeholder="Username" onChange={handleChange}/>
            <div className="auth-field">
                <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    onChange={handleChange}
                />
                <button
                    className="auth-eye"
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                >
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path
                            d="M12 5C6.5 5 2.1 8.6 1 12c1.1 3.4 5.5 7 11 7s9.9-3.6 11-7c-1.1-3.4-5.5-7-11-7Zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z"
                            fill="currentColor"
                        />
                    </svg>
                </button>
            </div>

            <button onClick={login}>Login</button>

            <div className="auth-link" style={{ textAlign: "left", fontSize: "16px", marginTop: "10px" }}>
                <button 
                    className="auth-forgot-btn"
                    type="button" 
                    onClick={() => setShowForgot(true)}
                >
                    Forgot Password
                </button>
            </div>

            <div className="auth-link" style={{ marginTop: 40 }}>
                No account? <Link to="/register">Create one</Link>
            </div>

        </div>

        {showForgot && (
            <div className="auth-modal-backdrop">
                <div className="auth-modal">
                    <h3>Reset Password</h3>
                    <input 
                        name="username" 
                        placeholder="Username" 
                        value={resetForm.username}
                        onChange={handleResetChange}
                    />
                    <input 
                        name="newPassword" 
                        type="password" 
                        placeholder="New Password" 
                        value={resetForm.newPassword}
                        onChange={handleResetChange}
                    />
                    <input 
                        name="confirmPassword" 
                        type="password" 
                        placeholder="Confirm Password" 
                        value={resetForm.confirmPassword}
                        onChange={handleResetChange}
                    />
                    <div className="auth-modal-actions">
                        <button className="auth-modal-btn auth-modal-btn-primary" onClick={handleResetPassword}>Reset Password</button>
                        <button className="auth-modal-btn auth-modal-btn-ghost" onClick={() => setShowForgot(false)}>Cancel</button>
                    </div>
                </div>
            </div>
        )}

        <ActionToast message={toastMessage} onClose={() => setToastMessage("")} />
        </div>
    )
}

export default Login
