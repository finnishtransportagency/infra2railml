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

const Direction = {
    UP: 'up',
    DOWN: 'down'
};

const DIRECTIONS = {
    'nouseva': Direction.UP,
    'laskeva': Direction.DOWN
};

/**
 * Marshalls the given speed limits object to railML speedChange element(s).
 * 
 * If the speed limits are given for certain direction (up/down), returns a
 * single corresponding element.
 * 
 * If the speed limits are not directed, assumes equal limits for both directions,
 * thus returning two elements for the range specified by the speed limit object.
 */
function marshall(railId, raideAlku, kilometrit, nopeudet) {

    if (nopeudet.suunnattu) {
        const dir = DIRECTIONS[nopeudet.suunnattu] || Direction.UP;
        return [
            getSpeedChange(railId, raideAlku, kilometrit, nopeudet, dir)
        ];
    }
    
    // if direction is unspecified, assume the same in both directions
    return [
        getSpeedChange(railId, raideAlku, kilometrit, nopeudet, Direction.UP),
        getSpeedChange(railId, raideAlku, kilometrit, nopeudet, Direction.DOWN)
    ];
}

/**
 * Renders a speedChange element.
 */
function getSpeedChange(railId, raideAlku, kilometrit, nopeudet, dir) {

    const { alku, loppu } = nopeudet.ratakmvali;
    const sijainti = dir === Direction.UP ? alku : loppu;

    const id = getSpeedChangeId(railId, sijainti, dir);
    const profileRef = getSpeedProfileId(railId, sijainti, dir);
    const max = _.max(_.map(nopeudet.nopeusrajoitukset, 'nopeus'));

    const pos = positionUtils.getPosition(raideAlku, sijainti, kilometrit);
    const absPos = positionUtils.getAbsolutePosition(sijainti);

    const $ = cheerio.load('<speedChange/>', config.cheerio);
    $('speedChange').attr('id', id);
    $('speedChange').attr('pos', pos);
    $('speedChange').attr('absPos', absPos);
    $('speedChange').attr('dir', dir);
    $('speedChange').attr('profileRef', profileRef);
    $('speedChange').attr('vMax', max);

    return $.xml();
}

/**
 * Returns a speed profile id for given rail, position and direction.
 */
function getSpeedProfileId(railId, sijainti, dir) {
    return `sppr_${formatId(railId, sijainti, dir)}`;
}

/**
 * Returns a speed change ID for given rail, position and direction.
 */
function getSpeedChangeId(railId, sijainti, dir) {
    return `sc_${formatId(railId, sijainti, dir)}`;
}

/**
 * Formats the common part of speed change/profile id.
 */
function formatId(railId, sijainti, dir) {
    return `${railId}_${sijainti.ratakm}_${sijainti.etaisyys}_${dir}`;
}


module.exports = {
    Direction, DIRECTIONS, getSpeedChangeId, getSpeedProfileId, marshall
};