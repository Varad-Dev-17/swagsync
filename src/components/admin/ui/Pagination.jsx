import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange,
  totalItems = 0,
  itemsPerPage = 10,
  itemLabel = "results",
  theme = "",
  activeColor = "",
}) => {
  const isVendor =
    theme === 'vendor' ||
    activeColor === '#fe4a03' ||
    (typeof window !== 'undefined' && window.location.pathname.startsWith('/vendor'));

  const startItem = totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  if (totalPages <= 1) {
    return (
      <div className="flex items-center justify-between px-4 py-3.5 bg-white border-t border-slate-100 sm:px-6">
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          {totalItems === 0 ? (
            <span>No {itemLabel} found</span>
          ) : (
            <>
              Showing <span className="font-bold text-slate-800">{startItem}</span> to{' '}
              <span className="font-bold text-slate-800">{endItem}</span> of{' '}
              <span className="font-bold text-slate-800">{totalItems}</span> {itemLabel}
            </>
          )}
        </p>
      </div>
    );
  }

  const activeStyles = isVendor
    ? 'z-10 bg-[#fe4a03] text-white shadow-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fe4a03]'
    : 'z-10 bg-[#4648d4] text-white shadow-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4648d4]';

  return (
    <div className="flex items-center justify-between px-4 py-3.5 bg-white border-t border-slate-100 sm:px-6">
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          {totalItems > 0 ? (
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Showing <span className="font-bold text-slate-800">{startItem}</span> to{' '}
              <span className="font-bold text-slate-800">{endItem}</span> of{' '}
              <span className="font-bold text-slate-800">{totalItems}</span> {itemLabel}
            </p>
          ) : (
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Showing page <span className="font-bold text-slate-800">{currentPage}</span> of{' '}
              <span className="font-bold text-slate-800">{totalPages}</span>
            </p>
          )}
        </div>
        <div>
          <nav className="inline-flex -space-x-px rounded-xl shadow-2xs overflow-hidden" aria-label="Pagination">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-2.5 py-2 text-slate-400 bg-white ring-1 ring-inset ring-slate-200 hover:bg-slate-50 focus:z-20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <span className="sr-only">Previous</span>
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            
            {[...Array(totalPages)].map((_, idx) => {
              const pageNum = idx + 1;
              const isCurrent = pageNum === currentPage;
              
              if (totalPages > 7) {
                if (
                  pageNum !== 1 && 
                  pageNum !== totalPages && 
                  Math.abs(pageNum - currentPage) > 1
                ) {
                  if (Math.abs(pageNum - currentPage) === 2) {
                    return (
                      <span key={`ellipsis-${pageNum}`} className="relative inline-flex items-center px-3.5 py-2 text-xs font-semibold text-slate-400 ring-1 ring-inset ring-slate-200 bg-white">
                        ...
                      </span>
                    );
                  }
                  return null;
                }
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`relative inline-flex items-center px-3.5 py-2 text-xs font-bold transition-all cursor-pointer focus:z-20 ${
                    isCurrent
                      ? activeStyles
                      : 'text-slate-700 bg-white ring-1 ring-inset ring-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-2.5 py-2 text-slate-400 bg-white ring-1 ring-inset ring-slate-200 hover:bg-slate-50 focus:z-20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <span className="sr-only">Next</span>
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </nav>
        </div>
      </div>
      
      {/* Mobile view */}
      <div className="flex flex-1 items-center justify-between sm:hidden">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="relative inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs"
        >
          Previous
        </button>
        <span className="text-xs text-slate-500 font-medium">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="relative inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Pagination;
