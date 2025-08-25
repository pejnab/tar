document.addEventListener('DOMContentLoaded', () => {
    // --- Element Refs ---
    const coloringArea = document.getElementById('coloring-area');
    const progressBar = document.querySelector('.progress-bar');
    const saveBtn = document.getElementById('save-btn');
    const savePdfBtn = document.getElementById('save-pdf-btn');
    const pathFillBtn = document.getElementById('path-fill-btn');
    const bucketFillBtn = document.getElementById('bucket-fill-btn');
    const canvas = document.getElementById('fill-canvas');
    const ctx = canvas.getContext('2d');

    // --- State ---
    let selectedColor = '#FFFFFF';
    let currentTool = 'path'; // 'path' or 'bucket'
    let totalPaths = 0;
    const coloredPaths = new Set();
    let svgDefs;
    let design;

    // --- Tool Switching ---
    pathFillBtn.addEventListener('click', () => {
        currentTool = 'path';
        pathFillBtn.classList.add('active');
        bucketFillBtn.classList.remove('active');
    });
    bucketFillBtn.addEventListener('click', () => {
        currentTool = 'bucket';
        bucketFillBtn.classList.add('active');
        pathFillBtn.classList.remove('active');
    });

    // --- Load Data ---
    const db = JSON.parse(localStorage.getItem('coloringBookDB')) || { collections: {} };
    const urlParams = new URLSearchParams(window.location.search);
    const collectionName = urlParams.get('collection');
    const designId = parseInt(urlParams.get('designId'), 10);
    const collection = collectionName ? db.collections[collectionName] : null;
    design = collection ? collection.find(d => d.id === designId) : null;

    // --- SVG & Canvas Setup ---
    if (design) {
        const svgContainer = document.createElement('div');
        svgContainer.innerHTML = design.svg;
        const svg = svgContainer.querySelector('svg');
        coloringArea.appendChild(svg);

        svgDefs = svg.querySelector('defs') || document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        svg.prepend(svgDefs);

        const paths = svg.querySelectorAll('path, circle, rect');
        totalPaths = paths.length;

        // Use a timeout to ensure SVG is rendered before drawing to canvas
        setTimeout(() => {
            const svgBox = svg.getBoundingClientRect();
            canvas.width = svgBox.width;
            canvas.height = svgBox.height;
            const img = new Image();
            const xml = new XMLSerializer().serializeToString(svg);
            const svg64 = btoa(xml);
            const b64start = 'data:image/svg+xml;base64,';
            const image64 = b64start + svg64;
            img.onload = function() {
                ctx.drawImage(img, 0, 0);
            };
            img.src = image64;
        }, 100);

    } else {
        coloringArea.innerHTML = '<h2>Design not found</h2>';
    }

    // --- Main Click Handler ---
    coloringArea.addEventListener('click', (e) => {
        if (!selectedColor) return;

        if (currentTool === 'path') {
            // Check if the click was on an SVG element
            if (e.target.tagName === 'path' || e.target.tagName === 'rect' || e.target.tagName === 'circle') {
                const path = e.target;
                if (!coloredPaths.has(path)) {
                    coloredPaths.add(path);
                    updateProgressBar();
                }
                path.style.fill = selectedColor;
            }
        } else if (currentTool === 'bucket') {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const fillColor = selectedColor; // For now, bucket fill only supports solid colors

            // Basic hex to rgba conversion
            const r = parseInt(fillColor.slice(1, 3), 16);
            const g = parseInt(fillColor.slice(3, 5), 16);
            const b = parseInt(fillColor.slice(5, 7), 16);

            floodFill(x, y, { r, g, b, a: 255 });
        }
    });

    // --- Color Picker ---
    new lc_color_picker('#color-picker-input', {
        dark_theme: true,
        on_change: (new_value) => {
            if (new_value.startsWith('linear-gradient') || new_value.startsWith('radial-gradient')) {
                // Gradient handling for path tool remains, but bucket tool will use solid fallback
                // For simplicity, we'll just use the first color of the gradient for the bucket.
                const firstColor = new_value.match(/#(?:[0-9a-fA-F]{3}){1,2}/);
                selectedColor = firstColor ? firstColor[0] : '#000000';

                // We could still generate the gradient for the path tool if we want
                // handleGradient(new_value);
            } else {
                selectedColor = new_value;
            }
        }
    });

    // --- Flood Fill Algorithm ---
    function floodFill(startX, startY, fillColor) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const startPos = (startY * canvas.width + startX) * 4;
        const startR = data[startPos];
        const startG = data[startPos + 1];
        const startB = data[startPos + 2];

        if (startR === fillColor.r && startG === fillColor.g && startB === fillColor.b) {
            return; // Clicked on already filled area
        }

        const queue = [[startX, startY]];
        while (queue.length) {
            const [x, y] = queue.shift();
            let currentPos = (y * canvas.width + x) * 4;

            if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) continue;

            if (data[currentPos] === startR && data[currentPos + 1] === startG && data[currentPos + 2] === startB) {
                data[currentPos] = fillColor.r;
                data[currentPos + 1] = fillColor.g;
                data[currentPos + 2] = fillColor.b;
                data[currentPos + 3] = fillColor.a;

                queue.push([x + 1, y]);
                queue.push([x - 1, y]);
                queue.push([x, y + 1]);
                queue.push([x, y - 1]);
            }
        }
        ctx.putImageData(imageData, 0, 0);
    }

    // --- Other Functions (Progress, Save) ---
    function updateProgressBar() {
        if (totalPaths === 0) return;
        const progress = (coloredPaths.size / totalPaths) * 100;
        progressBar.style.width = progress + '%';
    }

    saveBtn.addEventListener('click', () => {
        if (!design) return;
        html2canvas(coloringArea).then(canvas => {
            const link = document.createElement('a');
            link.download = `${design.name.replace('.svg', '')}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
    });

    savePdfBtn.addEventListener('click', () => {
        if (!design) return;
        const { jsPDF } = window.jspdf;
        html2canvas(coloringArea).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ orientation: 'p', unit: 'px', format: [canvas.width, canvas.height] });
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`${design.name.replace('.svg', '')}.pdf`);
        });
    });
});
