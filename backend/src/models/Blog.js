import mongoose from 'mongoose';

const { Schema } = mongoose;

const blogSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    },
    excerpt: { type: String, trim: true, maxlength: 400, default: '' },
    coverImageUrl: { type: String, trim: true, default: '' },
    coverImageFileId: { type: String, trim: true, default: '' }, // provider file id, for orphan cleanup
    content: { type: String, required: true }, // rich-text HTML; must be sanitised on write
    category: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    tags: { type: [{ type: String, trim: true, lowercase: true, maxlength: 30 }], default: [] },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

blogSchema.pre('validate', function setPublishedAt(next) {
  if (this.status === 'published' && !this.publishedAt) this.publishedAt = new Date();
  next();
});

blogSchema.index({ status: 1, publishedAt: -1 });
blogSchema.index({ category: 1, status: 1 });
blogSchema.index({ tags: 1 });
blogSchema.index({ title: 'text', excerpt: 'text', content: 'text' });

export const Blog = mongoose.model('Blog', blogSchema);
