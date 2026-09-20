export const validate = (schema) => {
    return (req, res, next) => {
        const result = schema.safeParse({
            body: req.body ?? {},
            params: req.params ?? {},
            query: req.query ?? {},
        });
        if (!result.success) {
            return next(result.error);
        }
        res.locals.validated = result.data;
        next();
    };
};
