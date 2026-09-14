import axios from "axios";
export const api = axios.create({
    baseURL:'/api',
    headers:{
        'Content-Type':'application/json'
    },
    withCredentials:true
});

api.interceptors.response.use(
    (response)=> response,
    (error)=>{
        const customError = error.response.data.error || error.message || "An unexpected error occurred"
        return Promise.reject(new Error(customError));
    }
)