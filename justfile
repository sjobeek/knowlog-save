# Run npm build and copy to Obsidian plugins directory
build:
    #!/usr/bin/env bash
    # Run npm build (one-time build instead of watch mode)
    npm run dev-nowatch
    
    # Copy main.js to the plugins directory (for vault used during development)
    cp main.js "/mnt/c/Users/sjobe/Dropbox/Apps/KnowLog/kl_vault/.obsidian/plugins/knowlog-save/"
    
    echo "Build complete and files copied to Obsidian plugins directory"

# Default recipe
default: build 