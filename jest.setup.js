require("@testing-library/jest-dom");

// Polyfill URL for jsdom
const { URL, URLSearchParams } = require('url');
global.URL = URL;
global.URLSearchParams = URLSearchParams;