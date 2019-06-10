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
   * Convert track kilometers to simple line/track railML.
   */
  kilometersToRailML: (index) => {
    console.info('Generating railML based on kilometers..');
    return railml.marshall(BaseType.KILOMETERS, index);
  },

  /**
   * Convert rails to railML infrastructure.
   */
  railsToRailML: (index) => {
    console.info('Generating railML based on rails..');
    return railml.marshall(BaseType.RAILS, index);
  },

  /**
   * Convert kilometers list to object index.
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

      // resolve leading/trailing extra kilometers for rails
      // that don't fully fit in the requested scope of kilometers
      const loadedKms = _.map(kilometrit, 'ratakm');
      const ratakmvalit = _.flatMap(raiteet, 'ratakmvalit');

      const valienKilometrit = _.transform(ratakmvalit, (res, v) => {
        res[v.ratanumero] = _.uniq(_.concat(res[v.ratanumero] || [], [v.alku.ratakm, v.loppu.ratakm]));
        return res;
      }, {});
      
      const nonLoadedKms = _.transform(valienKilometrit, (res, kms, ratanumero) => {
        res[ratanumero] = _.difference(kms, loadedKms);
        return res;
      }, {});

      // load extra kilometers and compose the index object
      console.info(`Loading additional leading/trailing kilometers.. ${nonLoadedKms}`);
      Promise.all(_.flatMap(nonLoadedKms, (kms, ratanumero) =>
        _.flatMap(kms, (km) => trackService.getKilometer(ratanumero, km))
      ))
      .then((extraKilometrit) => {
        return { trackId, from, to, absLength, kilometrit, extraKilometrit, raiteet, elementit };
      })
      .then(resolve);
    });
  }

};
