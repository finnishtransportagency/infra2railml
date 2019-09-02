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
const elementUtils = require('../utils/element-utils');
const positionUtils = require('../utils/position-utils');

const Direction = {
    UP: 'up',
    DOWN: 'down'
};

const DIRECTIONS = {
    'nouseva': Direction.UP,
    'laskeva': Direction.DOWN
};

module.exports = {
    marshall: (trackId, raideAlku, kilometrit, erotusjakso) => {

        const sijainti = elementUtils.getPosition(trackId, erotusjakso);

        const id = `${erotusjakso.tunniste}`;
        const name = `Erotusjakso ${sijainti.ratanumero} ${sijainti.ratakm}+${sijainti.etaisyys}`;
        const dir = DIRECTIONS[erotusjakso.suunnattu] || Direction.UP;
        const max = _.max(_.map(erotusjakso.nopeusrajoitukset, 'nopeus'));
        const pos = positionUtils.getPosition(raideAlku, sijainti, kilometrit);
        const absPos = positionUtils.getAbsolutePosition(sijainti);

        const $ = cheerio.load('<electrificationChange/>', config.cheerio);
        $('electrificationChange').attr('id', id);
        $('electrificationChange').attr('name', name);
        $('electrificationChange').attr('pos', pos);
        $('electrificationChange').attr('absPos', absPos);
        $('electrificationChange').attr('dir', dir);
        $('electrificationChange').attr('vMax', max);

        return $.xml();
    }
};
