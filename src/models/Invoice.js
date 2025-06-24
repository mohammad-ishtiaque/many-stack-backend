const mongoose = require('mongoose');


const invoiceSchema = new mongoose.Schema({
    //add customer details

    invoiceId: { type: String, unique: true, index: true },

    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
    },  
    nSiren: {
        type: String,
        required: true,
    },
    address: {
        streetNo: {
            type: String,
            required: true
        },
        streetName: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        postalCode: {
            type: String,
            required: true
        },
        country: {
            type: String,
            required: true
        }
    },
    //add services details
    services: [{
        selectedService:{
            type: String,
            required: true
        },
        quantity: {
            type: Number,
            required: true
        },
        price: {
            type: Number,
            required: true
        } 
    }],
    data: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['PAID', 'UNPAID'],
        default: 'UNPAID'
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
})


invoiceSchema.pre('save', async function(next) {
  if (!this.invoiceId) {
    const date = new Date();
    const dateString = `${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
    
    // Find the latest intervention for today
    const latestInvoice = await this.constructor.findOne({
      invoiceId: new RegExp(`INV-${dateString}-`)
    }).sort({ invoiceId: -1 });
    
    let sequence = 1;
    if (latestInvoice) {
      // Extract the sequence number from the latest intervention
      const lastSequence = parseInt(latestInvoice.invoiceId.split('-')[2]);
      sequence = lastSequence + 1;
    }
    
    // Generate new ID with sequence
    this.invoiceId = `INV-${dateString}-${sequence.toString().padStart(3, '0')}`;
  }
  next();
});

const Invoice = mongoose.model('Invoice', invoiceSchema);
module.exports = Invoice;