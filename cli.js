const cmd = require('commander');
const app = require('./index');
const { version } = require('./package.json');

module.exports = () => {
  
  cmd.version(version)
    .command('track <number>')
    .option('-f, --from [km]', 'First track kilometer to include (default 0)', 0)
    .option('-t, --to [km]', 'Last track kilometer to include (default 1)', 1)
    .action(track)
    
  cmd.parse(process.argv);
};

function track(nr, args) {
  const { from, to } = args;
  app.convertTrack(nr, from ,to);
};
