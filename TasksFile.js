/* eslint-disable import/no-extraneous-dependencies */
const fs = require('fs')
const path = require('path')

const { cli, sh } = require('tasksfile')
const esbuild = require('esbuild')
const glob = require('fast-glob')
const { parse } = require('envfile')

const shellOptions = { nopipe: true, async: undefined }

const prepareAndCleanDir = dir => {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true })
  fs.mkdirSync(dir)
  fs.writeFileSync(path.join(dir, '.gitkeep'), '')
}

async function pDeleteFileOrFolder(folderPath, isFolder) {
  const exists = await fs.promises.stat(folderPath).catch(noop)
  if (!exists) return Promise.resolve()

  return isFolder ? fs.promises.rm(folderPath, { recursive: true }) : fs.promises.rm(folderPath)
}

const testingEnvVars = parse(fs.readFileSync('./tests/.testing.env', { encoding: 'utf8' }))

const removeTempTestFiles = () =>
  Promise.all([
    pDeleteFileOrFolder(testingEnvVars.LOGDIR, true),
    pDeleteFileOrFolder(testingEnvVars.POSTS_MEDIA_DOWNLOAD_DIR, true),
    pDeleteFileOrFolder(testingEnvVars.SQLITE_DBPATH),
    pDeleteFileOrFolder(testingEnvVars.COMMENTS_DBPATH),
    pDeleteFileOrFolder(`${testingEnvVars.COMMENTS_DBPATH}-lock`),
  ])

const noop = _ => {}

const tsFilesBackend = glob.sync(
  ['db/**/*.ts', 'downloads/**/*.ts', 'logging/**/*.ts', 'server/**/*.ts', './boot.ts'],
  {
    ignore: ['**/*.d.ts'],
  }
)

const tsFilesFrontend = glob.sync(['frontend/**/*.ts'], { ignore: ['**/*.d.ts'] })

/*****
  We need to set __VUE_OPTIONS_API__ and __VUE_PROD_DEVTOOLS__ as we are using the bundler build https://github.com/vuejs/vue-next/tree/master/packages/vue#bundler-build-feature-flags
  Esbuild seems to automatically add process.env.NODE_ENV on its own
*****/
// prettier-ignore
const esBuildFrontend = `esbuild ${tsFilesFrontend.join(' ')} --bundle --sourcemap --target=firefox78,chrome90,safari14,ios14 --loader:.ts=ts --loader:.svg=text --format=esm --platform=browser --outdir=frontend/js --outbase=frontend/js --tree-shaking=true --define:__VUE_OPTIONS_API__=\\"true\\" --define:__VUE_PROD_DEVTOOLS__=\\"false\\"`

// prettier-ignore
const esBuildBackend = `esbuild ${tsFilesBackend.join(' ')} --sourcemap --loader:.ts=ts --loader:.svg=text --format=cjs --platform=node --target=node14.18 --outdir=./`

/*****
  You can run any of these tasks manually like this: npx task tests:npmaudit
*****/
const dev = {
  start() {
    const browserync = `browser-sync start --watch --no-open --no-notify --no-ui --no-ghost-mode --no-inject-changes --files=frontend/**/*.js  --files=frontend/**/*.css --files=server/**/*.js --files=server/**/*.njk --files=boot.js --files=logging/**/*.js --files=db/**/*.js --files=downloads/**/*.js --ignore=node_modules --port 8081 --proxy 'http://0.0.0.0:3000' --host '0.0.0.0'`

    const tsWatchFrontend = `${esBuildFrontend} --watch`

    const tsWatchBackend = `${esBuildBackend} --watch`

    const tsLint = `tsc --noEmit --watch --preserveWatchOutput --incremental`

    const nodemon = `nodemon --delay 1.5 --watch db --watch downloads --watch logging --watch server --ext js,njk ./boot.js`

    sh(
      `concurrently --raw --prefix=none "${tsWatchFrontend}" "${tsWatchBackend}" "${browserync}" "${nodemon}" "${tsLint}"`,
      shellOptions
    )
  },
  inspect() {
    sh(`${esBuildFrontend} && ${esBuildBackend} && node --inspect ./boot.js`, shellOptions)
  },
}

let runningMochaTests = false

const build = {
  prepareBuildDir() {
    prepareAndCleanDir('./frontend-build')
  },
  copyFilesToFrontendBuild() {
    sh(`ncp ./frontend/static "./frontend-build/static"`, { ...shellOptions, silent: true })
    sh(`ncp ./frontend/css "./frontend-build/css"`, { ...shellOptions, silent: true })
  },
  minifyCSSToBuildDir() {
    sh(`foreach --glob "frontend-build/**/*.css" --execute "csso --input #{path} --output #{path}"`, {
      ...shellOptions,
      silent: true,
    })
  },
  frontendJS() {
    const result = esbuild.buildSync({
      entryPoints: tsFilesFrontend,
      format: 'esm',
      /*****
        We need to set __VUE_OPTIONS_API__ and __VUE_PROD_DEVTOOLS__ as we are using the bundler build https://github.com/vuejs/vue-next/tree/master/packages/vue#bundler-build-feature-flags
      *****/
      define: {
        __VUE_OPTIONS_API__: 'true',
        __VUE_PROD_DEVTOOLS__: 'false',
        'process.env.NODE_ENV': '"production"',
      },
      loader: {
        '.ts': 'ts',
        '.svg': 'text',
      },
      platform: 'browser',
      outdir: path.join(process.cwd(), 'frontend-build', 'js'),
      target: ['firefox78', 'chrome90', 'safari14', 'ios14'],
      metafile: true,
      ...(runningMochaTests
        ? { bundle: false, minify: false, sourcemap: true, treeShaking: false }
        : { bundle: true, minify: true, sourcemap: false, treeShaking: true }),
    })
    // https://esbuild.github.io/api/#metafile
    require('fs').writeFileSync('esbuild-meta.json', JSON.stringify(result.metafile))
  },
  backendJS() {
    esbuild.buildSync({
      entryPoints: tsFilesBackend,
      bundle: false,
      loader: {
        '.ts': 'ts',
        '.svg': 'text',
      },
      format: 'cjs',
      platform: 'node',
      target: ['node14.18'],
      outdir: path.join(process.cwd()),
      ...(runningMochaTests ? { treeShaking: false, sourcemap: true } : { treeShaking: true, sourcemap: false }),
    })
  },
}

