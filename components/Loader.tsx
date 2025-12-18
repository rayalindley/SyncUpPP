// components/Loader.tsx
"use client";

const Loader = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-70">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
      <p className="text-lg font-semibold text-white">Generating report...</p>
      <p className="text-sm text-gray-300 mt-1">This may take a few seconds.</p>
    </div>
  );
};

export default Loader;
