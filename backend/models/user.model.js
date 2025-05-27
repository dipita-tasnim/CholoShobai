const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");


const userSchema = new mongoose.Schema({
    fullname: {
        firstname: {
            type: String,
            required: true,
            minlength:[3,"First name must be at least 3 character"]
        },
        lastname: {
            type: String,
            minlength:[3,"Last name must be at least 3 character"]
        }
    },
    email: {
        type: String,
        required: true,
        unique: true,
        minlength:[5,"Email address is required"]
    },
    password: {
        type: String,
        required: true,
        select:false,
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    socketId: {
        type: String,
    },
    joinedUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
      
})
//password generation and encryption process
userSchema.methods.generateAuthToken = function () {
    const token = jwt.sign(
        { 
            _id: this._id,
            role: this.role,
            email: this.email,
            name: `${this.fullname.firstname} ${this.fullname.lastname}`
        }, 
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );
    return token;
}
userSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
}
userSchema.statics.hashPassword = async function (password) {
    return await bcrypt.hash(password, 10);
}

const userModel = mongoose.model('User', userSchema);

module.exports = userModel;
