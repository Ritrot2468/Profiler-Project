import React, { useState } from 'react';
import axios from 'axios';
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Chatbot = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMessage = { role: 'user', content: input };
        setMessages([...messages, userMessage]);

        try {
            const res = await axios.post(`${BACKEND_URL}/chat`, { prompt: input });
            console.log(res.data.text);
            const botMessage = { role: 'assistant', content: res.data.text }; // Assuming `response` is in res.data
            setMessages([...messages, userMessage, botMessage]);
        } catch (err) {
            console.error('Error:', err);
        }

        setInput('');
    };

    return (
        <div>
            <div style={{ height: '400px', overflowY: 'auto' }}>
                {messages.map((msg, index) => (
                    <div key={index} style={{ textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                        <p><strong>{msg.role === 'user' ? 'You' : 'Bot'}:</strong> {msg.content}</p>
                    </div>
                ))}
            </div>

            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
            />
            <button onClick={sendMessage}>Send</button>
        </div>
    );
};

export default Chatbot;
