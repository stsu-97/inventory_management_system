# Inventory Management System

A full-stack inventory management web application with multi-warehouse analytics, Excel upload, and OCR capabilities.

## Features

### Backend (Node.js/Express with SQLite)
- RESTful API for products, invoices, staff notes, and stock counts
- SQLite database with historical data tracking
- File upload support for Excel (.xlsx, .xls) and images (.jpg, .png)
- CORS enabled for frontend communication
- Pre-loaded with sample data for October-December 2024

### Frontend (React with Tailwind CSS)
- **Product Management**: Full CRUD operations for products with categories
- **Invoice Input**: 
  - Manual entry form
  - Excel upload with preview/edit before saving
  - Purchase/Sale tracking with buyer information
- **Staff Notes**:
  - Manual entry form
  - OCR upload using Tesseract.js for handwritten notes
  - Daily sales records
- **Real Stock Count**:
  - Warehouse-specific stock counts (Warehouse 1 & 2)
  - Multi-warehouse support
- **Monthly Analysis Dashboard**:
  - Month-by-month analytics (Oct, Nov, Dec 2024)
  - Comparison table with calculated stock from invoices vs staff notes vs real stock
  - Discrepancy highlighting (green ≤5%, yellow 5-10%, red >10%)
  - Click-to-view historical data modal
  - Line chart showing stock trends over time
  - Detailed transaction history for each product

## Tech Stack

### Backend
- Node.js
- Express.js
- SQLite3
- CORS
- body-parser
- multer (file uploads)

### Frontend
- React 18
- Tailwind CSS
- xlsx (SheetJS) - Excel parsing
- Tesseract.js - OCR for handwritten notes
- Recharts - Interactive charts
- Lucide React - Icons

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Backend Setup

```bash
cd test-inventory/backend
npm install
npm start
```

The backend will run on `http://localhost:5002`

### Frontend Setup

```bash
cd test-inventory/frontend
npm install
npm start
```

The frontend will run on `http://localhost:3000`

### Running Both Servers

Open two terminal windows:

**Terminal 1 (Backend):**
```bash
cd test-inventory/backend
npm start
```

**Terminal 2 (Frontend):**
```bash
cd test-inventory/frontend
npm start
```

Then open your browser to `http://localhost:3000`

## Sample Data

The application comes pre-loaded with realistic sample data:

### Products (15 items)
- 10 Electronics (Laptops, Monitors, Keyboards, etc.)
- 3 Office Supplies (USB-C Hub, Laptop Stand, LED Lamp)
- 1 Furniture (Ergonomic Office Chair)
- 1 Accessories (iPhone Case, Screen Protector, etc.)

### Invoices (33+ records)
- Mixed purchases and sales
- Dates: October, November, December 2024
- Buyer names: Tech Corp, Electronics Ltd, John Doe, Jane Smith, ABC Corp, etc.

### Staff Notes (45+ records)
- Daily sales records
- Dates: October, November, December 2024
- Mix of named customers and "Walk-in" sales

### Stock Counts (28+ records)
- Both Warehouse 1 and Warehouse 2
- Monthly counts for Oct, Nov, Dec 2024
- Realistic discrepancies for demo purposes

## Usage Guide

### Adding Products
1. Go to "Products" tab
2. Click "Add Product"
3. Enter product name, category, and initial stock
4. Click "Save"

### Entering Invoices
**Manual Entry:**
1. Go to "Invoices" tab
2. Click "Manual Entry"
3. Fill in date, product, quantity, type (purchase/sale), buyer name
4. Click "Save"

**Excel Upload:**
1. Go to "Invoices" tab
2. Click upload area to select .xlsx file
3. Review preview table
4. Edit cells or remove rows as needed
5. Click "Confirm & Save to Database"

Excel Format:
- Column 1: Date (YYYY-MM-DD)
- Column 2: Product Name
- Column 3: Quantity
- Column 4: Type (purchase/sale)
- Column 5: Buyer Name (optional)

