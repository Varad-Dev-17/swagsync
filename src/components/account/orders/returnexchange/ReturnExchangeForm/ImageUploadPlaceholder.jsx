import React, { useRef, useState } from 'react';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../../../../context/AuthContext';

const ImageUploadPlaceholder = ({ images, setImages }) => {
  const [isUploading, setIsUploading] = useState(false);
  const { getAuthHeaders } = useAuth();
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    if (images.length + files.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    const formData = new FormData();
    files.forEach(file => formData.append('images', file));

    setIsUploading(true);
    try {
      const response = await axios.post('/admin/upload/user-multiple', formData, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setImages([...images, ...response.data.data]);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to upload images');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (indexToRemove) => {
    setImages(images.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div>
      <label className="block text-[14px] font-bold text-slate-700 mb-3">Upload Images (Optional)</label>
      
      {images.length > 0 && (
        <div className="flex flex-wrap gap-4 mb-4">
          {images.map((img, index) => (
            <div key={index} className="relative w-20 h-20 border border-gray-200 rounded-lg overflow-hidden">
              <img src={img.url} alt="Upload preview" className="w-full h-full object-cover"  loading="lazy" decoding="async" />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {images.length < 5 && (
        <div 
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`w-full border-2 border-dashed border-gray-300 rounded-lg p-10 flex flex-col items-center justify-center text-center transition-colors bg-white ${isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'}`}
        >
          {isUploading ? (
            <Loader2 className="w-8 h-8 text-[#FD7100] animate-spin mb-4" />
          ) : (
            <div className="w-12 h-12 bg-[#FFF5ED] text-[#FD7100] rounded-full flex items-center justify-center mb-4">
              <ImagePlus className="w-6 h-6" />
            </div>
          )}
          <p className="text-[15px] font-bold text-slate-700">
            {isUploading ? 'Uploading...' : 'Click to upload images'}
          </p>
          <p className="text-[13px] text-gray-500 mt-1">SVG, PNG, JPG (max. 800x400px)</p>
          <input 
            type="file" 
            multiple 
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden" 
          />
        </div>
      )}
    </div>
  );
};

export default ImageUploadPlaceholder;
