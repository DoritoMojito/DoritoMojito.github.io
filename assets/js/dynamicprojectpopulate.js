let allTags = new Set();  // This will store all the unique tags

function createProjectTile({ title, tags, modified, url, image, status }) {
    const projectTile = document.createElement("div");
    projectTile.classList.add("project-tile");
    
    // Ensure tags are properly trimmed and formatted
    const tagString = Array.isArray(tags) ? tags.join(", ").trim() : tags.trim();
    
    projectTile.setAttribute("data-title", title);
    projectTile.setAttribute("data-tags", tagString);  // Store trimmed and formatted tags
    projectTile.setAttribute("data-modified", modified); 
    projectTile.setAttribute("data-url", "/" + url);
    projectTile.setAttribute("style", "display: block;");
    
    // Create project tile HTML with proper tag handling
    projectTile.innerHTML = `
        <img src="${image}" alt="${title}" class="project-image">
        <div class="project-tags">
            ${(Array.isArray(tags) ? tags : [tags]).map(tag => `<span>${tag.trim()}</span>`).join(" ")}
        </div>
        <div class="overlay">
            <h3>${title}</h3>
            <p class="Updated">${modified}</p>
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
        const response = await fetch("project_files.json");
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

            // Collect tags and add them to the allTags set
            if (Array.isArray(metadata["project-tags"])) {
                metadata["project-tags"].forEach(tag => allTags.add(tag.trim()));
            }

            let imagePath = metadata["project-image"]?.trim() || "";
            const imageMatch = imagePath.match(/!\[\]\((.*?)\)/);
            imagePath = imageMatch ? imageMatch[1] : "assets/images/default.png";

            let modifiedDate = metadata["project-modified"] || null; // First, check YAML metadata

            if (!modifiedDate) {
                modifiedDate = await getLastModified(filePath); // Fetch from server if not found in metadata
            }

            const projectTile = createProjectTile({
                title: metadata["project-title"],
                tags: metadata["project-tags"] || [],
                modified: "Updated: " + modifiedDate, // Now uses either YAML or server Updated date
                url: filePath,
                image: imagePath,
                status: metadata["project-status"]
            });

            projectContainer.appendChild(projectTile);
        }

        // Now populate the filter options after all projects are loaded
        populateFilters();
        updateProjectVisibility(); // Ensure filtering is applied after loading
    } catch (error) {
        console.error("Error fetching projects:", error);
    }
}

// Function to populate the filter options dynamically
function populateFilters() {
    const filterContainer = document.querySelector(".filter-buttons"); // Assuming you have a container for filters
    if (!filterContainer) {
        console.error("Filter container not found");
        return;
    }

    // Clear any existing filters
    filterContainer.innerHTML = "";

    // Add 'All' option for clearing filters
    const allOption = document.createElement("option");
    allOption.value = "all";
    allOption.textContent = "All Tags";
    filterContainer.appendChild(allOption);

    // Create filter options based on the collected tags
    allTags.forEach(tag => {
        const option = document.createElement("option");
        option.value = tag;
        option.textContent = tag;
        filterContainer.appendChild(option);
    });
}

// Helper function to parse YAML correctly
function parseYAML(yamlString) {
    const metadata = {};
    const lines = yamlString.split("\n");
    let currentKey = null;

    for (let line of lines) {
        const match = line.match(/^([\w-]+):\s*(.*)$/);
        if (match) {
            currentKey = match[1].trim();
            let value = match[2].trim();

            // Handle lists (tags, etc.)
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

// Update visibility based on active filters
function updateProjectVisibility() {
    let visibleCount = 0;
    const projectTiles = document.querySelectorAll(".project-tile");

    projectTiles.forEach(tile => {
        const tags = tile.dataset.tags ? tile.dataset.tags.split(",").map(tag => tag.trim()) : [];
        const matches = [...activeFilters].some(filter => tags.includes(filter));  // Check against all tags

        if (activeFilters.size === 0 || matches) {
            tile.style.display = "block";
            visibleCount++;
        } else {
            tile.style.display = "none";
        }
    });

    projectCount.textContent = `${visibleCount}`;
}

document.addEventListener("DOMContentLoaded", function () {
    fetchProjectFiles().then(() => {
        updateProjectVisibility(); // Update visibility after tiles are added
    });
});
