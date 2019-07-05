module.exports = {
    infraApi: {
        baseUrl: 'https://rata.digitraffic.fi/infra-api/0.3'
    },
    cheerio: {
        xmlMode: true,
        normalizeWhitespace: true
    },
    railml: {
        visualize: true,
        debugVisualization: true
    },
    http: {
        // The API is sometimes very slow..
        timeout: 60000,
        throttle: {
            // cache threshold for new fetch
            threshold: 15 * 60 * 1000
        },
        // number of concurrent requests
        concurrency: 10
    }
};
