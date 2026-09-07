import { Link } from "react-router-dom";

const PathNotFound = () => {
  return (
    <div>
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50 px-4">
        <div className="text-center max-w-md">
          <h1 className="text-7xl font-extrabold text-[#FD7100]">404</h1>
          <p className="text-2xl font-bold text-gray-900 mt-4">Page Not Found</p>
          <p className="mt-2 text-gray-600">
            The page you are looking for doesn't exist or has been moved.
          </p>
          <Link
            to="/"
            className="inline-block mt-6 px-6 py-2.5 bg-[#FD7100] hover:bg-[#E06400] text-white font-semibold rounded-lg shadow-sm transition-colors text-sm"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PathNotFound;
