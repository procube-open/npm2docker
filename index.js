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
  .alias('x', 'prifix')
  .describe('x', 'Prefix of tag(ex. rep.example.com:5000/, procube/)')
  .alias('f', 'file')
  .describe('f', 'Path to package.json')
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

function wait() {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve()
        }, wait_interval)
    })
}

async function ensureVersion(name, version) {
  for (var i = 0;  i < retries;  i++) {
    try {
      var versions = execFileSync('npm', ['view', name, '--json', 'versions']).toString()
    } catch (err) {
      throw `Fail to execute command: npm view ${name} --json versions error=${err}`
    }
    try {
      var {latest} = JSON.parse(versions)
    } catch (err) {
      throw `Fail to parse output of: npm view ${name} --json versions; error=${err}; string=${versions}`
    }
    if (versions.includes(version)) return ''
    if ( i == 0 ) {
      consle.log(`Current latest is ${latest} by "npm view ${name} dist-tags", then start waiting for ${version}`)
    } else {
      consle.log(`Waiting.`)
    }
    await wait()
  }
  throw `The package ${name}@${version}has not been released.`
}

function getCmd(bin, baseName) {
  if (typeof(bin) == "string") return baseName
  return Object.keys(bin)[0]
}

async function main() {
  const package = JSON.parse(fs.readFileSync(argv.f, 'utf8'))
  const {name, version, bin, files} = package
  await ensureVersion(name, version)
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
  if (npmrcContents) dockerfile += `RUN echo -e $'${npmrcContents.replace(/'/g, `'\\''`).replace(/\r?\n/g, '\\n\\\n')}' >> /root/.npmrc\n`
  dockerfile += `RUN yarn global add ${name}@${version} --exact\n`
  if (npmrcContents) dockerfile += `RUN rm /root/.npmrc\n`
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

