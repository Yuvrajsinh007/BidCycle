import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import { 
  Package, 
  DollarSign, 
  Upload, 
  X, 
  ArrowLeft,
  AlertCircle,
  CheckCircle2
} from "lucide-react";

const EditItem = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    basePrice: "",
    auctionDuration: "24",
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  
  // State for existing images (URLs) vs new uploads (Files)
  const [existingImages, setExistingImages] = useState([]);
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);

  const categories = [
    "Electronics", "Fashion", "Home & Garden", "Sports", "Books",
    "Collectibles", "Art", "Jewelry", "Automotive", "Other",
  ];

  useEffect(() => {
    fetchItemDetails();
  }, [id]);

  const fetchItemDetails = async () => {
    try {
      const response = await api.get(`/items/${id}`);
      const item = response.data;

      setFormData({
        title: item.title,
        description: item.description,
        category: item.category,
        basePrice: item.basePrice,
        auctionDuration: item.auctionDuration || 24,
      });
      setExistingImages(item.images || []);
      setLoading(false);
    } catch (err) {
      setError("Failed to fetch item details.");
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- IMAGE HANDLING START ---

  // Remove an EXISTING image from the list
  const removeExistingImage = (indexToRemove) => {
    setExistingImages(existingImages.filter((_, index) => index !== indexToRemove));
  };

  // Handle NEW File Uploads
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileArray = Array.from(e.target.files);
      const combinedLength = existingImages.length + newImageFiles.length + fileArray.length;
      
      if (combinedLength > 5) {
        setError("Total images cannot exceed 5.");
        return;
      }

      const newPreviews = fileArray.map((file) => URL.createObjectURL(file));
      setNewImageFiles((prev) => [...prev, ...fileArray]);
      setNewImagePreviews((prev) => [...prev, ...newPreviews]);
      setError("");
    }
  };

  // Remove a NEWLY selected image
  const removeNewImage = (indexToRemove) => {
    setNewImageFiles(newImageFiles.filter((_, index) => index !== indexToRemove));
    setNewImagePreviews(newImagePreviews.filter((_, index) => index !== indexToRemove));
  };

  // --- IMAGE HANDLING END ---

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      // 1. UPDATE TEXT & EXISTING IMAGES (Step 1)
      // This step updates the text fields and removes any existing images you deleted.
      await api.put(`/seller/items/${id}`, {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        basePrice: formData.basePrice,
        auctionDuration: formData.auctionDuration,
        images: existingImages 
      });

      // 2. UPLOAD NEW IMAGES (Step 2)
      if (newImageFiles.length > 0) {
        const imageFormData = new FormData();
        newImageFiles.forEach((file) => imageFormData.append("images", file));
        
        // FIX: Set Content-Type to undefined.
        // This forces Axios to remove its default 'application/json' header,
        // allowing the browser to correctly set 'multipart/form-data' with the boundary.
        await api.post(`/seller/items/${id}/images`, imageFormData, {
           headers: { "Content-Type": undefined },
        });
      }

      navigate("/my-items");
    } catch (error) {
      console.error(error);
      setError(error.response?.data?.message || "Failed to update item");
      window.scrollTo(0, 0);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center p-12">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Edit Listing</h1>
          </div>
          <button
            onClick={() => navigate("/my-items")}
            className="flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start animate-fadeIn">
              <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              
              {/* Details Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Package className="w-6 h-6 text-indigo-600" />
                  <h2 className="text-xl font-bold">Details</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Title</label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      className="block w-full mt-1 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="block w-full mt-1 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      name="description"
                      rows="5"
                      value={formData.description}
                      onChange={handleChange}
                      className="block w-full mt-1 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Image Section */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                 <h2 className="text-xl font-bold mb-4">Images</h2>
                 <p className="text-sm text-gray-500 mb-4">Manage your listing images (Max 5)</p>
                 
                 {/* Image Grid */}
                 <div className="flex flex-wrap gap-4 mb-6">
                    {/* Render Existing Images */}
                    {existingImages.map((img, i) => (
                      <div key={`existing-${i}`} className="relative group w-24 h-24">
                        <img 
                          src={img} 
                          alt="Existing" 
                          className="w-full h-full object-cover rounded-lg border border-gray-200" 
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(i)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                          title="Remove Image"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                    {/* Render New Upload Previews */}
                    {newImagePreviews.map((img, i) => (
                      <div key={`new-${i}`} className="relative group w-24 h-24">
                        <img 
                          src={img} 
                          alt="New Upload" 
                          className="w-full h-full object-cover rounded-lg border-2 border-green-500" 
                        />
                         <button
                          type="button"
                          onClick={() => removeNewImage(i)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                          title="Remove Upload"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <span className="absolute bottom-0 left-0 right-0 bg-green-500 text-white text-[10px] text-center font-bold py-0.5 rounded-b-sm">New</span>
                      </div>
                    ))}
                 </div>
                 
                 {/* Upload Button */}
                 <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors">
                    <input 
                      type="file" 
                      multiple 
                      onChange={handleImageChange} 
                      className="hidden" 
                      id="edit-img-upload" 
                      accept="image/*"
                    />
                    <label htmlFor="edit-img-upload" className="cursor-pointer flex flex-col items-center justify-center text-indigo-600 font-medium hover:text-indigo-700">
                      <Upload className="w-8 h-8 mb-2" />
                      <span>Click to Upload More Images</span>
                    </label>
                 </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                 <div className="flex items-center gap-3 mb-4">
                    <DollarSign className="w-6 h-6 text-green-600" />
                    <h2 className="text-xl font-bold">Pricing</h2>
                 </div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Starting Price ($)</label>
                 <input
                    type="number"
                    name="basePrice"
                    value={formData.basePrice}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="block w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:bg-indigo-700 transition-all flex justify-center items-center gap-2 transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" /> Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditItem;