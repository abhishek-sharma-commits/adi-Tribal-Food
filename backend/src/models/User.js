import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
      unique: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user', index: true },
    accountStatus: { type: String, enum: ['active', 'suspended'], default: 'active' },
    profileImageUrl: { type: String, trim: true, default: '' },
    tokenVersion: { type: Number, default: 0 }, // bumped on password change to invalidate older sessions
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

userSchema.index({ role: 1, accountStatus: 1 });
userSchema.index({ createdAt: -1 });

export const User = mongoose.model('User', userSchema);
