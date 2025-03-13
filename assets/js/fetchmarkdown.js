async function fetchMarkdownFiles() {
    const projectFolder = 'projects/'; // Folder containing Markdown files
    
    try {
        const response = await fetch(projectFolder);
        if (!response.ok) throw new Error('Failed to fetch project list');
        
        const text = await response.text();
        const parser = new DOMParser();
        const htmlDoc = parser.parseFromString(text, 'text/html');
        const links = [...htmlDoc.querySelectorAll('a')]
            .map(a => a.href)
            .filter(href => href.endsWith('.md'));
        
        const projectData = await Promise.all(links.map(fetchAndParseMarkdown));
        displayProjects(projectData);
    } catch (error) {
        console.error('Error fetching Markdown files:', error);
    }
}

async function fetchAndParseMarkdown(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch ${url}`);
        
        const text = await response.text();
        return parseMarkdown(text, url);
    } catch (error) {
        console.error(`Error fetching Markdown file ${url}:`, error);
        return null;
    }
}

function parseMarkdown(markdown, url) {
    const yamlMatch = markdown.match(/---\n([\s\S]+?)\n---/);
    if (!yamlMatch) return null;
    
    const yamlText = yamlMatch[1];
    const yamlData = Object.fromEntries(yamlText.split('\n')
        .map(line => line.split(/:(.+)/).map(s => s.trim()))
        .filter(parts => parts.length === 2));
    
    let image = 'assets/default.jpg';
    if (yamlData.image) {
        // Check for Obsidian-style image embedding ![[image.jpg]]
        const obsidianImageMatch = yamlData.image.match(/!\[\[(.*?)\]\]/);
        image = obsidianImageMatch ? `assets/${obsidianImageMatch[1]}` : `assets/${yamlData.image}`;
    }
    
    return {
        title: yamlData.title || 'Untitled Project',
        status: yamlData.status || 'Unknown',
        image,
        url,
    };
}

function displayProjects(projects) {
    const container = document.getElementById('project-container');
    container.innerHTML = '';
    
    projects.forEach(project => {
        if (!project) return;
        
        const tile = document.createElement('div');
        tile.classList.add('project-tile');
        tile.dataset.url = project.url;
        
        tile.innerHTML = `
            <img src="${project.image}" alt="${project.title}">
            <div class="project-info">
                <h3>${project.title}</h3>
                <p>Status: ${project.status}</p>
            </div>
        `;
        
        tile.addEventListener('click', () => openProjectPage(project.url));
        container.appendChild(tile);
    });
}

function openProjectPage(url) {
    window.open(url, '_blank');
}

document.addEventListener('DOMContentLoaded', fetchMarkdownFiles);
