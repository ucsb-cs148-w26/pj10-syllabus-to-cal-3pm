'use client';
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Uploads = Uploads;
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var googleCalendar_1 = require("../../../lib/googleCalendar");
function Uploads() {
    var _this = this;
    var _a = (0, react_1.useState)(false), showDocuments = _a[0], setShowDocuments = _a[1];
    var _b = (0, react_1.useState)([]), documents = _b[0], setDocuments = _b[1];
    (0, react_1.useEffect)(function () {
        // Load documents from localStorage
        var stored = localStorage.getItem('syllabusDocuments');
        if (stored) {
            setDocuments(JSON.parse(stored));
        }
        else {
            // Initialize with mock data
            var mockDocs = [
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
    var handleFileUpload = function (e) {
        var files = e.target.files;
        if (files && files.length > 0) {
            var newDocs = Array.from(files).map(function (file) { return ({
                id: Date.now().toString() + Math.random(),
                name: file.name,
                uploadDate: new Date().toISOString().split('T')[0],
                courseName: file.name.replace('.pdf', '').replace(/-/g, ' ')
            }); });
            var updatedDocs = __spreadArray(__spreadArray([], documents, true), newDocs, true);
            setDocuments(updatedDocs);
            localStorage.setItem('syllabusDocuments', JSON.stringify(updatedDocs));
        }
    };
    var handleDelete = function (id) {
        var updatedDocs = documents.filter(function (doc) { return doc.id !== id; });
        setDocuments(updatedDocs);
        localStorage.setItem('syllabusDocuments', JSON.stringify(updatedDocs));
    };
    var handleUploadToCalendar = function () { return __awaiter(_this, void 0, void 0, function () {
        var accessToken, events, eventIds, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    accessToken = localStorage.getItem('googleAccessToken');
                    if (!accessToken) {
                        alert('Please authenticate with Google Calendar first.');
                        return [2 /*return*/];
                    }
                    events = documents.map(function (doc) { return ({
                        title: doc.courseName,
                        start: new Date(doc.uploadDate).toISOString(),
                        allDay: true,
                    }); });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, (0, googleCalendar_1.createCalendarEvents)(accessToken, events)];
                case 2:
                    eventIds = _a.sent();
                    alert("Successfully uploaded ".concat(eventIds.length, " events to Google Calendar."));
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.error('Failed to upload events:', error_1);
                    alert('Failed to upload events to Google Calendar.');
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    return (<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h2 className="text-3xl font-semibold text-gray-900 mb-2">Upload Your Syllabuses</h2>
        <p className="text-gray-600">
          Upload PDF syllabuses to automatically extract assignments, exams, and important dates
        </p>
      </div>

      <div className="flex gap-4 mb-8">
        <label className="flex-1">
          <input type="file" accept=".pdf" multiple onChange={handleFileUpload} className="hidden"/>
          <div className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors cursor-pointer text-center flex items-center justify-center gap-2">
            <lucide_react_1.Upload className="w-5 h-5"/>
            Upload
          </div>
        </label>
        <button onClick={function () { return setShowDocuments(!showDocuments); }} className="flex-1 bg-white border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
          <lucide_react_1.FolderOpen className="w-5 h-5"/>
          Documents
        </button>
        <button onClick={handleUploadToCalendar} className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
          <lucide_react_1.Upload className="w-5 h-5"/>
          Upload to Calendar
        </button>
      </div>

      {showDocuments && (<div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Your Syllabuses</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {documents.length === 0 ? (<div className="px-6 py-12 text-center text-gray-500">
                <lucide_react_1.FileText className="w-12 h-12 mx-auto mb-4 text-gray-400"/>
                <p>No documents uploaded yet</p>
              </div>) : (documents.map(function (doc) { return (<div key={doc.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <lucide_react_1.FileText className="w-6 h-6 text-red-600"/>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{doc.name}</p>
                      <p className="text-sm text-gray-500">{doc.courseName}</p>
                      <p className="text-xs text-gray-400">Uploaded on {doc.uploadDate}</p>
                    </div>
                  </div>
                  <button onClick={function () { return handleDelete(doc.id); }} className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors">
                    <lucide_react_1.Trash2 className="w-5 h-5"/>
                  </button>
                </div>); }))}
          </div>
        </div>)}

      {!showDocuments && (<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <lucide_react_1.Upload className="w-8 h-8 text-indigo-600"/>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Upload your first syllabus
          </h3>
          <p className="text-gray-600 mb-6">
            Drag and drop or click the upload button to get started
          </p>
        </div>)}
    </div>);
}
