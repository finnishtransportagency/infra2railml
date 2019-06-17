const cmd = require('commander');
const app = require('./index');
const { version } = require('./package.json');

module.exports = () => {
  
  cmd.arguments('<trackNumber>')
    .option('-f, --from <km>', 'First track kilometer', parseInt)
    .option('-t, --to <km>', 'Last track kilometer', parseInt)
    .option('-l, --length <n>', 'Total number of kilometers', parseInt)
    .action(rails);

  cmd.version(version);
  cmd.parse(process.argv);
};

/**
 * Track command controller.
 */
function rails(trackNumber, args) {

  const { from, to, length } = args;
  
  if (!trackNumber || trackNumber.length === 0 || !from || from > to) {
    cmd.outputHelp();
  } else {

    const start = new Date().getTime();    
    const count = !!to ? to - from + 1 : (length || 1);
    const filename = `./Rails-${trackNumber}_${from}-${from + count - 1}.railml.xml`;
    
    app.getTrack(trackNumber, from, count)
      .then((kms) => app.createIndex(trackNumber, kms))
      .then(app.railsToRailML)
      .then((railml) => app.writeToFile(filename, railml))
      .then(() => console.info(`Done! (${new Date().getTime() - start} ms)`))
      .catch((err) => console.error(err));
  }
}
