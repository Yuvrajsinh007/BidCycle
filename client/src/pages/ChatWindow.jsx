import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import io from 'socket.io-client';
import { 
  Send, User, ArrowLeft, Paperclip, Image as ImageIcon, Video, FileText, MapPin, X, CreditCard, ShieldCheck
} from 'lucide-react';

const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
  transports: ['websocket']
});

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
  const [isProcessingPayment, setIsProcessingPayment] = useState(false); 
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const handleConnect = () => { socket.emit('join_chat', itemId); };
    if (socket.connected) handleConnect();
    socket.on('connect', handleConnect);

    const initChat = async () => {
      try {
        const itemRes = await api.get(`/items/${itemId}`);
        setItem(itemRes.data);
        const msgRes = await api.get(`/chat/${itemId}`);
        setMessages(msgRes.data);
      } catch (e) { console.error(e); }
    };
    initChat();

    const handleReceiveMessage = (message) => {
      setMessages(p => {
        // If already exists by DB id, do nothing
        if (p.some(m => m._id === message._id)) return p;
        // Check for an optimistic UI message match
        const isOptimistic = p.some(m => m.content === message.content && m.sender._id === message.sender._id && typeof m._id === 'number');
        if (isOptimistic) {
          return p.map(m => (m.content === message.content && m.sender._id === message.sender._id && typeof m._id === 'number') ? message : m);
        }
        return [...p, message];
      });
    };

    socket.on('receive_message', handleReceiveMessage);

    socket.on('payment_received', (data) => {
      if (data.itemId === itemId) {
        setItem(prev => ({ ...prev, status: 'paid' }));
        setMessages(p => [...p, { _id: Date.now(), type: 'text', content: "📢 Capital Secured! Contract settled.", sender: { _id: 'system', name: 'System' }, createdAt: new Date().toISOString() }]);
      }
    });

    return () => { 
        socket.off('connect', handleConnect);
        socket.off('receive_message', handleReceiveMessage); 
        socket.off('payment_received'); 
    };
  }, [itemId]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleFileSelect = (e, type) => {
    if (e.target.files[0]) { setFile(e.target.files[0]); setFileType(type); setShowAttachMenu(false); }
  };

  const handlePayment = async () => {
    try {
      setIsProcessingPayment(true);
      const { data } = await api.post(`/payment/create-order/${itemId}`);
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID, 
        amount: data.amount, currency: data.currency, name: "BidCycle", description: `Authorization for ${data.name}`, order_id: data.orderId,
        handler: async function (res) {
          try { await api.post('/payment/verify', { ...res, itemId, amount: data.amount }); } 
          catch (e) { alert("Verification intercepted."); }
        },
        prefill: { name: user.name, email: user.email, contact: user.phone },
        theme: { color: "#1e293b" } 
      };
      const rzp = new window.Razorpay(options); rzp.open();
    } catch (e) { alert("System rejected interface initialization."); }
    finally { setIsProcessingPayment(false); }
  };

  const handleLocation = () => {
    if (!navigator.geolocation) return alert('Geo-tracking unavailable.');
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
    if (extraData.lat) { formData.append('lat', extraData.lat); formData.append('lng', extraData.lng); }

    const tempMsg = {
        _id: Date.now(), sender: { _id: user._id, name: user.name },
        content: content || (type === 'location' ? 'Transmitted Coordinates' : 'Transmitted Payload'),
        type: type, mediaUrl: file ? URL.createObjectURL(file) : null, location: extraData.lat ? extraData : null, createdAt: new Date().toISOString()
    };
    setMessages(p => [...p, tempMsg]); setNewMessage(""); setFile(null); setIsSending(true);

    try { await api.post('/chat', formData, { headers: { 'Content-Type': 'multipart/form-data' } }); } 
    finally { setIsSending(false); }
  };

  if (!item) return <div className="h-screen flex items-center justify-center bg-slate-50"><div className="w-10 h-10 border-4 border-slate-200 border-t-brand-600 rounded-full animate-spin"/></div>;

  const otherUser = user._id === item.seller._id ? item.winner : item.seller;

  if (!otherUser) {
    return (
      <div className="h-[calc(100vh-80px)] mt-20 flex items-center justify-center bg-slate-50">
         <div className="text-center p-8 bg-white border border-slate-100 shadow-xl shadow-slate-200/50 rounded-[2rem] max-w-sm">
            <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-black text-slate-900 mb-2">Chat Unavailable</h2>
            <p className="text-slate-500 font-medium mb-6">This communication channel is strictly reserved for the seller and the auction winner.</p>
            <button onClick={() => navigate(-1)} className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl shadow-md hover:bg-slate-800 transition-colors">Return</button>
         </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-slate-50 relative mt-20 max-w-5xl mx-auto md:p-6 p-0 animate-fadeIn">
      
      <div className="flex flex-col h-full bg-white md:rounded-[2rem] md:shadow-2xl md:shadow-slate-200/50 md:border md:border-slate-100 overflow-hidden relative">
        <div className="flex-none bg-slate-900 text-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-brand-500 opacity-20 blur-2xl"></div>
          
          <div className="flex items-center gap-4 relative z-10">
            <button onClick={() => navigate(-1)} className="w-12 h-12 flex items-center justify-center bg-slate-800 hover:bg-slate-700 rounded-full transition-colors active:scale-95"><ArrowLeft className="w-5 h-5 text-white" /></button>
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-slate-800 rounded-full flex items-center justify-center text-white font-black text-2xl border-2 border-slate-700 shadow-xl">
                    {otherUser?.name?.[0]}
                </div>
                <div>
                    <h2 className="font-black text-white text-xl leading-tight truncate max-w-[200px] md:max-w-md uppercase tracking-tight">{item.title}</h2>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mt-1">
                        <User className="w-3 h-3 text-brand-400" /> Secure Protocol with <span className="text-white">{otherUser?.name}</span>
                    </div>
                </div>
            </div>
          </div>

          <div className="relative z-10">
            {item.status === 'paid' ? (
              <span className="bg-brand-500 flex items-center justify-center gap-1.5 text-white px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase shadow-lg shadow-brand-500/20">
                 <ShieldCheck className="w-4 h-4" /> Settlement Finalized
              </span>
            ) : (
                <span className="bg-slate-800 flex items-center justify-center gap-1.5 text-slate-300 px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase border border-slate-700">
                   Escrow Pending
                </span>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 custom-scrollbar">
          {messages.map((msg, idx) => {
              const isMe = msg.sender._id === user._id;
              const isSystem = msg.sender._id === 'system';
              
              if (isSystem) return (
                  <div key={idx} className="flex justify-center my-6">
                    <div className="bg-brand-50 text-brand-700 border border-brand-100 text-[10px] font-black uppercase tracking-widest px-6 py-2 rounded-xl shadow-sm">
                      {msg.content}
                    </div>
                  </div>
              );

              return (
                  <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] sm:max-w-[70%] p-4 rounded-[1.5rem] shadow-sm relative ${
                          isMe ? 'bg-brand-600 text-white rounded-br-none shadow-brand-600/20' : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none shadow-slate-200/50'
                      }`}>
                          {msg.type === 'text' && <p className="text-[15px] font-medium leading-relaxed whitespace-pre-wrap">{msg.content}</p>}
                          {msg.type === 'image' && <img src={msg.mediaUrl} alt="payload" className="rounded-xl mt-2 max-h-64 object-cover w-full cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(msg.mediaUrl)} />}
                          {msg.type === 'video' && <video src={msg.mediaUrl} controls className="rounded-xl mt-2 max-h-64 w-full bg-black" />}
                          {msg.type === 'document' && <a href={msg.mediaUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 underline text-sm mt-2 font-bold"><FileText className="w-5 h-5" /> Inspect File</a>}
                          {msg.type === 'location' && <a href={`https://www.google.com/maps?q=${msg.location?.lat},${msg.location?.lng}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 underline text-sm mt-2 font-bold"><MapPin className="w-5 h-5" /> Execute Map Coordinates</a>}
                          <p className={`text-[10px] uppercase font-black tracking-widest mt-3 text-right ${isMe ? 'text-brand-300' : 'text-slate-400'}`}>
                              {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                      </div>
                  </div>
              );
          })}
          <div ref={messagesEndRef} />
        </div>

        {item.status === 'sold' && user._id === item.winner?._id && (
          <div className="flex-none bg-brand-50 p-6 border-t border-brand-100 z-10 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 max-w-4xl mx-auto">
              <div className="text-center sm:text-left">
                <p className="text-brand-900 font-extrabold text-lg">Auction Triumph Detected</p>
                <p className="text-brand-700 text-sm font-medium mt-1">Execute capital transfer of <span className="font-black text-brand-900 bg-brand-200 px-2 py-0.5 rounded-md">${item.currentBid}</span> to initiate cargo release.</p>
              </div>
              <button onClick={handlePayment} disabled={isProcessingPayment} className="w-full sm:w-auto flex items-center justify-center gap-3 bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-xl font-black transition-all shadow-xl shadow-slate-900/20 active:scale-95 disabled:opacity-70 text-sm tracking-wide uppercase">
                {isProcessingPayment ? "Executing..." : <><CreditCard className="w-5 h-5" /> Authorize Payment</>}
              </button>
            </div>
          </div>
        )}

        <div className="flex-none bg-white p-4 sm:p-6 border-t border-slate-100 relative z-20">
          {file && (
              <div className="absolute bottom-full left-6 bg-white p-3 rounded-t-2xl border border-b-0 border-slate-100 shadow-[0_-10px_20px_-15px_rgba(0,0,0,0.1)] flex items-center gap-3 z-30">
                  <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center"><Paperclip className="w-4 h-4 text-brand-600"/></div>
                  <span className="text-xs font-bold text-slate-700 max-w-[150px] truncate">{file.name}</span>
                  <button onClick={() => setFile(null)} className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center hover:bg-red-100 hover:text-red-500 transition-colors"><X className="w-3 h-3"/></button>
              </div>
          )}

          {showAttachMenu && (
              <div className="absolute bottom-full left-6 mb-4 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-3 flex gap-4 animate-fadeIn z-30">
                  <label className="cursor-pointer flex flex-col items-center gap-2 p-3 hover:bg-slate-50 rounded-xl transition-colors min-w-[60px] group">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors"><ImageIcon className="w-5 h-5 text-blue-500" /></div>
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Image</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, 'image')} />
                  </label>
                  <label className="cursor-pointer flex flex-col items-center gap-2 p-3 hover:bg-slate-50 rounded-xl transition-colors min-w-[60px] group">
                      <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors"><Video className="w-5 h-5 text-red-500" /></div>
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Video</span>
                      <input type="file" accept="video/*" className="hidden" onChange={(e) => handleFileSelect(e, 'video')} />
                  </label>
                  <label className="cursor-pointer flex flex-col items-center gap-2 p-3 hover:bg-slate-50 rounded-xl transition-colors min-w-[60px] group">
                      <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center group-hover:bg-orange-100 transition-colors"><FileText className="w-5 h-5 text-orange-500" /></div>
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Doc</span>
                      <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => handleFileSelect(e, 'document')} />
                  </label>
                  <button onClick={handleLocation} className="flex flex-col items-center gap-2 p-3 hover:bg-slate-50 rounded-xl transition-colors min-w-[60px] group">
                      <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors"><MapPin className="w-5 h-5 text-green-500" /></div>
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Location</span>
                  </button>
              </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); sendMessage(newMessage); }} className="flex gap-3 items-center w-full">
              <button type="button" onClick={() => setShowAttachMenu(!showAttachMenu)} className={`w-14 h-14 flex items-center justify-center rounded-[1.2rem] transition-all shrink-0 ${showAttachMenu ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                  <Paperclip className={`w-6 h-6 transition-transform ${showAttachMenu ? 'rotate-45' : ''}`} />
              </button>
              
              <div className="flex-1 relative">
                <input 
                    type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Transmit payload..."
                    className="w-full pl-6 pr-6 py-4 bg-slate-100 rounded-[1.2rem] focus:bg-white font-medium focus:ring-2 focus:ring-brand-500 outline-none transition-all placeholder:text-slate-400"
                />
              </div>
              
              <button type="submit" disabled={isSending || (!newMessage.trim() && !file)} className="w-14 h-14 flex items-center justify-center shrink-0 bg-brand-600 text-white rounded-[1.2rem] hover:bg-brand-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-brand-600/20 active:scale-95 group">
                  <Send className="w-5 h-5 relative right-0.5 group-hover:translate-x-1 transition-transform" />
              </button>
          </form>
        </div>
        
      </div>
    </div>
  );
};

export default ChatWindow;