document.addEventListener("DOMContentLoaded", function () {
  // Fonction pour charger et injecter le footer
  const loadFooter = async () => {
    const footerPlaceholder = document.getElementById("footer-placeholder");
    if (footerPlaceholder) {
      try {
        const response = await fetch("/components/footer.html");
        if (response.ok) {
          const footerHTML = await response.text();
          footerPlaceholder.innerHTML = footerHTML;
        } else {
          console.error("Could not load footer component.");
        }
      } catch (error) {
        console.error("Error fetching footer:", error);
      }
    }
  };

  loadFooter();
});
