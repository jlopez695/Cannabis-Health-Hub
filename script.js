document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("toggle-filters");
  const pane   = document.getElementById("filters");

  toggle.addEventListener("click", () => {
    pane.classList.toggle("hide");
  });
});
