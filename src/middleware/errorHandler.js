function errorHandler(err, req, res, next) {
    req.log?.error({ err }, "Request failed");
  
    if (err.name === "ZodError") {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: err.errors
      });
    }
  
    if (err.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "Duplicate resource"
      });
    }
  
    if (err.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Resource not found"
      });
    }
  
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.statusCode ? err.message : "Internal server error"
    });
  }
  
  module.exports = errorHandler;