const cheerio = require('cheerio');
const config = require('../config');
const elementUtils = require('../utils/element-utils');
const positionUtils = require('../utils/position-utils');

// https://wiki.railml.org/index.php?title=IS:trainDetector

const DetectionObject = {
    AXLE: 'axle',
    WHEEL: 'wheel',
    TRAIN: 'train',
    END_OF_TRAIN: 'endOfTrain',
    OBSTACLE: 'obstacle',
    OTHER: (val) => `other:${val}`
};

module.exports = {
    DetectionObject,
    marshall: (trackId, raideAlku, kilometrit, element) => {
        
        const sijainti = elementUtils.getPosition(trackId, element);
        const pos = positionUtils.getPosition(raideAlku, sijainti, kilometrit);
        const absPos = positionUtils.getAbsolutePosition(sijainti);

        const $ = cheerio.load('<trainDetector/>', config.cheerio);
        $('trainDetector').attr('id', element.tunniste);
        $('trainDetector').attr('name', element.nimi);
        $('trainDetector').attr('pos', pos);
        $('trainDetector').attr('absPos', absPos);
        $('trainDetector').attr('detectionObject', DetectionObject.AXLE);
        $('trainDetector').attr('axleCounting', true);
        $('trainDetector').attr('ocpStationRef', element.liikennepaikka);

        // TODO direction, medium, posInTrack not available in API?

        return $.xml();        
    }
};
