import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
    {
        username: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        profileImageUrl: { type: String, default: null },
        isVerified: { type: Boolean, default: false },
        verifiedAt: { type: Date }
    }
    ,{ timestamps: true }
)

export default mongoose.model('User', userSchema);