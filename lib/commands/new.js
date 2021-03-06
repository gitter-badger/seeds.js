var chalk    = require('chalk');

module.exports = function(cli) {
  var appName = cli.args[1];
  var nodeBin = `${cli.included_basepath}/node_modules/.bin`;

  var feName  = "frontend";
  var feDir = `${cli.cwd()}/${appName}/${feName}`;

  var apiName  = "api";
  var apiDir = `${cli.cwd()}/${appName}/${apiName}`;

  function createAppFolder() {
    if (appName === undefined) {
      cli.error('You must supply a name for your Seeds.js Application.');
      cli.exit(1);
    }
    cli.debug('createAppFolder');

    return cli.mkdir(appName);
  }

  function bootstrapApp() {
    cli.debug('bootstrapApp');

    return cli.cp(`${cli.included_basepath}/node_modules`, `${cli.cwd()}/${appName}/node_modules`, {clobber: true}, function(err) {
      if (err) { return cli.debug(err); }

      cli.runExternalCommand('npm', ['init', '-f']).then(function() {
        cli.chdir(appName, generateAppFiles);
      })
    });
  }

  function generateAppFiles() {
    cli.debug('generateAppFiles');

    return cli.exec('npm install').then(function() {
      cli.runExternalCommand(`${cli.cwd()}/${appName}/node_modules/.bin/sails`, ['new', 'api']).then(setupSails);
      cli.runExternalCommand(`${cli.cwd()}/${appName}/node_modules/.bin/ember`, ['new', 'frontend', '--skip-git']).then(setupEmber);
    });
  }

  function setupSails() {
    cli.debug('setupSails');

    cleanUpSails().then(function() {
      cli.debug('Clean up sails finished.');
    }).then(function() {
      cli.debug('prepareSails started.');
      prepareSails();
    }).then(function() {
      cli.copyTemplates(`${cli.included_basepath}/lib/templates/api`, `${apiDir}`, {clobber: true}, function(err) {
        if (err) { return cli.debug(err); }
        cli.debug('Sails templates copied without error.');
      });
    }).done(function(){
      cli.banner(`${cli.included_basepath}/lib/helpers/banner`);
    });
  }

  function cleanUpSails(){
    cli.debug('cleanUpSails');

    cli.rm(`${apiDir}/views`);
    cli.rm(`${apiDir}/tasks`);
    cli.rm(`${apiDir}/Gruntfile.js`);

    var sailsPackages = ['rm', 'grunt', 'ejs', 'grunt-contrib-clean', 'grunt-contrib-concat',
    'grunt-contrib-copy', 'grunt-contrib-cssmin', 'grunt-contrib-jst', 'grunt-contrib-less',
    'grunt-contrib-uglify', 'grunt-contrib-watch', 'grunt-sails-linker', 'grunt-sync', 'grunt-contrib-coffee',
    '--save'];

    return cli.runExternalCommand('npm', sailsPackages, { cwd: `${apiDir}` });
  }

  function prepareSails() {
    cli.debug('prepareSails');
    var sailsPackages = ['i','sails-generate-ember-blueprints', 'lodash', 'pluralize',
    'sails-hook-autoreload@~0.11.4', 'balderdashy/sails-hook-dev', 'sails-disk', '--save'];

    cli.runExternalCommand('npm', sailsPackages, { cwd: `${apiDir}` }).then(function() {
      cli.runExternalCommand(`${cli.cwd()}/${appName}/node_modules/.bin/sails`, ["generate", "ember-blueprints"], { cwd: `${apiDir}` });
    })
  }

  function setupEmber() {
    cli.debug('setupEmber');
    var emberPackages = ['install','semantic-ui-ember', 'ember-cli-scaffold'];

    return cli.runExternalCommand(`${feDir}/node_modules/.bin/ember`, emberPackages, { cwd: `${feDir}` }).then(function() {
      cli.copyTemplates(`${cli.included_basepath}/lib/templates/frontend`, `${feDir}`, {clobber: true}, function(err) {
        if (err) { return cli.debug(err); }
        cli.debug('Ember templates copied without error.');
      });
    })
  }

  cli.ui(chalk.green('Generating a new Seed named'), chalk.white(appName) + chalk.green('...'));

  createAppFolder().then(bootstrapApp);
}
