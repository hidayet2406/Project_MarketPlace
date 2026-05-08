import API from "./api"

export async function getAllProducts(){
    const res = await API.get("/product/getAllProducts")
    return res.data
}

export async function getProduct(id){
    const res = await API.get(`/product/getProduct/${id}`)
    return res.data
}

