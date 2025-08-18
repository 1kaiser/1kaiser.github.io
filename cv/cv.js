document.addEventListener('DOMContentLoaded', () => {
  const timelineDiagram = document.getElementById('timeline-diagram');

  // Keep the initial static content
  const initialTimeline = timelineDiagram.innerHTML;

  fetch('https://api.github.com/users/1kaiser/repos')
    .then(response => response.json())
    .then(data => {
      let projectsSyntax = `
        section GitHub Projects`;

      data.forEach(repo => {
        // Sanitize repo name and description to avoid breaking Mermaid syntax
        const repoName = repo.name.replace(/:/g, '');
        const repoDescription = repo.description ? repo.description.replace(/:/g, '') : 'No description';

        // Add each repo as a new entry in the timeline
        // Using repo name as the "time" and description as the "event"
        projectsSyntax += `
            ${repoName} : ${repoDescription}`;
      });

      // Append the new section to the initial timeline
      timelineDiagram.innerHTML = initialTimeline + projectsSyntax;

      // Re-render the diagram
      // This is a bit of a hack: remove the `data-processed` attribute and re-run mermaid
      timelineDiagram.removeAttribute('data-processed');
      mermaid.contentLoaded();
    })
    .catch(error => {
      console.error('Error fetching GitHub projects:', error);
    });
});
