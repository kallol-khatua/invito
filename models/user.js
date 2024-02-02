const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    otp: { 
        type: String, 
        required: true,
    },
    isVerified: { 
        type: Boolean,
        required: true, 
        default: false 
    },
    bio: {
        type: String,
    },
    profile_image: {
        url: {
            type: String,
            default: "https://img.freepik.com/free-psd/3d-illustration-human-avatar-profile_23-2150671142.jpg?w=740&t=st=1706519723~exp=1706520323~hmac=24d138e5d0dbb62517819149691d75d6832aa630914640b0d3a5e42fd5e8ebde"
        },
        filename: String
    }
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model('User', userSchema);

module.exports = User;