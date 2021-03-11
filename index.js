#!/usr/bin/env node
const argv = require('yargs/yargs')(process.argv.slice(2))
  .usage('Usage: $0 [options]')
  .boolean(['p', 'l', 'r', 'd'])
  .alias('p', 'push')
  .describe('p', 'Push to docker repository')
  .alias('l', 'latest')
  .describe('l', 'Push to docker repository with latest tag')
  .alias('r', 'remove')
  .describe('r', 'Remove docker image')
  .alias('d', 'dry-run')
  .describe('d', 'Dry run')
  .alias('x', 'prefix')
  .describe('x', 'Prefix of tag(ex. rep.example.com:5000/, procube/)')
  .demandCommand(1,1)
  .default({f: 'package.json', x: ''})
  .help('h')
  .alias('h', 'help')
  .strict()
  .epilog('copyright 2021 Procube Co.,Ltd')
  .argv;

const fs = require('fs')
const { spawn, execFileSync } = require('child_process')
const shellescape = require('shell-escape')

const base_image = 'node:15-alpine'
const wait_interval = 20
const retries = 10

function spawnPromise(modulePath, args, stdinFile = null) {
  return new Promise((resolve, reject) => {
    console.log(`Execute: ${modulePath} ${args.join(' ')}.`)
    const proc = spawn(modulePath, args)
    proc.stdout.on('data', (data) => {
      console.log(data.toString())
    })
    proc.stderr.on('data', (data) => {
      console.error(data.toString())
    })
    proc.on('close', (code) => {
      if (code !== 0) {
        reject(`The process exited with code ${code}.`)
      }
      resolve('The process succeeded.')
    });
    if (stdinFile) {
      proc.stdin.write(stdinFile)
    }
    proc.stdin.end()
  });
}

function getCmd(bin, baseName) {
  if (typeof(bin) == "string") return baseName
  return Object.keys(bin)[0]
}

async function main() {
  const name = argv._[0]
  var viewJson
  try {
    viewJson = execFileSync('npm', ['view', name, '--json']).toString()
  } catch (err) {
    throw `Fail to execute command: "npm view ${name} --json"`
  }
  var package
  try {
    package = JSON.parse(viewJson)
  } catch (err) {
    throw `Fail to parse output of: "npm view ${name} --json"; error=${err}; string=${viewJson}`
  }
  const {version, bin} = package
  const baseName = name.split('/').slice(-1)[0]
  var tag = `${baseName}:${version}`
  var latesttag = `${baseName}:latest`
  if (argv.x) {
    tag = argv.x + tag
    latesttag = argv.x + latesttag
  }
  const npmrc = `${process.env.HOME}/.npmrc`
  var npmrcContents = null
  if (fs.existsSync(npmrc)) {
    npmrcContents = fs.readFileSync(npmrc, 'utf8')
  }
  var dockerfile = `FROM ${base_image}\nWORKDIR /root\n`
  if (npmrcContents) {
    dockerfile += `RUN echo -e $'${npmrcContents.replace(/'/g, `'\\''`).replace(/\r?\n/g, '\\n\\\n')}' >> /root/.npmrc &&\\\n` +
      `yarn global add ${name}@${version} --exact &&\\\n` +
      'rm /root/.npmrc\n'
  } else {
    dockerfile += `RUN yarn global add ${name}@${version} --exact\n`
  }
  dockerfile += `CMD ${getCmd(bin, baseName)}\n`
  if (! argv.d) {
    console.log(await spawnPromise('docker', ['build', '-t', tag, '-'], stdinFile = dockerfile))
  } else {
    console.log(`Execute: "docker  build -t ${tag}"`)
    console.log(`Dockerfile:\n${dockerfile}`)
  }
  if (argv.p) {
    await doPush(tag)
  }
  if (argv.l) {
    await doPush(tag, alias=latesttag)
  }
  if (argv.r) {
    if (argv.l) {
      if (argv.d) {
        console.log(`Execute: "docker image rm ${latesttag}"`)
      } else {
        console.log(await spawnPromise('docker', ['image', 'rm', latesttag]))
      }
    }
    if (argv.d) {
      console.log(`Execute: "docker image rm ${tag}"`)
    } else {
      console.log(await spawnPromise('docker', ['image', 'rm', tag]))
    }
  }
  return 'Complete!'
}

async function doPush(tag, alias=null) {
  if (alias) {
    if (argv.d) {
      console.log(`Execute: "docker tag ${tag} ${alias}"`)
    } else {
      console.log(await spawnPromise('docker', ['tag', tag, alias]))
    }
    tag = alias
  }
  if (argv.d) {
    console.log(`Execute: "docker push ${tag}"`)
  } else {
    console.log(await spawnPromise('docker', ['push', tag]))
  }
}

main()
  .then((message) => {
    if (message) console.log(message)
    process.exit(0)
  })
  .catch((message) => {
    if (message) console.error(message)
    process.exit(1)
  })

