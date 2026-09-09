const parseFormData = (booleanFields = [], numberFields = []) => (req, res, next) => {
    booleanFields.forEach((field) => {
        if (req.body[field] !== undefined) {
            req.body[field] = req.body[field] === "true";
        }
    });

    numberFields.forEach((field) => {
        if (req.body[field] !== undefined && req.body[field] !== "") {
            req.body[field] = Number(req.body[field]);
        }
    });

    next();
};

module.exports = parseFormData;