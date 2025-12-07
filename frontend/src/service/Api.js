import axios from "axios";

const apiClient = axios.create({
    baseURL: process.env.REACT_APP_API_URL
});

apiClient.interceptors.request.use(
    (_) =>{
        const token =sessionStorage.getItem('authToken');
        if(token){
            _.headers['Authorization'] = `Bearer ${token}`;
        }

        return _;
    },
    (error)=>{
        return Promise.reject(error);
    }
);

apiClient.interceptors.response.use(
    (_) =>_,
    async (error)=>{

        //const req = error._;

        if(error.response.status=== 401){
            window.location.href="/"
        }
        return Promise.reject(error);

    }
);

export default apiClient;