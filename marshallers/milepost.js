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
const positionUtils = require('../utils/position-utils');

// Milepost is a special kind of signal
module.exports = {
    marshall: (trackId, railId, alku, kilometrit, kilometri) => {

        const id = `${railId}_${trackId}km${kilometri.ratakm}`;
        
        const { ratanumero, ratakm } = kilometri;
        const sijainti = { ratanumero, ratakm, etaisyys: 0 };
        const name = `Rata ${trackId} km ${kilometri.ratakm}`;
        const pos = positionUtils.getPosition(alku, sijainti, kilometrit);
        const absPos = positionUtils.getAbsolutePosition(sijainti);

        // TODO in practice, can there be more than one?
        const ocpRef = _.first(kilometri.liikennepaikat);

        const $ = cheerio.load('<signal/>', config.cheerio);
        $('signal').attr('id', id);
        $('signal').attr('type', 'other:kmpaalu');
        $('signal').attr('name', name);
        $('signal').attr('pos', pos);
        $('signal').attr('absPos', absPos);
        $('signal').attr('dir', 'up');
        $('signal').attr('virtual', 'true');
        $('switch').attr('ocpStationRef', ocpRef);
        $('signal').append(`<milepost shownValue="${kilometri.ratakm}" switchable="false" />`)

        // TODO should have reference to mileageChange?

        return $.xml();        
    }
};
