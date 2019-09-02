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

// railML tSignalType
const SignalType = {
    MAIN: 'main',
    DISTANT: 'distant',
    REPEATER: 'repeater',
    COMBINED: 'combined',
    SHUNTING: 'shunting',
    OTHER: (tyyppi) => `other:${tyyppi}`
};

// tSignalFunction: exit|home|blocking|intermediate
const SignalFunction = {
    EXIT: 'exit',
    HOME: 'home',
    BLOCKING: 'blocking',
    INTERMEDIATE: 'intermediate'
};

const SIGNAL_TYPES = {
    "es": SignalType.DISTANT,
    "jo": SignalType.SHUNTING,
    "jp": SignalType.OTHER('jp'), // Junakulkutien päätekohtamerkki
    "me": SignalType.OTHER('me'), // Matkustajalaiturin ennakkomerkki
    "pa": SignalType.MAIN,
    "pav": SignalType.MAIN,
    "pa2": SignalType.MAIN,
    "ps": SignalType.COMBINED,
    "psv": SignalType.COMBINED,
    "ps2": SignalType.COMBINED,
    "ps2v": SignalType.COMBINED,
    "ra": SignalType.SHUNTING,
    "rd": SignalType.MAIN,
    "rp": SignalType.SHUNTING,
    "sm": SignalType.OTHER('sm'), // Seismerkki
    "su": SignalType.MAIN,
    "to": SignalType.REPEATER,
    "vk": SignalType.SHUNTING,
    "ye": SignalType.COMBINED,
    "ys": SignalType.COMBINED,
    "yse": SignalType.COMBINED,
    "ysj": SignalType.COMBINED,
    "ysje": SignalType.COMBINED,
    "ysjv": SignalType.COMBINED,
    "ysv": SignalType.COMBINED,
    "ysve": SignalType.COMBINED,
    "yv": SignalType.COMBINED,
    "y4": SignalType.COMBINED,
};

module.exports = {
    marshall: (trackId, raideAlku, kilometrit, element) => {
        
        const dir = element.opastin.suunta == 'nouseva' ? 'up' : 'down';
        const sijainti = elementUtils.getPosition(trackId, element);
        const type = SIGNAL_TYPES[element.opastin.tyyppi];
        const pos = positionUtils.getPosition(raideAlku, sijainti, kilometrit);
        const absPos = positionUtils.getAbsolutePosition(sijainti);

        // NOTE: signal function not provided in the API, home signals must be fixed manually.
        const func = element.liikennepaikka === null ? SignalFunction.BLOCKING : SignalFunction.EXIT;

        // TODO element.opastin.puoli (vasen/oikea): no corresponding railML term?

        const $ = cheerio.load('<signal/>', config.cheerio);
        $('signal').attr('id', element.tunniste);
        $('signal').attr('type', type);
        $('signal').attr('name', element.nimi);
        $('signal').attr('pos', pos);
        $('signal').attr('absPos', absPos);
        $('signal').attr('dir', dir);
        $('signal').attr('virtual', 'false');
        $('signal').attr('function', func);
        $('signal').attr('ocpStationRef', element.liikennepaikka);

        return $.xml();        
    }
};
