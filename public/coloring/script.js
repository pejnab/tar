document.addEventListener('DOMContentLoaded', () => {
    const designGallery = document.getElementById('design-gallery');
    const header = document.querySelector('header h1');

    // --- Load Data ---
    const db = JSON.parse(localStorage.getItem('coloringBookDB')) || { collections: {} };
    const urlParams = new URLSearchParams(window.location.search);
    const collectionName = urlParams.get('collection');
    const designs = collectionName ? db.collections[collectionName] : null;

    // --- Render Gallery ---
    if (designs) {
        header.textContent = `Collection: ${collectionName}`;
        if (designs.length === 0) {
            designGallery.innerHTML = '<p>This collection has no designs yet.</p>';
            return;
        }

        designs.forEach(design => {
            const designElement = document.createElement('div');
            designElement.classList.add('design-thumbnail');

            // Use a container for the SVG to control its size
            const svgContainer = document.createElement('div');
            svgContainer.classList.add('design-thumbnail-svg');
            svgContainer.innerHTML = design.svg;

            const nameElement = document.createElement('p');
            nameElement.textContent = design.name;

            designElement.appendChild(svgContainer);
            designElement.appendChild(nameElement);

            designElement.addEventListener('click', () => {
                window.location.href = `coloring.html?collection=${encodeURIComponent(collectionName)}&designId=${design.id}`;
            });
            designGallery.appendChild(designElement);
        });
    } else {
        header.textContent = 'Collection Not Found';
        designGallery.innerHTML = '<p>The requested collection could not be found. Please check the link.</p>';
    }
});
