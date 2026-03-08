import axios from 'axios';

// Using localtunnel to bypass strict Wi-Fi isolation
export const BASE_URL = 'https://agent-stitch-backend.loca.lt';

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 60000,
    headers: {
        'Bypass-Tunnel-Reminder': 'true'
    }
});

export default api;
