const Invoice = require('../models/Invoice');


//create invoice

exports.createInvoice = async (req, res) => {
    try {
        const {
            name,
            email,
            phone,
            nSiren,
            address,
            services,
            status,
            date,
            user
        } = req.body;

        const userId = req.user.id || req.user._id;

        const invoice = await Invoice.create({
            name,
            email,
            phone,
            nSiren,
            address: {
                streetNo: address.streetNo,
                streetName: address.streetName,
                city: address.city,
                postalCode: address.postalCode,
                country: address.country
            },
            services: {
                selectedService: services.selectedService,
                quantity: services.quantity,
                price: services.price
            },
            date: date || new Date(),
            status: status.toUpperCase(),
            user: userId
        });

        res.status(201).json({
            success: true,
            invoice
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

//get}allinvoices

// exports.getAllInvoices=async(req,res)=>{

// };

// //get all invoices

exports.getAllInvoices = async (req, res) => {
    try {
        const invoices = await Invoice.find();
        res.status(200).json({
            success: true,
            invoices
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getInvoiceById = async (req, res) => {
    try {
        const { id } = req.params;
        const invoice = await Invoice.findById(id);
        
        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found'
            });
        }

        res.status(200).json({
            success: true,
            invoice
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.updateInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            email,
            phone,
            nSiren,
            address,
            services,
            date
        } = req.body;

        const invoice = await Invoice.findByIdAndUpdate(
            id,
            {
                name,
                email,
                phone,
                nSiren,
                address: {
                    streetNo: address.streetNo,
                    streetName: address.streetName,
                    city: address.city,
                    postalCode: address.postalCode,
                    country: address.country
                },
                services: {
                    selectedService: services.selectedService,
                    quantity: services.quantity,
                    price: services.price
                },
                date: date || new Date()
            },
            { new: true }
        );

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found'
            });
        }

        res.status(200).json({
            success: true,
            invoice
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.deleteInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        const invoice = await Invoice.findByIdAndDelete(id);

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Invoice deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
