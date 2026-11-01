import mongoose from 'mongoose';

const { Schema } = mongoose;

const ingredientSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    quantity: { type: String, trim: true, maxlength: 50, default: '' },
    unit: { type: String, trim: true, maxlength: 30, default: '' },
  },
  { _id: false }
);

const instructionSchema = new Schema(
  { text: { type: String, required: true, trim: true, maxlength: 2000 } },
  { _id: false }
);

const mediaSchema = new Schema(
  {
    type: { type: String, enum: ['image', 'video'], required: true },
    url: { type: String, required: true, trim: true },
    thumbnailUrl: { type: String, trim: true, default: '' },
    fileId: { type: String, trim: true, default: '' }, // provider file id, for orphan cleanup
    caption: { type: String, trim: true, maxlength: 300, default: '' },
  },
  { _id: false }
);

const recipeSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    },
    shortDescription: { type: String, trim: true, maxlength: 300, default: '' },
    description: { type: String, trim: true, maxlength: 10000, default: '' },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    coverImageUrl: { type: String, trim: true, default: '' },
    coverImageFileId: { type: String, trim: true, default: '' }, // provider file id, for orphan cleanup
    media: { type: [mediaSchema], default: [] },
    ingredients: { type: [ingredientSchema], default: [] },
    preparationTime: { type: Number, min: 0 }, // minutes
    cookingTime: { type: Number, min: 0 }, // minutes
    servings: { type: Number, min: 1 },
    instructions: { type: [instructionSchema], default: [] }, // array order = step order
    culturalNotes: { type: String, trim: true, maxlength: 5000, default: '' },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    isFeatured: { type: Boolean, default: false },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

recipeSchema.pre('validate', function setPublishedAt(next) {
  if (this.status === 'published' && !this.publishedAt) this.publishedAt = new Date();
  if (this.status === 'draft') this.publishedAt = null;
  next();
});

recipeSchema.index({ status: 1, publishedAt: -1 });
recipeSchema.index({ status: 1, isFeatured: -1, publishedAt: -1 });
recipeSchema.index({ status: 1, category: 1, publishedAt: -1 });
recipeSchema.index(
  { title: 'text', shortDescription: 'text', description: 'text', 'ingredients.name': 'text' },
  { weights: { title: 10, 'ingredients.name': 5, shortDescription: 3, description: 1 } }
);

export const Recipe = mongoose.model('Recipe', recipeSchema);
