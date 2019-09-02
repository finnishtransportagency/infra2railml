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

// https://wiki.railml.org/index.php?title=IS:trackBegin

module.exports = {
    marshall: (raideId, alku, elementit) => {
        
        const absPos = positionUtils.getAbsolutePosition(alku);

        const $ = cheerio.load('<trackBegin/>', config.cheerio);
        $('trackBegin').attr('id', `tb_${raideId}`);
        $('trackBegin').attr('pos', '0.0000');
        $('trackBegin').attr('absPos', absPos);

        // find the beginning element of rail, typically a switch or buffer stop
        const alkuElementti = elementUtils.getConnectingElement(alku, elementit);
        const ref = elementUtils.getReference(raideId, 'begin', alkuElementti);

        if (alkuElementti && ref && alkuElementti.tyyppi === 'vaihde') {
            $('trackBegin').append(`<connection id="tbc_${raideId}" ref="${ref}" />`);
        } else if (alkuElementti && alkuElementti.tyyppi === 'puskin') {
            $('trackBegin').append(`<bufferStop id="${alkuElementti.tunniste}" />`);
        } else {
            $('trackBegin').append(`<openEnd id="tboe_${raideId}" name="${raideId}" />`);
        }

        return $.xml();
    }
}