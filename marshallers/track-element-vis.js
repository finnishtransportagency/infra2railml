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
const visualizationUtils = require('../utils/visualization-utils');

// 30 000 pixels for every 0.2 of bounding box width
const CANVAS_SIZE_RATIO = 30000 / 0.2;

module.exports = {
    marshall: (trackVisualData, boundingBox) => {

        let canvasWidth = CANVAS_SIZE_RATIO * boundingBox.width;
        let canvasHeight = canvasWidth * (boundingBox.height / boundingBox.width);

        const refId = trackVisualData.id;
        const $ = cheerio.load(`<trackVis ref="${refId}">`, config.cheerio);

        // Track start
        const trackCanvasStartPosition = visualizationUtils.getCanvasPositionForCoordinates(
            trackVisualData.coordinates.start,
            boundingBox,
            canvasWidth,
            canvasHeight
        );

        $('trackVis').append(`<trackElementVis ref="tb_${refId}">
                            <position x="${trackCanvasStartPosition.x}" y="${trackCanvasStartPosition.y}"/>
                            </trackElementVis>`);

        // Track elements
        _.forEach(trackVisualData.elements, (elementVisualData)  => {
            const trackElementCanvasPosition = visualizationUtils.getCanvasPositionForCoordinates(
                elementVisualData.coordinates,
                boundingBox,
                canvasWidth,
                canvasHeight
            );
            $('trackVis').append(`<trackElementVis ref="${elementVisualData.id}">
                                <position x="${trackElementCanvasPosition.x}" y="${trackElementCanvasPosition.y}"/>
                                </trackElementVis>`);
        });

        // Track end
        const trackCanvasEndPosition = visualizationUtils.getCanvasPositionForCoordinates(
            trackVisualData.coordinates.end,
            boundingBox,
            canvasWidth,
            canvasHeight
        );
        $('trackVis').append(`<trackElementVis ref="te_${refId}">
                            <position x="${trackCanvasEndPosition.x}" y="${trackCanvasEndPosition.y}"/>
                            </trackElementVis>`);

        return $.xml();
    }
};
