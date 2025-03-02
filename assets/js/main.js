document.addEventListener("DOMContentLoaded", function () {
    const filterButtons = document.querySelectorAll(".filter-btn");
    const projectTiles = document.querySelectorAll(".project-tile");
    
    filterButtons.forEach(button => {
        button.addEventListener("click", function () {
            const filter = this.getAttribute("data-filter");
            
            projectTiles.forEach(tile => {
                if (filter === "all" || tile.getAttribute("data-category") === filter) {
                    tile.style.display = "block";
                } else {
                    tile.style.display = "none";
                }
            });
        });
    });
    
    function sortProjects() {
        const grid = document.querySelector(".project-grid");
        const tiles = Array.from(projectTiles);
        
        tiles.sort((a, b) => {
            return new Date(b.getAttribute("data-modified")) - new Date(a.getAttribute("data-modified"));
        });
        
        tiles.forEach(tile => grid.appendChild(tile));
    }
    
    sortProjects();
});
