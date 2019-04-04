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
  createIndex: (trackId, kilometrit) => {

    return new Promise((resolve, reject) => {

      if (_.isEmpty(kilometrit)) {
        reject(new Error('No kilometers to process.'));
      }

      const sorted = _.sortBy(kilometrit, 'ratakm');
      const from = _.first(sorted).ratakm || 0;
      const to = _.last(sorted).ratakm || kilometrit.length;
      const totalLength = _.sumBy(sorted, 'pituus');

      const elementit = _.uniqBy(_.filter(_.flatMap(kilometrit, 'elementit'), (e) => !_.isEmpty(_.find(e.ratakmsijainnit, { ratanumero: trackId }))), 'tunniste');
      //const raiteet = _.uniqBy(_.filter(_.flatMap(elementit, 'raiteet'), (r) => _.find(r.ratakmvalit, { ratanumero: trackId })), 'tunniste');
      
      const raiteet = _.uniqBy(_.flatMap(elementit, 'raiteet'), 'tunniste');
      const radanRaiteet = _.filter(raiteet, (r) => !_.isEmpty(_.find(r.ratakmvalit, { ratanumero: trackId })));
      
      console.log(`found ${raiteet.length} relevant rails out of ${raiteet.length}`);

      const index = { trackId, from, to, totalLength, kilometrit, raiteet: radanRaiteet, elementit};

      resolve(index);
    });
  }

};
