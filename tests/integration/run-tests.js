var path = require('path');
var kill = require('kill-process'),
  selenium = require('selenium-standalone'),
  spawn = require('child_process').spawn;

var procs = [];
var meteor_path = 'meteor';
var isWin = /^win/.test(process.platform);

if (isWin) meteor_path += '.bat';

function closeProcs() {
  console.log('closing procs');
  procs.forEach(function(proc) {
    kill(proc.pid);
  });
  return;
}

process.on('unhandledRejection', (reason, p) => {
  console.error(reason, 'Unhandled Rejection at Promise', p);
  closeProcs();
  process.exit(1);
}).on('uncaughtException', err => {
  console.error(err, 'Uncaught Exception thrown');
  closeProcs();
  process.exit(1);
}).on('SIGINT', function() {
  console.log('Caught interrupt signal');
  closeProcs();
  process.exit();
});

const setPackage = package_name => {
  return new Promise((resolve, reject) => {
    console.log('calling meteor add ' + package_name);
    var proc = spawn(meteor_path, ['add', package_name], { stdio: 'inherit' });
    proc.on('close', function() {
      resolve();
    });
  });
};

const resetMeteor = () => {
  return new Promise((resolve, reject) => {
    console.log('calling meteor reset');
    var proc = spawn(meteor_path, ['reset'], { stdio: 'inherit' });
    proc.on('close', function() {
      return resolve();
    });
  });
};

const startMeteor = () => {
  return new Promise((resolve, reject) => {
    console.log('starting Meteor server');
    var proc = spawn(meteor_path, ['--settings', 'settings.json']);
    procs.push(proc);
    proc.stdout.on('data', (data) => {
      var line = data.toString();
      console.log(line);
      if (line.indexOf('localhost:3000') != -1) {
        console.log('Meteor server Successfully started');
        resolve();
      }
    });
    proc.stderr.on('data', (data) => {
      console.log(data.toString());
      reject(new Error(data.toString()));
    });
  });
};

const startSelenium = () => {
  return new Promise((resolve, reject) => {
    console.log('starting selenium');
    selenium.start({spawnOptions: {stdio: 'inherit'}}, (err, selenium_proc) => {
      if (err) {
        console.error('Error starting selenium: ');
        console.error(err);
        return reject(err);
      }
      procs.push(selenium_proc);

      console.log('selenium started');
      resolve();
    });
  });
}


const runTestPackage = ((package_name, callback) => {
  return new Promise((resolve, reject) => {
    var wdio_conf_file = path.join(__dirname, package_name, 'wdio.conf.js');
    console.log('running test package: ' + wdio_conf_file);
    var wdio_proc = spawn(path.join(__dirname, '..', '..', 'node_modules', '.bin', 'wdio' + (isWin ? '.cmd' : '')), [wdio_conf_file], {'stdio': 'inherit'});
    wdio_proc.on('error', function(data) {
      return reject(new Error(data.toString()));
    });
    wdio_proc.on('close', resolve);
  });
});

var package_name = 'example-simple';
startMeteor()
  .then(startSelenium)
  .then(runTestPackage.bind(null, package_name))
  .catch((reason) => {
    console.error(reason);
    console.log('Error running ' + __filename);
  })
  .then(() => {
    closeProcs();
    console.log('Successfully run tests');
  });
