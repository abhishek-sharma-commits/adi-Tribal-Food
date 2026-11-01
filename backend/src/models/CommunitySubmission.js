import mongoose from 'mongoose';

const { Schema } = mongoose;

const submissionSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    caption: { type: String, trim: true, maxlength: 500, default: '' },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    mediaType: { type: String, enum: ['image', 'video'], required: true },
    mediaUrl: { type: String, required: true, trim: true },
    mediaFileId: { type: String, trim: true, default: '' }, // provider file id, for orphan cleanup
    thumbnailUrl: { type: String, trim: true, default: '' },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    consentGivenAt: { type: Date, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    rejectionReason: { type: String, trim: true, maxlength: 500, default: '' },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

submissionSchema.pre('validate', function requireRejectionReason(next) {
  if (this.status === 'rejected' && !this.rejectionReason) {
    this.invalidate('rejectionReason', 'A rejection reason is required');
  }
  next();
});

submissionSchema.index({ status: 1, publishedAt: -1 });
submissionSchema.index({ status: 1, createdAt: -1 });
submissionSchema.index({ uploadedBy: 1, createdAt: -1 });
submissionSchema.index({ category: 1, status: 1 });
submissionSchema.index({ mediaType: 1, status: 1 });
submissionSchema.index({ mediaFileId: 1 });
submissionSchema.index({ title: 'text', description: 'text' });

export const CommunitySubmission = mongoose.model('CommunitySubmission', submissionSchema);
