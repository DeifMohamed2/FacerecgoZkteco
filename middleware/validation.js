/**
 * Validate device SN
 */
export function validateDeviceSN(req, res, next) {
    const sn = req.query.SN || req.query.sn || req.body.SN || req.body.sn || req.get('SN');
    
    if (!sn || typeof sn !== 'string' || sn.trim().length === 0) {
        return res.status(400).send('ERR: Device SN required');
    }
    
    req.deviceSN = sn.trim();
    next();
}

/**
 * Validate request body size
 */
export function validateBodySize(maxSize = 1024 * 1024) { // 1MB default
    return (req, res, next) => {
        const contentLength = parseInt(req.get('content-length') || '0');
        
        if (contentLength > maxSize) {
            return res.status(413).json({ error: 'Request body too large' });
        }
        
        next();
    };
}

/**
 * Log request for audit
 */
export function auditLog(action, resource) {
    return async (req, res, next) => {
        // Store original end function
        const originalEnd = res.end;
        
        // Override end function to log after response
        res.end = function(...args) {
            // Log audit entry asynchronously (don't block response)
            setImmediate(async () => {
                try {
                    const AuditLog = (await import('../models/AuditLog.js')).default;
                    await AuditLog.create({
                        action: action,
                        resource: resource,
                        resourceId: req.params?.id || req.params?.sn || null,
                        userId: req.user?.userId || null,
                        ip: req.ip || req.connection.remoteAddress,
                        userAgent: req.get('user-agent') || null,
                        details: {
                            method: req.method,
                            path: req.path,
                            query: req.query,
                            body: req.method === 'POST' || req.method === 'PUT' ? req.body : undefined
                        }
                    });
                } catch (error) {
                    console.error('Audit log error:', error);
                }
            });
            
            // Call original end
            originalEnd.apply(this, args);
        };
        
        next();
    };
}


