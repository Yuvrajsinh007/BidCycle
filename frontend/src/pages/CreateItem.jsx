import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { 
  Package, 
  Tag, 
  FileText, 
  DollarSign, 
  Clock, 
  Calendar, 
  Upload, 
  X, 
  Image as ImageIcon,
  ArrowLeft,
  AlertCircle,
  CheckCircle2
} from "lucide-react";

const CreateItem = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    basePrice: "",
    auctionDuration: "24",
    customEndTime: "",
    customStartTime: "", // Added for scheduling
  });
  
  const [scheduleType, setScheduleType] = useState("immediate"); // 'immediate' or 'scheduled'
  const [durationType, setDurationType] = useState("fixed"); // 'fixed' or 'custom'
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);
  const [dragActive, setDragActive] = useState(false);

  const categories = [
    "Electronics", "Fashion", "Home & Garden", "Sports", "Books",
    "Collectibles", "Art", "Jewelry", "Automotive", "Other",
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const processFiles = (files) => {
    const fileArray = Array.from(files);
    
    // Validate file count
    if (imageFiles.length + fileArray.length > 5) {
      setError("You can only upload a maximum of 5 images.");
      return;
    }

    const newPreviews = fileArray.map((file) => URL.createObjectURL(file));
    setImageFiles((prev) => [...prev, ...fileArray]);
    setImagePreview((prev) => [...prev, ...newPreviews]);
    setError("");
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const removeImage = (index) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreview.filter((_, i) => i !== index);
    setImageFiles(newFiles);
    setImagePreview(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (imageFiles.length === 0) {
        throw new Error("Please upload at least one image.");
      }

      const data = new FormData();
      data.append("title", formData.title);
      data.append("description", formData.description);
      data.append("category", formData.category);
      data.append("basePrice", formData.basePrice);
      data.append("scheduleType", scheduleType); // Send schedule type

      // 1. Handle Start Time
      if (scheduleType === 'scheduled') {
        if (!formData.customStartTime) throw new Error("Please select a start time.");
        const startTime = new Date(formData.customStartTime).getTime();
        if (startTime <= Date.now()) {
             throw new Error("Start time must be in the future.");
        }
        data.append("customStartTime", formData.customStartTime);
      }

      // 2. Handle Duration / End Time
      if (durationType === 'fixed') {
        data.append("auctionDuration", formData.auctionDuration);
      } else {
        if (!formData.customEndTime) throw new Error("Please select an end time.");
        const endTime = new Date(formData.customEndTime).getTime();
        const startTime = scheduleType === 'scheduled' 
            ? new Date(formData.customStartTime).getTime() 
            : Date.now();
            
        if (endTime <= startTime) {
          throw new Error("End time must be after the start time.");
        }
        data.append("customEndTime", formData.customEndTime);
      }

      imageFiles.forEach((file) => {
        data.append("images", file);
      });

      // FIX: Removed manual 'Content-Type' header to prevent "Unexpected end of form"
      // await api.post("/seller/items", data, {
      //   headers: { "Content-Type": "multipart/form-data" },
      // });
      await api.post("/seller/items", data, {
        headers: { "Content-Type": undefined }, // This is the fix
      });

      navigate("/my-items");
    } catch (error) {
      setError(error.message || error.response?.data?.message || "Failed to create item");
      window.scrollTo(0, 0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto"> {/* Changed max-w-4xl to max-w-5xl for wider layout */}
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Create Listing</h1>
            <p className="mt-2 text-sm text-gray-500">
              Fill in the details below to start a new auction.
            </p>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="hidden sm:flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start animate-fadeIn">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6"> {/* Changed grid cols to 12 for finer control */}
            
            {/* Left Column - Main Details (Span 7 columns) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Basic Info Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                    <Package className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Item Details</h2>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Item Title</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Package className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none bg-gray-50 focus:bg-white"
                        placeholder="e.g. Vintage 1960s Camera"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Tag className="h-5 w-5 text-gray-400" />
                      </div>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        required
                        className="block w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none bg-gray-50 focus:bg-white appearance-none"
                      >
                        <option value="">Select a category</option>
                        {categories.map((category) => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <div className="relative">
                      <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                        <FileText className="h-5 w-5 text-gray-400" />
                      </div>
                      <textarea
                        name="description"
                        rows="5"
                        value={formData.description}
                        onChange={handleChange}
                        required
                        className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none bg-gray-50 focus:bg-white resize-none"
                        placeholder="Detailed description of the item, condition, provenance, etc."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Media Upload Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Media</h2>
                    <p className="text-sm text-gray-500">Upload up to 5 photos of your item.</p>
                  </div>
                </div>

                <div 
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                    dragActive 
                      ? "border-indigo-500 bg-indigo-50" 
                      : "border-gray-300 hover:border-indigo-400 hover:bg-gray-50"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    id="image-upload"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center justify-center">
                    <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
                      <Upload className="h-6 w-6 text-indigo-600" />
                    </div>
                    <label 
                      htmlFor="image-upload"
                      className="text-base font-medium text-indigo-600 cursor-pointer hover:text-indigo-500"
                    >
                      Click to upload
                    </label>
                    <span className="text-sm text-gray-500 mt-1">or drag and drop images here</span>
                    <p className="text-xs text-gray-400 mt-2">JPG, PNG, WEBP up to 5MB</p>
                  </div>
                </div>

                {imagePreview.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
                    {imagePreview.map((preview, index) => (
                      <div key={index} className="relative group rounded-xl overflow-hidden border border-gray-200 shadow-sm aspect-square">
                        <img 
                          src={preview} 
                          alt={`Preview ${index + 1}`} 
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="p-2 bg-white rounded-full text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        {index === 0 && (
                          <div className="absolute top-2 left-2 bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">
                            Main Image
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Settings (Span 5 columns) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Pricing Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-green-100 rounded-lg text-green-600">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Pricing</h2>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Starting Bid</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 font-bold">$</span>
                    </div>
                    <input
                      type="number"
                      name="basePrice"
                      value={formData.basePrice}
                      onChange={handleChange}
                      required
                      min="0.01"
                      step="0.01"
                      className="block w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none bg-gray-50 focus:bg-white font-medium text-lg"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    This is the minimum amount the first bidder needs to place.
                  </p>
                </div>
              </div>

              {/* TIMING CONFIGURATION CARD */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                    <Clock className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Timing</h2>
                </div>

                <div className="space-y-5">
                  
                  {/* 1. Start Time Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">When to start?</label>
                    <div className="flex gap-2 p-1 bg-gray-50 rounded-xl border border-gray-100 mb-3 w-full">
                        <button
                          type="button"
                          onClick={() => setScheduleType('immediate')}
                          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                            scheduleType === 'immediate'
                              ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-gray-200'
                              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <Clock className="w-4 h-4" /> Immediate
                        </button>
                        <button
                          type="button"
                          onClick={() => setScheduleType('scheduled')}
                          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                            scheduleType === 'scheduled'
                              ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-gray-200'
                              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <Calendar className="w-4 h-4" /> Schedule
                        </button>
                    </div>
                    
                    {scheduleType === 'scheduled' && (
                        <div className="animate-fadeIn">
                          <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Start Date & Time</label>
                          <input
                            type="datetime-local"
                            name="customStartTime"
                            value={formData.customStartTime}
                            onChange={handleChange}
                            min={new Date().toISOString().slice(0, 16)}
                            className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none bg-white text-sm" // Increased py to match End Date
                          />
                        </div>
                    )}
                  </div>

                  <hr className="border-gray-100" />

                  {/* 2. Duration / End Time Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                    <div className="flex gap-2 p-1 bg-gray-50 rounded-xl border border-gray-100 mb-3 w-full">
                      <button
                        type="button"
                        onClick={() => setDurationType('fixed')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                          durationType === 'fixed'
                            ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-gray-200'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <Clock className="w-4 h-4" /> Fixed Time
                      </button>
                      <button
                        type="button"
                        onClick={() => setDurationType('custom')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                          durationType === 'custom'
                            ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-gray-200'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <Calendar className="w-4 h-4" /> Custom End
                      </button>
                    </div>

                    <div className="pt-1">
                      {durationType === 'fixed' ? (
                        <div className="relative">
                          <select
                            name="auctionDuration"
                            value={formData.auctionDuration}
                            onChange={handleChange}
                            className="block w-full pl-4 pr-10 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none bg-white appearance-none cursor-pointer"
                          >
                            <option value="1">1 Hour</option>
                            <option value="6">6 Hours</option>
                            <option value="12">12 Hours</option>
                            <option value="24">1 Day</option>
                            <option value="48">2 Days</option>
                            <option value="72">3 Days</option>
                            <option value="168">1 Week</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      ) : (
                        <div className="animate-fadeIn">
                           <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">End Date & Time</label>
                           <input
                            type="datetime-local"
                            name="customEndTime"
                            value={formData.customEndTime}
                            onChange={handleChange}
                            required
                            min={formData.customStartTime || new Date().toISOString().slice(0, 16)}
                            className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none bg-white text-sm"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" /> Launch Auction
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/my-items")}
                  className="w-full py-3 bg-white text-gray-700 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
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