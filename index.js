const trackService = require('./services/tracks');
const railml = require('./marshallers/railml');

module.exports = {
  
  getTrack: (trackNumber, from, length) => {    
    console.info(`Loading track ${trackNumber} [${from}..${from+length} km] ..`);
    return trackService.getTrack(trackNumber, from, length);    
  },

  kilometersToRailML: (trackId, kilometers) => {
    console.info('Generating railML..');
    return railml.fromKilometers(trackId, kilometers);
  }
};
