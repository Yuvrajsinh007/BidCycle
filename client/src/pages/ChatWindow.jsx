import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import io from 'socket.io-client';
import { 
  Send, 
  User, 
  ArrowLeft, 
  Paperclip, 
  Image as ImageIcon, 
  Video, 
  FileText, 
  MapPin,
  X
} from 'lucide-react';

const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000');

const ChatWindow = () => {
  const { itemId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [item, setItem] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [file, setFile] = useState(null); // For attachments
  const [fileType, setFileType] = useState('text'); 
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const initChat = async () => {
      try {
        const itemRes = await api.get(`/items/${itemId}`);
        setItem(itemRes.data);
        
        const msgRes = await api.get(`/chat/${itemId}`);
        setMessages(msgRes.data);
        
        // Join the specific chat room
        socket.emit('join_chat', itemId);
      } catch (error) {
        console.error("Chat load error", error);
      }
    };
    initChat();

    // Listener for incoming messages
    socket.on('receive_message', (message) => {
        // Prevent duplicate messages if we added it optimistically
        setMessages((prev) => {
            // Check if we have a temp message with this content/timestamp logic (simplified check here)
            // Ideally, backend returns a temp ID, but here we just append if it's from the OTHER person
            // OR if it's from me but confirming the optimistic add.
            // Simple logic: Just append. 
            // Better logic for smoothness: If it's my message, I already added it. 
            // But to be safe and simple: Filter duplicates by ID if available.
            if (prev.some(m => m._id === message._id)) return prev;
            return [...prev, message];
        });
    });

    return () => {
      socket.off('receive_message');
    };
  }, [itemId]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- Handlers ---

  const handleFileSelect = (e, type) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setFileType(type);
      setShowAttachMenu(false);
    }
  };

  const handleLocation = () => {
    if (!navigator.geolocation) return alert('Geolocation not supported');
    navigator.geolocation.getCurrentPosition((pos) => {
       sendMessage(null, 'location', { lat: pos.coords.latitude, lng: pos.coords.longitude });
       setShowAttachMenu(false);
    });
  };

  const sendMessage = async (content, type = 'text', extraData = {}) => {
    if (!content && !file && type === 'text') return;

    // 1. Prepare Form Data (for file upload support)
    const formData = new FormData();
    formData.append('itemId', itemId);
    
    // Determine receiver
    const receiverId = user._id === item.seller._id ? item.winner._id : item.seller._id;
    formData.append('receiverId', receiverId);
    formData.append('type', type);
    
    if (content) formData.append('content', content);
    if (file) formData.append('file', file);
    if (extraData.lat) {
        formData.append('lat', extraData.lat);
        formData.append('lng', extraData.lng);
    }

    // 2. Optimistic UI Update (Show immediately)
    const tempMsg = {
        _id: Date.now(), // Temp ID
        sender: { _id: user._id, name: user.name }, // Me
        content: content || (type === 'location' ? 'Shared Location' : 'Sent a file'),
        type: type,
        mediaUrl: file ? URL.createObjectURL(file) : null,
        location: extraData.lat ? extraData : null,
        createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);
    
    // Reset Input
    setNewMessage("");
    setFile(null);
    setIsSending(true);

    try {
      // 3. Send to Server
      await api.post('/chat', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setIsSending(false);
    } catch (error) {
      console.error("Send error", error);
      setIsSending(false);
      // Ideally remove the temp message or show error
    }
  };

  if (!item) return <div className="flex justify-center items-center h-screen">Loading Chat...</div>;

  const otherUser = user._id === item.seller._id ? item.winner : item.seller;

  return (
    // MAIN CONTAINER: Fixed Height, calculated to fit viewport minus Navbar
    // Ensure your Navbar is fixed or this calculation matches your layout
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-100">
      
      {/* 1. STICKY HEADER (Flex Item 1: Fixed Height) */}
      <div className="flex-none bg-white shadow-sm p-4 flex items-center gap-4 z-20">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                {otherUser?.name?.[0]}
            </div>
            <div>
                <h2 className="font-bold text-gray-800 leading-tight">{item.title}</h2>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                    <User className="w-3 h-3" /> 
                    {otherUser?.name}
                </div>
            </div>
        </div>
      </div>

      {/* 2. MESSAGES AREA (Flex Item 2: Grows & Scrolls) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
        {messages.map((msg, index) => {
            const isMe = msg.sender._id === user._id;
            return (
                <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] sm:max-w-[70%] p-3 rounded-2xl shadow-sm relative ${
                        isMe ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none'
                    }`}>
                        {/* Render Content Based on Type */}
                        {msg.type === 'text' && <p>{msg.content}</p>}
                        
                        {msg.type === 'image' && (
                            <img src={msg.mediaUrl} alt="attachment" className="rounded-lg max-h-60 object-cover" />
                        )}
                        
                        {msg.type === 'video' && (
                            <video src={msg.mediaUrl} controls className="rounded-lg max-h-60 w-full" />
                        )}

                        {msg.type === 'document' && (
                            <a href={msg.mediaUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 underline">
                                <FileText className="w-5 h-5" /> View Document
                            </a>
                        )}

                        {msg.type === 'location' && (
                            <a 
                                href={`https://www.google.com/maps?q=${msg.location?.lat},${msg.location?.lng}`} 
                                target="_blank" 
                                rel="noreferrer"
                                className="flex items-center gap-2 underline"
                            >
                                <MapPin className="w-5 h-5" /> View Location
                            </a>
                        )}

                        <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                    </div>
                </div>
            );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. INPUT AREA (Flex Item 3: Fixed Height) */}
      <div className="flex-none bg-white p-3 border-t relative">
        
        {/* Attachment Preview */}
        {file && (
            <div className="absolute bottom-full left-4 bg-white p-2 rounded-t-lg border border-b-0 shadow-sm flex items-center gap-2">
                <span className="text-xs text-gray-600 truncate max-w-[150px]">{file.name}</span>
                <button onClick={() => setFile(null)} className="text-red-500 hover:text-red-700"><X className="w-4 h-4"/></button>
            </div>
        )}

        {/* Attachment Menu */}
        {showAttachMenu && (
            <div className="absolute bottom-16 left-4 bg-white rounded-xl shadow-xl border border-gray-100 p-2 flex gap-4 animate-in slide-in-from-bottom-2">
                <label className="cursor-pointer flex flex-col items-center gap-1 p-2 hover:bg-gray-50 rounded-lg text-gray-600">
                    <ImageIcon className="w-6 h-6 text-blue-500" />
                    <span className="text-[10px]">Image</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, 'image')} />
                </label>
                <label className="cursor-pointer flex flex-col items-center gap-1 p-2 hover:bg-gray-50 rounded-lg text-gray-600">
                    <Video className="w-6 h-6 text-red-500" />
                    <span className="text-[10px]">Video</span>
                    <input type="file" accept="video/*" className="hidden" onChange={(e) => handleFileSelect(e, 'video')} />
                </label>
                <label className="cursor-pointer flex flex-col items-center gap-1 p-2 hover:bg-gray-50 rounded-lg text-gray-600">
                    <FileText className="w-6 h-6 text-orange-500" />
                    <span className="text-[10px]">Doc</span>
                    <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => handleFileSelect(e, 'document')} />
                </label>
                <button onClick={handleLocation} className="flex flex-col items-center gap-1 p-2 hover:bg-gray-50 rounded-lg text-gray-600">
                    <MapPin className="w-6 h-6 text-green-500" />
                    <span className="text-[10px]">Location</span>
                </button>
            </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); sendMessage(newMessage); }} className="flex gap-2 items-center">
            <button 
                type="button" 
                onClick={() => setShowAttachMenu(!showAttachMenu)}
                className={`p-3 rounded-full transition-colors ${showAttachMenu ? 'bg-gray-200 text-gray-800' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            >
                <Paperclip className="w-5 h-5" />
            </button>
            
            <input 
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 p-3 bg-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
            
            <button 
                type="submit" 
                disabled={isSending || (!newMessage.trim() && !file)}
                className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200"
            >
                <Send className="w-5 h-5" />
            </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;