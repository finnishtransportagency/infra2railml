/*
 * Copyright 2019 FINNISH TRANSPORT INFRASTRUCTURE AGENCY
 * 
 * Licensed under the EUPL, Version 1.2 or – as soon they will be approved by
 * the European Commission – subsequent versions of the EUPL (the "License");
 * You may not use this work except in compliance with the License.
 * 
 * You may obtain a copy of the License at:
 * https://joinup.ec.europa.eu/software/page/eupl5
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" basis, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */
const _ = require('lodash');
const cmd = require('commander');
const app = require('./index');
const { version } = require('./package.json');

module.exports = () => {
  
  cmd.arguments('<trackNumber>')
    .option('-f, --from <km>', 'First track kilometer', parseInt)
    .option('-t, --to <km>', 'Last track kilometer', parseInt)
    .option('-l, --length <n>', 'Total number of kilometers', parseInt)
    .action(rails);

  cmd.command('stations').action(stations);

  cmd.version(version);
  cmd.parse(process.argv);
};

/**
 * Track command controller.
 */
function rails(trackNumber, args) {

  const { from, to, length } = args;
  
  if (isValidArgs(trackNumber, args)) {

    const start = new Date().getTime();    
    const count = !!to ? to - from + 1 : (length || 1);
    const filename = `./Rails-${trackNumber}_${from}-${from + count - 1}.railml.xml`;
    
    app.getTrack(trackNumber, from, count)
      .then((kms) => app.createIndex(trackNumber, kms))
      .then(app.railsToRailML)
      .then((railml) => app.writeToFile(filename, railml))
      .then(() => console.info(`\r\x1b[KDone! (${new Date().getTime() - start} ms)`))
      .catch((err) => console.error(err));

  } else {
    cmd.outputHelp();
  }
}

/**
 * Returns true if given command-line parameters are valid and
 * mutually logical, otherwise false.
 */
function isValidArgs(trackNumber, args) {

  const { from, to, length } = args;

  if (_.isUndefined(trackNumber) || _.isEmpty(trackNumber)) {
    return false;
  }
  if (_.isUndefined(from) || from < 0) {
    return false;
  }
  if (!_.isUndefined(to) && (to < 0 || to < from)) {
    return false;
  }
  if (!_.isUndefined(length) && length < 1) {
    return false;
  }

  return true;
}

/**
 * Stations command controller.
 */
function stations(args) {
  const start = new Date().getTime();
  const filename = `./Stations.railml.xml`;
  app.getStations()
    .then((liikennepaikat) => app.stationsToRailML({ liikennepaikat }))
    .then((railml) => app.writeToFile(filename, railml))
    .then(() => console.info(`\r\x1b[KDone! (${new Date().getTime() - start} ms)`))
    .catch((err) => console.error(err));
}
