const chatbotWsInstance = {
    connectWebSocket: () => {
        const wsUrl = `${import.meta.env.VITE_WS_CHATBOT_BASE_URL.replace('http', 'ws')}/chat/ws`;
        const token = localStorage.getItem('token');
        const url = token ? `${wsUrl}?token=${token}` : wsUrl;
        return new WebSocket(url);
    }
};

export default chatbotWsInstance;
