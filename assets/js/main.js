document.addEventListener("DOMContentLoaded", function () {
    const filterDropdown = document.getElementById("filter-dropdown");
    const filterMenu = document.getElementById("filter-menu");
    const filterButtons = document.querySelectorAll(".filter-btn");
    const projectTiles = document.querySelectorAll(".project-tile");
    const projectCount = document.getElementById("project-count");

    // Check if filterDropdown and filterMenu exist
    if (!filterDropdown || !filterMenu) return; // Exit early if these elements don't exist

    let activeFilters = new Set();

    // Toggle dropdown visibility
    filterDropdown.addEventListener("click", (event) => {
        event.stopPropagation();  // Prevent closing the dropdown if clicked inside
        filterMenu.classList.toggle("open");
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", (event) => {
        if (!filterDropdown.contains(event.target) && !filterMenu.contains(event.target)) {
            filterMenu.classList.remove("open");
        }
    });

    function updateProjectVisibility() {
        let visibleCount = 0;

        projectTiles.forEach(tile => {
            const tags = tile.dataset.tags ? tile.dataset.tags.split(",") : [];
            const matches = [...activeFilters].some(filter => tags.includes(filter));

            if (activeFilters.size === 0 || matches) {
                tile.style.display = "block";
                visibleCount++;
            } else {
                tile.style.display = "none";
            }
        });

        projectCount.textContent = `Showing ${visibleCount} projects`;
    }

    // Handle filter button clicks
    filterButtons.forEach(button => {
        button.addEventListener("click", () => {
            const filter = button.dataset.filter;

            if (filter === "all") {
                activeFilters.clear();
                filterButtons.forEach(btn => btn.classList.remove("active"));
            } else {
                if (activeFilters.has(filter)) {
                    activeFilters.delete(filter);
                    button.classList.remove("active");
                } else {
                    activeFilters.add(filter);
                    button.classList.add("active");
                }
            }

            updateProjectVisibility();
        });
    });

    updateProjectVisibility(); // Initial update

    // Open Expanded View
    projectTiles.forEach(tile => {
        tile.addEventListener("click", function () {
            const projectUrl = tile.getAttribute("data-url");
            if (!projectUrl) return;

            // Remove existing expanded view if any
            document.querySelector(".expanded-view")?.remove();

            // Create expanded view
            const expandedView = document.createElement("div");
            expandedView.classList.add("expanded-view");
            expandedView.innerHTML = `
                <div class="expanded-content">
                    <button class="close-btn">✖</button>
                    <iframe src="${projectUrl}"></iframe>
                    <button class="share-btn"><i class="fas fa-share-alt"></i></button>
                </div>
            `;

            document.body.appendChild(expandedView);

            // Fade in animation
            setTimeout(() => expandedView.classList.add("show"), 10);

            // Close on button click or clicking outside
            expandedView.querySelector(".close-btn").addEventListener("click", () => expandedView.remove());
            expandedView.addEventListener("click", (e) => {
                if (e.target === expandedView) expandedView.remove();
            });

            // Share button
            expandedView.querySelector(".share-btn").addEventListener("click", () => {
                navigator.clipboard.writeText(projectUrl);
                alert("Project link copied!");
            });
        });
    });
});
async function getLastModified(url) {
    try {
        const response = await fetch(url, { method: 'HEAD' });
        const lastModified = response.headers.get('Last-Modified');
        return lastModified ? new Date(lastModified).toLocaleDateString() : "Unknown date";
    } catch (error) {
        console.error(`Error fetching last modified date for ${url}:`, error);
        return "Unknown date";
    }
}

async function updateProjectDates() {
    const projectTiles = document.querySelectorAll(".project-tile");

    projectTiles.forEach(async (tile) => {
        const projectUrl = tile.getAttribute("data-url");
        if (!projectUrl) return;

        const lastModifiedDate = await getLastModified(projectUrl);
        
        // Update the displayed last modified date
        const dateElement = tile.querySelector(".last-modified");
        if (dateElement) {
            dateElement.textContent = `Last Modified: ${lastModifiedDate}`;
        }
    });
}

// Run function after the DOM loads
document.addEventListener("DOMContentLoaded", updateProjectDates);
