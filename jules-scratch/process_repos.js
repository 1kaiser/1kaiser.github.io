const fs = require('fs');

const allReposFile = 'all_repos.txt';
const reposDataFile = '../js/repos.js';

const allReposText = fs.readFileSync(allReposFile, 'utf-8');

const repos = allReposText.split(/\n\d+\n/).slice(1).map(repo => {
  const lines = repo.split('\n');
  const name = lines[0].trim();
  let description = '';
  let date = '';

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].startsWith('Created on:')) {
      date = lines[i].replace('Created on:', '').trim();
      break;
    }
    description += lines[i].trim() + ' ';
  }

  return {
    name,
    description: description.trim(),
    date
  };
});

const milestonesData = repos.map(repo => {
    const date = new Date(repo.date.split(' ').slice(1).join(' '));

    return {
      timestamp: date.toISOString(),
      text: `${repo.name}${repo.description ? ': ' + repo.description : ''}`
    };
  });


fs.writeFileSync(reposDataFile, `const repos = ${JSON.stringify(milestonesData, null, 2)};`);

console.log(`Processed ${repos.length} repos and saved to ${reposDataFile}`);
