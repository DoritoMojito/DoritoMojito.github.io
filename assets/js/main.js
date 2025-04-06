// ======================
// Constants and Configs
// ======================
const CONFIG = {
    scrollSpeed: 100,
    defaultImage: "assets/images/default.png",
    projectFilesPath: "assets/data/project_files.json",
    filtersPath: "assets/data/project_filters.json",
    debounceDelay: 100,
    timestampPath: "assets/data/last_updated.json"
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
    activeFiltersLower: new Set(),
    theme: localStorage.getItem("theme") || "light",
    pendingRender: false,
  
    init() {
      if (this.theme === "dark") Theme.applyDarkMode();
    },
  
    addFilter(filter) {
      this.activeFilters.add(filter);
      this.activeFiltersLower.add(filter.toLowerCase());
    },
  
    removeFilter(filter) {
      this.activeFilters.delete(filter);
      this.activeFiltersLower.delete(filter.toLowerCase());
    },
  
    clearFilters() {
      this.activeFilters.clear();
      this.activeFiltersLower.clear();
    }
  };
  
  // ======================
  // Utility Functions
  // ======================
  const Utils = {
    debounce(func, wait, immediate = false) {
      let timeout;
      return function(...args) {
        const context = this;
        const later = () => {
          timeout = null;
          if (!immediate) func.apply(context, args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
      };
    },
  
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
    async getLastUpdatedTimestamp() {
        try {
            const response = await fetch(CONFIG.timestampPath);
            const data = await response.json();
            
            // Parse the custom format (e.g., "Apr 6 2025, 13:58")
            const parts = data.last_updated.match(/(\w{3}) (\d{1,2}) (\d{4}), (\d{1,2}):(\d{2})/);
            if (parts) {
                const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                                  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                const monthIndex = monthNames.indexOf(parts[1]);
                const day = parseInt(parts[2], 10);
                const year = parseInt(parts[3], 10);
                const hours = parseInt(parts[4], 10);
                const minutes = parseInt(parts[5], 10);
                
                return new Date(year, monthIndex, day, hours, minutes);
            }
            return new Date(document.lastModified); // Fallback if parsing fails
        } catch (error) {
            console.error("Error fetching timestamp:", error);
            return new Date(document.lastModified); // Fallback
        }
    }
  };

// ======================
// Timestamp Management
// ======================
const Timestamp = {
    async display() {
        try {
            const date = await Utils.getLastUpdatedTimestamp();
            const element = document.getElementById('last-updated-date');
            
            if (element) {
                // Format exactly like the batch file output
                const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                                  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                const month = monthNames[date.getMonth()];
                const day = date.getDate();
                const year = date.getFullYear();
                const hours = date.getHours();
                const minutes = date.getMinutes().toString().padStart(2, '0');
                
                element.textContent = `${month} ${day} ${year}, ${hours}:${minutes}`;
            }
        } catch (error) {
            console.error("Error displaying timestamp:", error);
        }
    }
};

  // ======================
  // Project Management
  // ======================
  const Projects = {
    tagCache: new Map(),
  
    initProjectTagCache() {
      this.tagCache.clear();
      DOM.projectTiles.forEach(tile => {
        const tagString = tile.dataset.tags || "";
        this.tagCache.set(tile, {
          original: tagString.split(",").map(tag => tag.trim()),
          lowercase: tagString.toLowerCase().split(",").map(tag => tag.trim())
        });
      });
    },
  
    async fetchProjects() {
      if (!DOM.projectGrid) {
        console.error("Project container not found");
        return;
      }
  
      try {
        const response = await fetch(CONFIG.projectFilesPath);
        const fileList = await response.json();
  
        for (const file of fileList) {
          await this.processProjectFile(`projects/${file}`);
        }
  
        this.initProjectTagCache();
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
  
        const metadata = Utils.parseYAML(yamlMatch[1]);
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
        console.error(`Error processing ${filePath}:`, error);
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
  
      const processedTags = Array.isArray(tags) 
        ? tags.map(tag => tag.trim())
        : tags.split(',').map(tag => tag.trim());
      const tagString = processedTags.join(", ");
  
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
          ${processedTags.map(tag => `<span>${tag}</span>`).join(" ")}
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
    }
  };
  
  // ======================
  // Visibility Management
  // ======================
  const Visibility = {
    pendingUpdates: new Map(),
    updateScheduled: false,
    scrollingElements: new Map(), // Tracks scrolling elements
  
    updateProjectVisibility: Utils.debounce(function() {
      if (!Projects.tagCache || Projects.tagCache.size !== DOM.projectTiles.length) {
        Projects.initProjectTagCache();
      }
  
      const hasFilters = State.activeFiltersLower.size > 0;
      let visibleCount = 0;
  
      DOM.projectTiles.forEach(tile => {
        const { lowercase } = Projects.tagCache.get(tile);
        const tagSet = new Set(lowercase);
        const isVisible = !hasFilters || 
                         [...State.activeFiltersLower].some(filter => tagSet.has(filter));
  
        this.pendingUpdates.set(tile, isVisible);
        if (isVisible) visibleCount++;
      });
  
      this.scheduleDOMUpdate(visibleCount);
    }, CONFIG.debounceDelay),
  
    scheduleDOMUpdate(visibleCount) {
      if (this.updateScheduled) return;
      this.updateScheduled = true;
  
      requestAnimationFrame(() => {
        this.pendingUpdates.forEach((isVisible, tile) => {
          tile.style.display = isVisible ? "block" : "none";
          this.handleOverlayScroll(tile, isVisible); // Manage scrolling per tile
        });
  
        if (DOM.projectCount) {
          DOM.projectCount.textContent = `${visibleCount}`;
        }
  
        this.pendingUpdates.clear();
        this.updateScheduled = false;
      });
    },
  
    handleOverlayScroll(tile, isVisible) {
      const overlay = tile.querySelector('.overlay');
      if (!overlay) return;
  
      const h3 = overlay.querySelector('h3');
      if (!h3) return;
  
      // Reset animation state when visibility changes
      h3.classList.remove("scroll-text");
      h3.style.removeProperty('--animation-duration');
      h3.style.removeProperty('--scroll-distance');
      h3.style.removeProperty('transform');
  
      if (isVisible) {
        // Only calculate scrolling if element is visible
        requestAnimationFrame(() => {
          const containerWidth = overlay.clientWidth;
          const textWidth = h3.scrollWidth;
          const offset = containerWidth * 0.08;
          const availableSpace = containerWidth - offset;
  
          if (textWidth > availableSpace) {
            const scrollDistance = textWidth; - availableSpace;
            const duration = (scrollDistance + containerWidth) / CONFIG.scrollSpeed;
  
            // Store original position
            this.scrollingElements.set(h3, {
              originalTransform: window.getComputedStyle(h3).transform
            });
  
            h3.style.setProperty('--animation-duration', `${duration}s`);
            h3.style.setProperty('--scroll-distance', `-${scrollDistance}px`);
            h3.classList.add("scroll-text");
          }
        });
      }
    },
  
    checkScrollingText() {
      DOM.projectTiles.forEach(tile => {
        if (tile.style.display !== 'none') {
          const h3 = tile.querySelector('.overlay h3');
          if (h3) {
            // Reset and recalculate
            h3.classList.remove("scroll-text");
            h3.style.removeProperty('--animation-duration');
            h3.style.removeProperty('--scroll-distance');
            
            const containerWidth = tile.querySelector('.overlay').clientWidth;
            const textWidth = h3.scrollWidth;
            const offset = containerWidth * 0.08;
            const availableSpace = containerWidth - offset;
  
            if (textWidth > availableSpace) {
              const scrollDistance = textWidth - availableSpace;
              const duration = (scrollDistance + containerWidth) / CONFIG.scrollSpeed;
  
              h3.style.setProperty('--animation-duration', `${duration}s`);
              h3.style.setProperty('--scroll-distance', `-${scrollDistance}px`);
              h3.classList.add("scroll-text");
            }
          }
        }
      });
    },
  
    initScrollingText() {
        // Set up MutationObserver to handle dynamic content
        const mutationObserver = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
              if (node.classList && node.classList.contains('overlay')) {
                this.setupInfiniteScroll(node.querySelector('h3'));
              }
            });
          });
        });
    
        // Observe the project grid for changes
        if (DOM.projectGrid) {
          mutationObserver.observe(DOM.projectGrid, {
            childList: true,
            subtree: true
          });
        }
    
        // Set up IntersectionObserver
        const intersectionObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            const h3 = entry.target.querySelector('h3');
            if (!h3) return;
    
            if (entry.isIntersecting) {
              this.startInfiniteScroll(h3);
            } else {
              this.stopInfiniteScroll(h3);
            }
          });
        }, { threshold: 0.1 });
    
        // Initialize all existing overlays
        document.querySelectorAll('.overlay').forEach(overlay => {
          intersectionObserver.observe(overlay);
          this.setupInfiniteScroll(overlay.querySelector('h3'));
        });
    
        // Optimized resize handler
        const resizeHandler = Utils.debounce(() => {
          document.querySelectorAll('.overlay h3').forEach(h3 => {
            this.stopInfiniteScroll(h3);
            this.setupInfiniteScroll(h3);
          });
        }, 100);
        window.addEventListener('resize', resizeHandler);
      },
    
      setupInfiniteScroll(h3) {
        if (!h3 || h3.dataset.scrollSetup === 'true') return;
        
        const container = h3.parentElement;
        const containerWidth = container.clientWidth;
        const textWidth = h3.scrollWidth;
        const padding = containerWidth * 0.08;
        const availableSpace = containerWidth - padding;
    
        if (textWidth > availableSpace) {
          // Create the duplicate text element for seamless looping
          const duplicate = h3.cloneNode(true);
          duplicate.classList.add('scroll-duplicate');
          h3.parentElement.appendChild(duplicate);
    
          // Calculate animation parameters
          const scrollDistance = textWidth;
          const duration = scrollDistance / (CONFIG.scrollSpeed); // Adjust speed factor
    
          // Set CSS properties
          h3.style.setProperty('--scroll-distance', `-${scrollDistance}px`);
          h3.style.setProperty('--scroll-duration', `${duration}s`);
          duplicate.style.setProperty('--scroll-distance', `-${scrollDistance}px`);
          duplicate.style.setProperty('--scroll-duration', `${duration}s`);
    
          // Mark as setup
          h3.dataset.scrollSetup = 'true';
        }
      },
    
      startInfiniteScroll(h3) {
        if (!h3 || h3.dataset.scrollSetup !== 'true') return;
        h3.classList.add('scroll-text');
        const duplicate = h3.nextElementSibling;
        if (duplicate && duplicate.classList.contains('scroll-duplicate')) {
          duplicate.classList.add('scroll-text');
        }
      },
    
      stopInfiniteScroll(h3) {
        if (!h3) return;
        h3.classList.remove('scroll-text');
        const duplicate = h3.nextElementSibling;
        if (duplicate && duplicate.classList.contains('scroll-duplicate')) {
          duplicate.classList.remove('scroll-text');
        }
      },
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
  
      const allButton = document.createElement("button");
      allButton.className = "filter-btn";
      allButton.textContent = "All";
      allButton.dataset.filter = "all";
      DOM.filterMenu.appendChild(allButton);
  
      filters.forEach(filter => {
        const button = document.createElement("button");
        button.className = "filter-btn";
        button.textContent = filter;
        button.dataset.filter = filter.toLowerCase();
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
      const filter = button.dataset.filter.trim();
      const filterLower = filter.toLowerCase();
  
      if (filterLower === "all") {
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
  
      const tooltip = document.createElement('div');
      tooltip.classList.add('custom-tooltip');
      tooltip.textContent = button.getAttribute('data-title');
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
      document.querySelector('.custom-tooltip')?.remove();
    },
  
    init() {
      document.body.addEventListener('mouseenter', (event) => {
        if (event.target?.matches('button[data-title]')) this.create(event.target);
      }, true);
      
      document.body.addEventListener('mouseleave', (event) => {
        if (event.target?.matches('button[data-title]')) this.remove();
      }, true);
      
      document.body.addEventListener('click', (event) => {
        if (event.target?.matches('button[data-title]')) this.remove();
      }, true);
    }
  };
  
  // ======================
  // Expanded View Management
  // ======================
  const ExpandedView = {
    create(tile) {
      const projectUrl = tile.getAttribute("data-url");
      const projectTitle = encodeURIComponent(tile.getAttribute("data-title") || 
                    tile.querySelector("h3").textContent.trim());
  
      if (!projectUrl) return;
  
      this.removeExisting();
  
      const expandedView = document.createElement("div");
      expandedView.classList.add("expanded-view");
      if (State.theme === "dark") expandedView.classList.add("dark-mode");
  
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
        window.open(
          projectUrl.endsWith(".md") 
            ? `viewer.html?file=${encodeURIComponent(projectUrl)}&title=${projectTitle}`
            : projectUrl,
          "_blank"
        );
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
    
    State.init();
    Tooltip.init();
    ExpandedView.init();
    Theme.init();
    Timestamp.display();
    
    Filters.load().then(() => {
        Filters.sortFilterButtons();
    });
    
    Projects.fetchProjects().then(() => {
        Visibility.initScrollingText();
    });
});
  
  // Check for filter container existence
  document.addEventListener("DOMContentLoaded", () => {
    const checkExist = setInterval(() => {
      if (DOM.filterMenu) {
        clearInterval(checkExist);
      }
    }, 100);
  });