function moduleExists( name ) {
  try { return !!require.resolve(name); }
  catch(e) { return false }
}

const child_process = require('child_process');

if (!moduleExists('./dist/index.js')) {
  let tsInstalled = moduleExists('typescript')
  const execOptions = {
    cwd: __dirname
  };

  if (!tsInstalled) {
    child_process.execSync('npm install --no-save typescript', execOptions)
  }

  child_process.execSync('npm run build', execOptions)

  if (!tsInstalled) {
    child_process.execSync('npm remove --no-save typescript', execOptions)
    child_process.execSync('npm remove --no-save tslint', execOptions)
    child_process.execSync('npm remove --no-save typedoc', execOptions)
    child_process.execSync('npm prune', execOptions)
  }
}