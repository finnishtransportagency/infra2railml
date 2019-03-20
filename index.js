const trackService = require('./services/track-service');
const railml = require('./marshallers/railml-marshaller');

module.exports = {
  
  getTrack: (trackNumber, from, length) => {    
    console.info(`Loading track ${trackNumber} [${from}..${from+length} km] ..`);
    return trackService.getTrack(trackNumber, from, length);    
  },

  convertTrack: (trackId, from, to, track) => {
    console.info('Converting to railML ..');
    return railml.convert(trackId, from, to, track);
  }
};
