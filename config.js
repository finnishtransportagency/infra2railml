module.exports = {
    infraApi: {
        baseUrl: 'https://rata-beta.digitraffic.fi/infra-api/0.3'
    },
    cheerio: {
        xmlMode: true,
        normalizeWhitespace: true
    },
    railml: {
        visualize: false
    },
    http: {
        throttle: {
            threshold: 15 * 60 * 1000
        },
        concurrency: 10
    }
};
