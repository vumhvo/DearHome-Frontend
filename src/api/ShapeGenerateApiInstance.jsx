import axios from 'axios';

// Create a shape generation API instance with common configuration
const shapeGenerateApiInstance = axios.create({
    baseURL: `${import.meta.env.VITE_API_CHATBOT_AND_3D_GENERATION_BASE_URL}`, // Assuming shapes endpoint
    timeout: 1000000,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Request interceptor for adding auth token
shapeGenerateApiInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for handling common errors
shapeGenerateApiInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Handle unauthorized errors (401)
        if (error.response && error.response.status === 401) {
            // Clear local storage and redirect to login
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/#/auth/login';
        }
        return Promise.reject(error);
    }
);

export default shapeGenerateApiInstance;
