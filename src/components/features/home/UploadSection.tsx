import { FileUpload } from '@/components/features/upload';

export const UploadSection = () => {
  return (
    <div className="py-24 sm:py-32 bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            Upload Your Bank Statement
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            We support all major file formats: CSV, Excel, PDF, or image format
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl">
          <FileUpload />
        </div>
      </div>
    </div>
  );
};
