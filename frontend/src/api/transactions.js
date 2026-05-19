import API from "./api"

export async function checkoutWithWallet(payload){
    const res = await API.post("/transaction/wallet/checkout", payload)
    return res.data
}
