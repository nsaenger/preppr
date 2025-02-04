const swaggerJsdoc = require('swagger-jsdoc')
const swaggerUi = require('swagger-ui-express')

const options = {
    swaggerDefinition: {
        restapi: '3.0.3',
        components: {},
        schemas: [],
        tags: [],
        info: {
            title: 'millConnect',
            version: '1.0.0',
            description: 'RESTlite API for millControl. Enables users and automated clients to securely access millControl and its data. Secured via JWT & OAuth2.',
        },
        servers: [
            {
                url: 'http://localhost:3000',
            },
        ],
    },
    apis: ['./src/**/*.yaml', './src/**/*.ts'],
    explorer: true,
}

const specs = swaggerJsdoc(options)

module.exports = (app) => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs))
}