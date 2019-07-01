const _ = require('lodash');

/**
 * Calculates the shape of a axis-aligned bounding box
 * for given track visual elements list.
 */
function getAABB(visualElements) {

    let minX = 90; // Max value for latitude
    let minY = 180; // Max value for longitude

    let maxX = -90; // Min value for latitude
    let maxY = -180; // Min value for longitude

    // Gather all coordinates
    let coordinates = [];
    _.forEach(visualElements, function(track) {
        coordinates.push(track.coordinates.start);
        coordinates.push(track.coordinates.end);
        const elementsList = track.elements;

        _.forEach(elementsList, function (element) {
            coordinates.push(element.coordinates);
        });
    });

    // Determine bounding box
    _.forEach(coordinates, function(coordinate) {
        let x = coordinate.x;
        let y = coordinate.y;
        if(x < minX) minX = x;
        if(y < minY) minY = y;
        if(x > maxX) maxX = x;
        if(y > maxY) maxY = y;
    });

    const boundingBox = {
        "min" : {
            "x" : minX,
            "y" : minY
        },
        "max" : {
            "x" : maxX,
            "y" : maxY
        },
        "height" : (maxY - minY),
        "width" : (maxX - minX)
    };

    return boundingBox;
}

/**
 *  Returns the coordinates of an element.
 */
function getElementCoordinates(element) {

    let coordinates = {
        "start" : null,
        "end" : null
    };

    // Elements only have one coordinate
    if(element.geometria.length === 2 && !Array.isArray(element.geometria[0])) {
        coordinates.start = {
            "x" : element.geometria[0],
            "y" : element.geometria[1]
        }
    }
    // Tracks have an array with one array of coordinates
    else if(element.geometria.length > 0 && Array.isArray(element.geometria[0])) {
        coordinates.start = {
            "x" : element.geometria[0][0][0],
            "y" : element.geometria[0][0][1]
        };
        const lastElementIndex = element.geometria.length - 1;
        coordinates.end = {
            "x" : element.geometria[0][lastElementIndex][0],
            "y" : element.geometria[0][lastElementIndex][1]
        }
    }

    return coordinates;
}

/**
 * Returns canvas position for given coordinates defined by a
 * geometry bounding box and canvas dimensions.
 */
function getCanvasPositionForCoordinates(coordinates, geometryBoundingBox, canvasWidth, canvasHeight) {

    // Don't distort coordinates, expand bounding box into a square
    let drawAreaEdgeSize = Math.max(geometryBoundingBox.width, geometryBoundingBox.height);

    // Convert X and Y coordinates to values between 0 - 1
    const normalizedX = (coordinates.x - geometryBoundingBox.min.x) / drawAreaEdgeSize;
    const normalizedY = (coordinates.y - geometryBoundingBox.min.y) / drawAreaEdgeSize;

    // Return position on canvas
    return {
        "x" : normalizedX * canvasWidth,
        "y" : normalizedY * canvasHeight
    }

}

module.exports = {
    getAABB, getElementCoordinates, getCanvasPositionForCoordinates
};
