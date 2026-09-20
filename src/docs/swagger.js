import swaggerUi from "swagger-ui-express";
export const swaggerSpec = {
    openapi: "3.0.0",
    info: {
        title: "SkillCompass API",
        version: "1.0.0",
        description: "API documentation for the SkillCompass backend",
    },
    servers: [
        {
            url: "http://localhost:3000",
            description: "Local development server",
        },
    ],
    paths: {
        "/api/health": {
            get: {
                summary: "Check API health",
                description: "Checks whether the SkillCompass API and its database connection are available.",
                responses: {
                    "200": {
                        description: "API and database are healthy",
                        content: {
                            "application/json": {
                                example: {
                                    status: "ok",
                                    service: "SkillCompass API",
                                    database: "connected",
                                    timestamp: "2026-09-19T12:00:00.000Z",
                                },
                            },
                        },
                    },
                    "503": {
                        description: "Database is unavailable",
                        content: {
                            "application/json": {
                                example: {
                                    success: false,
                                    message: "Database unavailable",
                                },
                            },
                        },
                    },
                },
            },
        },
    },
};
export { swaggerUi };
