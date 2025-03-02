document.addEventListener("DOMContentLoaded", function () {
    const filterButtons = document.querySelectorAll(".filter-btn");
    const projectTiles = document.querySelectorAll(".project-tile");

    // Event listener for filter buttons
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Toggle the 'active' class on button click
            button.classList.toggle('active');

            // Get active filters
            const activeFilters = Array.from(filterButtons)
                .filter(btn => btn.classList.contains('active')) // Get buttons that are 'active'
                .map(btn => btn.dataset.filter);

            // If 'all' is selected, show all projects
            if (activeFilters.includes('all') || activeFilters.length === 0) {
                projectTiles.forEach(tile => {
                    tile.style.display = 'block'; // Show all tiles
                });
            } else {
                // Filter projects based on active filters
                projectTiles.forEach(tile => {
                    const tags = tile.dataset.tags.split(','); // Get the tags as an array
                    const matches = activeFilters.some(filter => tags.includes(filter)); // Check if any active filter matches
                    tile.style.display = matches ? 'block' : 'none'; // Show or hide the project based on the filter
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
