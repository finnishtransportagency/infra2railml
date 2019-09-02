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
