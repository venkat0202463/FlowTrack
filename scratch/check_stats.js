import axios from 'axios';

async function checkStats() {
    try {
        const response = await axios.get('http://localhost:8080/api/stats/summary');
        console.log(response.data);
    } catch (error) {
        console.error("API Call failed:", error.message);
    }
}

checkStats();
