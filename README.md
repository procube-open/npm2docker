# npm2docker

npm2docker is a tool for developers to build a Docker image of a javascript program and register it in a registry such as dockerhub.

## Prerequisites

- The program must be registered in the npm registry and can be installed with the yarn command.
- pacakge.json must have a bin attribute that can be executed as a command.

## Features

- No Dockerfile is required
- Identifies and automatically assigns image names and revision tags from pacakge.json
- Supports npm login

## How to use

## Installation

Install it in your package with the following command

```
yarn add --dev npm2docker
```

### Example release scripts

Add the following to scripts in packge.json.

```
"register-image": "npx npm2docker --latest --push --remove",
```

If you want to release it, use the following command.

```
yarn register-image
```

This script will do the following:

1. Build an image tagged with the version attribute in pacakge.json
1. Push the image to dockerhub
1. Push same image to dockerhub with latest tag
1. Delete the image.

### Add to private repository.

You can specify the destination of the push with --prefix.

#### To register to a repository in an Organization on dockerhub.

You can use --prefix to add the organization name with suffix "/". For example, to register to "exorg" organization, specify "--prefix exorg/".

#### To register to a unique registry, use --prefix

To register to a own registry, specify --prefix FQDN:port-number followed by /. For example, if you want to register to reg.example.com:5000, specify "--prefix reg.example.com:5000/".

### Other
For other usage, please refer to the help.
```
npx npm2docker --help
```
