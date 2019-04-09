const fs = require('fs');
const cmd = require('commander');
const app = require('./index');
const { version } = require('./package.json');

module.exports = () => {
  
  cmd.version(version)
    .command('track <trackNumber>')
    .option('-f, --from [km]', 'First track kilometer', parseInt, 0)
    .option('-t, --to [km]', 'Last track kilometer', parseInt, 0)
    .option('-l, --length [km]', 'Total number of kilometers', parseInt, 0)
    .action(track)
    
  cmd.command('rails <trackNumber>')
    .option('-f, --from [km]', 'First track kilometer', parseInt, 0)
    .option('-t, --to [km]', 'Last track kilometer', parseInt, 0)
    .option('-l, --length [km]', 'Total number of kilometers', parseInt, 0)
    .action(rails)

  cmd.parse(process.argv);
};

/**
 * "track" command controller
 * 
 * @param {*} trackId ID/number of the track to fetch.
 * @param {*} args Command line args for the "track" command.
 */
function track(trackId, args) {

  const { from } = args;
  const length = !!args.to ? args.to - args.from + 1 : (args.length || 1);
  const filename = `./Track-${trackId}_${from}-${from + length - 1}`;

  app.getTrack(trackId, from, length)
    .then((kms) => app.createIndex(trackId, kms))
    .then(app.kilometersToRailML)
    .then((railml) => writeToFile(`${filename}.railml.xml`, railml))
    .catch((err) => console.error(err.message));
};

/**
 * "rails" command controller.
 */
function rails(trackId, args) {

  const { from } = args;
  const length = !!args.to ? args.to - args.from + 1 : (args.length || 1);
  const filename = `./Rails-${trackId}_${from}-${from + length - 1}.railml.xml`;

  app.getTrack(trackId, from, length)
    .then((kms) => app.createIndex(trackId, kms))
    .then(app.railsToRailML)
    .then((railml) => writeToFile(filename, railml))
    .catch((err) => console.error(err.message));

}

function writeToFile(filename, data) {
  console.log(`Writing ${filename} ..`);
  const f = fs.writeFile(filename, data, 'utf8', () => console.log("Done."));
  return data;
}