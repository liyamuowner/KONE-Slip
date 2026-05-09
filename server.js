const express = require('express');
const cors = require('cors');
const fs = require('fs');
const xlsx = require('xlsx');
const path = require('path');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Serve static files from the current directory
app.use(express.static(path.join(__dirname)));

const EXCEL_FILE = path.join(__dirname, 'Slip_Records.xlsx');

app.post('/save-slip', (req, res) => {
    try {
        const slipData = req.body;
        
        let workbook;
        let worksheet;
        
        // Flatten the data for Excel row
        const rowData = {
            'Slip ID': slipData.slipId,
            'Slip Date': slipData.slipDate,
            'Package ID': slipData.pkgId,
            'Order Date': slipData.orderDate,
            'Delivered Date': slipData.delDate,
            'Client Name': slipData.clientName,
            'Full Billing Address': slipData.billToAddress,
            'Subtotal (Rs)': slipData.subtotal,
            'Discount (Rs)': slipData.discount,
            'Final Total (Rs)': slipData.total,
            'Payment Status': slipData.status,
            'Notes': slipData.notes,
            'Created At': new Date().toLocaleString()
        };

        if (fs.existsSync(EXCEL_FILE)) {
            workbook = xlsx.readFile(EXCEL_FILE);
            worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const existingData = xlsx.utils.sheet_to_json(worksheet);
            existingData.push(rowData);
            worksheet = xlsx.utils.json_to_sheet(existingData);
            workbook.Sheets[workbook.SheetNames[0]] = worksheet;
        } else {
            workbook = xlsx.utils.book_new();
            worksheet = xlsx.utils.json_to_sheet([rowData]);
            xlsx.utils.book_append_sheet(workbook, worksheet, 'Slips');
        }

        xlsx.writeFile(workbook, EXCEL_FILE);
        res.status(200).json({ message: 'Slip saved to Excel successfully.' });
    } catch (error) {
        console.error('Error saving to Excel:', error);
        res.status(500).json({ error: 'Failed to save to Excel' });
    }
});

app.get('/get-next-slip-id', (req, res) => {
    try {
        if (!fs.existsSync(EXCEL_FILE)) {
            return res.json({ nextId: 'INV-2026-001' });
        }
        const workbook = xlsx.readFile(EXCEL_FILE);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const existingData = xlsx.utils.sheet_to_json(worksheet);
        
        if (existingData.length === 0) {
            return res.json({ nextId: 'INV-2026-001' });
        }
        
        // Find the last slip ID
        const lastRow = existingData[existingData.length - 1];
        const lastId = lastRow['Slip ID'];
        
        if (lastId && lastId.includes('-')) {
            const parts = lastId.split('-');
            const numPart = parseInt(parts[parts.length - 1]);
            if (!isNaN(numPart)) {
                const nextNum = numPart + 1;
                parts[parts.length - 1] = nextNum.toString().padStart(3, '0');
                return res.json({ nextId: parts.join('-') });
            }
        }
        
        return res.json({ nextId: 'INV-2026-001' });
    } catch (error) {
        console.error('Error getting next ID:', error);
        res.status(500).json({ nextId: 'INV-2026-001' });
    }
});

app.get('/get-customers', (req, res) => {
    try {
        if (!fs.existsSync(EXCEL_FILE)) {
            return res.json({ customers: [] });
        }
        const workbook = xlsx.readFile(EXCEL_FILE);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const existingData = xlsx.utils.sheet_to_json(worksheet);
        
        // Extract unique customers
        const customersMap = new Map();
        existingData.forEach(row => {
            const name = row['Client Name'];
            const address = row['Full Billing Address'];
            if (name && address && !customersMap.has(name)) {
                customersMap.set(name, address);
            }
        });
        
        const customersList = Array.from(customersMap.entries()).map(([name, address]) => ({
            name, address
        }));
        
        res.json({ customers: customersList });
    } catch (error) {
        console.error('Error getting customers:', error);
        res.status(500).json({ customers: [] });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
