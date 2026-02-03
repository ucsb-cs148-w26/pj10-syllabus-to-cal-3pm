'use client';

import { useState, useEffect } from 'react';
import { Upload, FileText, Trash2, FolderOpen } from 'lucide-react';

interface Document {
  id: string;
  name: string;
  uploadDate: string;
  courseName: string;
}

export function Uploads() {
  const [showDocuments, setShowDocuments] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);

  useEffect(() => {
    // Load documents from localStorage
    const stored = localStorage.getItem('syllabusDocuments');
    if (stored) {
      setDocuments(JSON.parse(stored));
    } else {
      // Initialize with mock data
      const mockDocs = [
        {
          id: '1',
          name: 'CS-101-Syllabus.pdf',
          uploadDate: '2024-01-15',
          courseName: 'Introduction to Computer Science'
        },
        {
          id: '2',
          name: 'MATH-201-Syllabus.pdf',
          uploadDate: '2024-01-16',
          courseName: 'Calculus II'
        },
        {
          id: '3',
          name: 'ENG-150-Syllabus.pdf',
          uploadDate: '2024-01-17',
          courseName: 'English Composition'
        }
      ];
      setDocuments(mockDocs);
      localStorage.setItem('syllabusDocuments', JSON.stringify(mockDocs));
    }
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newDocs = Array.from(files).map(file => ({
        id: Date.now().toString() + Math.random(),
        name: file.name,
        uploadDate: new Date().toISOString().split('T')[0],
        courseName: file.name.replace('.pdf', '').replace(/-/g, ' ')
      }));
      
      const updatedDocs = [...documents, ...newDocs];
      setDocuments(updatedDocs);
      localStorage.setItem('syllabusDocuments', JSON.stringify(updatedDocs));
    }
  };

  const handleDelete = (id: string) => {
    const updatedDocs = documents.filter(doc => doc.id !== id);
    setDocuments(updatedDocs);
    localStorage.setItem('syllabusDocuments', JSON.stringify(updatedDocs));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h2 className="text-3xl font-semibold text-gray-900 mb-2">Upload Your Syllabuses</h2>
        <p className="text-gray-600">
          Upload PDF syllabuses to automatically extract assignments, exams, and important dates
        </p>
      </div>

      <div className="flex gap-4 mb-8">
        <label className="flex-1">
          <input
            type="file"
            accept=".pdf"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
          <div className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors cursor-pointer text-center flex items-center justify-center gap-2">
            <Upload className="w-5 h-5" />
            Upload
          </div>
        </label>
        <button
          onClick={() => setShowDocuments(!showDocuments)}
          className="flex-1 bg-white border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
        >
          <FolderOpen className="w-5 h-5" />
          Documents
        </button>
      </div>

      {showDocuments && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Your Syllabuses</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {documents.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>No documents uploaded yet</p>
              </div>
            ) : (
              documents.map(doc => (
                <div key={doc.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{doc.name}</p>
                      <p className="text-sm text-gray-500">{doc.courseName}</p>
                      <p className="text-xs text-gray-400">Uploaded on {doc.uploadDate}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {!showDocuments && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Upload className="w-8 h-8 text-indigo-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Upload your first syllabus
          </h3>
          <p className="text-gray-600 mb-6">
            Drag and drop or click the upload button to get started
          </p>
        </div>
      )}
    </div>
  );
}
