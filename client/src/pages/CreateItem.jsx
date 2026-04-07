import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { 
  Package, Tag, FileText, IndianRupee, Clock, Calendar, ArrowRight,
  Upload, X, Image as ImageIcon, ArrowLeft, AlertCircle, CheckCircle2,
  ShoppingBag, Layers
} from "lucide-react";

const CreateItem = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "", description: "", category: "", basePrice: "", 
    auctionDuration: "24", customEndTime: "", customStartTime: "",
    price: "", stock: "1",
  });
  
  const [listingType, setListingType] = useState("auction");
  const [scheduleType, setScheduleType] = useState("immediate");
  const [durationType, setDurationType] = useState("fixed");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);
  const [dragActive, setDragActive] = useState(false);

  const categories = ["Electronics", "Fashion", "Home & Garden", "Sports", "Books", "Collectibles", "Art", "Jewelry", "Automotive", "Other"];

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const processFiles = (files) => {
    const fileArray = Array.from(files);
    if (imageFiles.length + fileArray.length > 5) return setError("Maximum 5 images allowed.");
    const newPreviews = fileArray.map((file) => URL.createObjectURL(file));
    setImageFiles((prev) => [...prev, ...fileArray]);
    setImagePreview((prev) => [...prev, ...newPreviews]);
    setError("");
  };

  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) processFiles(e.dataTransfer.files);
  };

  const removeImage = (index) => {
    setImageFiles(imageFiles.filter((_, i) => i !== index));
    setImagePreview(imagePreview.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);

    try {
      if (imageFiles.length === 0) throw new Error("Please upload at least one image.");

      const data = new FormData();
      data.append("title", formData.title);
      data.append("description", formData.description);
      data.append("category", formData.category);
      data.append("listingType", listingType);

      if (listingType === 'direct') {
        // Direct selling fields
        if (!formData.price || parseFloat(formData.price) <= 0) throw new Error("Set a valid price.");
        data.append("price", formData.price);
        data.append("stock", formData.stock || "1");
      } else {
        // Auction fields
        data.append("basePrice", formData.basePrice);
        data.append("scheduleType", scheduleType);
      if (scheduleType === 'scheduled') {
        if (!formData.customStartTime) throw new Error("Select start time.");
        if (new Date(formData.customStartTime).getTime() <= Date.now()) throw new Error("Start time must be future.");
        data.append("customStartTime", formData.customStartTime);
      }

      if (durationType === 'fixed') {
        data.append("auctionDuration", formData.auctionDuration);
      } else {
        if (!formData.customEndTime) throw new Error("Select end time.");
        const startTime = scheduleType === 'scheduled' ? new Date(formData.customStartTime).getTime() : Date.now();
        if (new Date(formData.customEndTime).getTime() <= startTime) throw new Error("End time must be after start time.");
        data.append("customEndTime", formData.customEndTime);
        }
      }

      imageFiles.forEach((file) => data.append("images", file));

      await api.post("/seller/items", data, { headers: { "Content-Type": undefined } });
      navigate("/my-items");
    } catch (error) {
      setError(error.message || error.response?.data?.message || "Failed to create item");
      window.scrollTo(0, 0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto animate-fadeIn">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
             <h1 className="text-4xl font-black text-slate-900 tracking-tight">Create Listing</h1>
             <p className="mt-2 text-slate-500 font-medium">Add a new item to the marketplace — auction or direct sale.</p>
          </div>
          <button onClick={() => navigate("/dashboard")} className="hidden sm:flex items-center text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 shrink-0" />
              <p className="font-bold text-red-700 text-sm">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* LEFT COLUMN */}
            <div className="lg:col-span-7 space-y-8">

              {/* LISTING TYPE TOGGLE */}
              <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-slate-100 rounded-xl">
                    <Layers className="w-6 h-6 text-slate-600" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900">Listing Type</h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setListingType('auction')}
                    className={`p-5 rounded-2xl border-2 text-left transition-all ${
                      listingType === 'auction'
                        ? 'border-brand-500 bg-brand-50 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${listingType === 'auction' ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      <Clock className="w-5 h-5" />
                    </div>
                    <p className="font-black text-slate-900">Auction</p>
                    <p className="text-xs font-medium text-slate-500 mt-1">Buyers bid competitively. Highest bid wins.</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setListingType('direct')}
                    className={`p-5 rounded-2xl border-2 text-left transition-all ${
                      listingType === 'direct'
                        ? 'border-brand-500 bg-brand-50 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${listingType === 'direct' ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <p className="font-black text-slate-900">Direct Selling</p>
                    <p className="text-xs font-medium text-slate-500 mt-1">Fixed price. Buyers purchase instantly.</p>
                  </button>
                </div>
              </div>
              
              {/* DETAILS */}
              <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100 p-8">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-3 bg-brand-50 rounded-xl">
                    <Package className="w-6 h-6 text-brand-600" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900">Item Details</h2>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Title</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Package className="h-5 w-5 text-slate-400" /></div>
                      <input type="text" name="title" value={formData.title} onChange={handleChange} required className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-all" placeholder="e.g. Vintage 1960s Camera" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Category</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Tag className="h-5 w-5 text-slate-400" /></div>
                      <select name="category" value={formData.category} onChange={handleChange} required className="w-full pl-11 pr-10 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-brand-500 focus:bg-white transition-all appearance-none cursor-pointer">
                        <option value="">Select Category</option>
                        {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Description</label>
                    <div className="relative">
                      <div className="absolute top-4 left-4 flex items-start pointer-events-none"><FileText className="h-5 w-5 text-slate-400" /></div>
                      <textarea name="description" rows="5" value={formData.description} onChange={handleChange} required className="w-full pl-11 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-all resize-none" placeholder="Detailed description of the item, condition, provenance..." />
                    </div>
                  </div>
                </div>
              </div>

              {/* MEDIA */}
              <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-brand-50 rounded-xl"><ImageIcon className="w-6 h-6 text-brand-600" /></div>
                  <div>
                     <h2 className="text-2xl font-black text-slate-900">Media</h2>
                     <p className="text-sm font-medium text-slate-500">Upload up to 5 high-quality photos.</p>
                  </div>
                </div>

                <div className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all ${dragActive ? "border-brand-500 bg-brand-50" : "border-slate-200 hover:border-brand-400 hover:bg-slate-50"}`} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}>
                  <input id="imgupload" type="file" multiple accept="image/*" onChange={(e) => processFiles(e.target.files)} className="hidden" />
                  <label htmlFor="imgupload" className="cursor-pointer flex flex-col items-center justify-center">
                    <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4"><Upload className="h-8 w-8 text-slate-400" /></div>
                    <span className="text-lg font-bold text-brand-600 hover:text-brand-700">Click to upload files</span>
                    <span className="text-sm text-slate-500 font-medium mt-1">or drag and drop here</span>
                  </label>
                </div>

                {imagePreview.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-8">
                    {imagePreview.map((src, i) => (
                      <div key={i} className="relative group rounded-xl overflow-hidden border border-slate-200 shadow-sm aspect-square bg-slate-50">
                        <img src={src} alt="Preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button type="button" onClick={() => removeImage(i)} className="p-2.5 bg-white rounded-full text-red-600 hover:bg-red-50 transition-colors shadow-lg"><X className="w-5 h-5" /></button>
                        </div>
                        {i === 0 && <div className="absolute top-2 left-2 bg-slate-900 text-white text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-widest shadow-sm">Main Photo</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="lg:col-span-5 space-y-8">
              
              {/* PRICING */}
              <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-green-50 rounded-xl"><IndianRupee className="w-6 h-6 text-green-600" /></div>
                  <h2 className="text-2xl font-black text-slate-900">Pricing</h2>
                </div>

                {listingType === 'direct' ? (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Fixed Price</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><span className="text-slate-400 font-bold">₹</span></div>
                        <input type="number" name="price" value={formData.price} onChange={handleChange} required min="1" step="0.01" className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-slate-900 font-black text-xl placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-all" placeholder="0.00" />
                      </div>
                      <p className="text-xs font-semibold text-slate-500 mt-2">Buyers pay this exact amount.</p>
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Stock Quantity</label>
                      <input type="number" name="stock" value={formData.stock} onChange={handleChange} min="1" className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-slate-900 font-black text-xl placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-all" placeholder="1" />
                      <p className="text-xs font-semibold text-slate-500 mt-2">How many units are available?</p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Starting Bid</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><span className="text-slate-400 font-bold">₹</span></div>
                      <input type="number" name="basePrice" value={formData.basePrice} onChange={handleChange} required min="0.01" step="0.01" className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-slate-900 font-black text-xl placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-all" placeholder="0.00" />
                    </div>
                    <p className="text-xs font-semibold text-slate-500 mt-2">Minimum first bid required.</p>
                  </div>
                )}
              </div>

              {/* TIMING (Auction only) */}
              {listingType === 'auction' && (
              <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-amber-50 rounded-xl"><Clock className="w-6 h-6 text-amber-600" /></div>
                  <h2 className="text-2xl font-black text-slate-900">Auction Flow</h2>
                </div>
                
                <div className="space-y-6">
                  {/* Start */}
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Launch Time</label>
                    <div className="flex gap-2 mb-4">
                        <button type="button" onClick={() => setScheduleType('immediate')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${scheduleType === 'immediate' ? 'bg-white text-brand-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:bg-slate-100 border border-transparent'}`}>Immediate</button>
                        <button type="button" onClick={() => setScheduleType('scheduled')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${scheduleType === 'scheduled' ? 'bg-white text-brand-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:bg-slate-100 border border-transparent'}`}>Scheduled</button>
                    </div>
                    {scheduleType === 'scheduled' && (
                        <input type="datetime-local" name="customStartTime" value={formData.customStartTime} onChange={handleChange} min={new Date().toISOString().slice(0, 16)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-500" />
                    )}
                  </div>

                  {/* End */}
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Closing Time</label>
                    <div className="flex gap-2 mb-4">
                      <button type="button" onClick={() => setDurationType('fixed')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${durationType === 'fixed' ? 'bg-white text-brand-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:bg-slate-100 border border-transparent'}`}>Fixed Length</button>
                      <button type="button" onClick={() => setDurationType('custom')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${durationType === 'custom' ? 'bg-white text-brand-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:bg-slate-100 border border-transparent'}`}>Custom Date</button>
                    </div>
                    {durationType === 'fixed' ? (
                        <select name="auctionDuration" value={formData.auctionDuration} onChange={handleChange} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-500 appearance-none cursor-pointer">
                          <option value="1">1 Hour</option><option value="6">6 Hours</option><option value="12">12 Hours</option>
                          <option value="24">1 Day</option><option value="48">2 Days</option><option value="72">3 Days</option><option value="168">1 Week</option>
                        </select>
                    ) : (
                        <input type="datetime-local" name="customEndTime" value={formData.customEndTime} onChange={handleChange} required min={formData.customStartTime || new Date().toISOString().slice(0, 16)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-500" />
                    )}
                  </div>
                </div>
              </div>
              )}

              {/* Submit / Actions */}
              <div className="flex flex-col gap-3 pt-4">
                <button type="submit" disabled={loading} className="w-full py-4 bg-slate-900 text-white rounded-xl font-black text-lg hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-[0.98] flex justify-center items-center gap-2">
                  {loading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Publish Listing <ArrowRight className="w-5 h-5 ml-1" /></>}
                </button>
                <button type="button" onClick={() => navigate("/my-items")} className="w-full py-4 bg-white text-slate-600 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
              </div>

            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateItem;