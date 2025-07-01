/**
 * Raw Body Middleware
 * 
 * Preserves the raw request body for webhook signature verification
 * This is required for Stripe webhook signature verification
 */

module.exports = (req, res, next) => {
  // Skip if not a webhook request or if body is already parsed
  if (req.rawBody) {
    return next();
  }
  
  let rawBody = '';
  
  req.on('data', chunk => {
    rawBody += chunk.toString();
  });
  
  req.on('end', () => {
    req.rawBody = rawBody;
    next();
  });
  
  req.on('error', (err) => {
    console.error('Error reading request body:', err);
    res.status(400).json({ error: 'Error reading request body' });
  });
};
