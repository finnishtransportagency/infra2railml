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
  kilometersToRailML: (index) => {
    console.info('Generating railML based on kilometers..');
    return railml.fromKilometers(index);
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
  createIndex: (trackId, kilometrit) => {

    return new Promise((resolve, reject) => {

      if (_.isEmpty(kilometrit)) {
        reject(new Error('No kilometers to process.'));
      }

      const sorted = _.sortBy(kilometrit, 'ratakm');
      const from = _.first(sorted).ratakm || 0;
      const to = _.last(sorted).ratakm || kilometrit.length;
      const absLength = _.sumBy(sorted, 'pituus');

      const elementit = _.uniqBy(_.filter(_.flatMap(kilometrit, 'elementit'), (e) => !_.isEmpty(_.find(e.ratakmsijainnit, { ratanumero: trackId }))), 'tunniste');   
      const raiteet = _.uniqBy(_.flatMap(elementit, 'raiteet'), 'tunniste');
      const radanRaiteet = _.filter(raiteet, (r) => !_.isEmpty(_.find(r.ratakmvalit, { ratanumero: trackId })));
      
      const index = {
        trackId, from, to, absLength, kilometrit, raiteet: radanRaiteet, elementit
      };

      resolve(index);
    });
  }

};
