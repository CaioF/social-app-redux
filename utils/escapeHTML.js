const escapeHTML = unsafe => unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
module.exports = escapeHTML