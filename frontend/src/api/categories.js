import API from "./api"

export async function getCategories(){
    const res = await API.get("/category/getCategories")
    return res.data
}

