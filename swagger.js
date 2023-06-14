import swaggerJsdoc from 'swagger-jsdoc';

const options = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'API Game 3D',
            description: 'API Game 3D giả lập bệnh viện',
        },
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [{
            BearerAuth: [],
        }],
    },
    apis: ['src/api/route/*.js'], // Đường dẫn tới các tệp định nghĩa API
};

const specs = swaggerJsdoc(options);

export default specs;