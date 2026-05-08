import API from "./api"

export async function getCart(){
    const res = await API.get("/cart")
    return res.data
}

export async function addCartItem(productId, quantity = 1){
    const res = await API.post("/cart/items", { productId, quantity })
    return res.data
}

export async function setCartItem(productId, quantity){
    const res = await API.put("/cart/items", { productId, quantity })
    return res.data
}

export async function removeCartItem(productId){
    const res = await API.delete(`/cart/items/${productId}`)
    return res.data
}

