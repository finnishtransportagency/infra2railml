const trackService = require('./services/track-service');

module.exports = {
  fetchTrack: (trackNumber, from, length) => {    
    console.info(`Loading track ${trackNumber} [${from}..${from+length} km] ..`);
    return trackService.fetchTrack(trackNumber, from, length);    
  },
  convertTrack: (track) => {
    console.info("Converting to railML v2.2..");
    return Promise.resolve("<railml/>");
  }
};
