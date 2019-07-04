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
