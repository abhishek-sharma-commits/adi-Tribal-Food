import mongoose from 'mongoose';

const { Schema } = mongoose;

const officialMediaSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    category: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    mediaType: { type: String, enum: ['image', 'video'], required: true },
    mediaUrl: { type: String, required: true, trim: true },
    mediaFileId: { type: String, required: true, trim: true, unique: true }, // provider file id
    thumbnailUrl: { type: String, trim: true, default: '' },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    isFeatured: { type: Boolean, default: false },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

officialMediaSchema.pre('validate', function setPublishedAt(next) {
  if (this.status === 'published' && !this.publishedAt) this.publishedAt = new Date();
  if (this.status === 'draft') this.publishedAt = null;
  next();
});

officialMediaSchema.index({ status: 1, isFeatured: -1, publishedAt: -1 });
officialMediaSchema.index({ status: 1, mediaType: 1, publishedAt: -1 });
officialMediaSchema.index({ category: 1, status: 1 });

export const OfficialMedia = mongoose.model('OfficialMedia', officialMediaSchema);
