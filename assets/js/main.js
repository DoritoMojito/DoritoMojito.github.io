// ======================
// Constants and Configs
// ======================
const CONFIG = {
    scrollSpeed: 150,
    imageSizes: {
        small: 500,   // For tiles < 300px
        medium: 800,  // For tiles 300-600px
        large: 1200   // For tiles > 600px
    },
    defaultImage: "assets/images/default.png",
    projectFilesPath: "assets/data/project_files.json",
    filtersPath: "assets/data/project_filters.json",
    debounceDelay: 100,
    timestampPath: "assets/data/last_updated.json",

    localBackground: "rgba(255, 200, 200, 0.2)",
    localText: "DEV MODE",
    localTextColor: "#ff0000",

    devHostnames: [
        "127.0.0.1",
        "localhost",
        "0.0.0.0",
        "192.168.",
        "10.0."
    ]
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
          // First try HEAD request
          const response = await fetch(url, { 
            method: 'HEAD', 
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' }
          });
          
          if (response.ok) {
            const lastModified = response.headers.get('Last-Modified');
            if (lastModified) {
              return this.formatDateFromString(lastModified);
            }
          }
          
          // Fallback for local files
          const fullResponse = await fetch(url, {
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' }
          });
          const fallbackModified = fullResponse.headers.get('Last-Modified');
          if (fallbackModified) {
            return this.formatDateFromString(fallbackModified);
          }
          
          return null;
        } catch (error) {
          console.error(`Error fetching last modified date for ${url}:`, error);
          return null;
        }
      },
      
      formatDateFromString(dateString) {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return null;
        
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                           "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return `${monthNames[date.getMonth()]} ${date.getDate()} ${date.getFullYear()}`;
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
    },
    isDevEnvironment() {
        // Check for file protocol
        if (window.location.protocol === 'file:') return true;
        
        // Check for localhost or specific IP addresses
        const hostname = window.location.hostname;
        return CONFIG.devHostnames.some(devHost => 
          hostname === devHost || 
          hostname.startsWith(devHost)
        );
    },
    
  };
  const DevIndicator = {
    init() {
      if (!Utils.isDevEnvironment()) return;
      
      // Add corner ribbon with more detailed info
      const ribbon = document.createElement('div');
      ribbon.classList.add("ribbon");
      /*ribbon.style.position = 'fixed';
      ribbon.style.bottom = '10px';
      ribbon.style.right = '10px';
      ribbon.style.padding = '5px 10px';
      ribbon.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
      ribbon.style.border = `2px solid ${CONFIG.localTextColor}`;
      ribbon.style.borderRadius = '5px';
      ribbon.style.color = CONFIG.localTextColor;
      ribbon.style.fontWeight = 'bold';
      ribbon.style.fontSize = '12px';
      ribbon.style.display = 'flex';
      ribbon.style.alignItems = 'center';
      ribbon.style.gap = '8px';*/
      
      // Add icon and text
      ribbon.innerHTML = `
        <i class="fas fa-code" style="font-size: 14px;"></i>
        <span>${CONFIG.localText} (${window.location.hostname || 'local file'})</span>
      `;
      
      document.body.appendChild(ribbon);
      
      // Enhanced console warning
      console.log(
        '%c⚠️ RUNNING IN DEVELOPMENT MODE ⚠️\n' +
        `%cThis is a development environment`,
        `color: ${CONFIG.localTextColor}; font-size: 16px; font-weight: bold;`,
        'color: #999; font-size: 12px;'
      );
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
    
          // Get the display date (synchronously)
          const modifiedDate = this.getDisplayDate(metadata["project-modified"]);
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
    
      // Synchronous date processing
      getDisplayDate(yamlDate) {
        if (!yamlDate) return "Date not specified";
        
        // Try to parse as direct date string first (for hosted environment)
        const directDate = this.tryParseDate(yamlDate);
        if (directDate) return directDate;
        
        // Try parsing various formats (for local environment)
        const parsedDate = this.parseYAMLDate(yamlDate);
        return parsedDate || yamlDate; // Fallback to raw string if parsing fails
      },
    
      tryParseDate(dateString) {
        try {
          const date = new Date(dateString);
          if (!isNaN(date.getTime())) {
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                              "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            return `${monthNames[date.getMonth()]} ${date.getDate()} ${date.getFullYear()}`;
          }
        } catch (e) {
          return null;
        }
        return null;
      },
    
      parseYAMLDate(dateString) {
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                           "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        
        // Clean the string
        dateString = dateString.toString().trim();
        
        // Try common formats
        const formats = [
          { regex: /(\d{1,2})[-/](\d{1,2})[-/](\d{4})/, parts: [1, 2, 3] }, // dd-mm-yyyy or dd/mm/yyyy
          { regex: /(\d{4})[-/](\d{1,2})[-/](\d{1,2})/, parts: [3, 2, 1] }  // yyyy-mm-dd or yyyy/mm/dd
        ];
        
        for (const format of formats) {
          const match = dateString.match(format.regex);
          if (match) {
            const day = parseInt(match[format.parts[0]]);
            const monthIndex = parseInt(match[format.parts[1]]) - 1;
            const year = parseInt(match[format.parts[2]]);
            
            if (monthIndex >= 0 && monthIndex < 12 && day > 0 && day < 32) {
              return `${monthNames[monthIndex]} ${day} ${year}`;
            }
          }
        }
        
        return null;
      },
  
      formatYAMLDate(dateString) {
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                           "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      
        // Remove any time portion and extra spaces
        dateString = dateString.split(' ')[0].trim();
      
        // Try different date formats
        const formatsToTry = [
          // dd-mm-yyyy
          { regex: /^(\d{1,2})-(\d{1,2})-(\d{4})$/, parts: [1, 2, 3] },
          // mm/dd/yyyy
          { regex: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, parts: [2, 1, 3] },
          // yyyy-mm-dd
          { regex: /^(\d{4})-(\d{1,2})-(\d{1,2})$/, parts: [3, 2, 1] }
        ];
      
        for (const format of formatsToTry) {
          const match = dateString.match(format.regex);
          if (match) {
            const day = parseInt(match[format.parts[0]], 10);
            const monthIndex = parseInt(match[format.parts[1]], 10) - 1;
            const year = parseInt(match[format.parts[2]], 10);
      
            if (!isNaN(day) && !isNaN(monthIndex) && !isNaN(year) &&
                monthIndex >= 0 && monthIndex < 12) {
              return `${monthNames[monthIndex]} ${day} ${year}`;
            }
          }
        }
      
        // If no format matched, return the original string
        return dateString;
      },
  
      async fetchProjects() {
        if (!DOM.projectGrid) {
          console.error("Project container not found");
          return;
        }
    
        try {
          const response = await fetch(CONFIG.projectFilesPath);
          const fileList = await response.json();
          
          // Process all files first
          const projects = await Promise.all(
            fileList.map(file => this.processProjectFile(`projects/${file}`))
          );
          
          // Filter out nulls and sort by date (newest first)
          const validProjects = projects.filter(p => p !== null);
          validProjects.sort((a, b) => b.modified - a.modified);
          
          // Clear existing content
          DOM.projectGrid.innerHTML = "";
          
          // Append sorted projects
          validProjects.forEach(project => {
            DOM.projectGrid.appendChild(project.element);
          });
          
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
            return null; // Return null for filtering
          }
    
          const metadata = Utils.parseYAML(yamlMatch[1]);
          if (!metadata["project-title"] || !metadata["project-status"]) {
            console.warn(`Skipping ${filePath} due to missing metadata`);
            return null;
          }
    
          // Get last modified date (now checking both old and new field names)
          const modifiedDate = this.getLastModifiedDisplay(
            metadata["last-modified"] || metadata["project-modified"], // Check both field names
            filePath
          );
    
          const imagePath = this.extractImagePath(metadata["project-image"]);
    
          return { // Return project data instead of immediately creating tile
            element: this.createProjectTile({
              title: metadata["project-title"],
              tags: metadata["project-tags"] || [],
              modified: modifiedDate,
              url: filePath,
              image: imagePath,
              status: metadata["project-status"]
            }),
            modified: modifiedDate === "Unknown" ? new Date(0) : this.parseDateForSorting(modifiedDate),
            filePath
          };
        } catch (error) {
          console.error(`Error processing ${filePath}:`, error);
          return null;
        }
      },
    
      getLastModifiedDisplay(yamlDate, filePath) {
        // If empty string or undefined/null
        if (!yamlDate || yamlDate.toString().trim() === "") {
          return "Unknown";
        }
        
        const formattedDate = this.formatYAMLDate(yamlDate);
        return formattedDate !== yamlDate ? formattedDate : yamlDate;
      },
    
      parseDateForSorting(dateString) {
        if (dateString === "Unknown") return new Date(0);
        
        // Try to parse various date formats
        const formats = [
          { regex: /(\w{3}) (\d{1,2}) (\d{4})/, fn: (m) => new Date(`${m[1]} ${m[2]}, ${m[3]}`) }, // "Apr 15 2025"
          { regex: /(\d{1,2})[-/](\d{1,2})[-/](\d{4})/, fn: (m) => new Date(m[3], m[2]-1, m[1]) }, // "15-04-2025"
          { regex: /(\d{4})[-/](\d{1,2})[-/](\d{1,2})/, fn: (m) => new Date(m[1], m[2]-1, m[3]) }  // "2025-04-15"
        ];
        
        for (const format of formats) {
          const match = dateString.match(format.regex);
          if (match) {
            const date = format.fn(match);
            if (!isNaN(date.getTime())) return date;
          }
        }
        
        return new Date(0); // Fallback for unparseable dates
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
  
      const imgBase = image !== CONFIG.defaultImage ? 
            image.substring(0, image.lastIndexOf('.')) : 
            CONFIG.defaultImage.substring(0, CONFIG.defaultImage.lastIndexOf('.'));
        const imgExt = image !== CONFIG.defaultImage ? 
            image.substring(image.lastIndexOf('.')) : 
            CONFIG.defaultImage.substring(CONFIG.defaultImage.lastIndexOf('.'));

            const getResponsivePath = (imgPath, size) => {
                if (imgPath === CONFIG.defaultImage) return imgPath;
                
                const baseName = imgPath.substring(0, imgPath.lastIndexOf('.'));
                const ext = imgPath.substring(imgPath.lastIndexOf('.'));
                const fileName = baseName.substring(baseName.lastIndexOf('/') + 1);
                const dirPath = baseName.substring(0, baseName.lastIndexOf('/'));
                
                return `${dirPath}/processed/${fileName}/${fileName}-${size}${ext}`;
            };

        projectTile.innerHTML = `
            <picture>
                <source media="(max-width: 300px)" 
                        srcset="${getResponsivePath(image, 'small')}">
                <source media="(max-width: 600px)" 
                        srcset="${getResponsivePath(image, 'medium')}">
                <img src="${getResponsivePath(image, 'large')}" 
                     alt="${title}" 
                     class="project-image"
                     loading="lazy">
            </picture>
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
        const textWidth = h3.scrollWidth;
        const containerWidth = container.clientWidth;
        
        if (textWidth > containerWidth) {
            // Wrap h3 in a container div
            const wrapper = document.createElement('div');
            wrapper.className = 'scroll-container';
            h3.parentNode.insertBefore(wrapper, h3);
            wrapper.appendChild(h3);
            
            // Create duplicate
            const duplicate = h3.cloneNode(true);
            duplicate.classList.add('scroll-duplicate');
            h3.classList.add('scroll-primary');
            wrapper.appendChild(duplicate);
            
            // Calculate duration
            const duration = (textWidth + 20) / CONFIG.scrollSpeed;
            h3.style.setProperty('--scroll-duration', `${duration}s`);
            
            // Initial state
            h3.style.animationPlayState = 'paused';
            
            h3.dataset.scrollSetup = 'true';
        }
    },
    
    startInfiniteScroll(h3) {
        if (!h3 || h3.dataset.scrollSetup !== 'true') return;
        
        const wrapper = h3.parentElement;
        if (!wrapper || !wrapper.classList.contains('scroll-container')) return;
        
        // Reset positions
        h3.style.transform = 'translateX(0)';
        const duplicate = wrapper.querySelector('.scroll-duplicate');
        if (duplicate) duplicate.style.transform = 'translateX(0)';
        
        // Start after delay
        setTimeout(() => {
            h3.style.animationPlayState = 'running';
        }, 500);
    },
    
    stopInfiniteScroll(h3) {
        if (!h3) return;
        
        const wrapper = h3.parentElement;
        if (!wrapper || !wrapper.classList.contains('scroll-container')) return;
        
        h3.style.animationPlayState = 'paused';
        h3.style.transform = 'translateX(0)';
        const duplicate = wrapper.querySelector('.scroll-duplicate');
        if (duplicate) duplicate.style.transform = 'translateX(0)';
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
            <button class="close-btn" data-title="Close"><i class="fas fa-times"></i></button>
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
// Contact Form
// ======================

// Contact Form Functionality
const ContactWidget = {
    init() {
      this.form = document.getElementById('contact-form');
      this.formContainer = document.querySelector('.contact-form-container');
      this.contactButton = document.getElementById('contact-button');
      this.closeButton = document.querySelector('.close-form');
      
      if (!this.form) return;
      
      this.setupEventListeners();
    },
    
    setupEventListeners() {
      this.contactButton.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent immediate close when opening
        this.toggleForm();
      });
      
      this.closeButton.addEventListener('click', () => {
        this.hideForm();
      });
      
      // Prevent clicks inside form from closing it
      this.formContainer.addEventListener('click', (e) => {
        e.stopPropagation();
      });
      
      // Close when clicking anywhere outside
      document.addEventListener('click', (e) => {
        if (this.formContainer.classList.contains('show') && 
            !this.formContainer.contains(e.target) && 
            e.target !== this.contactButton) {
          this.hideForm();
        }
      });
      
      this.form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleSubmit();
      });
    },
    
    toggleForm() {
      this.formContainer.classList.toggle('show');
    },
    
    hideForm() {
      this.formContainer.classList.remove('show');
    },
    
    async handleSubmit() {
      const submitButton = this.form.querySelector('button[type="submit"]');
      const originalText = submitButton.textContent;
      
      try {
        submitButton.textContent = 'Sending...';
        submitButton.disabled = true;
        
        const response = await fetch(this.form.action, {
          method: 'POST',
          body: new FormData(this.form),
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (response.ok) {
          this.form.reset();
          submitButton.textContent = 'Sent! ✓';
          setTimeout(() => {
            this.hideForm();
            submitButton.textContent = originalText;
            submitButton.disabled = false;
          }, 1500);
        } else {
          throw new Error('Form submission failed');
        }
      } catch (error) {
        console.error('Error:', error);
        submitButton.textContent = 'Error!';
        setTimeout(() => {
          submitButton.textContent = originalText;
          submitButton.disabled = false;
        }, 1500);
      }
    }
  };

  // ======================
// Image Viewer Management
// ======================
const ImageViewer = {
    init() {
      this.viewer = document.querySelector('.image-expanded-view');
      this.imgElement = document.querySelector('.expanded-image');
      this.closeBtn = document.querySelector('.close-image-btn');
      
      // Initialize only if elements exist
      if (this.viewer && this.imgElement && this.closeBtn) {
        this.setupEventListeners();
      }
    },
  
    setupEventListeners() {
      // Attach click handlers to all viewer images
      document.querySelectorAll('#viewer img').forEach(img => {
        img.addEventListener('click', (e) => this.openImage(e));
      });
  
      // Close when clicking outside image
      this.viewer.addEventListener('click', (e) => {
        if (e.target === this.viewer) {
          this.close();
        }
      });
  
      // Close with button
      this.closeBtn.addEventListener('click', () => this.close());
  
      // Close with ESC key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.viewer.classList.contains('show')) {
          this.close();
        }
      });
    },
  
    openImage(event) {
      const clickedImg = event.target;
      this.imgElement.src = clickedImg.src;
      this.imgElement.alt = clickedImg.alt || 'Expanded view';
      this.viewer.classList.add('show');
      document.body.style.overflow = 'hidden';
    },
  
    close() {
      this.viewer.classList.remove('show');
      document.body.style.overflow = '';
    }
  };

  // ======================
  // Initialization
  // ======================
  document.addEventListener("DOMContentLoaded", function() {
    console.log("Custom Tooltip JS Loaded!");
    
    DevIndicator.init();
    State.init();
    Tooltip.init();
    ExpandedView.init();
    Theme.init();
    Timestamp.display();
    ContactWidget.init();
    ImageViewer.init(); // Add this line

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