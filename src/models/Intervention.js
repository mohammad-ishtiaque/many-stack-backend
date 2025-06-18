const mongoose = require('mongoose');


const imageSchema = new mongoose.Schema({
  url: { type: String },
  location: { type: String }, 
  createdAt: { type: Date, default: Date.now }
});

const interventionSchema = new mongoose.Schema({
  interventionId: { type: String, unique: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  price: { type: Number, required: true },
  note: String,
  status: { type: String, enum: ['PAID', 'UNPAID'], default: 'UNPAID' },
  images: [imageSchema],
}, { timestamps: true });

// Auto-generate intervention ID
interventionSchema.pre('save', async function(next) {
  if (!this.interventionId) {
    const date = new Date();
    const dateString = `${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
    
    // Find the latest intervention for today
    const latestIntervention = await this.constructor.findOne({
      interventionId: new RegExp(`INT-${dateString}-`)
    }).sort({ interventionId: -1 });
    
    let sequence = 1;
    if (latestIntervention) {
      // Extract the sequence number from the latest intervention
      const lastSequence = parseInt(latestIntervention.interventionId.split('-')[2]);
      sequence = lastSequence + 1;
    }
    
    // Generate new ID with sequence
    this.interventionId = `INT-${dateString}-${sequence.toString().padStart(3, '0')}`;
  }
  next();
});


module.exports = mongoose.model('Intervention', interventionSchema);