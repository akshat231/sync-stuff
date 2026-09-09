const jwt = require("jsonwebtoken");

const getJwtOfEmail =  (email) => {
    try {
        const token = jwt.sign(
            { email: email },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );
        return token;
    } catch (error) {
        throw error;
    }
}

const decodeJwtOfEmail = (token) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded;
    } catch (error) {
        throw error;
    }
}

module.exports = {
    getJwtOfEmail,
    decodeJwtOfEmail
}
