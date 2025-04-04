// ======================
// Constants and Configs
// ======================
const CONFIG = {
    scrollSpeed: 60, // pixels per second
    defaultImage: "assets/images/default.png",
    projectFilesPath: "assets/data/project_files.json",
    filtersPath: "assets/data/project_filters.json"
  };
  
  // ======================
  // DOM Elements
  // ======================
  const DOM = {
    get filterDropdown() { return document.getElementById("drawer-toggle"); },
    get filterMenu() { return document.getElementById("filter-menu"); },
    get filterButtons() { return document.querySelectorAll(".filter-btn"); },
    get projectTiles() { return document.querySelectorAll(".project-tile"); },
    get projectCount() { return document.getElementById("project-count"); },
    get filterDrawer() { return document.getElementById("filter-drawer"); },
    get projectGrid() { return document.querySelector(".project-grid"); },
    get darkModeToggle() { return document.getElementById("darkModeToggle"); },
    get body() { return document.body; }
  };
  
  // ======================
  // State Management
  // ======================
  const State = {
    activeFilters: new Set(),
    theme: localStorage.getItem("theme") || "light",
    
    init() {
      if (this.theme === "dark") {
        Theme.applyDarkMode();
      }
    },
    
    addFilter(filter) {
      this.activeFilters.add(filter);
    },
    
    removeFilter(filter) {
      this.activeFilters.delete(filter);
    },
    
    clearFilters() {
      this.activeFilters.clear();
    }
  };
  
  // ======================
  // Utility Functions
  // ======================
  const Utils = {
    async getLastModified(url) {
      try {
        const response = await fetch(url, { method: 'HEAD' });
        const lastModified = response.headers.get('Last-Modified');
        return lastModified ? new Date(lastModified).toLocaleDateString() : "Unknown date";
      } catch (error) {
        console.error(`Error fetching last modified date for ${url}:`, error);
        return "Unknown date";
      }
    },
  
    parseYAML(yamlString) {
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
  
      return metadata;
    },
  
    debounce(func, wait) {
      let timeout;
      return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
      };
    }
  };
  
  // ======================
  // Project Management
  // ======================
  const Projects = {
    async fetchProjects() {
      if (!DOM.projectGrid) {
        console.error("Project container not found");
        return;
      }
  
      try {
        const response = await fetch(CONFIG.projectFilesPath);
        const fileList = await response.json();
  
        for (const file of fileList) {
          const filePath = `projects/${file}`;
          await this.processProjectFile(filePath);
        }
        
        Visibility.updateProjectVisibility();
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    },
  
    async processProjectFile(filePath) {
      try {
        const fileResponse = await fetch(filePath);
        const fileText = await fileResponse.text();
        const yamlMatch = fileText.match(/^---\n([\s\S]+?)\n---/);
        
        if (!yamlMatch) {
          console.warn(`No YAML front matter found in ${filePath}`);
          return;
        }
  
        const yamlData = yamlMatch[1];
        const metadata = Utils.parseYAML(yamlData);
  
        if (!metadata["project-title"] || !metadata["project-status"]) {
          console.warn(`Skipping ${filePath} due to missing metadata`);
          return;
        }
  
        const modifiedDate = metadata["project-modified"] || await Utils.getLastModified(filePath);
        const imagePath = this.extractImagePath(metadata["project-image"]);
  
        const projectTile = this.createProjectTile({
          title: metadata["project-title"],
          tags: metadata["project-tags"] || [],
          modified: modifiedDate,
          url: filePath,
          image: imagePath,
          status: metadata["project-status"]
        });
  
        DOM.projectGrid.appendChild(projectTile);
      } catch (error) {
        console.error(`Error processing project file ${filePath}:`, error);
      }
    },
  
    extractImagePath(imageMetadata) {
      if (!imageMetadata) return CONFIG.defaultImage;
      const imageMatch = imageMetadata.trim().match(/!\[\]\((.*?)\)/);
      return imageMatch ? imageMatch[1] : CONFIG.defaultImage;
    },
  
    createProjectTile({ title, tags, modified, url, image, status }) {
      const projectTile = document.createElement("div");
      projectTile.classList.add("project-tile");
  
      const tagString = Array.isArray(tags) ? tags.join(", ").trim() : tags.trim();
      const statusClass = status.toLowerCase();
      const iconClass = this.getStatusIcon(statusClass);
  
      projectTile.setAttribute("data-title", title);
      projectTile.setAttribute("data-tags", tagString);
      projectTile.setAttribute("data-modified", modified);
      projectTile.setAttribute("data-url", "/" + url);
      projectTile.setAttribute("style", "display: block;");
  
      projectTile.innerHTML = `
        <img src="${image}" alt="${title}" class="project-image">
        <div class="project-tags">
          ${(Array.isArray(tags) ? tags : [tags]).map(tag => `<span>${tag.trim()}</span>`).join(" ")}
        </div>
        <div class="overlay">
          <h3>${title}</h3>
          <p class="last-modified">Last Modified: ${modified}</p>
          <span class="status ${statusClass}"><i class="${iconClass}"></i></span>
        </div>
      `;
  
      return projectTile;
    },
  
    getStatusIcon(status) {
      const statusIcons = {
        finished: "fas fa-check",
        wip: "fas fa-wrench",
        cancelled: "fas fa-times-circle"
      };
      return statusIcons[status] || "fas fa-question";
    },
  
    async updateProjectDates() {
      const projectTiles = document.querySelectorAll(".project-tile");
  
      for (const tile of projectTiles) {
        const projectUrl = tile.getAttribute("data-url");
        if (!projectUrl) continue;
  
        const lastModifiedDate = await Utils.getLastModified(projectUrl);
        const dateElement = tile.querySelector(".last-modified");
        
        if (dateElement) {
          dateElement.textContent = `Last Modified: ${lastModifiedDate}`;
        }
      }
    }
  };
  
  // ======================
  // Visibility Management
  // ======================
  const Visibility = {
    updateProjectVisibility() {
      let visibleCount = 0;
      const tiles = DOM.projectTiles;
  
      tiles.forEach(tile => {
        const tags = tile.dataset.tags ? tile.dataset.tags.split(",").map(tag => tag.trim()) : [];
        const matches = [...State.activeFilters].some(filter => tags.includes(filter));
  
        if (State.activeFilters.size === 0 || matches) {
          tile.style.display = "block";
          visibleCount++;
        } else {
          tile.style.display = "none";
        }
      });
  
      if (DOM.projectCount) {
        DOM.projectCount.textContent = `${visibleCount}`;
      }
    },
  
    checkScrollingText() {
      document.querySelectorAll(".overlay h3").forEach(h3 => {
        const containerWidth = h3.parentElement.clientWidth;
        const textWidth = h3.scrollWidth;
        const offset = containerWidth * 0.08;
        const availableSpace = containerWidth - offset;
  
        if (textWidth > availableSpace) {
          const distanceToScroll = textWidth + containerWidth - 250;
          const duration = distanceToScroll / CONFIG.scrollSpeed;
  
          h3.style.setProperty('--animation-duration', `${duration}s`);
          h3.style.setProperty('--scroll-distance', `-${distanceToScroll}px`);
          h3.classList.add("scroll-text");
        } else {
          h3.classList.remove("scroll-text");
          h3.style.removeProperty('--animation-duration');
          h3.style.removeProperty('--scroll-distance');
        }
      });
    }
  };
  
  // ======================
  // Filter Management
  // ======================
  const Filters = {
    async load() {
      try {
        const response = await fetch(CONFIG.filtersPath);
        if (!response.ok) throw new Error("Failed to load filters");
  
        const data = await response.json();
        this.renderFilters(data.filters);
        this.attachEventListeners();
      } catch (error) {
        console.error("Error loading filters:", error);
      }
    },
  
    renderFilters(filters) {
      if (!DOM.filterMenu) {
        console.error("Filter container not found");
        return;
      }
  
      DOM.filterMenu.innerHTML = "";
  
      // Add 'All' button
      const allButton = document.createElement("button");
      allButton.className = "filter-btn";
      allButton.textContent = "All";
      allButton.dataset.filter = "all";
      DOM.filterMenu.appendChild(allButton);
  
      // Add other filters
      filters.forEach(filter => {
        const button = document.createElement("button");
        button.className = "filter-btn";
        button.textContent = filter;
        button.dataset.filter = filter;
        DOM.filterMenu.appendChild(button);
      });
    },
  
    attachEventListeners() {
      DOM.filterDropdown?.addEventListener("click", (event) => {
        event.stopPropagation();
        DOM.filterMenu.classList.toggle("open");
        DOM.filterDrawer?.classList.toggle("open");
      });
  
      document.addEventListener("click", (event) => {
        if (!DOM.filterDropdown?.contains(event.target) && !DOM.filterMenu?.contains(event.target)) {
          DOM.filterMenu?.classList.remove("open");
        }
      });
  
      document.addEventListener("click", (e) => {
        const checkbox = document.getElementById("drawer-toggle");
        const drawer = document.querySelector(".drawer");
  
        if (drawer && !drawer.contains(e.target) && e.target !== checkbox) {
          checkbox.checked = false;
        }
      });
  
      DOM.filterButtons.forEach(button => {
        button.addEventListener("click", () => this.handleFilterClick(button));
      });
    },
  
    handleFilterClick(button) {
      const filter = button.dataset.filter;
  
      if (filter === "all") {
        State.clearFilters();
        DOM.filterButtons.forEach(btn => btn.classList.remove("active"));
      } else {
        if (State.activeFilters.has(filter)) {
          State.removeFilter(filter);
          button.classList.remove("active");
        } else {
          State.addFilter(filter);
          button.classList.add("active");
        }
      }
  
      Visibility.updateProjectVisibility();
    },
  
    sortFilterButtons() {
      const buttonsArray = Array.from(DOM.filterButtons);
      const allButton = buttonsArray.find(btn => btn.dataset.filter === "all");
      const otherButtons = buttonsArray.filter(btn => btn.dataset.filter !== "all");
      
      otherButtons.sort((a, b) => a.textContent.localeCompare(b.textContent));
      
      if (DOM.filterMenu) {
        DOM.filterMenu.innerHTML = "";
        if (allButton) DOM.filterMenu.appendChild(allButton);
        otherButtons.forEach(btn => DOM.filterMenu.appendChild(btn));
      }
    }
  };
  
  // ======================
  // Tooltip Management
  // ======================
  const Tooltip = {
    create(button) {
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
  
      if (button.classList.contains('close-btn')) {
        tooltipLeft = rect.right - tooltipWidth;
      }
  
      tooltipLeft = Math.max(10, Math.min(tooltipLeft, window.innerWidth - tooltipWidth - 10));
      tooltipTop = tooltipTop < 0 ? rect.bottom + 5 : tooltipTop;
  
      tooltip.style.top = `${tooltipTop}px`;
      tooltip.style.left = `${tooltipLeft}px`;
      tooltip.style.visibility = 'visible';
      tooltip.style.opacity = '1';
    },
  
    remove() {
      const tooltip = document.querySelector('.custom-tooltip');
      tooltip?.remove();
    },
  
    init() {
      document.body.addEventListener('mouseenter', (event) => {
        if (event.target?.matches('button[data-title]')) {
          this.create(event.target);
        }
      }, true);
      
      document.body.addEventListener('mouseleave', (event) => {
        if (event.target?.matches('button[data-title]')) {
          this.remove();
        }
      }, true);
      
      document.body.addEventListener('click', (event) => {
        if (event.target?.matches('button[data-title]')) {
          this.remove();
        }
      }, true);
    }
  };
  
  // ======================
  // Expanded View Management
  // ======================
  const ExpandedView = {
    create(tile) {
      const projectUrl = tile.getAttribute("data-url");
      const projectTitle = encodeURIComponent(tile.getAttribute("data-title") || tile.querySelector("h3").textContent.trim());
  
      if (!projectUrl) {
        console.log("No project URL found");
        return;
      }
  
      this.removeExisting();
  
      const expandedView = document.createElement("div");
      expandedView.classList.add("expanded-view");
      
      if (State.theme === "dark") {
        expandedView.classList.add("dark-mode");
      }
  
      expandedView.innerHTML = `
        <div class="expanded-wrapper">
          <div class="expanded-content">
            <button class="close-btn" data-title="Close"><i class="fas fa-times-circle"></i></button>
            <button class="new-tab-btn" data-title="Open in New Tab"><i class="fas fa-external-link-alt"></i></button>
            <iframe id="project-iframe" src="${projectUrl}"></iframe>
          </div>
        </div>
      `;
  
      document.body.appendChild(expandedView);
      setTimeout(() => expandedView.classList.add("show"), 10);
  
      this.setupEventListeners(expandedView, projectUrl, projectTitle);
    },
  
    removeExisting() {
      document.querySelector(".expanded-view")?.remove();
    },
  
    setupEventListeners(expandedView, projectUrl, projectTitle) {
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
  
      if (projectUrl.endsWith(".md")) {
        const iframe = document.getElementById("project-iframe");
        iframe.src = `viewer.html?file=${encodeURIComponent(projectUrl)}&title=${projectTitle}&theme=${State.theme}`;
      }
    },
  
    init() {
      document.addEventListener("click", (event) => {
        const tile = event.target.closest(".project-tile");
        if (tile) this.create(tile);
      });
    }
  };
  
  // ======================
  // Theme Management
  // ======================
  const Theme = {
    applyDarkMode() {
      DOM.body.classList.add("dark-mode");
      document.querySelectorAll(".expanded-view, #viewer").forEach(view => {
        view.classList.add("dark-mode");
      });
      
      document.querySelectorAll("#darkModeToggle").forEach(btn => {
        btn.innerHTML = '<i id="darkMode" class="fas fa-moon"></i>';
      });
      
      localStorage.setItem("theme", "dark");
      State.theme = "dark";
    },
    
    removeDarkMode() {
      DOM.body.classList.remove("dark-mode");
      document.querySelectorAll(".expanded-view, #viewer").forEach(view => {
        view.classList.remove("dark-mode");
      });
      
      document.querySelectorAll("#darkModeToggle").forEach(btn => {
        btn.innerHTML = '<i id="lightMode" class="fas fa-sun"></i>';
      });
      
      localStorage.setItem("theme", "light");
      State.theme = "light";
    },
    
    toggle() {
      if (DOM.body.classList.contains("dark-mode")) {
        this.removeDarkMode();
      } else {
        this.applyDarkMode();
      }
    },
    
    init() {
      DOM.darkModeToggle?.addEventListener("click", () => this.toggle());
    }
  };
  
  // ======================
  // Initialization
  // ======================
  document.addEventListener("DOMContentLoaded", function() {
    console.log("Custom Tooltip JS Loaded!");
    
    // Initialize state
    State.init();
    
    // Initialize modules
    Tooltip.init();
    ExpandedView.init();
    Theme.init();
    
    // Load and setup filters
    Filters.load().then(() => {
      Filters.sortFilterButtons();
    });
    
    // Load projects
    Projects.fetchProjects();
    
    // Setup visibility and scrolling checks
    setTimeout(() => {
      Visibility.updateProjectVisibility();
      Visibility.checkScrollingText();
    }, 100);
    
    // Setup window resize listener
    window.addEventListener("resize", Utils.debounce(Visibility.checkScrollingText, 100));
  });
  
  // Check for filter container existence
  document.addEventListener("DOMContentLoaded", () => {
    const checkExist = setInterval(() => {
      if (DOM.filterMenu) {
        clearInterval(checkExist);
        Projects.updateProjectDates();
      }
    }, 100);
  });