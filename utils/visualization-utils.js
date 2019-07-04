const _ = require('lodash');
const canvasUtils = require('../utils/canvas-utils');
const elementUtils = require('../utils/element-utils');

/**
 * Calculates the shape of a axis-aligned bounding box
 * for given track visual elements list.
 */
function getBoundingBox(visualElements) {

    let maxX = 90; // The maximum value for latitude
    let maxY = 180; // The maximum value for latitude

    let minX = -90; // The minimum value for latitude
    let minY = -180; // The minimum value for latitude

    let smallestX = maxX;
    let smallestY = maxY;

    let biggestX = minX;
    let biggestY = minY;

    // Gather all coordinates
    let coordinates = [];
    _.forEach(visualElements, (track) => {
        coordinates.push(track.coordinates.start);
        coordinates.push(track.coordinates.end);
        const elementsList = track.elements;

        _.forEach(elementsList, function (element) {
            coordinates.push(element.coordinates);
        });
    });

    // Determine bounding box
    _.forEach(coordinates, (coordinate) => {
        let x = coordinate.x;
        let y = coordinate.y;
        if(x < smallestX) smallestX = x;
        if(y < smallestY) smallestY = y;
        if(x > biggestX) biggestX = x;
        if(y > biggestY) biggestY = y;
    });

    const boundingBox = {
        "min" : {
            "x" : smallestX,
            "y" : smallestY
        },
        "max" : {
            "x" : biggestX,
            "y" : biggestY
        },
        "height" : (biggestY - smallestY),
        "width" : (biggestX - smallestX)
    };

    return boundingBox;
}

/**
 *  Returns the coordinates of a track.
 */
function getTrackCoordinates(track) {

    let coordinates = {
        "start" : null,
        "end" : null
    };

    // Tracks have an array with one array of coordinates
    if(track.geometria.length > 0 && Array.isArray(track.geometria[0])) {
        coordinates.start = {
            "x" : track.geometria[0][0][0],
            "y" : track.geometria[0][0][1]
        };
        const lastElementIndex = track.geometria[0].length - 1;
        coordinates.end = {
            "x" : track.geometria[0][lastElementIndex][0],
            "y" : track.geometria[0][lastElementIndex][1]
        }
    } else {
        console.error("Error: can't determine coordinates for a track.");
    }

    return coordinates;
}

/**
 *  Returns the coordinates of an element.
 */
function getElementCoordinates(element) {

    let coordinates = null;

    // Elements only have one coordinate
    if(element.geometria.length === 2 && !Array.isArray(element.geometria[0])) {
        coordinates = {
            "x" : element.geometria[0],
            "y" : element.geometria[1]
        }
    } else {
        console.error("Error: can't determine coordinates for an element.");
    }

    return coordinates;
}

/**
 * Returns canvas position for given coordinates defined by a
 * geometry bounding box and canvas dimensions.
 */
function getCanvasPositionForCoordinates(coordinates, geometryBoundingBox, canvasWidth, canvasHeight) {

    const margins = {
        "x" : canvasWidth * 0.1,
        "y" : canvasHeight * 0.1
    };

    // Don't distort coordinates, expand bounding box into a square
    let drawAreaEdgeLength = Math.max(geometryBoundingBox.width, geometryBoundingBox.height);

    // Convert X and Y coordinates to values between 0 - 1
    const normalizedX = (coordinates.x - geometryBoundingBox.min.x) / drawAreaEdgeLength;
    const normalizedY = (coordinates.y - geometryBoundingBox.min.y) / drawAreaEdgeLength;

    // Return position on canvas
    return {
        "x" : margins.x + (normalizedX * (canvasWidth - (margins.x * 2))),
        "y" : margins.y + (normalizedY * (canvasHeight - (margins.y * 2)))
    }

}

/**
 * Create a HTML write with a canvas visualization of tracks visual
 * elements.
 */
