#!/bin/bash
cd /Users/kid/Ptak-expo

# Kill any hanging git processes
pkill -f git

# Remove merge state files
rm -f .git/MERGE_HEAD
rm -f .git/MERGE_MODE  
rm -f .git/MERGE_MSG
rm -f .git/AUTO_MERGE
rm -f .git/index.lock

# Reset to main branch
echo "ref: refs/heads/main" > .git/HEAD

# Show status
git status --porcelain

