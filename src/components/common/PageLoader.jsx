import React from "react";

const PageLoader = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
      <div className="w-10 h-10 border-4 border-[#FD7100] border-t-transparent rounded-full animate-spin" />
    </div>
  );
};

export default PageLoader;
