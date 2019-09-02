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
const balise = require('./balise');
const signal = require('./signal');
const milepost = require('./milepost');
const trainDetector = require('./train-detector');
const trackCircuitBorder = require('./track-circuit-border');
const stopPost = require('./stop-post');
const railUtils = require('../utils/rail-utils');

// Notice: the order of child elements is significant.
// https://wiki.railml.org/index.php?title=IS:ocsElements

module.exports = {
    marshall: (raide, ratanumero, alku, loppu, elementit, kilometrit) => {

        const $ = cheerio.load('<ocsElements/>', config.cheerio);

        const raideId = raide.tunniste;
        const onRailMileposts = _.filter(kilometrit, (k) => railUtils.isMilepostOnRail(ratanumero, alku, loppu, k));

        const signals = _.map(elementit.opastin, (o) => signal.marshall(ratanumero, alku, kilometrit, o));
        const mileposts = _.map(onRailMileposts, (p) => milepost.marshall(ratanumero, raideId, alku, kilometrit, p));
        const signalsAndPosts = _.flatten(_.concat(signals, mileposts));
        if (!_.isEmpty(signalsAndPosts)) {
            $('ocsElements').append(`<signals>${_.join(signalsAndPosts, '')}</signals>`);
        }

        const trainDetectors = _.map(elementit.akselinlaskija, (al) => trainDetector.marshall(ratanumero, alku, kilometrit, al));
        const trackCircuitBorders = _.map(elementit.raideeristys, (re) => trackCircuitBorder.marshall(ratanumero, alku, kilometrit, re));
        if (!_.isEmpty(trainDetectors) || !_.isEmpty(trackCircuitBorders)) {
            $('ocsElements').append('<trainDetectionElements/>');
            $('ocsElements > trainDetectionElements').append(trainDetectors);
            $('ocsElements > trainDetectionElements').append(trackCircuitBorders);    
        }

        const balises = _.map(elementit.baliisi, (b) => balise.marshall(ratanumero, alku, kilometrit, b));
        if (!_.isEmpty(balises)) {
            $('ocsElements').append(`<balises>${_.join(balises, '')}</balises>`);
        }

        const stops = stopPost.marshall(raideId, alku, kilometrit, raide.liikennepaikanRaide);
        if (!_.isEmpty(stops)) { 
            $('ocsElements').append(`<stopPosts>${_.join(stops, '')}</stopPosts>`);
        }

        return $('ocsElements').children().length > 0 ? $.xml() : '';
    }
}