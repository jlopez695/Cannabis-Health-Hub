//Contributors code
fetch('contributors.json')
  .then(response => response.json())
  .then(profiles => {
    const container = document.getElementById("profile-container");

    profiles.forEach(profile => {
      const card = document.createElement("div");
      card.className = "profile-card";

      card.innerHTML = `
        <img src="${profile.image}" alt="${profile.name}" class="profile-img">
        <h3>${profile.name}</h3>
        <p>${profile.title}</p>
        <p>Email: <a href="mailto:${profile.email}">${profile.email}</a></p>
        ${profile.phone ? `<p>Phone: ${profile.phone}</p>` : ""}
      `;

      container.appendChild(card);
    });
  })
  .catch(error => {
    console.error("Error loading contributor data:", error);
  });