const tests = {
  npmaudit() {
    sh('snyk test --production  --severity-threshold=high', shellOptions)
  },
  csslint() {
    sh(`stylelint "frontend/css/**/*.css"`, shellOptions)
  },
  eslint() {
    sh(
      `eslint './boot.ts' './server/**/*.ts' './logging/**/*.ts' './downloads/**/*.ts' './db/**/*.ts' './frontend/js/**/*.ts' --report-unused-disable-directives --quiet --rule 'no-console: ["error", { allow: ["error", "info", "warn"] }]' --rule "no-warning-comments: ['error', { terms: ['todo', 'fixme', 'hack', 'bug', 'xxx'], location: 'anywhere' }]" --rule "no-debugger: 'error'"  --ignore-pattern 'db-dev.ts'`,
      shellOptions
    )
    sh(`eslint './tests/*.ts' './tests/**/*.ts' --quiet --config ./tests/.eslintrc.cjs`, shellOptions)
  },
  tslint() {
    sh(`tsc --noEmit`, shellOptions)
    sh(`tsc --noEmit --project ./tests/.testing.tsconfig.json`, shellOptions)
  },
  sonarqube() {
    /*****
      When we call this via `npm run test` we dont preload the .env data (cause mocha needs to do that on its own),
      so we manually load it here.
    *****/
    const sonarToken = fs.readFileSync('./.env').toString().split('SONAR_TOKEN=')[1].split('\n')[0].trim()
    // You need a SONAR_TOKEN .env varible set for this to work. You can get one from https://sonarcloud.io/
    sh(
      `SONAR_TOKEN=${sonarToken} sonar-scanner -Dsonar.organization=darkle -Dsonar.projectKey=Roffline -Dsonar.sources=. -Dsonar.host.url=https://sonarcloud.io -Dsonar.exclusions=frontend/static/**/*`,
      shellOptions
    )
    sh(`xdg-open https://sonarcloud.io/dashboard?id=Roffline &`, { ...shellOptions, silent: true })
  },
  bundlesize() {
    sh(`esbuild-visualizer --metadata ./esbuild-meta.json --filename esbuild-stats.html`, shellOptions)
    sh(`xdg-open esbuild-stats.html &`, { ...shellOptions, silent: true })
  },
  codecoverage() {
    sh(`TS_NODE_PROJECT='tests/.testing.tsconfig.json' TESTING=true nyc mocha tests`, shellOptions)
  },
  // eslint-disable-next-line max-lines-per-function
  mocha() {
    runningMochaTests = true
    const shOptions = { ...shellOptions, async: true }
    // download video tests can take 5-10 mins, so can skip them if want
    const ignoreVideoTests = process.env.SKIP_VIDEO_TESTS
      ? '--ignore tests/unit/server/updates/download-video.test.js'
      : ''

    Object.keys(build).forEach(key => build[key]()) //get frontend-build set up

    //DO instrument here AFTER build
    sh(`nyc instrument --compact=false --in-place . .`, shellOptions)

    const startServer = `TESTING=true ROFFLINE_NO_UPDATE=true node -r ./env-checker.cjs ./boot.js &`
    const e2eTests_Chromium = `TESTING=true cypress run --browser chromium`
    const e2eTests_Firefox = `TESTING=true cypress run --browser firefox`
    const integrationAndUnitTests = `TS_NODE_PROJECT='tests/.testing.tsconfig.json' TESTING=true nyc mocha tests ${ignoreVideoTests}`

    // sh(startServer, { ...shellOptions, silent: true })
    sh(startServer, shellOptions)

    // it takes a long while for n
    // @ts-expect-error
    sh(`sleep 2 && ${e2eTests_Chromium}`, shOptions)
      //// @ts-expect-error
      // .then(() => sh(e2eTests_Firefox, shOptions))
      //// @ts-expect-error
      // .then(() => sh(integrationAndUnitTests, shOptions))
      .catch(noop)
      .finally(_ =>
        // @ts-expect-error
        sh(`fkill :8080 --silent`, { silent: true, ...shOptions })
          .then(removeTempTestFiles)
          .catch(noop)
          .finally(() => process.exit(0))
      )
  },
}

const db = {
  resetSubsLastUpdate() {
    sh(`sqlite3 -batch roffline-sqlite.db "UPDATE subreddits_master_list SET lastUpdate = ${Date.now()};"`)
  },
}

const buildProd = () => Object.keys(build).forEach(key => build[key]())

const testAll = () => {
  buildProd()
  Object.keys(tests).forEach(key => tests[key]())
}

cli({
  dev,
  tests,
  testAll,
  build,
  buildProd,
  db,
})
