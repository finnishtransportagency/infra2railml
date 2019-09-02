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
const gradientUtils = require('../utils/gradient-utils');
const positionUtils = require('../utils/position-utils');


// https://wiki.railml.org/index.php?title=IS:gradientChange

module.exports = {
    marshall: (raideId, raideAlku, korkeuspisteet, kaltevuudet, kilometrit) => {
        
        const begin = [
            getGradientChange(raideId, raideAlku, 'laskeva', raideAlku, kaltevuudet, kilometrit),
            getGradientChange(raideId, raideAlku, 'nouseva', raideAlku, kaltevuudet, kilometrit)
        ];
        
        const changes = _.flatMap(korkeuspisteet, (k) => [
            getGradientChange(raideId, raideAlku, 'laskeva', k.sijainti, kaltevuudet, kilometrit),
            getGradientChange(raideId, raideAlku, 'nouseva', k.sijainti, kaltevuudet, kilometrit)
        ]);
        
        return _.reject(_.concat(begin, changes), _.isEmpty);
    }
};

/**
 * Marshall gradientChange for the given position. Position may be
 * arbitrary, e.g. track begin, or exact corresponding to korkeuspiste.
 */
function getGradientChange(raideId, raideAlku, suunta, sijainti, kaltevuudet, kilometrit) {

    const pos = positionUtils.getPosition(raideAlku, sijainti, kilometrit);
    const absPos = positionUtils.getAbsolutePosition(sijainti);
    const slope = gradientUtils.getSlope(sijainti, suunta, kaltevuudet);
    const dir = suunta === 'nouseva' ? 'up' : 'down';

    const $ = cheerio.load('<gradientChange/>', config.cheerio);
    $('gradientChange').attr('id', `gc_${raideId}_${pos}_${dir}`);
    $('gradientChange').attr('pos', pos);
    $('gradientChange').attr('absPos', absPos);
    $('gradientChange').attr('dir', dir);
    $('gradientChange').attr('slope', slope.kaltevuus);

    return $.xml();
}
