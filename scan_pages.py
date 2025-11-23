import json
import subprocess
import time

def run_command(command):
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        # print(f"Error running command: {command}\n{e.stderr}")
        return None

with open('repos.json', 'r') as f:
    repos = json.load(f)

pages_repos = [r for r in repos if r.get('has_pages')]

print(f"Found {len(pages_repos)} repositories with GitHub Pages enabled.\n")

for repo in pages_repos:
    name = repo['name']
    default_branch = repo['default_branch']

    # 1. Try to get Pages specific info to find the source branch
    # If this fails (e.g. auth needed for detailed settings), we fall back to default branch
    # The public API for pages info might require auth. Let's try.
    pages_info_json = run_command(f"curl -s https://api.github.com/repos/1kaiser/{name}/pages")

    source_branch = default_branch
    if pages_info_json:
        try:
            pages_data = json.loads(pages_info_json)
            if 'source' in pages_data and 'branch' in pages_data['source']:
                source_branch = pages_data['source']['branch']
        except:
            pass

    # 2. Get the tree for that branch
    tree_url = f"https://api.github.com/repos/1kaiser/{name}/git/trees/{source_branch}?recursive=1"
    tree_json = run_command(f"curl -s '{tree_url}'")

    print(f"## {name}")
    base_url = f"https://1kaiser.github.io/{name}/"
    if name == "1kaiser.github.io":
        base_url = "https://1kaiser.github.io/"

    found_html = False
    if tree_json:
        try:
            tree_data = json.loads(tree_json)
            if 'tree' in tree_data:
                for item in tree_data['tree']:
                    path = item['path']
                    if path.endswith('.html'):
                        found_html = True
                        # Construct full URL
                        # If it's index.html at root, it's the base URL
                        full_url = base_url + path
                        print(f"- {full_url}")
        except:
            print(f"  (Error parsing tree data)")

    if not found_html:
         print(f"  (No public HTML files found via API or API rate limit reached)")

    print("") # spacer
    time.sleep(1) # Be nice to the API
