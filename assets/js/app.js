document.addEventListener('DOMContentLoaded', () => {

    const canvasContainer = document.getElementById('canvas-container');
    const canvasElement = document.getElementById('coloring-canvas');
    if (!canvasElement || !canvasContainer) return;

    // --- State management ---
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

    // --- Load SVG ---
    // The SVG_PATH variable is created in the color.php template
    fabric.loadSVGFromURL(SVG_PATH, (objects, options) => {
        const svg = fabric.util.groupSVGElements(objects, options);

        // Make all paths non-interactive initially
        svg.getObjects().forEach(obj => {
            obj.set({
                selectable: false,
                evented: true, // Allow click events
                hasControls: false,
                hasBorders: false,
                lockMovementX: true,
                lockMovementY: true,
            });
        });

        canvas.add(svg);
        svg.center();
        canvas.renderAll();

        // Save initial state for undo/redo
        saveState();
    });

    // --- Tool Logic ---

    // 1. Fill Tool
    canvas.on('mouse:down', (options) => {
        if (options.target) {
            // Check if it's a path inside the grouped SVG
            if (options.target.isType('path') || options.target.isType('polygon') || options.target.isType('rect') || options.target.isType('circle')) {
                // Prevent changing color if it's the same
                if(options.target.get('fill') !== currentColor) {
                    options.target.set('fill', currentColor);
                    canvas.renderAll();
                    saveState();
                }
            }
        }
    });

    // --- Toolbar UI ---

    // 1. Color Palette
    const paletteContainer = document.getElementById('color-palette');
    const customColorInput = document.getElementById('custom-color');
    const presetColors = [
        '#E94560', '#F07B3F', '#FFD460', '#8BDB81', '#5CD8B2', '#3DB2FF', '#7A4DDD', '#C0392B',
        '#FFFFFF', '#BDC3C7', '#2C3E50', '#000000',
    ];

    presetColors.forEach(color => {
        const colorBox = document.createElement('div');
        colorBox.className = 'color-box';
        colorBox.style.backgroundColor = color;
        colorBox.addEventListener('click', () => {
            currentColor = color;
            updateActiveColor();
        });
        paletteContainer.appendChild(colorBox);
    });

    customColorInput.addEventListener('input', (e) => {
        currentColor = e.target.value;
        updateActiveColor();
    });

    function updateActiveColor() {
        // Remove active class from all boxes
        document.querySelectorAll('.color-box').forEach(box => box.classList.remove('active'));
        // Find and add active class to the selected preset, if it exists
        const activeBox = Array.from(document.querySelectorAll('.color-box')).find(box => box.style.backgroundColor === currentColor);
        if(activeBox) {
            activeBox.classList.add('active');
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
});
