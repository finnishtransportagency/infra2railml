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
const cheerio = require('cheerio');
const config = require('../config');
const railUtils = require('../utils/rail-utils');
const speedChange = require('./speed-change');
const electrificationChange = require('./electrification-change');
const platformEdge = require('./platform-edge');
const gradientChange = require('./gradient-change');

// Notice: the order of child elements is significant.
// https://wiki.railml.org/index.php?title=IS:trackElements

module.exports = {
    marshall: (raide, ratanumero, alku, loppu, elementit, kilometrit, kaltevuudet) => {

        const raideId = raide.tunniste;
        const nopeudet = railUtils.getSpeedLimits(raide, ratanumero, alku, loppu);
        
        const $ = cheerio.load('<trackElements/>', config.cheerio);

        const speedChanges = _.uniq(_.flatMap(nopeudet, (n) => speedChange.marshall(raideId, alku, kilometrit, n)));
        if (!_.isEmpty(speedChanges)) {
            $('trackElements').append('<speedChanges/>');
            $('trackElements > speedChanges').append(_.join(speedChanges, ''));
        }

        const gradientChanges = gradientChange.marshall(raideId, alku, raide.korkeuspisteet, kaltevuudet[ratanumero], kilometrit);
        if (!_.isEmpty(gradientChanges)) {
            $('trackElements').append('<gradientChanges/>');
            $('trackElements > gradientChanges').append(_.join(gradientChanges, ''));
        }
        
        // TODO is electrificationChange correct railML term?
        const electrificationChanges = _.map(elementit.erotusjakso, (ej) => electrificationChange.marshall(ratanumero, alku, kilometrit, ej));
        if (!_.isEmpty(electrificationChanges)) {
            $('trackElements').append(`<electrificationChanges>${_.join(electrificationChanges, '')}</electricifationChanges>`);
        }

        const platform = platformEdge.marshall(raideId, alku, kilometrit, raide.liikennepaikanRaide);
        if (!_.isEmpty(platform)) {
            $('trackElements').append(`<platformEdges>${platform}</platformEdges>`);
        }

        return $('trackElements').children().length > 0 ? $.xml() : '';
    }
}