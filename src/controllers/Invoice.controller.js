const Invoice = require('../models/Invoice');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const {generateInvoicePDF} = require('../utils/downloadpdf');
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

        if (!Array.isArray(services) || services.length === 0) {
            return res.status(400).json({ success: false, message: 'Services must be a non-empty array.' });
        }

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
            services,
            date: date || new Date(),
            status: status.toUpperCase(),
            user: userId
        });

        res.status(201).json({
            success: true,
            message: 'Invoice created successfully',
            invoice,
            user: req.user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// //get all invoices

exports.getAllInvoices = async (req, res) => {
    try {

        const userId = req.user.id || req.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';


        const fromDate = req.query.fromDate ? new Date(req.query.fromDate) : new Date(0);
        const toDate = req.query.toDate ? new Date(req.query.toDate) : new Date();

        let query = { user : userId };

        if (fromDate || toDate) {
            query.createdAt = {};
            if (fromDate) {
                fromDate.setHours(0, 0, 0, 0); // Set to start of the day
                query.createdAt.$gte = fromDate;
            }
            if (toDate) {
                toDate.setHours(23, 59, 59, 999); // Set to end of the day
                query.createdAt.$lte = toDate;
            }
        }

        // Search filter by catagory
        if (search) {
            query.invoiceCategory = { $regex: search, $options: 'i' };
        }

        const totalCount = await Invoice.countDocuments(query);

        const invoices = await Invoice.find(query)
            .populate('user', 'name email phone address nSiren ')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

            if (invoices.length === 0) {
                return res.status(200).json({
                    success: true,
                    invoices: [],
                    message: 'No invoices found for the given filters.',
                    pagination: {
                        currentPage: page,
                        totalPages: 0,
                        totalItems: 0,
                        itemsPerPage: limit,
                        hasMore: false,
                        dateFilter: {
                            fromDate: fromDate?.toISOString(),
                            toDate: toDate?.toISOString()
                        }
                    }
                });
            }



        res.status(200).json({
            success: true,
            message: 'Invoices retrieved successfully',
            invoices,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalCount / limit),
                totalItems: totalCount,
                itemsPerPage: limit,
                hasMore: totalCount > (skip + invoices.length),
                dateFilter: {
                    fromDate: fromDate?.toISOString(),
                    toDate: toDate?.toISOString()
                }
            }
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
        const invoice = await Invoice.findById(id).populate('user', 'firstName lastName email contact address');
        // const user = await User.findById(invoice.user);
        // console.log(user);
        
        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Invoice retrieved successfully',
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
            message: 'Invoice updated successfully',
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




// exports.createAndSaveInvoicePDF = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const invoice = await Invoice.findById(id)
//         .populate('user', 'name email phone address nSiren businessLogo');


//     if (!invoice) {
//       return res.status(404).json({ success: false, message: 'Invoice not found' });
//     }

//     const pdfPath = path.join(__dirname, '../../docs', `invoice_${invoice._id}.pdf`);
//     await generateInvoicePDF(invoice, pdfPath);

//     res.status(200).json({
//       success: true,
//       message: 'Invoice PDF generated successfully',
//       path: `docs/invoice_${invoice._id}.pdf`,
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// exports.downloadInvoicePDF = (req, res) => {
//   const { id } = req.params;
//   const filePath = path.join(__dirname, '../../docs', `invoice_${id}.pdf`);

//   if (!fs.existsSync(filePath)) {
//     return res.status(404).json({ success: false, message: 'Invoice PDF not found' });
//   }

//   res.setHeader('Content-Type', 'application/pdf');
//   res.setHeader('Content-Disposition', `attachment; filename="invoice_${id}.pdf"`);
//   fs.createReadStream(filePath).pipe(res);
// };



exports.downloadInvoice = async (req, res) => {
    try {
      const invoice = await Invoice.findById(req.params.id)
        .populate('user', 'name email phone address nSiren businessLogo');
    
      if (!invoice) {
        return res.status(404).json({ success: false, message: 'Invoice not found' });
      }
  
      generateInvoicePDF(invoice, res); // 🔥 This will stream PDF directly to browser
    } catch (error) {
      console.error('Invoice download error:', error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  };

exports.paidUnpaid = async (req, res) => {
    try {
        const invoiceId = req.params.id;
        
        // Find the invoice
        const invoice = await Invoice.findById(invoiceId);
        
        if (!invoice) {
            return res.status(404).json({ message: 'invoice not found' });
        }

        // Toggle the status
        invoice.status = invoice.status === 'PAID' ? 'UNPAID' : 'PAID';
        
        // Save the updated invoice
        await invoice.save();
        
        res.status(200).json({ 
            message: 'Status updated successfully',
            invoice
        });
    } catch (error) {
        res.status(500).json({ message: 'Error updating status', error: error.message });
    }
}

