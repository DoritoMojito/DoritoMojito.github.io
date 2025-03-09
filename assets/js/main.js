document.addEventListener("DOMContentLoaded", function () {
    console.log("Custom Tooltip JS Loaded!");

    const filterDropdown = document.getElementById("drawer-toggle");
    const filterMenu = document.getElementById("filter-menu");
    const filterButtons = document.querySelectorAll(".filter-btn");
    const projectTiles = document.querySelectorAll(".project-tile");
    const projectCount = document.getElementById("project-count");
    const filterDrawer = document.getElementById("filter-drawer");

    if (!filterDropdown || !filterMenu  ) return;

    let activeFilters = new Set();

    filterDropdown.addEventListener("click", (event) => {
        event.stopPropagation();
        filterMenu.classList.toggle("open");
    });
    filterDropdown.addEventListener("click", function () {
        filterDrawer.classList.toggle("open");
    });

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

        projectCount.textContent = `${visibleCount}`;
    }

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

    updateProjectVisibility();

    // Function to create and position the tooltip
    function createTooltip(button) {
        const tooltipText = button.getAttribute('data-title');

        // Create the tooltip element
        const tooltip = document.createElement('div');
        tooltip.classList.add('custom-tooltip');
        tooltip.textContent = tooltipText;

        // Append tooltip to the body
        document.body.appendChild(tooltip);

        // Get the button's position relative to the viewport
        const rect = button.getBoundingClientRect();
        const tooltipWidth = tooltip.offsetWidth;
        const tooltipHeight = tooltip.offsetHeight;

        // Calculate the position of the tooltip to ensure it stays within the viewport
        let tooltipLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
        let tooltipTop = rect.top - tooltipHeight - 5;

        // Adjust the tooltip's position if it's too far right or left
        if (tooltipLeft + tooltipWidth > window.innerWidth) {
            tooltipLeft = window.innerWidth - tooltipWidth - 10;
        } else if (tooltipLeft < 0) {
            tooltipLeft = 10;
        }

        // Adjust the tooltip's vertical position if it's too far top
        if (tooltipTop < 0) {
            tooltipTop = rect.bottom + 25; // Position it below the button if above the viewport
        }

        // Set the tooltip's final position
        tooltip.style.top = `${tooltipTop}px`;
        tooltip.style.left = `${tooltipLeft}px`;
        tooltip.style.visibility = 'visible';  // Show tooltip
        tooltip.style.opacity = '1'; // Fade in
    }

    // Function to remove the tooltip
    function removeTooltip() {
        const tooltip = document.querySelector('.custom-tooltip');
        if (tooltip) {
            tooltip.remove();  // Remove tooltip when the mouse leaves
        }
    }

    // Event delegation for mouseenter and mouseleave events
    document.body.addEventListener('mouseenter', function (event) {
        if (event.target && event.target.matches('button[data-title]')) {
            createTooltip(event.target);
        }
    }, true);  // Use capture phase to ensure it works with dynamically added buttons

    document.body.addEventListener('mouseleave', function (event) {
        if (event.target && event.target.matches('button[data-title]')) {
            removeTooltip();
        }
    }, true);  // Use capture phase to ensure it works with dynamically added buttons

    projectTiles.forEach(tile => {
        tile.addEventListener("click", function () {
            const projectUrl = tile.getAttribute("data-url");
            if (!projectUrl) return;
    
            document.querySelector(".expanded-view")?.remove();
    
            const expandedView = document.createElement("div");
            expandedView.classList.add("expanded-view");
    
            expandedView.innerHTML = `
                <div class="expanded-wrapper">
                    <div class="expanded-content">
                        <button class="close-btn" data-title="Close">✖</button>
                        <button class="new-tab-btn" data-title="Open in New Tab"><i class="fas fa-external-link-alt"></i></button>
                        <iframe src="${projectUrl}"></iframe>
                    </div>
                </div>
            `;
    
            document.body.appendChild(expandedView);
    
            setTimeout(() => expandedView.classList.add("show"), 10);
    
            expandedView.addEventListener("click", (e) => {
                if (!expandedView.querySelector(".expanded-content").contains(e.target)) {
                    expandedView.remove();
                }
            });
    
            expandedView.querySelector(".close-btn").addEventListener("click", () => expandedView.remove());
    
            expandedView.querySelector(".new-tab-btn").addEventListener("click", () => {
                window.open(projectUrl, "_blank");
            });
        });
    });

    function sortFilterButtons() {
        const buttonsArray = Array.from(filterButtons);
        const allButton = buttonsArray.find(btn => btn.dataset.filter === "all");
        const otherButtons = buttonsArray.filter(btn => btn.dataset.filter !== "all");
        
        otherButtons.sort((a, b) => a.textContent.localeCompare(b.textContent));
        
        filterMenu.innerHTML = "";
        if (allButton) filterMenu.appendChild(allButton);
        otherButtons.forEach(btn => filterMenu.appendChild(btn));
    }

    sortFilterButtons();
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
        
        const dateElement = tile.querySelector(".last-modified");
        if (dateElement) {
            dateElement.textContent = `Last Modified: ${lastModifiedDate}`;
        }
    });
}

document.addEventListener("DOMContentLoaded", updateProjectDates);
