document.addEventListener('DOMContentLoaded', () => {

    const canvasContainer = document.getElementById('canvas-container');
    const canvasElement = document.getElementById('coloring-canvas');
    if (!canvasElement || !canvasContainer) return;

    // --- DOM Elements ---
    const loadingIndicator = document.getElementById('loading-indicator');

    // --- State management ---
    let currentTool = 'fill'; // 'fill' or 'brush'
    let currentColor = '#BB86FC'; // Default to accent color
    let history = [];
    let historyIndex = -1;
    let historyLock = false;

    // --- Canvas Setup ---
    const canvas = new fabric.Canvas(canvasElement, {
        width: canvasContainer.offsetWidth,
        height: canvasContainer.offsetHeight,
        backgroundColor: '#ffffff',
    });

    // --- Load SVG & Progress ---
    function loadDesignAndProgress(isLoggedIn) {
        if (isLoggedIn) {
            // Try to load saved progress first
            fetch(`api/load_progress.php?design_id=${DESIGN_ID}`)
                .then(res => res.json())
                .then(response => {
                    if (response.success && response.data) {
                        canvas.loadFromJSON(response.data, () => {
                            canvas.renderAll();
                            // Save this loaded state as the initial state
                            saveState();
                            loadingIndicator.style.display = 'none';
                        });
                    } else {
                        // No progress found, load the blank SVG
                        loadBlankSVG();
                    }
                }).catch(() => loadBlankSVG()); // On error, load blank
        } else {
            // Not logged in, just load the blank SVG
            loadBlankSVG();
        }
    }

    function loadBlankSVG() {
        fabric.loadSVGFromURL(SVG_PATH, (objects, options) => {
            // Use fabric's parser to get a clean set of objects
            const loadedObjects = fabric.util.groupSVGElements(objects, options).getObjects();

            // Create a temporary group to handle scaling and centering
            const group = new fabric.Group(loadedObjects);

            // Scale to fit canvas
            const canvasWidth = canvas.getWidth();
            const canvasHeight = canvas.getHeight();
            const padding = 50;

            group.scaleToWidth(canvasWidth - padding);
            if (group.getScaledHeight() > canvasHeight - padding) {
                group.scaleToHeight(canvasHeight - padding);
            }

            // Center the group
            group.center();

            // Ungroup the objects, but keep their calculated positions and scales
            const items = group.destroy().getObjects();

            items.forEach(item => {
                item.set({
                    selectable: false,
                    evented: true,
                    hasControls: false,
                    hasBorders: false,
                    lockMovementX: true,
                    lockMovementY: true,
                });
                canvas.add(item);
            });

            canvas.renderAll();
            saveState(); // Save initial blank state
            loadingIndicator.style.display = 'none';
        });
    }

    // Listen for the auth script to tell us if we are logged in
    document.addEventListener('auth-checked', (e) => {
        loadDesignAndProgress(e.detail.loggedIn);
    });

    // --- Tool Logic ---
    let currentClippingShape = null;

    canvas.on('mouse:down', (options) => {
        // Panning logic takes precedence
        if (altKeyDown) {
            isPanning = true;
            lastPosX = options.e.clientX;
            lastPosY = options.e.clientY;
            canvas.defaultCursor = 'grabbing';
            return; // Stop further processing
        }

        const target = options.target;
        if (!target) return;

        if (currentTool === 'fill') {
            // --- Fill Tool Logic ---
            if (target.isType('path') || target.isType('polygon') || target.isType('rect') || target.isType('circle')) {
                if (typeof currentColor === 'object' && currentColor.isGradient) {
                    const gradient = new fabric.Gradient({
                        type: 'linear', coords: { x1: 0, y1: 0, x2: target.width, y2: target.height },
                        colorStops: currentColor.colors.map((color, index) => ({ offset: index / (currentColor.colors.length - 1), color: color }))
                    });
                    target.set('fill', gradient);
                } else {
                    if(target.get('fill') !== currentColor) target.set('fill', currentColor);
                }
                canvas.renderAll();
                saveState();
            }
        } else if (currentTool === 'brush') {
            // --- Smart Brush Logic (Part 1: Set Clip Path) ---
            if (target.isType('path') || target.isType('polygon') || target.isType('rect') || target.isType('circle')) {
                currentClippingShape = target;
                canvas.clipPath = currentClippingShape;
            }
        } else if (currentTool === 'eraser') {
            // --- Eraser Tool Logic ---
            if (target.isType('path') || target.isType('polygon') || target.isType('rect') || target.isType('circle')) {
                target.set('fill', 'transparent');
                canvas.renderAll();
                saveState();
            }
        }
    });

    canvas.on('mouse:up', () => {
        // --- Smart Brush Logic (Part 2: Release Clip Path) ---
        if (currentTool === 'brush' && currentClippingShape) {
            currentClippingShape = null;
            canvas.clipPath = null;
        }
    });

    canvas.on('path:created', (e) => {
        // --- Smart Brush Logic (Part 3: Finalize Path) ---
        // Make the new brush stroke non-interactive so it doesn't block the region behind it.
        e.path.set({ evented: false });
        saveState();
    });


    // --- Toolbar UI ---
    const fillToolBtn = document.getElementById('fill-tool-btn');
    const brushToolBtn = document.getElementById('brush-tool-btn');
    const eraserToolBtn = document.getElementById('eraser-tool-btn');
    const brushOptions = document.getElementById('brush-options');
    const brushSizeSlider = document.getElementById('brush-size');
    const brushSizeLabel = document.getElementById('brush-size-label');

    function setTool(tool) {
        currentTool = tool;
        if (tool === 'brush') {
            canvas.isDrawingMode = true;
            brushOptions.style.display = 'block';
            brushToolBtn.classList.add('active');
            fillToolBtn.classList.remove('active');
        } else { // fill or eraser
            canvas.isDrawingMode = false;
            brushOptions.style.display = 'none';

            fillToolBtn.classList.toggle('active', tool === 'fill');
            brushToolBtn.classList.toggle('active', tool === 'brush');
            eraserToolBtn.classList.toggle('active', tool === 'eraser');
        }
    }

    fillToolBtn.addEventListener('click', () => setTool('fill'));
    brushToolBtn.addEventListener('click', () => setTool('brush'));
    eraserToolBtn.addEventListener('click', () => setTool('eraser'));

    // Brush properties
    canvas.freeDrawingBrush.color = currentColor;
    canvas.freeDrawingBrush.width = parseInt(brushSizeSlider.value, 10);

    brushSizeSlider.addEventListener('input', (e) => {
        const newSize = parseInt(e.target.value, 10);
        canvas.freeDrawingBrush.width = newSize;
        brushSizeLabel.textContent = newSize;
    });

    // 1. Color Palette
    const paletteContainer = document.getElementById('color-palette');
    const customColorInput = document.getElementById('custom-color');
    const presetColors = [
        '#E94560', '#F07B3F', '#FFD460', '#8BDB81', '#5CD8B2', '#3DB2FF', '#7A4DDD', '#C0392B',
        '#FFFFFF', '#BDC3C7', '#2C3E50', '#000000',
    ];

    const presetGradients = [
        { name: 'Sunset', colors: ['#F9C851', '#E94560'] },
        { name: 'Ocean', colors: ['#3DB2FF', '#16213E'] },
        { name: 'Forest', colors: ['#8BDB81', '#2C3E50'] },
        { name: 'Rainbow', colors: ['#E94560', '#FFD460', '#8BDB81', '#3DB2FF'] }
    ];

    presetColors.forEach(color => {
        const colorBox = document.createElement('div');
        colorBox.className = 'color-box';
        colorBox.style.backgroundColor = color;
        colorBox.dataset.color = color;
        colorBox.addEventListener('click', () => {
            currentColor = color;
            updateActiveColor();
        });
        paletteContainer.appendChild(colorBox);
    });

    presetGradients.forEach(grad => {
        const colorBox = document.createElement('div');
        colorBox.className = 'color-box';
        colorBox.style.background = `linear-gradient(45deg, ${grad.colors.join(',')})`;
        colorBox.dataset.gradient = JSON.stringify(grad.colors);
        colorBox.addEventListener('click', () => {
            currentColor = { isGradient: true, colors: grad.colors };
            updateActiveColor();
        });
        paletteContainer.appendChild(colorBox);
    });

    customColorInput.addEventListener('input', (e) => {
        currentColor = e.target.value;
        updateActiveColor();
    });

    function updateActiveColor() {
        // Update brush color - gradients can't be used for the brush, so default to black
        if (typeof currentColor === 'string') {
            canvas.freeDrawingBrush.color = currentColor;
        } else {
            canvas.freeDrawingBrush.color = '#000000';
        }

        // Remove active class from all boxes
        document.querySelectorAll('.color-box').forEach(box => box.classList.remove('active'));

        if (typeof currentColor === 'object' && currentColor.isGradient) {
            const gradString = JSON.stringify(currentColor.colors);
            const activeBox = Array.from(document.querySelectorAll('.color-box')).find(box => box.dataset.gradient === gradString);
            if(activeBox) activeBox.classList.add('active');
        } else {
            const activeBox = Array.from(document.querySelectorAll('.color-box')).find(box => box.dataset.color && box.dataset.color.toLowerCase() === currentColor.toLowerCase());
            if(activeBox) activeBox.classList.add('active');
        }
    }
    // Set initial active color
    updateActiveColor();

    // 2. Undo/Redo Buttons
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');

    undoBtn.addEventListener('click', undo);
    redoBtn.addEventListener('click', redo);

    function saveState() {
        if (historyLock) return;
        // Clear the "redo" history
        history.splice(historyIndex + 1);
        // Add new state
        history.push(canvas.toJSON());
        historyIndex = history.length - 1;
        updateUndoRedoButtons();
    }

    function replayState(index) {
        historyLock = true;
        canvas.loadFromJSON(history[index], () => {
            canvas.renderAll();
            historyLock = false;
        });
    }

    function undo() {
        if (historyIndex > 0) {
            historyIndex--;
            replayState(historyIndex);
            updateUndoRedoButtons();
        }
    }

    function redo() {
        if (historyIndex < history.length - 1) {
            historyIndex++;
            replayState(historyIndex);
            updateUndoRedoButtons();
        }
    }

    function updateUndoRedoButtons() {
        undoBtn.disabled = historyIndex <= 0;
        redoBtn.disabled = historyIndex >= history.length - 1;
    }
    updateUndoRedoButtons();


    // --- Responsive Canvas ---
    window.addEventListener('resize', () => {
        canvas.setWidth(canvasContainer.offsetWidth);
        canvas.setHeight(canvasContainer.offsetHeight);
        canvas.renderAll();
    });

    // --- Export Logic ---
    const exportPngBtn = document.getElementById('export-png-btn');
    exportPngBtn.addEventListener('click', () => {
        const originalBg = canvas.backgroundColor;
        canvas.backgroundColor = 'transparent';
        canvas.renderAll();

        const dataURL = canvas.toDataURL({
            format: 'png',
            quality: 1.0
        });

        // Restore background
        canvas.backgroundColor = originalBg;
        canvas.renderAll();

        // Trigger download
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = 'coloring-masterpiece.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // --- Save Progress Logic ---
    const saveProgressBtn = document.getElementById('save-progress-btn');
    saveProgressBtn.addEventListener('click', () => {
        const progressData = JSON.stringify(canvas.toJSON());

        fetch('api/save_progress.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                design_id: DESIGN_ID,
                progress_data: progressData
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                // Show a temporary success message
                saveProgressBtn.textContent = 'Saved!';
                setTimeout(() => {
                    saveProgressBtn.textContent = 'Save Progress';
                }, 2000);
            } else {
                alert(data.message); // Or a more gentle notification
            }
        }).catch(() => alert('Error saving progress.'));
    });

    // --- Export PDF Logic ---
    const exportPdfBtn = document.getElementById('export-pdf-btn');
    exportPdfBtn.addEventListener('click', () => {
        const { jsPDF } = window.jspdf;

        const dataURL = canvas.toDataURL({
            format: 'png',
            quality: 1.0,
            multiplier: 2 // Render at 2x resolution for better PDF quality
        });

        const doc = new jsPDF({
            orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
            unit: 'px',
            format: [canvas.width, canvas.height]
        });

        const pdfWidth = doc.internal.pageSize.getWidth();
        const pdfHeight = doc.internal.pageSize.getHeight();

        doc.addImage(dataURL, 'PNG', 0, 0, pdfWidth, pdfHeight);
        doc.save('coloring-masterpiece.pdf');
    });

    // --- Zoom and Pan Logic ---
    let isPanning = false;
    let lastPosX, lastPosY;
    let altKeyDown = false;

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Alt') {
            altKeyDown = true;
            canvas.defaultCursor = 'grab';
        }
    });
    window.addEventListener('keyup', (e) => {
        if (e.key === 'Alt') {
            altKeyDown = false;
            canvas.defaultCursor = 'default';
        }
    });

    canvas.on('mouse:wheel', function(opt) {
        var delta = opt.e.deltaY;
        var zoom = canvas.getZoom();
        zoom *= 0.999 ** delta;
        if (zoom > 20) zoom = 20; // Max zoom
        if (zoom < 0.1) zoom = 0.1; // Min zoom
        canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
        opt.e.preventDefault();
        opt.e.stopPropagation();
    });

    canvas.on('mouse:move', function(opt) {
        if (isPanning) {
            const e = opt.e;
            const delta = new fabric.Point(e.clientX - lastPosX, e.clientY - lastPosY);
            this.relativePan(delta);
            lastPosX = e.clientX;
            lastPosY = e.clientY;
        }
    });

    canvas.on('mouse:up', function(opt) {
        this.setViewportTransform(this.viewportTransform);
        isPanning = false;
        if (altKeyDown) {
            canvas.defaultCursor = 'grab';
        }
    });

});
