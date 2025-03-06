document.addEventListener("DOMContentLoaded", function () {
    console.log("Custom Tooltip JS Loaded!");

    const filterDropdown = document.getElementById("filter-dropdown");
    const filterMenu = document.getElementById("filter-menu");
    const filterButtons = document.querySelectorAll(".filter-btn");
    const projectTiles = document.querySelectorAll(".project-tile");
    const projectCount = document.getElementById("project-count");

    if (!filterDropdown || !filterMenu) return;

    let activeFilters = new Set();

    filterDropdown.addEventListener("click", (event) => {
        event.stopPropagation();
        filterMenu.classList.toggle("open");
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

        projectCount.textContent = `Showing ${visibleCount} projects`;
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

    document.querySelectorAll('button[data-title]').forEach(button => {
        button.addEventListener("mouseenter", function () {
            let tooltipText = this.getAttribute('data-title');
            if (!tooltipText) return;

            let tooltip = document.createElement("div");
            tooltip.className = "custom-tooltip";
            tooltip.innerText = tooltipText;
            document.body.appendChild(tooltip);

            let rect = this.getBoundingClientRect();
            tooltip.style.position = "absolute";
            tooltip.style.top = `${rect.top - 30}px`;
            tooltip.style.left = `${rect.left + rect.width / 2}px`;
            tooltip.style.background = "black";
            tooltip.style.color = "white";
            tooltip.style.padding = "5px";
            tooltip.style.borderRadius = "5px";
            tooltip.style.opacity = "1";
            tooltip.style.display = "block";

            this.tooltipElement = tooltip;
        });

        button.addEventListener("mouseleave", function () {
            if (this.tooltipElement) {
                this.tooltipElement.remove();
                this.tooltipElement = null;
            }
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
