import React from "react";
import SyncLoader from "../../common/SyncLoader";

const ShopLoader = () => {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3.5">
      <SyncLoader color="#FD7100" size={11} gap={7} />
      <span className="text-xs font-medium tracking-wide text-gray-400 uppercase">
        Loading products...
      </span>
    </div>
  );
};

export default ShopLoader;

