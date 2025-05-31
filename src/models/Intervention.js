const mongoose = require('mongoose');

const interventionSchema = new mongoose.Schema({
  interventionId: { type: String, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  price: { type: Number, required: true },
  note: String,
  status: { type: String, enum: ['paid', 'unpaid'], default: 'unpaid' },
  images: [String],
}, { timestamps: true });

// Auto-generate intervention ID
interventionSchema.pre('save', async function(next) {
  if (!this.interventionId) {
    const date = new Date();
    const dateString = `${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
    const count = await this.constructor.countDocuments();
    this.interventionId = `INT-${dateString}-${(count+1).toString().padStart(3, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Intervention', interventionSchema);