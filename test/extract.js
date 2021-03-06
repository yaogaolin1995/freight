/*global describe, it, beforeEach, afterEach*/
var fs = require('fs');
var rimraf = require('rimraf');
var exec = require('child_process').exec;
var assert = require('chai').assert;

var executable = 'node ' + __dirname + '/../bin/freight';

describe('extract', function () {
  var currentDir = process.cwd();
  var projectName = 'sample-project';

  beforeEach(function (done) {
    process.env.FREIGHT_PASSWORD = null;
    // go to the fixture project
    process.chdir(__dirname + '/fixtures/project2');
    // force project update
    var pkg = JSON.parse(fs.readFileSync('package.json'));
    // update project name
    pkg.name = pkg.name + Date.now();
    // write new project name
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
    // clear node_modules for the sample project
    rimraf('node_modules', function () {
      rimraf('app', done);
    });
  });

  afterEach(function () {
    // force project update
    var pkg = JSON.parse(fs.readFileSync('package.json'));
    // set the old project name
    pkg.name = projectName;
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
    process.chdir(currentDir);
  });

  it('a full bundle with bower and npm', function (done) {
    this.timeout(20000);
    process.env.FREIGHT_PASSWORD = 'test';

    exec(executable + ' create -u http://localhost:8872',
      function (error, stdout, stderr) {
        assert.equal(stderr, '');

        var bundleReady = function () {
          exec(executable + ' -u http://localhost:8872',
            function (error, stdout, stderr) {
              assert.equal(stderr, '');

              fs.exists('node_modules/inherits/package.json', function (exists) {
                if (! exists) {
                  setTimeout(function () {
                    bundleReady();
                  }, 2000);
                } else {
                  assert.ok(exists, 'inherits should exist');
                  assert.ok(fs.existsSync('node_modules/rimraf/package.json'), 'rimraf should exist');
                  assert.notOk(fs.existsSync('bower_components'), 'wrong bower dir');
                  assert.ok(fs.existsSync('app/bower_components/normalize.css/.bower.json'), 'normalize should exist');
                  var bowerResolution = JSON.parse(fs.readFileSync('app/bower_components/normalize.css/.bower.json')).version;
                  assert.equal(bowerResolution, '2.0.1', 'should use bower resolutions');
                  assert.ok(fs.existsSync('app/bower_components/sinon/index.js'), 'sinon should exist');
                  assert.ok(fs.existsSync('app/bower_components/p/p.js'), 'p should exist');
                  assert.notOk(fs.existsSync('app/bower_components/bower.json'), 'bower.json wrong');
                  assert.ok(fs.existsSync('bower.json'), 'keep the original bower.json');
                  assert.ok(fs.existsSync('.bowerrc'), 'keep the original .bowerrc');
                  // npm shrinkwrap test: inherits must be 2.0.0
                  var shrinkwrapPkg = JSON.parse(fs.readFileSync('node_modules/inherits/package.json'));
                  assert.equal(shrinkwrapPkg.version, '2.0.0');

                  done();
                }
              });
            });
        };

        bundleReady();

      });
  });

  it('a production bundle', function (done) {
    this.timeout(20000);
    process.env.FREIGHT_PASSWORD = 'test';

    exec(executable + ' create -u http://localhost:8872',
      function (error, stdout, stderr) {
        assert.equal(stderr, '');

        var bundleReady = function () {
          exec(executable + ' -u http://localhost:8872 --production',
            function (error, stdout, stderr) {
              assert.equal(stderr, '');

              fs.exists('node_modules/inherits/package.json', function (exists) {
                if (! exists) {
                  setTimeout(function () {
                    bundleReady();
                  }, 2000);
                } else {
                  assert.ok(exists, 'npm module inherits should exist');
                  assert.notOk(fs.existsSync('node_modules/rimraf/package.json'), 'rimraf should not exist');
                  assert.notOk(fs.existsSync('bower_components'), 'wrong bower component directory');
                  assert.ok(fs.existsSync('app/bower_components/normalize.css/.bower.json'), 'normalize should exist');
                  assert.notOk(fs.existsSync('app/bower_components/sinon/index.js'), 'sinon should not exist in prod');
                  assert.ok(fs.existsSync('app/bower_components/p/p.js'));
                  assert.notOk(fs.existsSync('app/bower_components/bower.json'));
                  assert.ok(fs.existsSync('bower.json'));
                  assert.ok(fs.existsSync('.bowerrc'));
                  done();
                }
              });
            });
        };

        bundleReady();
      });
  });

  it('a production bundle using NODE_ENV', function (done) {
    this.timeout(20000);
    process.env.FREIGHT_PASSWORD = 'test';
    process.env.NODE_ENV = 'production';

    exec(executable + ' create -u http://localhost:8872',
      function (error, stdout, stderr) {
        assert.equal(stderr, '');

        var bundleReady = function () {
          exec(executable + ' -u http://localhost:8872',
            function (error, stdout, stderr) {
              assert.equal(stderr, '');

              fs.exists('node_modules/inherits/package.json', function (exists) {
                if (! exists) {
                  setTimeout(function () {
                    bundleReady();
                  }, 2000);
                } else {
                  assert.ok(exists, 'npm module inherits should exist');
                  assert.notOk(fs.existsSync('node_modules/rimraf/package.json'), 'rimraf should not exist');
                  assert.notOk(fs.existsSync('bower_components'), 'wrong bower component directory');
                  assert.ok(fs.existsSync('app/bower_components/normalize.css/.bower.json'), 'normalize should exist');
                  assert.notOk(fs.existsSync('app/bower_components/sinon/index.js'), 'sinon should not exist in prod');
                  assert.ok(fs.existsSync('app/bower_components/p/p.js'));
                  assert.notOk(fs.existsSync('app/bower_components/bower.json'));
                  assert.ok(fs.existsSync('bower.json'));
                  assert.ok(fs.existsSync('.bowerrc'));

                  process.env.NODE_ENV = null;
                  done();
                }
              });
            });
        };

        bundleReady();
      });
  });

  it('a full bundle using NODE_ENV, override by the --production=false option', function (done) {
    this.timeout(20000);
    process.env.FREIGHT_PASSWORD = 'test';
    process.env.NODE_ENV = 'production';

    exec(executable + ' create -u http://localhost:8872',
      function (error, stdout, stderr) {
        assert.equal(stderr, '');

        var bundleReady = function () {
          exec(executable + ' -u http://localhost:8872 --production=false',
            function (error, stdout, stderr) {
              assert.equal(stderr, '');

              fs.exists('node_modules/inherits/package.json', function (exists) {
                if (! exists) {
                  setTimeout(function () {
                    bundleReady();
                  }, 2000);
                } else {
                  assert.ok(exists, 'inherits should exist');
                  assert.ok(fs.existsSync('node_modules/rimraf/package.json'), 'rimraf should exist');
                  assert.notOk(fs.existsSync('bower_components'), 'wrong bower dir');
                  assert.ok(fs.existsSync('app/bower_components/normalize.css/.bower.json'), 'normalize should exist');
                  var bowerResolution = JSON.parse(fs.readFileSync('app/bower_components/normalize.css/.bower.json')).version;
                  assert.equal(bowerResolution, '2.0.1', 'should use bower resolutions');
                  assert.ok(fs.existsSync('app/bower_components/sinon/index.js'), 'sinon should exist');
                  assert.ok(fs.existsSync('app/bower_components/p/p.js'), 'p should exist');
                  assert.notOk(fs.existsSync('app/bower_components/bower.json'), 'bower.json wrong');
                  assert.ok(fs.existsSync('bower.json'), 'keep the original bower.json');
                  assert.ok(fs.existsSync('.bowerrc'), 'keep the original .bowerrc');
                  // npm shrinkwrap test: inherits must be 2.0.0
                  var shrinkwrapPkg = JSON.parse(fs.readFileSync('node_modules/inherits/package.json'));
                  assert.equal(shrinkwrapPkg.version, '2.0.0');

                  process.env.NODE_ENV = null;
                  done();
                }
              });
            });
        };

        bundleReady();

      });
  });

});
