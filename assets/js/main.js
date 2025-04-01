document.addEventListener("DOMContentLoaded", function () {
    console.log("Custom Tooltip JS Loaded!");

    // Initialize variables for DOM elements
    const filterDropdown = document.getElementById("drawer-toggle");
    const filterMenu = document.getElementById("filter-menu");
    const filterButtons = document.querySelectorAll(".filter-btn");
    const projectTiles = document.querySelectorAll(".project-tile");
    const projectCount = document.getElementById("project-count");
    const filterDrawer = document.getElementById("filter-drawer");

    if (!filterDropdown || !filterMenu) return;

    let activeFilters = new Set();

    // Existing event listeners and functions here...

    // Tooltip handling code
    function createTooltip(button) {
        const tooltipText = button.getAttribute('data-title');
        const tooltip = document.createElement('div');
        tooltip.classList.add('custom-tooltip');
        tooltip.textContent = tooltipText;
        document.body.appendChild(tooltip);

        const rect = button.getBoundingClientRect();
        const tooltipWidth = tooltip.offsetWidth;
        const tooltipHeight = tooltip.offsetHeight;
        let tooltipLeft, tooltipTop;

        if (button.classList.contains('close-btn')) {
            tooltipLeft = rect.right - tooltipWidth;
            tooltipTop = rect.top - tooltipHeight - 5;
        } else {
            tooltipLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
            tooltipTop = rect.top - tooltipHeight - 5;
        }

        if (tooltipLeft + tooltipWidth > window.innerWidth) {
            tooltipLeft = window.innerWidth - tooltipWidth - 10;
        } else if (tooltipLeft < 0) {
            tooltipLeft = 10;
        }

        if (tooltipTop < 0) {
            tooltipTop = rect.bottom + 5;
        }

        tooltip.style.top = `${tooltipTop}px`;
        tooltip.style.left = `${tooltipLeft}px`;
        tooltip.style.visibility = 'visible';
        tooltip.style.opacity = '1';
    }

    function removeTooltip() {
        const tooltip = document.querySelector('.custom-tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }

    // Filter buttons logic
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
        const projectTiles = document.querySelectorAll(".project-tile");

        projectTiles.forEach(tile => {
            const tags = tile.dataset.tags ? tile.dataset.tags.split(",").map(tag => tag.trim()) : [];
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

    setTimeout(() => {
        updateProjectVisibility();
    }, 100);
    
    document.body.addEventListener('mouseenter', function (event) {
        if (event.target && event.target.matches('button[data-title]')) {
            createTooltip(event.target);
        }
    }, true);
    
    document.body.addEventListener('mouseleave', function (event) {
        if (event.target && event.target.matches('button[data-title]')) {
            removeTooltip();
        }
    }, true);
    
    function createTooltip(button) {
        if (!button.hasAttribute('data-title')) return;
    
        const tooltipText = button.getAttribute('data-title');
        const tooltip = document.createElement('div');
        tooltip.classList.add('custom-tooltip');
        tooltip.textContent = tooltipText;
        document.body.appendChild(tooltip);
    
        const rect = button.getBoundingClientRect();
        const tooltipWidth = tooltip.offsetWidth;
        const tooltipHeight = tooltip.offsetHeight;
        let tooltipLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
        let tooltipTop = rect.top - tooltipHeight - 5;
    
        if (tooltipLeft + tooltipWidth > window.innerWidth) {
            tooltipLeft = window.innerWidth - tooltipWidth - 10;
        } else if (tooltipLeft < 0) {
            tooltipLeft = 10;
        }
    
        if (tooltipTop < 0) {
            tooltipTop = rect.bottom + 5;
        }
    
        tooltip.style.top = `${tooltipTop}px`;
        tooltip.style.left = `${tooltipLeft}px`;
        tooltip.style.visibility = 'visible';
        tooltip.style.opacity = '1';
    }
    
    function removeTooltip() {
        const tooltip = document.querySelector('.custom-tooltip');
        if (tooltip) tooltip.remove();
    }
    

    document.body.addEventListener('click', function (event) {
        if (event.target && event.target.matches('button[data-title]')) {
            removeTooltip();
        }
    }, true);  // Use capture phase to ensure it works with dynamically added buttons

    document.addEventListener("click", async function (event) {
        const tile = event.target.closest(".project-tile");
        if (!tile) return;
    
        const projectUrl = tile.getAttribute("data-url");
        const projectTitle = encodeURIComponent(tile.getAttribute("data-title") || tile.querySelector("h3").textContent.trim());
    
        if (!projectUrl) {
            console.log("No project URL found");
            return;
        }
    
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
                        <link rel="stylesheet" href="assets/css/main.css">
                        <style>
                            body { font-family: Arial, sans-serif; }
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

function checkScrollingText() {
    requestAnimationFrame(() => {
        document.querySelectorAll(".overlay h3").forEach(h3 => {
            if (h3.scrollWidth > h3.clientWidth) {
                h3.classList.add("scroll-text");
            } else {
                h3.classList.remove("scroll-text");
            }
        });
    });
}

// Ensure check runs **after** all assets (images/fonts) are fully loaded
window.addEventListener("load", () => {
    setTimeout(checkScrollingText, 100); // Small delay to let fonts render
});

// Also run on resize for dynamic updates
window.addEventListener("resize", checkScrollingText);

async function loadFilters() {
    try {
        const response = await fetch("assets/data/project_filters.json");
        if (!response.ok) throw new Error("Failed to load filters");

        const data = await response.json();
        const filterContainer = document.querySelector(".filter-menu");

        if (!filterContainer) {
            console.error("Filter container not found");
            return;
        }

        // Clear existing filters
        filterContainer.innerHTML = "";

        // Add an 'all' option
        const allButton = document.createElement("button");
        allButton.className = "filter-btn";
        allButton.textContent = "All";
        allButton.dataset.filter = "all";
        filterContainer.appendChild(allButton);

        // Populate filters dynamically
        data.filters.forEach(filter => {
            const button = document.createElement("button");
            button.className = "filter-btn";
            button.textContent = filter;
            button.dataset.filter = filter;
            filterContainer.appendChild(button);
        });

        console.log("Filters loaded:", data.filters);
    } catch (error) {
        console.error("Error loading filters:", error);
    }
}

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

// Global variables or initial setup

let activeFilters = new Set();
let projectCount = document.querySelector(".project-count");

document.addEventListener("DOMContentLoaded", function () {
    // 1. Any setup or initialization of filters here
    
    // 2. Dynamic project population logic goes here
    let allTags = new Set();

    function createProjectTile({ title, tags, modified, url, image, status }) {
        const projectTile = document.createElement("div");
        projectTile.classList.add("project-tile");
        
        // Ensure tags are properly trimmed and formatted
        const tagString = Array.isArray(tags) ? tags.join(", ").trim() : tags.trim();
        
        projectTile.setAttribute("data-title", title);
        projectTile.setAttribute("data-tags", tagString);
        projectTile.setAttribute("data-modified", modified);
        projectTile.setAttribute("data-url", "/" + url);
        projectTile.setAttribute("style", "display: block;");
        
        // Create project tile HTML
        projectTile.innerHTML = `
            <img src="${image}" alt="${title}" class="project-image">
            <div class="project-tags">
                ${(Array.isArray(tags) ? tags : [tags]).map(tag => `<span>${tag.trim()}</span>`).join(" ")}
            </div>
            <div class="overlay">
                <h3>${title}</h3>
                <p class="last-modified">${modified}</p>
                <span class="status ${status.toLowerCase()}"><i class="fas fa-check"></i></span>
            </div>
        `;
        
        return projectTile;
    }

    async function fetchProjectFiles() {
        const projectContainer = document.querySelector(".project-grid");
        if (!projectContainer) {
            console.error("Project container not found");
            return;
        }

        try {
            const response = await fetch("assets/data/project_files.json");
            const fileList = await response.json();

            for (const file of fileList) {
                const filePath = `projects/${file}`;
                console.log(`Fetching file: ${filePath}`);

                const fileResponse = await fetch(filePath);
                const fileText = await fileResponse.text();

                const yamlMatch = fileText.match(/^---\n([\s\S]+?)\n---/);
                if (!yamlMatch) {
                    console.warn(`No YAML front matter found in ${file}`);
                    continue;
                }

                const yamlData = yamlMatch[1];
                const metadata = parseYAML(yamlData);

                if (!metadata["project-title"] || !metadata["project-status"]) {
                    console.warn(`Skipping ${file} due to missing metadata`);
                    continue;
                }

                if (Array.isArray(metadata["project-tags"])) {
                    metadata["project-tags"].forEach(tag => allTags.add(tag.trim()));
                }

                let imagePath = metadata["project-image"]?.trim() || "";
                const imageMatch = imagePath.match(/!\[\]\((.*?)\)/);
                imagePath = imageMatch ? imageMatch[1] : "assets/images/default.png";

                let modifiedDate = metadata["project-modified"] || null;

                if (!modifiedDate) {
                    modifiedDate = await getLastModified(filePath);
                }

                const projectTile = createProjectTile({
                    title: metadata["project-title"],
                    tags: metadata["project-tags"] || [],
                    modified: "Last Modified: " + modifiedDate,
                    url: filePath,
                    image: imagePath,
                    status: metadata["project-status"]
                });

                projectContainer.appendChild(projectTile);
            }
            updateProjectVisibility();
        } catch (error) {
            console.error("Error fetching projects:", error);
        }
    }
      
    // Helper function to apply selected filter
    function applyFilter(tag) {
        if (tag === "all") {
            activeFilters.clear();  // Clear filters
        } else {
            activeFilters.add(tag);
        }
        updateProjectVisibility();
    }

    function parseYAML(yamlString) {
        const metadata = {};
        const lines = yamlString.split("\n");
        let currentKey = null;

        for (let line of lines) {
            const match = line.match(/^([\w-]+):\s*(.*)$/);
            if (match) {
                currentKey = match[1].trim();
                let value = match[2].trim();

                if (value === "") {
                    metadata[currentKey] = [];
                } else if (value.startsWith("-")) {
                    metadata[currentKey] = [value.replace("- ", "").trim()];
                } else {
                    metadata[currentKey] = value;
                }
            } else if (currentKey && line.startsWith("  -")) {
                metadata[currentKey].push(line.replace("  - ", "").trim());
            }
        }

        console.log("Parsed YAML:", metadata);
        return metadata;
    }

    function updateProjectVisibility() {
        let visibleCount = 0;
        const projectTiles = document.querySelectorAll(".project-tile");
    
        projectTiles.forEach(tile => {
            const tags = tile.dataset.tags ? tile.dataset.tags.split(",").map(tag => tag.trim()) : [];
            const matches = [...activeFilters].some(filter => tags.includes(filter));
    
            if (activeFilters.size === 0 || matches) {
                tile.style.display = "block";
                visibleCount++;
            } else {
                tile.style.display = "none";
            }
        });
    
        // Make sure projectCount exists before updating
        if (projectCount) {
            projectCount.textContent = `${visibleCount}`;
        }
    }

    fetchProjectFiles().then(() => {
        updateProjectVisibility();
    });
    
});

document.addEventListener("DOMContentLoaded", () => {
    const checkExist = setInterval(() => {
        const filterContainer = document.querySelector(".filter-menu");
        if (filterContainer) {
            clearInterval(checkExist);
            loadFilters();
        }
    }, 100); // Check every 100ms
});