(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/app/components/PdfUpload.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>PdfUpload
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
function PdfUpload() {
    _s();
    const [message, setMessage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    async function handleFile(file) {
        if (file.type !== "application/pdf") {
            setMessage("❌ Only PDF files are allowed.");
            return;
        }
        setLoading(true);
        setMessage("");
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", {
            method: "POST",
            body: formData
        });
        setLoading(false);
        if (res.ok) {
            setMessage("✅ You've completed an upload!");
        } else {
            setMessage("❌ Upload failed.");
        }
    }
    function handleDrop(e) {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                onDrop: handleDrop,
                onDragOver: (e)=>e.preventDefault(),
                className: "border-2 border-dashed border-gray-400 rounded-lg p-8 text-center cursor-pointer",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        type: "file",
                        accept: "application/pdf",
                        hidden: true,
                        id: "pdf-upload",
                        onChange: (e)=>{
                            const file = e.target.files?.[0];
                            if (file) handleFile(file);
                        }
                    }, void 0, false, {
                        fileName: "[project]/app/components/PdfUpload.tsx",
                        lineNumber: 48,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        htmlFor: "pdf-upload",
                        className: "cursor-pointer",
                        children: "📄 Drag & drop a PDF here, or click to upload"
                    }, void 0, false, {
                        fileName: "[project]/app/components/PdfUpload.tsx",
                        lineNumber: 59,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/components/PdfUpload.tsx",
                lineNumber: 43,
                columnNumber: 7
            }, this),
            loading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "mt-4",
                children: "Uploading…"
            }, void 0, false, {
                fileName: "[project]/app/components/PdfUpload.tsx",
                lineNumber: 64,
                columnNumber: 19
            }, this),
            message && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "mt-4",
                children: message
            }, void 0, false, {
                fileName: "[project]/app/components/PdfUpload.tsx",
                lineNumber: 65,
                columnNumber: 19
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/components/PdfUpload.tsx",
        lineNumber: 42,
        columnNumber: 5
    }, this);
}
_s(PdfUpload, "v6kA1Ae862hrGuRtbOhcS+ufWao=");
_c = PdfUpload;
var _c;
__turbopack_context__.k.register(_c, "PdfUpload");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/csvExport.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "downloadCsv",
    ()=>downloadCsv,
    "toGoogleCalendarCsv",
    ()=>toGoogleCalendarCsv
]);
const GOOGLE_CALENDAR_HEADERS = 'Subject,Start Date,Start Time,End Date,End Time,All Day Event,Description,Location';
function escapeCsvField(value) {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}
function formatDate(iso) {
    const d = new Date(iso);
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const y = d.getFullYear();
    return `${m}/${day}/${y}`;
}
function formatTime12h(iso) {
    const d = new Date(iso);
    const h = d.getHours();
    const m = d.getMinutes();
    const am = h < 12 ? 'AM' : 'PM';
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, '0')} ${am}`;
}
function toGoogleCalendarCsv(events) {
    const rows = [
        GOOGLE_CALENDAR_HEADERS
    ];
    for (const e of events){
        const startDate = formatDate(e.start);
        const allDay = e.allDay ? 'TRUE' : 'FALSE';
        const subject = escapeCsvField(e.title);
        const desc = escapeCsvField(e.description ?? '');
        const loc = escapeCsvField(e.location ?? '');
        if (e.allDay) {
            rows.push([
                subject,
                startDate,
                '',
                startDate,
                '',
                allDay,
                desc,
                loc
            ].join(','));
        } else {
            const startTime = formatTime12h(e.start);
            const end = new Date(e.start);
            end.setMinutes(end.getMinutes() + 30);
            const endDate = formatDate(end.toISOString());
            const endTime = formatTime12h(end.toISOString());
            rows.push([
                subject,
                startDate,
                startTime,
                endDate,
                endTime,
                allDay,
                desc,
                loc
            ].join(','));
        }
    }
    return rows.join('\n');
}
function downloadCsv(csvContent, baseName = 'syllabus-events') {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const filename = `${baseName}-${y}-${m}-${d}.csv`;
    const blob = new Blob([
        csvContent
    ], {
        type: 'text/csv;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/app/has_navbar/upload/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>UploadPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$PdfUpload$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/components/PdfUpload.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$csvExport$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/csvExport.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
const SAMPLE_EVENTS = [
    {
        title: "Midterm Exam",
        start: "2026-02-15T10:00:00.000Z",
        allDay: false,
        description: "Ch 1–5"
    },
    {
        title: "Homework 3 Due",
        start: "2026-02-20T23:59:00.000Z",
        allDay: true,
        description: "Submit on GauchoSpace"
    },
    {
        title: "Final Project Presentation",
        start: "2026-03-10T14:00:00.000Z",
        allDay: false,
        description: "Phelps 3520",
        location: "Phelps 3520"
    }
];
function UploadPage() {
    _s();
    const [events, setEvents] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [calendarStatus, setCalendarStatus] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("idle");
    const [calendarMessage, setCalendarMessage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [accessToken, setAccessToken] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const searchParams = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSearchParams"])();
    // Restore events from localStorage on mount
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "UploadPage.useEffect": ()=>{
            const savedEvents = localStorage.getItem("calendarEvents");
            if (savedEvents) {
                try {
                    const parsed = JSON.parse(savedEvents);
                    setEvents(parsed);
                } catch (e) {
                    console.error("Failed to parse saved events:", e);
                }
            }
        }
    }["UploadPage.useEffect"], []);
    // Handle OAuth callback from Google
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "UploadPage.useEffect": ()=>{
            const authSuccess = searchParams?.get("auth_success");
            const token = searchParams?.get("access_token");
            const error = searchParams?.get("error");
            if (authSuccess === "true" && token) {
                console.log("OAuth success, token received");
                setAccessToken(token);
                window.history.replaceState({}, "", "/has_navbar/upload");
                // Restore events from localStorage
                const savedEvents = localStorage.getItem("calendarEvents");
                let eventsToAdd = [];
                if (savedEvents) {
                    try {
                        eventsToAdd = JSON.parse(savedEvents);
                        setEvents(eventsToAdd);
                        console.log("Restored events from localStorage:", eventsToAdd.length);
                    } catch (e) {
                        console.error("Failed to parse saved events:", e);
                    }
                }
                // Automatically add events if we have any
                if (eventsToAdd.length > 0) {
                    console.log("Auto-adding events to calendar...");
                    setCalendarMessage("Adding events to Google Calendar...");
                    setTimeout({
                        "UploadPage.useEffect": ()=>{
                            handleAddToGoogleCalendarWithToken(token);
                        }
                    }["UploadPage.useEffect"], 100);
                } else {
                    setCalendarMessage("Successfully connected! Load events and they'll be added automatically.");
                }
            } else if (error) {
                setCalendarStatus("error");
                setCalendarMessage(`Authentication failed: ${error}`);
                window.history.replaceState({}, "", "/has_navbar/upload");
            }
        // eslint-disable-next-line react-hooks/exhaustive-deps
        }
    }["UploadPage.useEffect"], [
        searchParams
    ]);
    // Separate function to add events with a token
    async function handleAddToGoogleCalendarWithToken(token) {
        const eventsToAdd = events.length > 0 ? events : (()=>{
            const saved = localStorage.getItem("calendarEvents");
            if (saved) {
                try {
                    return JSON.parse(saved);
                } catch (e) {
                    return [];
                }
            }
            return [];
        })();
        if (eventsToAdd.length === 0) {
            return;
        }
        setCalendarStatus("loading");
        setCalendarMessage("Adding events to Google Calendar...");
        try {
            const res = await fetch("/api/calendar/events", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    accessToken: token,
                    events: eventsToAdd
                })
            });
            const data = await res.json();
            console.log("Calendar API response:", data);
            if (!res.ok) {
                setCalendarStatus("error");
                setCalendarMessage(data.error || "Failed to add events to Google Calendar");
                return;
            }
            setCalendarStatus("ok");
            setCalendarMessage(data.message || `Successfully added ${data.count} event(s) to Google Calendar!`);
        } catch (err) {
            console.error("Error adding events:", err);
            setCalendarStatus("error");
            setCalendarMessage("Failed to add events to Google Calendar");
        }
    }
    function handleLoadSample() {
        setEvents(SAMPLE_EVENTS);
        localStorage.setItem("calendarEvents", JSON.stringify(SAMPLE_EVENTS));
        if (accessToken) {
            console.log("Events loaded, auto-adding to calendar...");
            handleAddToGoogleCalendarWithToken(accessToken);
        }
    }
    function handleDownloadCsv() {
        if (events.length === 0) return;
        const csv = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$csvExport$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toGoogleCalendarCsv"])(events);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$csvExport$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["downloadCsv"])(csv, "syllabus-events");
    }
    async function handleGoogleCalendarAuth() {
        try {
            const res = await fetch("/api/calendar/auth");
            const data = await res.json();
            if (!res.ok || !data.authUrl) {
                setCalendarStatus("error");
                setCalendarMessage(data.error || "Failed to start authentication");
                return;
            }
            window.location.href = data.authUrl;
        } catch (err) {
            setCalendarStatus("error");
            setCalendarMessage("Failed to connect to Google Calendar");
        }
    }
    async function handleAddToGoogleCalendar() {
        if (!accessToken) {
            await handleGoogleCalendarAuth();
            return;
        }
        if (events.length === 0) {
            setCalendarMessage("Please load events first");
            setCalendarStatus("error");
            return;
        }
        await handleAddToGoogleCalendarWithToken(accessToken);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
        className: "min-h-screen flex items-center justify-center",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "max-w-md w-full p-6",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                    className: "text-2xl font-semibold mb-4 text-center",
                    children: "Upload your PDF"
                }, void 0, false, {
                    fileName: "[project]/app/has_navbar/upload/page.tsx",
                    lineNumber: 198,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "text-gray-600 text-center mb-6",
                    children: "Please upload a PDF file to continue."
                }, void 0, false, {
                    fileName: "[project]/app/has_navbar/upload/page.tsx",
                    lineNumber: 202,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$components$2f$PdfUpload$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                    fileName: "[project]/app/has_navbar/upload/page.tsx",
                    lineNumber: 206,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mt-8 space-y-4",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            className: "text-lg font-medium",
                            children: "Calendar Events"
                        }, void 0, false, {
                            fileName: "[project]/app/has_navbar/upload/page.tsx",
                            lineNumber: 209,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex flex-wrap gap-3",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    onClick: handleLoadSample,
                                    className: "rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 shadow-sm transition hover:bg-zinc-50",
                                    children: "Load sample events"
                                }, void 0, false, {
                                    fileName: "[project]/app/has_navbar/upload/page.tsx",
                                    lineNumber: 211,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    onClick: handleDownloadCsv,
                                    disabled: events.length === 0,
                                    className: "rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50",
                                    children: "Download CSV"
                                }, void 0, false, {
                                    fileName: "[project]/app/has_navbar/upload/page.tsx",
                                    lineNumber: 218,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    onClick: handleAddToGoogleCalendar,
                                    disabled: calendarStatus === "loading",
                                    className: "rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50",
                                    children: calendarStatus === "loading" ? "Adding…" : accessToken && events.length > 0 ? "Add to Google Calendar" : accessToken ? "Connect to Google Calendar" : "Connect & Add to Google Calendar"
                                }, void 0, false, {
                                    fileName: "[project]/app/has_navbar/upload/page.tsx",
                                    lineNumber: 226,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/has_navbar/upload/page.tsx",
                            lineNumber: 210,
                            columnNumber: 11
                        }, this),
                        events.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-sm text-zinc-600",
                            children: [
                                events.length,
                                " event(s) loaded."
                            ]
                        }, void 0, true, {
                            fileName: "[project]/app/has_navbar/upload/page.tsx",
                            lineNumber: 242,
                            columnNumber: 13
                        }, this),
                        calendarMessage && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: `text-sm ${calendarStatus === "error" ? "text-red-600" : "text-green-600"}`,
                            children: calendarMessage
                        }, void 0, false, {
                            fileName: "[project]/app/has_navbar/upload/page.tsx",
                            lineNumber: 247,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/app/has_navbar/upload/page.tsx",
                    lineNumber: 208,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/app/has_navbar/upload/page.tsx",
            lineNumber: 197,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/app/has_navbar/upload/page.tsx",
        lineNumber: 196,
        columnNumber: 5
    }, this);
}
_s(UploadPage, "u8mE6KmQbEV5LoMPCdEMdEl/Yf8=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSearchParams"]
    ];
});
_c = UploadPage;
var _c;
__turbopack_context__.k.register(_c, "UploadPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/node_modules/next/navigation.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {

module.exports = __turbopack_context__.r("[project]/node_modules/next/dist/client/components/navigation.js [app-client] (ecmascript)");
}),
]);

//# sourceMappingURL=_cdd2649c._.js.map