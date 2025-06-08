import mongoose from 'mongoose';

const reviewImageSchema = new mongoose.Schema({
  imageUrl: { type: String, required: true },
  caption: { type: String }
}, { _id: false });

const reviewSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    title: {
      type: String,
      trim: true
    },
    comment: {
      type: String,
      trim: true
    },
    images: [reviewImageSchema],
    approved: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

export default reviewSchema;