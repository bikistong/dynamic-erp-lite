// Validation rules and middleware factory

const rules = {
  required: (val, field) => (val === undefined || val === null || val === '') && `${field} is required`,
  string: (val, field) => val !== undefined && typeof val !== 'string' && `${field} must be a string`,
  minLen: (n) => (val, field) => val !== undefined && typeof val === 'string' && val.length < n && `${field} must be at least ${n} characters`,
  maxLen: (n) => (val, field) => val !== undefined && typeof val === 'string' && val.length > n && `${field} must be at most ${n} characters`,
  number: (val, field) => val !== undefined && typeof val !== 'number' && `${field} must be a number`,
  integer: (val, field) => val !== undefined && (!Number.isInteger(val)) && `${field} must be an integer`,
  min: (n) => (val, field) => val !== undefined && typeof val === 'number' && val < n && `${field} must be at least ${n}`,
  max: (n) => (val, field) => val !== undefined && typeof val === 'number' && val > n && `${field} must be at most ${n}`,
  nonzero: (val, field) => val !== undefined && val === 0 && `${field} must not be zero`,
  boolean: (val, field) => val !== undefined && typeof val !== 'boolean' && `${field} must be true or false`,
  email: (val, field) => val !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) && `${field} must be a valid email`,
  date: (val, field) => val !== undefined && isNaN(Date.parse(val)) && `${field} must be a valid date`,
  enum: (values) => (val, field) => val !== undefined && !values.includes(val) && `${field} must be one of: ${values.join(', ')}`,
  array: (val, field) => val !== undefined && !Array.isArray(val) && `${field} must be an array`,
  minItems: (n) => (val, field) => val !== undefined && Array.isArray(val) && val.length < n && `${field} must have at least ${n} item(s)`,
};

/**
 * Validate a value against a list of rules.
 * Returns the first error string found, or null if valid.
 */
function validateField(val, field, fieldRules) {
  for (const rule of fieldRules) {
    const err = rule(val, field);
    if (err) return err;
  }
  return null;
}

/**
 * Build a validation middleware from a schema map.
 * Schema: { fieldName: [rule, rule, ...], ... }
 * Field names support dot notation for nested objects: 'lines.0.quantity'
 * Use '*' prefix for array item fields: 'lines.*.itemId'
 */
function validate(schema) {
  return (req, res, next) => {
    const errors = [];
    const body = req.body;

    for (const [field, fieldRules] of Object.entries(schema)) {
      if (field.includes('*.')) {
        // Wildcard: validate each item in an array
        const [arrayField, ...rest] = field.split('.*.');
        const subField = rest.join('.*.');
        const arr = body[arrayField];
        if (Array.isArray(arr)) {
          arr.forEach((item, i) => {
            const val = item[subField];
            const label = `${arrayField}[${i}].${subField}`;
            const err = validateField(val, label, fieldRules);
            if (err) errors.push(err);
          });
        }
      } else {
        const val = field.split('.').reduce((obj, key) => obj?.[key], body);
        const err = validateField(val, field, fieldRules);
        if (err) errors.push(err);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ status: 'error', message: 'Validation failed', errors });
    }
    next();
  };
}

module.exports = { validate, rules };
