exports.buildSearchQuery = (req, baseQuery = {}, searchFields = []) => {
  const queryParams = req?.query || {};
  const { search, status, startDate, endDate, ...rest } = queryParams;
  
  let query = { ...baseQuery };

  // Search term across multiple fields
  if (search && searchFields.length) {
    query.$or = searchFields.map(field => ({
      [field]: { $regex: search, $options: "i" }
    }));
  }

  // Specific field filters
  Object.keys(rest).forEach(key => {
    if (rest[key] && rest[key].trim() !== "") {
      query[key] = { $regex: rest[key], $options: "i" };
    }
  });

  // Status filter
  if (status) {
    query.status = status;
  }

  // Date range filter
  if (startDate && endDate) {
    query.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  return query;
};
