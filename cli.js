const cmd = require('commander');
const app = require('./index');
const { version } = require('./package.json');

module.exports = () => {
  
  cmd.version(version)
    .command('track <id>')
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

  const { from, to, length } = args;
  const kilometers = !!to ? to-from : (length || 0);
  
  app.fetchTrack(trackId, from, kilometers)
    .then(app.convertTrack)
    .then((railml) => {
      writeToFile(railml, `Track-${trackId}_${from}-${from+kilometers}.railml`);
    }).then((res) => {
      console.info("Done.");
    });
};

function writeToFile(data, filename) {
  console.log(`Writing \"${data}\" to ${filename} ..`);
}