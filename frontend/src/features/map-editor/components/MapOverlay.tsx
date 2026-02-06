import { useRef } from "react";

interface MapOverlayProps {
  onUpload: (url: string) => void;
}

export const MapOverlay = ({ onUpload }: MapOverlayProps) => {
  // Phải khai báo Ref ở đây thì mới dùng được fileInputRef.current
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Giải phóng URL cũ nếu cần để tránh rò rỉ bộ nhớ (optional nhưng tốt)
      const imageUrl = URL.createObjectURL(file);
      onUpload(imageUrl);
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm transition-all duration-500">
      <div className="flex flex-col items-center p-12 border border-indigo-50 rounded-3xl bg-white shadow-[0_20px_50px_-12px_rgba(59,130,246,0.1)] max-w-lg text-center animate-in zoom-in-95 fade-in duration-300">
        
        {/* Click vào vùng icon cũng kích hoạt chọn file */}
        <div 
          className="relative mb-6 group cursor-pointer" 
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform duration-300">
            <span className="material-symbols-outlined text-5xl">add_photo_alternate</span>
          </div>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white">
            <span className="material-symbols-outlined text-sm font-bold">add</span>
          </div>
        </div>

        <h3 className="text-2xl font-extrabold text-slate-800 mb-3">Tải bản đồ lên</h3>

        <p className="text-slate-500 mb-8 max-w-xs mx-auto leading-relaxed text-sm">
          Bắt đầu bằng cách chọn sơ đồ tòa nhà hoặc bản đồ khu vực của bạn.
        </p>

        <div className="flex gap-3 w-full">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 py-3.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">upload_file</span>
            Chọn file từ máy
          </button>
        </div>

        <p className="text-xs text-slate-400 mt-6 bg-slate-50 px-3 py-1 rounded-full">
          Hỗ trợ JPG, PNG, SVG • Tối đa 10MB
        </p>
      </div>

      {/* Input ẩn */}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={handleImageUpload} 
      />
    </div>
  );
};