### Staff Notes
**Manual Entry:**
1. Go to "Staff Notes" tab
2. Click "Manual Entry"
3. Fill in date, product, quantity sold, buyer name
4. Click "Save"

**OCR Upload:**
1. Go to "Staff Notes" tab
2. Upload a photo of handwritten sales notes
3. Wait for OCR processing
4. Review and edit parsed data
5. Click "Confirm & Save to Database"

OCR Tips:
- Ensure good lighting and clear handwriting
- Use format: "Qty Product Buyer" or "Product: [name] Qty: [5] Buyer: [name]"
- Example: "5 Laptop Dell XPS John Doe"

### Real Stock Counts
1. Go to "Stock Counts" tab
2. Click "Add Stock Count"
3. Fill in date, product, actual quantity, warehouse
4. Select Warehouse 1 or Warehouse 2
5. Click "Save"

### Monthly Analysis Dashboard
1. Go to "Dashboard" tab
2. Select month (Oct 2024, Nov 2024, Dec 2024)
3. Review analysis table showing:
   - Calculated Stock from Invoices (total)
   - Calculated Stock from Staff Notes (total)
   - Real Stock - Warehouse 1
   - Real Stock - Warehouse 2
   - Real Stock - Total (W1 + W2)
   - Discrepancy vs Invoices
   - Discrepancy vs Staff Notes
4. **Click any product row** to see:
   - Historical data table with all transactions
   - Line chart showing stock levels over time
   - Transaction type, quantity, buyer, warehouse details

### Discrepancy Colors
- **Green (≤5%)**: Within acceptable range
- **Yellow (5-10%)**: Moderate discrepancy - investigate
- **Red (>10%)**: Critical discrepancy - immediate attention needed

## API Endpoints

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Invoices
- `GET /api/invoices` - Get all invoices (filters: start_date, end_date, product_id)
- `POST /api/invoices` - Create single invoice
- `POST /api/invoices/batch` - Create multiple invoices
- `POST /api/invoices/upload` - Upload Excel file

### Staff Notes
- `GET /api/staff-notes` - Get all notes (filters: start_date, end_date, product_id)
- `POST /api/staff-notes` - Create single note
- `POST /api/staff-notes/batch` - Create multiple notes
- `POST /api/staff-notes/upload` - Upload image for OCR

### Stock Counts
- `GET /api/stock-counts` - Get all counts (filters: start_date, end_date, product_id, warehouse)
- `POST /api/stock-counts` - Create stock count

### Dashboard
- `GET /api/dashboard/analytics` - Get monthly analytics (params: month, year)
- `GET /api/products/:id/history` - Get product transaction history

## Project Structure

```
test-inventory/
├── backend/
│   ├── package.json
│   ├── server.js
│   ├── inventory.db (auto-created)
│   └── uploads/ (auto-created)
├── frontend/
│   ├── package.json
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── index.js
│   │   ├── index.css
│   │   ├── App.jsx
│   │   └── components/
│   │       ├── ProductManagement.jsx
│   │       ├── InvoiceForm.jsx
│   │       ├── StaffNoteForm.jsx
│   │       ├── RealStockForm.jsx
│   │       └── Dashboard.jsx
│   ├── tailwind.config.js
│   └── postcss.config.js
└── README.md
```

## Troubleshooting

### Backend Issues
- **Port 5002 already in use**: Change PORT in `backend/server.js`
- **Database locked**: Close any database viewers or restart backend
- **File upload fails**: Check file size (max 10MB) and format

### Frontend Issues
- **CORS errors**: Ensure backend is running on port 5002
- **OCR fails**: Check browser console, ensure image is clear and well-lit
- **Excel parsing fails**: Ensure file format matches requirements

## Development Notes

- The SQLite database is automatically created when the backend starts
- Sample data is inserted only on first run
- File uploads are stored in `backend/uploads/` directory
- OCR processing is client-side using Tesseract.js (no backend OCR needed)

## License

ISC

## Support

For issues or questions, refer to the inline code comments and API endpoint documentation.
