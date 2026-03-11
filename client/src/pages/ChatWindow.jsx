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
  X,
  CreditCard // Added for payment icon
} from 'lucide-react';

const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000');

const ChatWindow = () => {
  const { itemId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [item, setItem] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [file, setFile] = useState(null); 
  const [fileType, setFileType] = useState('text'); 
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false); // Added for loading state
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const initChat = async () => {
      try {
        const itemRes = await api.get(`/items/${itemId}`);
        setItem(itemRes.data);
        
        const msgRes = await api.get(`/chat/${itemId}`);
        setMessages(msgRes.data);
        
        socket.emit('join_chat', itemId);
      } catch (error) {
        console.error("Chat load error", error);
      }
    };
    initChat();

    socket.on('receive_message', (message) => {
      setMessages((prev) => {
        if (prev.some(m => m._id === message._id)) return prev;
        return [...prev, message];
      });
    });

    // NEW: Listener for real-time payment confirmation
    socket.on('payment_received', (data) => {
      if (data.itemId === itemId) {
        setItem(prev => ({ ...prev, status: 'paid' }));
        // Add a system notification message to the chat
        const systemMsg = {
          _id: Date.now(),
          type: 'text',
          content: "📢 Payment confirmed! Transaction complete.",
          sender: { _id: 'system', name: 'System' },
          createdAt: new Date().toISOString()
        };
        setMessages(prev => [...prev, systemMsg]);
      }
    });

    return () => {
      socket.off('receive_message');
      socket.off('payment_received');
    };
  }, [itemId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFileSelect = (e, type) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setFileType(type);
      setShowAttachMenu(false);
    }
  };

  // NEW: Payment Handler
  const handlePayment = async () => {
    try {
      // 1. Create order on backend
      const { data } = await api.post(`/payment/create-order/${itemId}`);
  
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID, // Your public Key ID
        amount: data.amount,
        currency: data.currency,
        name: "BidCycle",
        description: `Payment for ${data.name}`,
        order_id: data.orderId,
        handler: async function (response) {
          // 2. Verification call
          try {
            await api.post('/payment/verify', {
              ...response,
              itemId,
              amount: data.amount
            });
            // Status will update via socket listener automatically
          } catch (err) {
            alert("Payment verification failed");
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone
        },
        theme: { color: "#4F46E5" } // Indigo-600 to match your UI
      };
  
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      alert("Could not initiate payment");
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

    const formData = new FormData();
    formData.append('itemId', itemId);
    
    const receiverId = user._id === item.seller._id ? item.winner._id : item.seller._id;
    formData.append('receiverId', receiverId);
    formData.append('type', type);
    
    if (content) formData.append('content', content);
    if (file) formData.append('file', file);
    if (extraData.lat) {
        formData.append('lat', extraData.lat);
        formData.append('lng', extraData.lng);
    }

    const tempMsg = {
        _id: Date.now(),
        sender: { _id: user._id, name: user.name },
        content: content || (type === 'location' ? 'Shared Location' : 'Sent a file'),
        type: type,
        mediaUrl: file ? URL.createObjectURL(file) : null,
        location: extraData.lat ? extraData : null,
        createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);
    
    setNewMessage("");
    setFile(null);
    setIsSending(true);

    try {
      await api.post('/chat', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setIsSending(false);
    } catch (error) {
      console.error("Send error", error);
      setIsSending(false);
    }
  };

  if (!item) return <div className="flex justify-center items-center h-screen text-indigo-600 font-medium">Loading Chat...</div>;

  const otherUser = user._id === item.seller._id ? item.winner : item.seller;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-100">
      
      {/* 1. HEADER */}
      <div className="flex-none bg-white shadow-sm p-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                  {otherUser?.name?.[0]}
              </div>
              <div>
                  <h2 className="font-bold text-gray-800 leading-tight truncate max-w-[150px] sm:max-w-md">{item.title}</h2>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                      <User className="w-3 h-3" /> 
                      {otherUser?.name}
                  </div>
              </div>
          </div>
        </div>

        {/* Display Badge for Paid Status */}
        {item.status === 'paid' && (
          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-200 uppercase">
            Paid
          </span>
        )}
      </div>

      {/* 2. MESSAGES AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
        {messages.map((msg, index) => {
            const isMe = msg.sender._id === user._id;
            const isSystem = msg.sender._id === 'system';
            
            if (isSystem) {
              return (
                <div key={index} className="flex justify-center">
                  <div className="bg-gray-200/80 text-gray-600 text-[11px] px-4 py-1 rounded-full font-medium">
                    {msg.content}
                  </div>
                </div>
              );
            }

            return (
                <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] sm:max-w-[70%] p-3 rounded-2xl shadow-sm relative ${
                        isMe ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none'
                    }`}>
                        {msg.type === 'text' && <p className="text-sm whitespace-pre-wrap">{msg.content}</p>}
                        
                        {msg.type === 'image' && (
                            <img src={msg.mediaUrl} alt="attachment" className="rounded-lg max-h-60 object-cover w-full cursor-pointer" onClick={() => window.open(msg.mediaUrl)} />
                        )}
                        
                        {msg.type === 'video' && (
                            <video src={msg.mediaUrl} controls className="rounded-lg max-h-60 w-full" />
                        )}

                        {msg.type === 'document' && (
                            <a href={msg.mediaUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 underline text-sm">
                                <FileText className="w-5 h-5" /> View Document
                            </a>
                        )}

                        {msg.type === 'location' && (
                            <a 
                                href={`https://www.google.com/maps?q=${msg.location?.lat},${msg.location?.lng}`} 
                                target="_blank" 
                                rel="noreferrer"
                                className="flex items-center gap-2 underline text-sm"
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

      {/* 3. POST-AUCTION PAYMENT ACTION */}
      {item.status === 'sold' && user._id === item.winner?._id && (
        <div className="flex-none bg-indigo-50 p-4 border-t border-indigo-100 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-4xl mx-auto">
            <div className="text-center sm:text-left">
              <p className="text-indigo-900 font-bold text-sm">Congratulations! You won this item.</p>
              <p className="text-indigo-700 text-xs">Complete your payment of <span className="font-bold">${item.currentBid}</span> to finalize the deal.</p>
            </div>
            <button 
              onClick={handlePayment}
              disabled={isProcessingPayment}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95 disabled:opacity-70"
            >
              {isProcessingPayment ? "Processing..." : <><CreditCard className="w-4 h-4" /> Pay Now</>}
            </button>
          </div>
        </div>
      )}

      {/* 4. INPUT AREA */}
      <div className="flex-none bg-white p-3 border-t relative">
        {file && (
            <div className="absolute bottom-full left-4 bg-white p-2 rounded-t-lg border border-b-0 shadow-sm flex items-center gap-2">
                <span className="text-xs text-gray-600 truncate max-w-[150px]">{file.name}</span>
                <button onClick={() => setFile(null)} className="text-red-500 hover:text-red-700"><X className="w-4 h-4"/></button>
            </div>
        )}

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