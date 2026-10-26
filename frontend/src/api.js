import axios from 'axios';

const api = axios.create({
 baseURL: 'http://26.82.91.31:8000'
});

export default api;