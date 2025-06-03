const mongoose = require('mongoose');


const invoiceSchema = new mongoose.Schema({
    //add customer details

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
    services: {
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
    },
    data: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['Paid', 'Unpaid'],
        default: 'Unpaid'
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
})

const Invoice = mongoose.model('Invoice', invoiceSchema);
module.exports = Invoice;