const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const PUBLIC_DIR = __dirname;
const CHAPTERS_DIR = path.join(__dirname, 'chapters');
const MANIFEST_PATH = path.join(CHAPTERS_DIR, 'manifest.json');
const ADMIN_PASS = process.env.ADMIN_PASS || 'kyros2087';

// Ensure chapters directory exists
if (!fs.existsSync(CHAPTERS_DIR)) {
    fs.mkdirSync(CHAPTERS_DIR);
}

// Ensure manifest exists
if (!fs.existsSync(MANIFEST_PATH)) {
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify([], null, 2));
}

const MIME_TYPES = {
    '.html': 'text/html',
    '.css':  'text/css',
    '.js':   'text/javascript',
    '.json': 'application/json',
    '.png':  'image/png',
    '.webp': 'image/webp',
    '.jpg':  'image/jpeg',
    '.txt':  'text/plain'
};

// ── Helpers ──
function readManifest() {
    try {
        return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
    } catch {
        return [];
    }
}

function writeManifest(data) {
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(data, null, 2));
}

function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try { resolve(JSON.parse(body)); }
            catch (e) { reject(e); }
        });
        req.on('error', reject);
    });
}

function sendJSON(res, statusCode, data) {
    res.writeHead(statusCode, { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
    });
    res.end(JSON.stringify(data));
}

// ── Server ──
const server = http.createServer(async (req, res) => {
    console.log(`${req.method} ${req.url}`);

    // Helper to check cookie authentication
    function checkAuth(req) {
        const cookieHeader = req.headers.cookie;
        if (!cookieHeader) return false;
        const cookies = Object.fromEntries(cookieHeader.split(';').map(c => c.trim().split('=')));
        return cookies['admin_token'] === ADMIN_PASS;
    }

    // ─── API: Login ───
    if (req.method === 'POST' && req.url === '/api/login') {
        try {
            const { password } = await parseBody(req);
            if (password === ADMIN_PASS) {
                res.writeHead(200, {
                    'Content-Type': 'application/json',
                    'Set-Cookie': `admin_token=${ADMIN_PASS}; Path=/; HttpOnly; SameSite=Strict; Max-Age=2592000` // 30 days
                });
                return res.end(JSON.stringify({ success: true }));
            }
            return sendJSON(res, 401, { error: 'Invalid password' });
        } catch(e) {
            return sendJSON(res, 400, { error: 'Bad request' });
        }
    }

    // ─── API: Save Chapter ───
    if (req.method === 'POST' && req.url === '/api/save-chapter') {
        if (!checkAuth(req)) return sendJSON(res, 401, { error: 'Unauthorized' });
        try {
            const { timelineId, title, description, content } = await parseBody(req);

            if (!timelineId || !title || typeof content !== 'string') {
                return sendJSON(res, 400, { error: 'Missing timelineId, title, or content' });
            }

            const paddedId = timelineId.padStart(2, '0');
            const filename = `timeline_${paddedId}.json`;
            const filepath = path.join(CHAPTERS_DIR, filename);

            // Save the chapter JSON
            const chapterData = { title, description, content, updatedAt: new Date().toISOString() };
            fs.writeFileSync(filepath, JSON.stringify(chapterData, null, 2));

            // Update manifest
            const manifest = readManifest();
            const existingIdx = manifest.findIndex(c => c.timelineId === paddedId);
            const entry = {
                timelineId: paddedId,
                title,
                description,
                unlocked: true,
                filename
            };

            if (existingIdx >= 0) {
                manifest[existingIdx] = entry;
            } else {
                manifest.push(entry);
            }

            // Sort by timelineId
            manifest.sort((a, b) => a.timelineId.localeCompare(b.timelineId));
            writeManifest(manifest);

            console.log(`✅ Saved: ${filename} ("${title}")`);
            return sendJSON(res, 200, { success: true, filename });

        } catch (err) {
            console.error('Save error:', err);
            return sendJSON(res, 400, { error: 'Invalid request body' });
        }
    }

    // ─── API: List Chapters ───
    if (req.method === 'GET' && req.url === '/api/chapters') {
        const manifest = readManifest();
        return sendJSON(res, 200, manifest);
    }

    // ─── API: Toggle Lock ───
    if (req.method === 'POST' && req.url === '/api/toggle-lock') {
        if (!checkAuth(req)) return sendJSON(res, 401, { error: 'Unauthorized' });
        try {
            const { timelineId, unlock } = await parseBody(req);
            const paddedId = timelineId.padStart(2, '0');

            const manifest = readManifest();
            const entry = manifest.find(c => c.timelineId === paddedId);

            if (!entry) {
                return sendJSON(res, 404, { error: 'Timeline not found in manifest' });
            }

            entry.unlocked = !!unlock;
            writeManifest(manifest);

            console.log(`🔒 Timeline ${paddedId} ${unlock ? 'UNLOCKED' : 'LOCKED'}`);
            return sendJSON(res, 200, { success: true });

        } catch (err) {
            return sendJSON(res, 400, { error: 'Invalid request body' });
        }
    }

    // ─── Static File Serving ───
    let filePath = req.url === '/' ? '/index.html' : decodeURIComponent(req.url);

    // Strip query strings
    filePath = filePath.split('?')[0];

    // Auth check for admin
    if (filePath === '/admin.html' && !checkAuth(req)) {
        res.writeHead(302, { 'Location': '/login.html' });
        return res.end();
    }

    // Prevent directory traversal
    filePath = path.join(PUBLIC_DIR, filePath);

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('404 Not Found');
            } else {
                res.writeHead(500);
                res.end(`Server Error: ${err.code}`);
            }
        } else {
            const headers = { 'Content-Type': contentType };
            // Disable caching for development/CMS usage
            if (['.json', '.html', '.css', '.js'].includes(extname)) {
                headers['Cache-Control'] = 'no-store, no-cache, must-revalidate';
            }
            res.writeHead(200, headers);
            res.end(content);
        }
    });
});

server.listen(PORT, () => {
    console.log(`\n===========================================`);
    console.log(` 🚀 SERVER:  http://localhost:${PORT}`);
    console.log(` 📝 ADMIN:   http://localhost:${PORT}/admin.html`);
    console.log(`===========================================\n`);
});
