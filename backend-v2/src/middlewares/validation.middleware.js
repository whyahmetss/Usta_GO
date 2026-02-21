export const validateBody = (schema) => {
  return async (req, res, next) => {
    try {
      const validated = await schema.parseAsync(req.body);
      req.body = validated;
      next();
    } catch (error) {
      res.status(400).json({
        error: "Validation error",
        details: error.errors,
      });
    }
  };
};

export const validateParams = (schema) => {
  return async (req, res, next) => {
    try {
      const validated = await schema.parseAsync(req.params);
      req.params = validated;
      next();
    } catch (error) {
      res.status(400).json({
        error: "Validation error",
        details: error.errors,
      });
    }
  };
};

export const validateQuery = (schema) => {
  return async (req, res, next) => {
    try {
      const validated = await schema.parseAsync(req.query);
      req.query = validated;
      next();
    } catch (error) {
      res.status(400).json({
        error: "Validation error",
        details: error.errors,
      });
    }
  };
};
