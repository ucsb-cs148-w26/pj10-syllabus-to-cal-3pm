import PdfUpload from "../../components/PdfUpload";
import Navbar from "../../components/navbar";

export default function UploadPage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full p-6">
        <h1 className="text-2xl font-semibold mb-4 text-center">
          Upload your PDF
        </h1>

        <p className="text-gray-600 text-center mb-6">
          Please upload a PDF file tasdfljas;ldfjasl;fjdo continue.
        </p>

        <PdfUpload />
      </div>
    </main>
  );
}
