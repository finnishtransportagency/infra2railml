const fs = require('fs');
const cmd = require('commander');
const app = require('./index');
const { version } = require('./package.json');

module.exports = () => {
  
  cmd.version(version)
    .command('track <trackNumber>')
    .option('-f, --from [km]', 'First track kilometer to include', parseInt, 0)
    .option('-t, --to [km]', 'Last track kilometer to include', parseInt, 0)
    .option('-l, --length [km]', 'Number of following kilometers to include', parseInt, 0)
    .action(track)
    
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
  const length = !!args.to ? args.to - args.from : (args.length || 0);
  const filename = `./track-${trackId}_${from}-${from + length}`;

  app.getTrack(trackId, from, length)
    .then((kilometers) => app.kilometersToRailML(trackId, kilometers))
    .then((railml) => writeToFile(`${filename}.railml.xml`, railml))
};

function writeToFile(filename, data) {
  console.log(`Writing ${filename} ..`);
  const f = fs.writeFile(filename, data, 'utf8', () => console.log("Done."));
  return data;
}