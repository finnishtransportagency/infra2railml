const _ = require('lodash');
const trackService = require('./services/tracks');
const railml = require('./marshallers/railml');
const { BaseType } = railml;

module.exports = {
  
  /**
   * Get track kilometers from API, complemented with selected child objects.
   */
  getTrack: (trackNumber, from, length) => {
    return trackService.getKilometers(trackNumber, from, length);    
  },

  /**
   * Convert track kilometers to railML.
   */
  kilometersToRailML: (index) => {
    console.info('Generating railML based on kilometers..');
    return railml.marshall(BaseType.KILOMETERS, index);
  },

  /**
   * Convert indexed rail objects to railML.
   */
  railsToRailML: (index) => {
    console.info('Generating railML based on rails..');
    return railml.marshall(BaseType.RAILS, index);
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

      const elementit = _.uniqBy(_.reject(_.flatMap(kilometrit, 'elementit'), _.isEmpty), 'tunniste');
      const raiteet = _.uniqBy(_.reject(_.flatMap(elementit, 'raiteet'), _.isEmpty), 'tunniste');

      const index = {
        trackId, from, to, absLength, kilometrit, raiteet, elementit
      };

      resolve(index);
    });
  }

};
