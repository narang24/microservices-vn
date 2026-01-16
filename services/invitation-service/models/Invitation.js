import mongoose from "mongoose";

const InvitationSchema = new mongoose.Schema(
    {
        eventId: {type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true},
        inviteeId: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
        inviterId: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
        status: {type: String, enum: ['Pending', 'Accepted', 'Declined'], default: 'Pending'},
        date: {type: Date, required: true}
    },
    { timestamps: true }
);

export default mongoose.model('Invitation', InvitationSchema);