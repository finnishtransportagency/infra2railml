const _ = require('lodash');
const cheerio = require('cheerio');
const config = require('../config');
const elementUtils = require('../utils/element-utils');
const positionUtils = require('../utils/position-utils');

const CrossingType = {
    SIMPLE: 'simpleCrossing',
    SIMPLE_SWITCH: 'simpleSwitchCrossing',
    DOUBLE_SWITCH: 'doubleSwitchCrossing'
};

const CROSSING_TYPES = {
    rr: CrossingType.SIMPLE,
    srr: CrossingType.SIMPLE_SWITCH
};

module.exports = {
    marshall: (trackId, raideAlku, kilometrit, element) => {

        console.log("\n\n CROSSING!", element.tunniste, '\n\n')

        const type = CROSSING_TYPES[element.vaihde.tyyppi];
        const sijainti = elementUtils.getPosition(trackId, element);
        const pos = positionUtils.getPosition(raideAlku, sijainti, kilometrit);
        const absPos = positionUtils.getAbsolutePosition(sijainti);
        const connections = getConnections(element);

        const $ = cheerio.load('<crossing/>', config.cheerio);
        $('crossing').attr('id', element.tunniste);
        $('crossing').attr('name', element.nimi);
        $('crossing').attr('type', type);
        $('crossing').attr('pos', pos);
        $('crossing').attr('absPos', absPos);
        $('crossing').append(connections);

        return $.xml();
    }
};

/**
 * Resolves and renders the crossing connection elements.
 */
function getConnections(element) {

    const { vaihde } = element;

    const nousevat = _.filter(vaihde.raideyhteydet, (y) => y.mistaSuunta === 'nouseva' && y.minneSuunta === 'nouseva');
    if (nousevat.length === 0) {
        console.error(`ERROR: crossing ${element.tunniste} has no connections!`);
        return [];
    }

    const bc = findConnection(nousevat, 'b', 'c');
    const cb = findConnection(nousevat, 'c', 'b');
    const yhteys = bc || cb;

    if (_.isEmpty(yhteys)) {
        console.error(`ERROR: unable to resolve connections of crossing ${element.tunniste}`);
        return [];
    }

    const refIn = yhteys.mistaRooli === 'c' ? yhteys.mista : yhteys.minne;
    const refOut = yhteys.minneRooli === 'c' ? yhteys.minne : yhteys.mista;

    // Max 3 connections. B-C line considered secondary and thus referenced by the crossing. Primary line
    // is continuous and reference are between tracks, i.e. similar to straight direction of switch.
    return [
        `<connection id="crci_${element.tunniste}" ref="tec_${refIn}" orientation="incoming" />`,
        `<connection id="crco_${element.tunniste}" ref="tbc_${refOut}" orientation="outgoing" />`
    ];
}

function findConnection(yhteydet, mista, minne) {
    return  _.find(yhteydet, (y) => y.mistaRooli === mista && y.minneRooli === minne);
 }
 