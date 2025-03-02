document.addEventListener("DOMContentLoaded", function () {
    const filterButtons = document.querySelectorAll(".filter-btn");
    const projectTiles = document.querySelectorAll(".project-tile");
    let selectedFilters = new Set();
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            button.classList.toggle('active');
            const activeFilters = Array.from(filterButtons)
                .filter(btn => btn.classList.contains('active'))
                .map(btn => btn.dataset.filter);

            if (activeFilters.includes('all') || activeFilters.length === 0) {
                projectTiles.forEach(tile => {
                    tile.style.display = 'block';
                });
            } else {
                projectTiles.forEach(tile => {
                    const tags = tile.dataset.tags.split(',');
                    const matches = activeFilters.some(filter => tags.includes(filter));
                    tile.style.display = matches ? 'block' : 'none'; 
                });
            }
        });
    });

    function sortProjects() {
        const grid = document.querySelector(".project-grid");
        const tiles = Array.from(projectTiles);
        
        tiles.sort((a, b) => {
            return new Date(b.getAttribute("data-modified")) - new Date(a.getAttribute("data-modified"));
        });
        
        tiles.forEach(tile => grid.appendChild(tile));
    }

    projectTiles.forEach(tile => {
        tile.addEventListener("click", function () {
            const projectUrl = tile.getAttribute("data-url");
            if (!projectUrl) return;

            const existingView = document.querySelector(".expanded-view");
            if (existingView) existingView.remove();

            const expandedView = document.createElement("div");
            expandedView.classList.add("expanded-view");

            expandedView.innerHTML = `
            <iframe src="${projectUrl}"></iframe>
            <button class="close-btn">✖</button>
            <button class="share-btn"><i class="fas fa-share-alt"></i></button>
            `;

            document.body.appendChild(expandedView);

            // Trigger the transition by adding the 'show' class
            setTimeout(() => {
                expandedView.classList.add("show");
            }, 10); // Ensure it happens after the element is added to the DOM

            expandedView.querySelector(".close-btn").addEventListener("click", function () {
                expandedView.remove();
            });

            // Share functionality (Copy URL to clipboard)
            expandedView.querySelector(".share-btn").addEventListener("click", function () {
                const shareUrl = window.location.origin + projectUrl; // Full URL to the project page
                navigator.clipboard.writeText(shareUrl).then(() => {
                    alert("Project link copied to clipboard!");
                }).catch(err => {
                    alert("Failed to copy the link.");
                });
            });

            expandedView.addEventListener("click", function (event) {
                if (event.target === expandedView) {
                    expandedView.remove();
                }
            });
        });
    });

    sortProjects();
});
