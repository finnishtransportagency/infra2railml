const _ = require('lodash');
const cheerio = require('cheerio');
const config = require('../config');
const trackElemVis = require('./track-element-vis');

module.exports = {
    marshall: (baseType, model, boundingBox) => {

        const { index } = model;

        const infraId = `infra_${index.trackId}_${index.from}-${index.to}`;
        const lineId = `line_${index.trackId}_${index.from}_${index.to}`;

        const $ = cheerio.load('<infrastructureVisualizations/>', config.cheerio);

        let trackVis = "";
        _.forEach(model.visualElements, (trackVisualData) => {
            trackVis += trackElemVis.marshall(trackVisualData, boundingBox);
        });

        $('infrastructureVisualizations').append(`<visualization id="${lineId}_vis" version="2.2" infrastructureRef="${infraId}"/>`);
        $('infrastructureVisualizations > visualization').append(`<lineVis ref="${lineId}"/>`);
        $('infrastructureVisualizations > visualization > lineVis').append(trackVis);

        return $.xml();
    }
}