const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const memberSchema = new Schema({
    group_id: {
        type: Schema.Types.ObjectId,
        ref: "Group"
    },
    member_id: {
        type: Schema.Types.ObjectId,
        ref: "Member"
    }
},{timestamps: true});

const Member = mongoose.model('Member', memberSchema);

module.exports = Member;