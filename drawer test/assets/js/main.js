document.addEventListener("click", (e) => {
    const checkbox = document.getElementById("drawer-toggle");
    const drawer = document.querySelector(".drawer");
    
    if (!drawer.contains(e.target) && e.target !== checkbox) {
      checkbox.checked = false;
    }
  });
  