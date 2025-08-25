document.addEventListener('DOMContentLoaded', () => {
    const coloringArea = document.getElementById('coloring-area');
    const colorPalette = document.getElementById('color-palette');
    const progressBar = document.querySelector('.progress-bar');
    const saveBtn = document.getElementById('save-btn');
    const savePdfBtn = document.getElementById('save-pdf-btn');

    let selectedColor = null;
    let totalPaths = 0;
    const coloredPaths = new Set();

    // --- Load Data ---
    const db = JSON.parse(localStorage.getItem('coloringBookDB')) || { collections: {} };
    const urlParams = new URLSearchParams(window.location.search);
    const collectionName = urlParams.get('collection');
    const designId = parseInt(urlParams.get('designId'), 10);

    const collection = collectionName ? db.collections[collectionName] : null;
    const design = collection ? collection.find(d => d.id === designId) : null;

    // --- Load SVG ---
    if (design) {
        coloringArea.innerHTML = design.svg;
        const svg = coloringArea.querySelector('svg');
        const paths = svg.querySelectorAll('path, circle, rect');
        totalPaths = paths.length;

        paths.forEach(path => {
            path.addEventListener('click', () => {
                if (selectedColor) {
                    // Don't count coloring the same path twice towards progress
                    if (!coloredPaths.has(path)) {
                        coloredPaths.add(path);
                        updateProgressBar();
                    }
                    path.style.fill = selectedColor;
                }
            });
        });
    } else {
        coloringArea.innerHTML = '<h2>Design not found</h2><p>The requested design could not be found.</p>';
    }

    // --- Populate Color Palette ---
    const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFFFFF', '#000000', '#800080', '#FFA500', '#A52A2A', '#808080'];
    colors.forEach(color => {
        const colorBox = document.createElement('div');
        colorBox.classList.add('color-box');
        colorBox.style.backgroundColor = color;
        colorBox.addEventListener('click', () => {
            selectedColor = color;
            document.querySelectorAll('.color-box').forEach(box => {
                box.style.border = '2px solid white';
            });
            colorBox.style.border = '2px solid #bb86fc';
        });
        colorPalette.appendChild(colorBox);
    });

    // --- Update Progress Bar ---
    function updateProgressBar() {
        if (totalPaths === 0) return;
        const progress = (coloredPaths.size / totalPaths) * 100;
        progressBar.style.width = progress + '%';
    }

    // --- Save Functionality ---
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
