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
const cheerio = require('cheerio');
const config = require('../config');
const positionUtils = require('../utils/position-utils');

module.exports = {
    marshall: (railId, raideAlku, raideLoppu, kilometrit, km) => {

        if (km.pituus === 1000) return undefined;

        const alkuAbsPos = positionUtils.getAbsolutePosition(raideAlku);
        const loppuAbsPos = positionUtils.getAbsolutePosition(raideLoppu);
        const absPos = 1000 + km.ratakm * 1000;

        if (absPos < alkuAbsPos || absPos > loppuAbsPos) {
            return undefined;
        }

        const sijainti = { ratakm: km.ratakm, etaisyys: km.pituus };
        const pos = positionUtils.getPosition(raideAlku, sijainti, kilometrit);
        const absPosIn = alkuAbsPos + pos;

        const type = km.pituus > 1000 ? 'overlapping' : 'missing';
        const id = `mc_${railId}_${pos}`;

        const $ = cheerio.load('<mileageChange/>', config.cheerio);
        $('mileageChange').attr('id', id);
        $('mileageChange').attr('pos', pos);
        $('mileageChange').attr('absPosIn', absPosIn);
        $('mileageChange').attr('absPos', absPos);
        $('mileageChange').attr('absDir', 'raising');
        $('mileageChange').attr('type', type);

        return $.xml();        
    }
};