function createHTMLCanvasVisualization(fileNamePrefix, canvas, trackVisualElements, boundingBox) {

    canvasUtils.clearBackground(canvas);

    _.forEach(trackVisualElements, (trackVisualData) => {

        // Track start
        const trackCanvasStartPosition = getCanvasPositionForCoordinates(
            trackVisualData.coordinates.start,
            boundingBox,
            canvas.width,
            canvas.height
        );

        // Track end
        const trackCanvasEndPosition = getCanvasPositionForCoordinates(
            trackVisualData.coordinates.end,
            boundingBox,
            canvas.width,
            canvas.height
        );

        // If track has no elements, draw line from start to end.
        if(trackVisualData.elements.length === 0) {
            canvasUtils.drawLine(canvas, trackCanvasStartPosition, trackCanvasEndPosition, "#ff0008");
            return;
        }

        // Else, start by drawing a line from track start to first element
        const canvasFirstElementPosition = getCanvasPositionForCoordinates(
            trackVisualData.elements[0].coordinates,boundingBox, canvas.width, canvas.height);

        canvasUtils.drawLine(canvas, trackCanvasStartPosition, canvasFirstElementPosition, "#ffe009");

        // Draw connections between elements if there are more than one
        if(trackVisualData.elements.length > 1) {
            for(let i = 0; i <= trackVisualData.elements.length - 2; i++) {

                const coordinatesStart = {
                    "x": trackVisualData.elements[i].coordinates.x,
                    "y": trackVisualData.elements[i].coordinates.y
                };

                const coordinatesEnd = {
                    "x": trackVisualData.elements[i + 1].coordinates.x,
                    "y": trackVisualData.elements[i + 1].coordinates.y
                };

                const canvasPositionStart = getCanvasPositionForCoordinates(coordinatesStart,boundingBox, canvas.width, canvas.height);
                const canvasPositionEnd = getCanvasPositionForCoordinates(coordinatesEnd,boundingBox, canvas.width, canvas.height);

                canvasUtils.writeLabel(canvas, canvasPositionStart, trackVisualData.elements[i].type, "#3062b9");
                canvasUtils.drawLine(canvas, canvasPositionStart, canvasPositionEnd, "#4781ff");
                canvasUtils.drawABox(canvas, canvasPositionStart, "#00ffe3");
            }
        }

        // Draw a line from the last (or only) track element to the end of track
        const lastElementPos = {
            "x" : trackVisualData.elements[trackVisualData.elements.length-1].coordinates.x,
            "y" : trackVisualData.elements[trackVisualData.elements.length-1].coordinates.y
        };
        const lastElementCanvasPos = getCanvasPositionForCoordinates(lastElementPos,boundingBox, canvas.width, canvas.height);

        canvasUtils.drawLine(canvas, lastElementCanvasPos, trackCanvasEndPosition, "#00ff3c");
    });

    canvasUtils.createDebugImage(canvas, fileNamePrefix);
}

/**
 * Assemble tracks visualization information
 */
function getTracksVisualizationData(ratanumero, raide, trackElements) {

    const raideCoordinates = getTrackCoordinates(raide);

    // Sort elements according to their position on track
    trackElements = _.sortBy(
        trackElements,
        (element) => {
            const position = elementUtils.getPosition(ratanumero, element);
            return position.ratakm + (position.etaisyys / 1100); // The etaisyys can sometimes go over 1000m
        });

    let elementsVisualData = [];
    // Only add necessary information
    for(let i = 0; i <= trackElements.length - 1; i++) {
        const element = trackElements[i];
        const elementId = element.tunniste;
        const elementRefId = elementId;

        const elementCoordinates = getElementCoordinates(element);
        elementsVisualData.push({
            "id" : elementRefId,
            "coordinates" : elementCoordinates,
            "type" : element.tyyppi
        });
    }

    return  {
        "id" : raide.tunniste,
        "coordinates" : raideCoordinates,
        "elements" : elementsVisualData
    }

}

module.exports = {
    getBoundingBox, getCanvasPositionForCoordinates, createHTMLCanvasVisualization, getTracksVisualizationData
};
