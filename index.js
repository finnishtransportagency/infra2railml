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
const fs = require('fs');
const _ = require('lodash');
const trackService = require('./services/tracks');
const stationService = require('./services/stations');
const gradientUtils = require('./utils/gradient-utils');
const railml = require('./marshallers/railml');
const { BaseType } = railml;

module.exports = {
  
  /**
   * Get track kilometers from the Infra-API, amended with selected child objects.
   */
  getTrack: (trackNumber, from, length) => {
    return trackService.getKilometers(trackNumber, from, length);    
  },

  /**
   * List all stations from the Infra-API.
   */
  getStations: () => {
    return stationService.list();
  },

  /**
   * Convert rails to railML infrastructure.
   */
  railsToRailML: (index) => {
    console.info('\r\x1b[KGenerating infrastructure railML..');
    return railml.marshall(BaseType.RAILS, index);
  },

  /**
   * Convert stations to railML operation control points.
   */
  stationsToRailML: (index) => {
    console.log('\r\x1b[KGenerating stations railML..');
    return railml.marshall(BaseType.STATIONS, index);
  },

  /**
   * Convert kilometer list to index object. Also, loads the extra kilometers
   * for those rails that span over the initially requested track kilometers.
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
      const kaikkiRaiteet = _.uniqBy(_.reject(_.flatMap(elementit, 'raiteet'), _.isEmpty), 'tunniste');
      const raiteet = _.filter(kaikkiRaiteet, (r) => !_.isEmpty(_.find(r.ratakmvalit, (v) => v.ratanumero === trackId)));

      const liikennepaikanRaiteet = _.reject(_.flatMap(raiteet, 'liikennepaikanRaide'), _.isEmpty);
      const liikennepaikat = _.uniqBy(_.reject(_.flatMap(liikennepaikanRaiteet, 'liikennepaikka'), _.isEmpty), 'tunniste');

      // resolve the loaded kilometers and rail ranges
      const loadedKms = _.map(kilometrit, 'ratakm');
      const ratakmvalit = _.flatMap(raiteet, 'ratakmvalit');

      // map all rail ranges into { trackNumber: [km, km, ...] } object to find the
      // track kilometers where each rail begins and ends
      const valienKilometrit = _.transform(ratakmvalit, (res, v) => {
        const track = res[v.ratanumero] || [];
        res[v.ratanumero] = _.uniq(_.concat(track, [v.alku.ratakm, v.loppu.ratakm]));
        return res;
      }, {});

      // resolve track kilometers that have not been loaded
      const nonLoadedKms = _.transform(valienKilometrit, (res, kms, ratanumero) => {

        const kilometersToLoad = [];
        const diff = _.difference(kms, loadedKms);

        // fill in the blanks between diff and loaded
        const limit = Math.max(_.max(diff), _.min(loadedKms));
        for (let i = _.min(diff); i <= limit; i++) {
          if (i < _.min(loadedKms) || i > _.max(loadedKms)) {
            kilometersToLoad.push(i);
          }
        }

        res[ratanumero] = kilometersToLoad;
        return res;
      }, {});

      const kmInfo = _.transform(nonLoadedKms, (res, v, k) => {
        if (v.length > 0) res.push(`${k} [${v.join(', ')}]`);
        return res;
      }, []).join(', ');
      console.info(`\r\x1b[KLoading additional kilometers ${kmInfo}`);

      // load extra kilometers and compose the index object
      Promise.all(_.flatMap(nonLoadedKms, (kms, ratanumero) =>
          _.flatMap(kms, (km) => trackService.getKilometer(ratanumero, km))
        ))
        .then((extraKilometrit) => {

          const extraElementit = _.uniqBy(_.reject(_.flatMap(extraKilometrit, 'elementit'),_ .isEmpty), 'tunniste');
          const kaikkiElementit = _.uniqBy(_.concat(elementit, extraElementit), 'tunniste');

          const korkeudet = _.groupBy(_.flatMap(raiteet, 'korkeuspisteet'), (k) => k.sijainti.ratanumero);
          const kaltevuudet = gradientUtils.toSlopes(korkeudet, _.concat(kilometrit, extraKilometrit));

          return {
            trackId, from, to, absLength, kilometrit, extraKilometrit, raiteet, elementit : kaikkiElementit, liikennepaikat, kaltevuudet
          };
        })
        .then(resolve);
    });
  },

  /**
   * Write given contents in specified file.
   */
  writeToFile: (filename, data) => {
    console.log(`\r\x1b[KWriting ${filename} ..`);
    fs.writeFile(filename, data, 'utf8', (err) => {
      if (err) throw err;
    });
    return data;
  }

};
