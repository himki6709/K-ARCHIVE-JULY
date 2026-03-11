// THE JULY LEGACY | ARK ARCHIVE ENGINE
const firebaseConfig = {
    apiKey: "AIzaSyCAdnfu2R82xbC7H85n_9mvQBE58X3TjbA",
    authDomain: "the-5k-elite-legacy.firebaseapp.com",
    databaseURL: "https://the-5k-elite-legacy-default-rtdb.firebaseio.com",
    projectId: "the-5k-elite-legacy",
    storageBucket: "the-5k-elite-legacy.firebasestorage.app",
    messagingSenderId: "440824313752",
    appId: "1:440824313752:web:2c93344dcfe2ba0a4c5ded"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const cv = document.getElementById('mainCanvas');
const ctx = cv.getContext('2d');
const tooltip = document.getElementById('legacy-tooltip');

// Configuration - Matches your luxury branding
const blockSize = 30; 
const cols = 100; 
const totalPossiblePlots = 36000; 
const rows = Math.ceil(totalPossiblePlots / cols);

cv.width = cols * blockSize; 
cv.height = rows * blockSize;

let pixels = {};
const imgCache = {};

// Premium Render Engine
function render() {
    // Background - Pure Black for Luxury Feel
    ctx.fillStyle = "#000000"; 
    ctx.fillRect(0, 0, cv.width, cv.height);
    
    // Minimal Grid - Very subtle lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)"; 
    ctx.lineWidth = 0.5;
    
    for (let i = 0; i <= cols; i++) { 
        ctx.beginPath(); ctx.moveTo(i * blockSize, 0); ctx.lineTo(i * blockSize, cv.height); ctx.stroke(); 
    }
    for (let j = 0; j <= rows; j++) { 
        ctx.beginPath(); ctx.moveTo(0, j * blockSize); ctx.lineTo(cv.width, j * blockSize); ctx.stroke(); 
    }
    
    // Pixel/Plot Rendering
    Object.values(pixels).forEach(p => {
        if (p.imageUrl) {
            const id = parseInt(p.plotID) - 1;
            const targetX = (id % cols) * blockSize;
            const targetY = Math.floor(id / cols) * blockSize;
            
            if (imgCache[p.imageUrl]) {
                ctx.drawImage(imgCache[p.imageUrl], targetX, targetY, blockSize, blockSize);
            } else {
                const img = new Image();
                img.crossOrigin = "anonymous"; // Prevents security errors
                img.src = p.imageUrl;
                img.onload = () => {
                    imgCache[p.imageUrl] = img;
                    ctx.drawImage(img, targetX, targetY, blockSize, blockSize);
                };
            }
        }
    });
}

// Real-time Database Sync
db.ref('pixels').on('value', s => {
    pixels = s.val() || {};
    render();
    
    // Update Stats on UI if elements exist
    if(document.getElementById('sold-count')) {
        document.getElementById('sold-count').innerText = Object.keys(pixels).length;
    }
    if(document.getElementById('rem-count')) {
        document.getElementById('rem-count').innerText = totalPossiblePlots - Object.keys(pixels).length;
    }
});

// Tooltip & Hover Logic
cv.addEventListener('mousemove', (e) => {
    const rect = cv.getBoundingClientRect();
    const scaleX = cv.width / rect.width;
    const scaleY = cv.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    let found = false;
    
    Object.values(pixels).forEach(p => {
        const id = parseInt(p.plotID) - 1;
        const px = (id % cols) * blockSize; 
        const py = Math.floor(id / cols) * blockSize;
        
        if (x >= px && x <= px + blockSize && y >= py && y <= py + blockSize) {
            tooltip.style.display = 'block';
            tooltip.style.left = (e.pageX + 15) + 'px'; 
            tooltip.style.top = (e.pageY + 15) + 'px';
            tooltip.innerHTML = `<div style="padding:10px; border:1px solid #333; background:#000;">
                                    <b style="color:#fff;">${p.name.toUpperCase()}</b><br>
                                    <span style="color:#666; font-size:10px;">LEGACY PLOT #${p.plotID}</span>
                                 </div>`;
            cv.style.cursor = 'pointer'; 
            found = true;
        }
    });
    
    if (!found) { 
        tooltip.style.display = 'none'; 
        cv.style.cursor = 'default'; 
    }
});

// Click Interaction
cv.addEventListener('click', (e) => {
    const rect = cv.getBoundingClientRect();
    const scaleX = cv.width / rect.width;
    const scaleY = cv.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    Object.values(pixels).forEach(p => {
        const id = parseInt(p.plotID) - 1;
        const px = (id % cols) * blockSize; 
        const py = Math.floor(id / cols) * blockSize;
        
        if (x >= px && x <= px + blockSize && y >= py && y <= py + blockSize) {
            if (p.link && p.link !== "#") {
                window.open(p.link, '_blank');
            }
        }
    });
});
