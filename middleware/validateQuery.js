// middlewares/validateQuery.js
export default (req, res, next) => {
    const { query } = req.body;
    if (!query) {
      return res.status(400).send('Query is required');
    }
    next();
  };
  