import { BrowserRouter,Routes,Route } from "react-router-dom"
import Login from "./pages/Login"
import Register from "./pages/Register"
import MainPage from "./pages/MainPage"
import ProductDetail from "./pages/ProductDetail"
import Cart from "./pages/Cart"
import UserDetail from "./pages/UserDetail"
import Admin from "./pages/admin"
import AdminUsers from "./pages/AdminUsers"
import AdminVendors from "./pages/AdminVendors"
import AdminShops from "./pages/AdminShops"
import AdminProducts from "./pages/AdminProducts"
import CreateShop from "./pages/CreateShop"
import ShopPanel from "./pages/ShopPanel"
import ShopDetail from "./pages/ShopDetail"
import AddProduct from "./pages/AddProduct"
import UpdateProduct from "./pages/UpdateProduct"
import NotFound from "./pages/NotFound"

function App(){

    return(

        <BrowserRouter>

            <Routes>

                <Route path="/" element={<MainPage/>}/>
                <Route path="/product/:id" element={<ProductDetail/>}/>
                <Route path="/cart" element={<Cart/>}/>
                <Route path="/me" element={<UserDetail/>}/>
                <Route path="/admin" element={<Admin/>}/>
                <Route path="/admin/users" element={<AdminUsers/>}/>
                <Route path="/admin/vendors" element={<AdminVendors/>}/>
                <Route path="/admin/shops" element={<AdminShops/>}/>
                <Route path="/admin/products" element={<AdminProducts/>}/>
                <Route path="/shop/create" element={<CreateShop/>}/>
                <Route path="/shop/panel" element={<ShopPanel/>}/>
                <Route path="/shop/products/new" element={<AddProduct/>}/>
                <Route path="/shop/products/:id/edit" element={<UpdateProduct/>}/>
                <Route path="/shop/:slug" element={<ShopDetail/>}/>
                <Route path="/login" element={<Login/>}/>
                <Route path="/register" element={<Register/>}/>
                <Route path="*" element={<NotFound/>}/>

            </Routes>

        </BrowserRouter>

    )
}

export default App
