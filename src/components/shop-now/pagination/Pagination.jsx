import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

const Pagination = ({ currentPage, totalPages, setCurrentPage }) => {
  if (totalPages <= 1) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="flex items-center justify-center gap-2 mt-12"
    >
      <button
        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
        disabled={currentPage === 1}
        className="p-2 rounded-lg border border-[#E5E7EB] text-[#4B5563] hover:border-[#FD7100] hover:text-[#FD7100] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        <ChevronLeft size={18} />
      </button>

      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <button
          key={page}
          onClick={() => setCurrentPage(page)}
          className={`w-10 h-10 rounded-lg text-[15px] font-medium transition-all ${
            currentPage === page
              ? "bg-[#FD7100] text-white shadow-md"
              : "border border-[#E5E7EB] text-[#4B5563] hover:border-[#FD7100] hover:text-[#FD7100]"
          }`}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
        disabled={currentPage === totalPages}
        className="p-2 rounded-lg border border-[#E5E7EB] text-[#4B5563] hover:border-[#FD7100] hover:text-[#FD7100] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        <ChevronRight size={18} />
      </button>
    </motion.div>
  );
};

export default Pagination;
