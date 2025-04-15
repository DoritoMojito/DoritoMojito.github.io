---
project-title: PH
project-status: cancelled
project-image: "![](assets/attachments/Pasted%20image%2020250409151732.png)"
project-tags:
  - CAD
  - Metal Working
Updated: 2007-04-27
---
![](assets/attachments/Pasted%20image%2020250407182438.png)

```
async function loadMarkdown() {
    const params = new URLSearchParams(window.location.search);
    const file = params.get("file");

    if (!file) {
        document.getElementById("content").innerHTML = "<p>Error: No file provided.</p>";
        return;
    }

    try {
        const response = await fetch(file);
        if (!response.ok) throw new Error("Failed to load file.");
        let markdownText = await response.text();

        // Extract YAML front matter
        const yamlMatch = markdownText.match(/^---\n([\s\S]+?)\n---\n*/);
        let title = "Project Details"; // Default title

        if (yamlMatch) {
            const yamlContent = yamlMatch[1];
            const titleMatch = yamlContent.match(/^project-title:\s*(.+)$/m);
            if (titleMatch) {
                title = titleMatch[1].trim();
            }

            // Remove YAML front matter completely, ensuring no blank lines remain
            markdownText = markdownText.replace(yamlMatch[0], '').trim();
        }

        // Set document title and add a formatted header with a horizontal line
        document.title = title + " - Details";
        document.getElementById("content").innerHTML = `<h1 class="project-header">${title}</h1><hr>\n` + marked.parse(markdownText);
        
        // Initialize image viewer after content loads
        if (window.ImageViewer) {
            ImageViewer.init();
        }
    } catch (error) {
        console.error("Error loading Markdown:", error);
        document.getElementById("content").innerHTML = "<p>Error loading the document.</p>";
    }
}
```

**test**

