import API from "./api"

export async function getProductReviews(productId){
    const res = await API.get(`/product/${productId}/reviews`)
    return res.data
}

export async function addProductReview(productId, payload){
    const res = await API.post(`/product/${productId}/reviews`, payload)
    return res.data
}

