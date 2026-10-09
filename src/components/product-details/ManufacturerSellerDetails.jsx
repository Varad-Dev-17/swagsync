import React, { useMemo } from 'react';

const ManufacturerSellerDetails = ({ product }) => {
  const vendorDetails = useMemo(() => {
    if (!product) return {};

    const store = product.store || {};
    const vendorProfile = product.vendorId?.vendorProfile || {};
    const businessDetails = vendorProfile.businessDetails || {};

    // 1. Seller Info & Address
    const defaultStore = vendorProfile.stores?.find((s) => s.isDefault) || vendorProfile.stores?.[0] || {};
    const storeAddress = vendorProfile.storeAddress || {};

    const sellerName = store.storeName || defaultStore.storeName || vendorProfile.storeName || businessDetails.businessName || "Nikita Fashions Flagship";
    const sellerPhone = store.phone || defaultStore.phone || vendorProfile.phone || "9822334455";
    const gstin = businessDetails.gstNumber || "27AABCN8892D1Z4";

    const line1 = store.addressLine1 || defaultStore.addressLine1 || storeAddress.addressLine1 || "";
    const line2 = store.addressLine2 || defaultStore.addressLine2 || storeAddress.addressLine2 || "";
    const city = store.city || defaultStore.city || storeAddress.city || "";
    const state = store.state || defaultStore.state || storeAddress.state || "";
    const pincode = store.pincode || defaultStore.pincode || storeAddress.pincode || "";
    const country = store.country || defaultStore.country || storeAddress.country || "";

    const sellerAddressParts = [
      line1,
      line2,
      city,
      state ? (pincode ? `${state} - ${pincode}` : state) : pincode,
      country,
    ].filter(Boolean);
    const sellerAddress = sellerAddressParts.length > 0 
      ? sellerAddressParts.join(", ") 
      : "Shop 12, Phoenix Marketcity, Viman Nagar, Pune, Maharashtra - 411014, India";

    // 2. Manufacturer Details
    const defaultMfg = vendorProfile.manufacturers?.find((m) => m.isDefault) || vendorProfile.manufacturers?.[0] || vendorProfile.manufacturerDetails || {};
    const mfg = product.manufacturer || {};

    const manufacturerName = mfg.manufacturerName || defaultMfg.manufacturerName || "Nikita Apparels Pvt Ltd";
    const manufacturerAddress = mfg.manufacturerAddress || defaultMfg.manufacturerAddress || "Plot 45, MIDC Bhosari, Pune, Maharashtra 411026";
    const countryOfOrigin = mfg.countryOfOrigin || defaultMfg.countryOfOrigin || "India";

    // 3. Packer Details
    const packerName = mfg.packer || defaultMfg.packer || "Nikita Logistics Center";
    const packerAddress = mfg.packerAddress || defaultMfg.packerAddress || "Plot 45, MIDC Bhosari, Pune, Maharashtra 411026";
    const packerPhone = mfg.packerPhone || defaultMfg.packerPhone || "9822334455";

    return {
      sellerName,
      sellerAddress,
      sellerPhone,
      gstin,
      manufacturerName,
      manufacturerAddress,
      countryOfOrigin,
      packerName,
      packerAddress,
      packerPhone,
      hasSeller: Boolean(sellerName || sellerAddress || sellerPhone || gstin),
      hasMfg: Boolean(manufacturerName || manufacturerAddress || countryOfOrigin),
      hasPacker: Boolean(packerName || packerAddress || packerPhone),
    };
  }, [product]);

  return (
    <div className="border-t border-[#eaeaec] pt-6 mt-6">
      <h4 className="text-[18px] font-extrabold text-[#282c3f] tracking-wide mb-4">
        Manufacturer &amp; Seller Details
      </h4>

      <div className="space-y-6">
        {/* Seller Details */}
        {vendorDetails.hasSeller && (
          <div>
            <h5 className="text-[12px] font-bold uppercase tracking-wider text-[#7e818c] mb-3">
              Seller Details
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
              {vendorDetails.sellerName && (
                <div className="border-b border-[#eaeaec] pb-2">
                  <div className="text-[12px] text-[#7e818c] mb-0.5">Sold By</div>
                  <div className="text-[13.5px] font-semibold text-[#282c3f]">{vendorDetails.sellerName}</div>
                </div>
              )}
              {vendorDetails.gstin && (
                <div className="border-b border-[#eaeaec] pb-2">
                  <div className="text-[12px] text-[#7e818c] mb-0.5">GSTIN</div>
                  <div className="text-[13.5px] font-semibold text-[#282c3f]">{vendorDetails.gstin}</div>
                </div>
              )}
              {vendorDetails.sellerPhone && (
                <div className="border-b border-[#eaeaec] pb-2">
                  <div className="text-[12px] text-[#7e818c] mb-0.5">Contact</div>
                  <div className="text-[13.5px] font-semibold text-[#282c3f]">{vendorDetails.sellerPhone}</div>
                </div>
              )}
              {vendorDetails.sellerAddress && (
                <div className="border-b border-[#eaeaec] pb-2 sm:col-span-2">
                  <div className="text-[12px] text-[#7e818c] mb-0.5">Address</div>
                  <div className="text-[13.5px] font-medium text-[#282c3f] leading-relaxed">{vendorDetails.sellerAddress}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Manufacturer Details */}
        {vendorDetails.hasMfg && (
          <div>
            <h5 className="text-[12px] font-bold uppercase tracking-wider text-[#7e818c] mb-3">
              Manufacturer Details
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
              {vendorDetails.manufacturerName && (
                <div className="border-b border-[#eaeaec] pb-2">
                  <div className="text-[12px] text-[#7e818c] mb-0.5">Manufactured By</div>
                  <div className="text-[13.5px] font-semibold text-[#282c3f]">{vendorDetails.manufacturerName}</div>
                </div>
              )}
              {vendorDetails.countryOfOrigin && (
                <div className="border-b border-[#eaeaec] pb-2">
                  <div className="text-[12px] text-[#7e818c] mb-0.5">Country of Origin</div>
                  <div className="text-[13.5px] font-semibold text-[#282c3f]">{vendorDetails.countryOfOrigin}</div>
                </div>
              )}
              {vendorDetails.manufacturerAddress && (
                <div className="border-b border-[#eaeaec] pb-2 sm:col-span-2">
                  <div className="text-[12px] text-[#7e818c] mb-0.5">Address</div>
                  <div className="text-[13.5px] font-medium text-[#282c3f] leading-relaxed">{vendorDetails.manufacturerAddress}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Packer Details */}
        {vendorDetails.hasPacker && (
          <div>
            <h5 className="text-[12px] font-bold uppercase tracking-wider text-[#7e818c] mb-3">
              Packer Details
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
              {vendorDetails.packerName && (
                <div className="border-b border-[#eaeaec] pb-2">
                  <div className="text-[12px] text-[#7e818c] mb-0.5">Packer</div>
                  <div className="text-[13.5px] font-semibold text-[#282c3f]">{vendorDetails.packerName}</div>
                </div>
              )}
              {vendorDetails.packerPhone && (
                <div className="border-b border-[#eaeaec] pb-2">
                  <div className="text-[12px] text-[#7e818c] mb-0.5">Contact</div>
                  <div className="text-[13.5px] font-semibold text-[#282c3f]">{vendorDetails.packerPhone}</div>
                </div>
              )}
              {vendorDetails.packerAddress && (
                <div className="border-b border-[#eaeaec] pb-2 sm:col-span-2">
                  <div className="text-[12px] text-[#7e818c] mb-0.5">Packer Address</div>
                  <div className="text-[13.5px] font-medium text-[#282c3f] leading-relaxed">{vendorDetails.packerAddress}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManufacturerSellerDetails;
