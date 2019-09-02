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
const trackElemVis = require('./track-element-vis');

module.exports = {
    marshall: (baseType, model, boundingBox) => {

        const { index } = model;

        const infraId = `infra_${index.trackId}_${index.from}_${index.to}`;
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