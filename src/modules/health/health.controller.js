import { getHealthStatus } from "./health.service.js";
export const healthCheck = async (req, res) => {
    const health = await getHealthStatus();
    res.status(200).json({
        success: true,
        data: health,
    });
};
