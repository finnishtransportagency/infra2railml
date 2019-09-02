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
const elementUtils = require('../utils/element-utils');
const positionUtils = require('../utils/position-utils');

// https://wiki.railml.org/index.php?title=IS:trackEnd

module.exports = {
    marshall: (raideId, alku, loppu, kilometrit, elementit) => {
        
        const pos = positionUtils.getPosition(alku, loppu, kilometrit);
        const absPos = positionUtils.getAbsolutePosition(loppu);

        const $ = cheerio.load('<trackEnd/>', config.cheerio);
        $('trackEnd').attr('id', `te_${raideId}`);
        $('trackEnd').attr('pos', pos);
        $('trackEnd').attr('absPos', absPos);

        // find the end element of rail, typically a switch or buffer stop
        const loppuElementti = elementUtils.getConnectingElement(loppu, elementit);
        const ref = elementUtils.getReference(raideId, 'end', loppuElementti);
    
        if (loppuElementti && ref && loppuElementti.tyyppi === 'vaihde') {
            $('trackEnd').append(`<connection id="tec_${raideId}" ref="${ref}" />`);
        } else if (loppuElementti && loppuElementti.tyyppi === 'puskin') {
            $('trackEnd').append(`<bufferStop id="${loppuElementti.tunniste}" />`);
        } else {
            $('trackEnd').append(`<openEnd id="teoe_${raideId}" name="${raideId}" />`);
        }

        return $.xml();
    }
}