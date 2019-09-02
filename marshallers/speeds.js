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
const { Direction, DIRECTIONS, getSpeedProfileId } = require('./speed-change');

/**
 * Marshalls the given speed limits object to railML speed elements, wrapped
 * in infraAttributes parent element. Should there be any additional attributes,
 * the nesting should likely be lifted in track element marshaller.
 */
module.exports = {
    marshall: (railId, nopeudet) => {
        
        if (nopeudet.suunnattu) {
            const dir = DIRECTIONS[nopeudet.suunnattu] || Direction.UP;
            return [
                getSpeedAttrs(railId, nopeudet, dir)
            ];
        }
        
        return [
            getSpeedAttrs(railId, nopeudet, Direction.UP),
            getSpeedAttrs(railId, nopeudet, Direction.DOWN)
        ];
    }
};

function getSpeedAttrs(railId, nopeudet, dir) {

    const { alku, loppu } = nopeudet.ratakmvali;
    const sijainti = dir === Direction.UP ? alku : loppu;
    const profileId = getSpeedProfileId(railId, sijainti, dir);

    const speeds = _.uniq(_.map(nopeudet.nopeusrajoitukset, (speed, category) => {
        return `<speed trainCategory="${category}" vMax="${speed.nopeus}" />`;
    }));

    const $ = cheerio.load(`<infraAttributes><speeds/></infraAttributes>`, config.cheerio);
    $('infraAttributes').attr('id', profileId);
    $('infraAttributes > speeds').append(speeds);
    
    return $.xml();
}