import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import { 
  Package, DollarSign, Upload, X, ArrowLeft, AlertCircle, CheckCircle2, Save
} from "lucide-react";

const EditItem = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState({ title: "", description: "", category: "", basePrice: "", auctionDuration: "24" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  
  const [existingImages, setExistingImages] = useState([]);
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);

  const categories = ["Electronics", "Fashion", "Home & Garden", "Sports", "Books", "Collectibles", "Art", "Jewelry", "Automotive", "Other"];

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/items/${id}`);
        setFormData({ title: data.title, description: data.description, category: data.category, basePrice: data.basePrice, auctionDuration: data.auctionDuration || 24 });
        setExistingImages(data.images || []);
      } catch (err) {
        setError("Failed to fetch item details.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileArray = Array.from(e.target.files);
      if (existingImages.length + newImageFiles.length + fileArray.length > 5) return setError("Total max 5 images allowed.");
      setNewImageFiles((prev) => [...prev, ...fileArray]);
      setNewImagePreviews((prev) => [...prev, ...fileArray.map(f => URL.createObjectURL(f))]);
      setError("");
    }
  };

  const removeExistingImage = (idx) => setExistingImages(existingImages.filter((_, i) => i !== idx));
  const removeNewImage = (idx) => {
    setNewImageFiles(newImageFiles.filter((_, i) => i !== idx));
    setNewImagePreviews(newImagePreviews.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(""); setSaving(true);
    try {
      await api.put(`/seller/items/${id}`, { ...formData, images: existingImages });
      if (newImageFiles.length > 0) {
        const idf = new FormData();
        newImageFiles.forEach(f => idf.append("images", f));
        await api.post(`/seller/items/${id}/images`, idf, { headers: { "Content-Type": undefined } });
      }
      navigate("/my-items");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update item");
      window.scrollTo(0,0);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-brand-600 rounded-full animate-spin"/></div>;

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto animate-fadeIn">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div><h1 className="text-4xl font-black text-slate-900 tracking-tight">Edit Listing</h1></div>
          <button onClick={() => navigate("/my-items")} className="hidden sm:flex items-center text-sm font-bold text-slate-500 hover:text-slate-900 bg-white px-4 py-2 rounded-xl border border-slate-200">
            <ArrowLeft className="w-4 h-4 mr-2" /> Cancel Changes
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           <div className="lg:col-span-8 space-y-8">
              {error && <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-start"><AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5 mr-3"/><p className="font-bold text-red-700">{error}</p></div>}
              
              <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100 p-8">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-3 bg-brand-50 rounded-xl"><Package className="w-6 h-6 text-brand-600" /></div>
                  <h2 className="text-2xl font-black text-slate-900">Details</h2>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Title</label>
                    <input type="text" name="title" value={formData.title} onChange={handleChange} required className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-brand-500 focus:bg-white transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Category</label>
                    <select name="category" value={formData.category} onChange={handleChange} required className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-brand-500 focus:bg-white transition-all appearance-none">
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Description</label>
                    <textarea name="description" rows="5" value={formData.description} onChange={handleChange} required className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-brand-500 focus:bg-white transition-all resize-none" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100 p-8">
                <h2 className="text-2xl font-black text-slate-900 mb-6">Gallery (Max 5)</h2>
                <div className="flex flex-wrap gap-4 mb-6">
                  {existingImages.map((img, i) => (
                    <div key={`e-${i}`} className="relative w-28 h-28 group rounded-xl bg-slate-100 overflow-hidden border border-slate-200">
                      <img src={img} alt="Media" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                      <button type="button" onClick={() => removeExistingImage(i)} className="absolute top-2 right-2 bg-white/90 text-red-600 rounded-full p-1.5 shadow-md hover:bg-red-50"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                  {newImagePreviews.map((img, i) => (
                    <div key={`n-${i}`} className="relative w-28 h-28 group rounded-xl bg-slate-100 overflow-hidden border-2 border-brand-500 border-dashed">
                      <img src={img} alt="New" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeNewImage(i)} className="absolute top-2 right-2 bg-white/90 text-red-600 rounded-full p-1.5 shadow-md hover:bg-red-50"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:bg-slate-50 transition-colors">
                  <input type="file" multiple id="editImg" accept="image/*" onChange={handleImageChange} className="hidden" />
                  <label htmlFor="editImg" className="cursor-pointer font-bold text-brand-600 hover:text-brand-700 flex flex-col items-center"><Upload className="w-6 h-6 mb-2"/> Add Images</label>
                </div>
              </div>
           </div>

           <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100 p-8">
                 <div className="flex items-center gap-3 mb-6"><div className="p-3 bg-green-50 rounded-xl"><DollarSign className="w-6 h-6 text-green-600" /></div><h2 className="text-xl font-black">Base Price</h2></div>
                 <input type="number" name="basePrice" value={formData.basePrice} onChange={handleChange} min="0" step="0.01" className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-xl text-slate-900 font-black text-xl text-center focus:outline-none focus:border-brand-500" />
              </div>

              <button type="submit" disabled={saving} className="w-full py-4 bg-slate-900 text-white rounded-xl font-black hover:bg-slate-800 shadow-xl shadow-slate-900/10 active:scale-[0.98] flex justify-center items-center gap-2">
                {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save className="w-5 h-5"/> Save Updates</>}
              </button>
           </div>
        </form>
      </div>
    </div>
  );
};

export default EditItem;