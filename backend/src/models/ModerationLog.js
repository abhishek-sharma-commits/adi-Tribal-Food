import mongoose from 'mongoose';

const { Schema } = mongoose;
const STATUSES = ['pending', 'approved', 'rejected'];

const moderationLogSchema = new Schema(
  {
    submission: { type: Schema.Types.ObjectId, ref: 'CommunitySubmission', required: true },
    admin: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    previousStatus: { type: String, enum: STATUSES, required: true },
    newStatus: { type: String, enum: STATUSES, required: true },
    reason: { type: String, trim: true, maxlength: 500, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

moderationLogSchema.index({ submission: 1, createdAt: -1 });
moderationLogSchema.index({ admin: 1, createdAt: -1 });

export const ModerationLog = mongoose.model('ModerationLog', moderationLogSchema);
