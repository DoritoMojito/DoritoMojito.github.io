document.addEventListener("DOMContentLoaded", function () {
    const filterButtons = document.querySelectorAll(".filter-btn");
    const projectTiles = document.querySelectorAll(".project-tile");
    let selectedFilters = new Set();
    
// Event listener for filter buttons
filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Toggle the active class
        button.classList.toggle('active');
        
        // Get active filters
        const activeFilters = Array.from(filterButtons)
            .filter(btn => btn.classList.contains('active'))
            .map(btn => btn.dataset.filter);

        // If 'all' is selected, show all projects
        if (activeFilters.includes('all') || activeFilters.length === 0) {
            projectTiles.forEach(tile => {
                tile.style.display = 'block';
            });
        } else {
            // Filter projects based on active filters
            projectTiles.forEach(tile => {
                const categories = tile.dataset.category.split(','); // Get the categories as an array
                const matches = activeFilters.some(filter => categories.includes(filter)); // Check if any active filter matches
                tile.style.display = matches ? 'block' : 'none'; // Show or hide the project based on the filter
            });
        }
    });
});
    
    function updateProjectVisibility() {
        projectTiles.forEach(tile => {
            const category = tile.getAttribute("data-tags");
            if (selectedFilters.size === 0 || selectedFilters.has(category)) {
                tile.style.display = "grid";
            } else {
                tile.style.display = "none";
            }
        });
    }
    
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
            if (!projectUrl) return; // Skip if no URL is provided

            // Remove any existing expanded view
            const existingView = document.querySelector(".expanded-view");
            if (existingView) existingView.remove();

            // Create the expanded view container
            const expandedView = document.createElement("div");
            expandedView.classList.add("expanded-view");

            // Insert an iframe to load the project details
            expandedView.innerHTML = `
                <iframe src="${projectUrl}"></iframe>
                <button class="close-btn">Close</button>
            `;

            document.body.appendChild(expandedView);

            // Close the view when the button is clicked
            expandedView.querySelector(".close-btn").addEventListener("click", function () {
                expandedView.remove();
            });
        });
    });
    
    sortProjects();
});
