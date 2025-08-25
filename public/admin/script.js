document.addEventListener('DOMContentLoaded', () => {
    // --- DB Initialization ---
    let db = JSON.parse(localStorage.getItem('coloringBookDB')) || { collections: {} };
    function saveDB() {
        localStorage.setItem('coloringBookDB', JSON.stringify(db));
    }

    // --- Element References ---
    const addCollectionBtn = document.getElementById('add-collection-btn');
    const uploadDesignBtn = document.getElementById('upload-design-btn');
    const saveCollectionBtn = document.getElementById('save-collection-btn');
    const saveDesignBtn = document.getElementById('save-design-btn');
    const addCollectionModal = document.getElementById('add-collection-modal');
    const uploadDesignModal = document.getElementById('upload-design-modal');
    const shareCollectionModal = document.getElementById('share-collection-modal');
    const closeBtns = document.querySelectorAll('.close-btn');
    const collectionList = document.getElementById('collection-list');
    const designList = document.getElementById('design-list');
    const collectionNameInput = document.getElementById('collection-name-input');
    const collectionSelect = document.getElementById('collection-select');
    const designFileInput = document.getElementById('design-file-input');
    const collectionLinkInput = document.getElementById('collection-link-input');
    const qrCodeContainer = document.getElementById('qr-code-container');

    // --- Initial Render ---
    renderCollections();
    renderDesigns();

    // --- Modal Handling ---
    addCollectionBtn.addEventListener('click', () => addCollectionModal.style.display = 'block');
    uploadDesignBtn.addEventListener('click', () => uploadDesignModal.style.display = 'block');
    closeBtns.forEach(btn => btn.addEventListener('click', () => {
        addCollectionModal.style.display = 'none';
        uploadDesignModal.style.display = 'none';
        shareCollectionModal.style.display = 'none';
    }));
    window.addEventListener('click', (event) => {
        if (event.target == addCollectionModal || event.target == uploadDesignModal || event.target == shareCollectionModal) {
            event.target.style.display = 'none';
        }
    });

    // --- Data Handling ---
    saveCollectionBtn.addEventListener('click', () => {
        const collectionName = collectionNameInput.value.trim();
        if (collectionName && !db.collections[collectionName]) {
            db.collections[collectionName] = [];
            saveDB();
            renderCollections();
            collectionNameInput.value = '';
            addCollectionModal.style.display = 'none';
        } else if (db.collections[collectionName]) {
            alert('A collection with this name already exists.');
        }
    });

    saveDesignBtn.addEventListener('click', () => {
        const selectedCollection = collectionSelect.value;
        const designFile = designFileInput.files[0];

        if (selectedCollection && designFile && designFile.type === "image/svg+xml") {
            const reader = new FileReader();
            reader.onload = (e) => {
                const newDesign = {
                    id: Date.now(),
                    name: designFile.name,
                    svg: e.target.result
                };
                db.collections[selectedCollection].push(newDesign);
                saveDB();
                renderDesigns();
                designFileInput.value = '';
                uploadDesignModal.style.display = 'none';
            };
            reader.readAsText(designFile);
        } else {
            alert('Please select a collection and a valid SVG file.');
        }
    });

    // --- Render Functions ---
    function renderCollections() {
        collectionList.innerHTML = '';
        collectionSelect.innerHTML = '<option value="">Select a Collection</option>';
        for (const collectionName in db.collections) {
            // Render list item
            const collectionElement = document.createElement('div');
            collectionElement.classList.add('collection-item');
            const nameSpan = document.createElement('span');
            nameSpan.textContent = collectionName;
            const shareBtn = document.createElement('button');
            shareBtn.textContent = 'Share';
            shareBtn.onclick = () => generateAndShowQRCode(collectionName);
            collectionElement.append(nameSpan, shareBtn);
            collectionList.appendChild(collectionElement);

            // Render select option
            const option = document.createElement('option');
            option.value = collectionName;
            option.textContent = collectionName;
            collectionSelect.appendChild(option);
        }
    }

    function renderDesigns() {
        designList.innerHTML = '';
        for (const collectionName in db.collections) {
            db.collections[collectionName].forEach(design => {
                const designElement = document.createElement('div');
                designElement.classList.add('design-item');
                designElement.textContent = `${design.name} (in ${collectionName})`;
                designList.appendChild(designElement);
            });
        }
    }

    // --- QR Code Generation ---
    function generateAndShowQRCode(collectionName) {
        const link = `${window.location.origin}/coloring/index.html?collection=${encodeURIComponent(collectionName)}`;
        collectionLinkInput.value = link;
        qrCodeContainer.innerHTML = '';
        const qr = qrcode(0, 'L');
        qr.addData(link);
        qr.make();
        qrCodeContainer.innerHTML = qr.createImgTag(4);
        shareCollectionModal.style.display = 'block';
    }
});
