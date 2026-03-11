/**
 * THE JULY LEGACY | ARK ARCHIVE
 * ENGINE VERSION: 3.0 (INFINITE SCROLL & REAL-TIME SYNC)
 * DESIGNED BY: KAWSAR AHMED
 */

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCAdnfu2R82xbC7H85n_9mvQBE58X3TjbA",
    authDomain: "the-5k-elite-legacy.firebaseapp.com",
    databaseURL: "https://the-5k-elite-legacy-default-rtdb.firebaseio.com",
    projectId: "the-5k-elite-legacy",
    storageBucket: "the-5k-elite-legacy.firebasestorage.app",
    messagingSenderId: "440824313752",
    appId: "1:440824313752:web:2c93344dcfe2ba0a4c5ded"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Canvas Setup
const cv = document.getElementById('mainCanvas');
const ctx = cv.getContext('2d');
const tooltip = document.getElementById('legacy-tooltip');

// Global Constants
const blockSize = 30; // Each plot is 30x30 pixels
const cols = 100;     // 100 plots per row

let pixels = {};
const imgCache = {};

/**
 * রেন্ডার ইঞ্জিন: এটি ডাটাবেস থেকে পাওয়া তথ্যের ভিত্তিতে 
 * ক্যানভাসের সাইজ নির্ধারণ করে এবং ড্রয়িং করে।
 */
function render() {
    // ডাটাবেসে থাকা প্লটগুলোর মধ্যে সর্বোচ্চ নম্বরটি খুঁজে বের করা
    const plotIDs = Object.values(pixels).map(p => parseInt(p.plotID));
    const maxPlotID = plotIDs.length > 0 ? Math.max(...plotIDs) : 0;
    
    /**
     * INFINITE LOGIC: 
     * যদি শেষ প্লটটি ৫০০ হয়, তবে এটি আরও ১০০টি খালি প্লট (১টি রো) যোগ করে দেখাবে।
     * এভাবে এটি সবসময় সামনের দিকে অসীমভাবে বাড়তে থাকবে।
     */
    const dynamicRows = Math.ceil((maxPlotID + 100) / cols);
    
    cv.width = cols * blockSize;
    cv.height = dynamicRows * blockSize;

    // Background - Deep Luxury Black
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, cv.width, cv.height);

    // Subtle Grid Drawing - Minimalist Feel
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 0.5;

    for (let i = 0; i <= cols; i++) {
        ctx.beginPath();
        ctx.moveTo(i * blockSize, 0);
        ctx.lineTo(i * blockSize, cv.height);
        ctx.stroke();
    }
    for (let j = 0; j <= dynamicRows; j++) {
        ctx.beginPath();
        ctx.moveTo(0, j * blockSize);
        ctx.lineTo(cv.width, j * blockSize);
        ctx.stroke();
    }

    // Drawing the Plots (Images)
    Object.values(pixels).forEach(p => {
        if (p.imageUrl) {
            const id = parseInt(p.plotID) - 1; // 0-based index
            const targetX = (id % cols) * blockSize;
            const targetY = Math.floor(id / cols) * blockSize;

            if (imgCache[p.imageUrl]) {
                ctx.drawImage(imgCache[p.imageUrl], targetX, targetY, blockSize, blockSize);
            } else {
                const img = new Image();
                img.crossOrigin = "anonymous"; // Prevents CORS issues
                img.src = p.imageUrl;
                img.onload = () => {
                    imgCache[p.imageUrl] = img;
                    ctx.drawImage(img, targetX, targetY, blockSize, blockSize);
                };
            }
        }
    });
}

// Firebase Real-time Listener
db.ref('pixels').on('value', snapshot => {
    pixels = snapshot.val() || {};
    render();
    
    // Update Stats on Dashboard
    const totalSold = Object.keys(pixels).length;
    if(document.getElementById('sold-count')) {
        document.getElementById('sold-count').innerText = totalSold;
    }
});

/**
 * Interactive Tooltip Logic
 */
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
            
            tooltip.innerHTML = `
                <div style="background: #000; border: 1px solid #333; padding: 10px; color: #fff; font-family: serif; min-width: 120px; box-shadow: 0 5px 15px rgba(0,0,0,0.5);">
                    <div style="font-size: 12px; letter-spacing: 2px; border-bottom: 1px solid #222; margin-bottom: 5px; padding-bottom: 5px;">${p.name.toUpperCase()}</div>
                    <div style="font-size: 10px; color: #666; letter-spacing: 1px;">PLOT IDENTITY #${p.plotID}</div>
                </div>
            `;
            
            cv.style.cursor = 'pointer';
            found = true;
        }
    });

    if (!found) {
        tooltip.style.display = 'none';
        cv.style.cursor = 'default';
    }
});

/**
 * External Link Navigation on Click
 */
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

// Window Resize Handler to maintain quality
window.addEventListener('resize', render);
