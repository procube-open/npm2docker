# npm2docker

npm2docker is a tool for developers to make a daemon program running on node.js into a Docker image and register it in a registry such as dockerhub.

## Prerequisites

- The daemon program must be registered in the npm registry.
- The daemon program should be executable as a command when installed with npm install --global.

## Features

- No Dockerfile is required
- Identifies image names and tags from pacakge.json and assigns them automatically
- Supports npm login