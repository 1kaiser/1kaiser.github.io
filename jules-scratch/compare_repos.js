const fs = require('fs');

const allReposFile = 'all_repos.txt';
const nonForkedReposFile = 'non_forked_repos.txt';

const allReposText = fs.readFileSync(allReposFile, 'utf-8');
const nonForkedReposText = fs.readFileSync(nonForkedReposFile, 'utf-8');

const allRepos = allReposText.split(/\n\d+\n/).slice(1).map(repo => repo.split('\n')[0].trim());
const nonForkedRepos = nonForkedReposText.split(/\n\d+\n/).slice(1).map(repo => repo.split('\n')[0].trim());

const forkedRepos = allRepos.filter(repo => !nonForkedRepos.includes(repo));

console.log('Forked Repos:');
forkedRepos.forEach(repo => console.log(repo));
