const _ = require('lodash');
const trackService = require('./services/tracks');
const railml = require('./marshallers/railml');

module.exports = {
  
  /**
   * Get track kilometers from API, complemented with selected child objects.
   */
  getTrack: (trackNumber, from, length) => {    
    console.info(`Loading track ${trackNumber} [${from}..${from+length-1} km] ..`);
    return trackService.getKilometers(trackNumber, from, length);    
  },

  /**
   * Convert track kilometers to railML.
   */
  kilometersToRailML: (trackId, kilometers) => {
    console.info('Generating railML based on kilometers..');
    return railml.fromKilometers(trackId, kilometers);
  },

  /**
   * Convert indexed rail objects to railML.
   */
  railsToRailML: (index) => {
    console.info('Generating railML based on rails..');
    return railml.fromRails(index);
  },

  /**
   * Convert kilometers to object index.
   */
  createIndex: (trackId, kilometers) => {

    return new Promise((resolve) => {

      const from = _.first(kilometers).ratakm || 0;
      const to = _.last(kilometers).ratakm || kilometers.length;

      const elementit = _.uniqBy(_.filter(_.flatMap(kilometers, 'elementit'), (e) => _.find(e.ratakmsijainnit, { ratanumero: trackId })), 'tunniste');
      const raiteet = _.uniqBy(_.filter(_.flatMap(elementit, 'raiteet'), (r) => _.find(r.ratakmvalit, { ratanumero: trackId })), 'tunniste');
      
      const index = { trackId, from, to, kilometrit: kilometers, raiteet, elementit};

      resolve(index);
    });
  }

};
