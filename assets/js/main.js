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

    document.addEventListener("click", (e) => {
        const checkbox = document.getElementById("drawer-toggle");
        const drawer = document.querySelector(".drawer");
        
        if (!drawer.contains(e.target) && e.target !== checkbox) {
          checkbox.checked = false;
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

        let tooltipLeft, tooltipTop;

        // Check if the button is a close button (adjust tooltip alignment)
        if (button.classList.contains('close-btn')) {
            tooltipLeft = rect.right - tooltipWidth; // Align with the right side of the button
            tooltipTop = rect.top - tooltipHeight - 5; // Slightly above the button
        } else {
            tooltipLeft = rect.left + rect.width / 2 - tooltipWidth / 2; // Centered (default)
            tooltipTop = rect.top - tooltipHeight - 5; // Slightly above the button
        }
    
        // Adjust the tooltip's position to ensure it stays within the viewport
        if (tooltipLeft + tooltipWidth > window.innerWidth) {
            tooltipLeft = window.innerWidth - tooltipWidth - 10;
        } else if (tooltipLeft < 0) {
            tooltipLeft = 10;
        }
    
        // If tooltip is too high, move it below the button
        if (tooltipTop < 0) {
            tooltipTop = rect.bottom + 5;
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

    document.body.addEventListener('click', function (event) {
        if (event.target && event.target.matches('button[data-title]')) {
            removeTooltip();
        }
    }, true);  // Use capture phase to ensure it works with dynamically added buttons

    document.querySelectorAll(".project-tile").forEach(tile => {
        tile.addEventListener("click", async function () {
            const projectUrl = tile.getAttribute("data-url");
            const projectTitle = encodeURIComponent(tile.getAttribute("data-title") || tile.querySelector("h3").textContent.trim());
            
            if (!projectUrl) return;
    
            document.querySelector(".expanded-view")?.remove();
    
            const expandedView = document.createElement("div");
            expandedView.classList.add("expanded-view");
    
            expandedView.innerHTML = `
                <div class="expanded-wrapper">
                    <div class="expanded-content">
                        <button class="close-btn" data-title="Close">✖</button>
                        <button class="new-tab-btn" data-title="Open in New Tab"><i class="fas fa-external-link-alt"></i></button>
                        <iframe id="project-iframe" src="${projectUrl}"></iframe>
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
                if (projectUrl.endsWith(".md")) {
                    window.open(`viewer.html?file=${encodeURIComponent(projectUrl)}&title=${projectTitle}`, "_blank");
                } else {                
                    window.open(projectUrl, "_blank");
                }
            });
    
            // 🔹 If it's a Markdown file, render it using Marked.js
            if (projectUrl.endsWith(".md")) {
                const iframe = document.getElementById("project-iframe");
    
                try {
                    const response = await fetch(projectUrl);
                    const markdownText = await response.text();
                    
                    const htmlContent = `
                        <html>
                        <head>
                            <title>${decodeURIComponent(projectTitle)}</title>
                            <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
                            <style>                                
                                body { font-family: Arial, sans-serif; padding: 20px; max-width: 90%; background-color: #f8f9fa; margin: auto; }
                                h1, h2, h3 { color: #333; }
                            </style>
                        </head>
                        <body>
                            <div id="content"></div>
                            <script>
                                document.getElementById('content').innerHTML = marked.parse(\`${markdownText}\`);
                            </script>
                        </body>
                        </html>
                    `;
    
                    const blob = new Blob([htmlContent], { type: "text/html" });
                    iframe.src = URL.createObjectURL(blob);
                } catch (error) {
                    console.error("Error loading Markdown:", error);
                }
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

document.addEventListener("DOMContentLoaded", function () {
    
    function checkScrollingText() {
        document.querySelectorAll(".overlay h3").forEach(h3 => {
            if (h3.scrollWidth > h3.clientWidth) {
                h3.classList.add("scroll-text");
            } else {
                h3.classList.remove("scroll-text");
            }
        });
    }
    // Initial check on DOMContentLoaded
    checkScrollingText();

    // Add event listener for window resize to dynamically check scroll requirement
    window.addEventListener("resize", function () {
        checkScrollingText();
    });
});


document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".project-tile").forEach(tile => {
        const tagsContainer = tile.querySelector(".project-tags");
        const tags = tile.getAttribute("data-tags").split(",");

        tags.forEach(tag => {
            const tagElement = document.createElement("span");
            tagElement.textContent = tag.trim();
            tagsContainer.appendChild(tagElement);
        });
    });
});
