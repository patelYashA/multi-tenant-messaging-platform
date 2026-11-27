function tenantMiddleware(req, res, next) {
    const tenantId = req.header("x-tenant-id");
  
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: "x-tenant-id header is required"
      });
    }
  
    req.tenantId = tenantId;
    next();
  }
  
  module.exports = tenantMiddleware;