function createProjectTile({ title, tags, modified, url, image, status }) {
    const projectTile = document.createElement("div");
    projectTile.classList.add("project-tile");
    projectTile.setAttribute("data-title", title);
    projectTile.setAttribute("data-tags", Array.isArray(tags) ? tags.join(", ") : tags);
    projectTile.setAttribute("data-modified", modified); // Add data-modified
    projectTile.setAttribute("data-url", "/" + url);
    projectTile.setAttribute("style", "display: block;");
    
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

            let imagePath = metadata["project-image"]?.trim() || "";
            const imageMatch = imagePath.match(/!\[\]\((.*?)\)/);
            imagePath = imageMatch ? imageMatch[1] : "assets/images/default.png";

            const modifiedDate = metadata["project-modified"] || "Not available"; // Ensure modified date

            const projectTile = createProjectTile({
                title: metadata["project-title"],
                tags: metadata["project-tags"] || "",
                modified: modifiedDate, // Pass modified date
                url: filePath,
                image: imagePath,
                status: metadata["project-status"]
            });

            projectContainer.appendChild(projectTile);
        }

    } catch (error) {
        console.error("Error fetching projects:", error);
    }
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

document.addEventListener("DOMContentLoaded", function () {
    fetchProjectFiles().then(() => {
        updateProjectVisibility(); // Update visibility after tiles are added
    });
});

