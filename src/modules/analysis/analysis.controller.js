import { startRepositoryAnalysis } from "./analysis.service.js";
export const analyzeRepository = async (req, res, next) => {
    try {
        const { repositoryId } = res.locals.validated.params;
        const result = await startRepositoryAnalysis(req.user.id, repositoryId);
        res.status(202).json({
            success: true,
            message: "Repository analysis queued",
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
};
