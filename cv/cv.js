fetch('https://api.github.com/users/1kaiser/repos')
  .then(response => response.json())
  .then(data => {
    const projects = document.querySelector('#github-projects ul');
    data.forEach(repo => {
      const project = document.createElement('li');
      project.innerHTML = `
        <h3><a href="${repo.html_url}">${repo.name}</a></h3>
        <p>${repo.description}</p>
      `;
      projects.appendChild(project);
    });
  })
  .catch(error => {
    console.error('Error fetching GitHub projects:', error);
  });
