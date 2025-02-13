const express = require('express');
const router = express.Router();
// const path = require('path');
// const logger = require(`${__basedir}/backend/logger`);
const fs = require('fs');
const PDFDocument = require('pdfkit');
const puppeteer = require('puppeteer');
const sizeOf = require('image-size');

// Generate a bus ticket as a PDF file
async function generateTicket(details, filePath) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const maroon = '#8b2004';
        
        // Pipe PDF into the file
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);
  
        // Dynamic logo placement above the title:
        const logoPath = 'C:/xampp/htdocs/UocBus/frontend/assets/TicketLogo2.png';
        if (fs.existsSync(logoPath)) {
          // Get actual dimensions of the logo
          const dimensions = sizeOf(logoPath);
          const logoWidth = 100; // fixed width
          // Compute height while preserving aspect ratio
          const logoHeight = dimensions.height * (logoWidth / dimensions.width);
          // Center the logo horizontally
          const logoX = (doc.page.width - logoWidth) / 2;
          const logoY = 20;
          doc.image(logoPath, logoX, logoY, { width: logoWidth });
          // Adjust current y position: add extra spacing after the logo (20 pts)
          doc.y = logoY + logoHeight + 20;
        }
  
        // Title (centered) below the logo
        doc.fillColor('black')
           .fontSize(22)
           .text('Bus Ticket', { align: 'center' });
        // Reduce extra space below title
        doc.moveDown(1);
  
        // ---------------------------
        // Enhanced Helper: Draw Section with Dynamic Height, Underlines, Border, and Bold Keys
        // ---------------------------
        function drawSection(doc, title, lines, options = {}) {
          const {
            x = doc.page.margins.left,
            width = doc.page.width - doc.page.margins.left - doc.page.margins.right,
            padding = 10,
            titleFontSize = 14,
            textFontSize = 12,
            titleColor = maroon,
            textColor = 'black'
          } = options;
          
          const startY = doc.y;
          
          // Calculate title height
          doc.fontSize(titleFontSize);
          const titleHeight = doc.heightOfString(title, {
            width: width - 2 * padding,
            align: 'center'
          });
          
          // Underline for title is drawn 2 pts below title plus top padding
          const underlineY = startY + padding + titleHeight + 2;
          
          // Calculate content height with increased spacing
          doc.fontSize(textFontSize);
          let contentHeight = 0;
          lines.forEach(line => {
            const lh = doc.heightOfString(line, {
              width: width - 2 * padding
            });
            contentHeight += lh + padding;
          });
          
          const totalHeight = padding + titleHeight + 2 + padding + contentHeight + padding;
          
          // Draw the border rectangle around the section
          doc.save();
          doc.lineWidth(1);
          doc.strokeColor(titleColor);
          doc.rect(x, startY, width, totalHeight).stroke();
          doc.restore();
          
          // Draw the section title
          doc.fillColor(titleColor)
             .fontSize(titleFontSize)
             .text(title, x, startY + padding, { width, align: 'center' });
          
          // Draw underline for the title
          doc.moveTo(x + padding, underlineY)
             .lineTo(x + width - padding, underlineY)
             .stroke(titleColor);
          
          // Write each content line with a subtle underline and bold key if applicable
          let currentY = underlineY + padding;
          lines.forEach(line => {
            const lineHeight = doc.heightOfString(line, { width: width - 2 * padding });
            const colonIndex = line.indexOf(':');
            if (colonIndex !== -1) {
              const keyPart = line.substring(0, colonIndex + 1);
              const valuePart = line.substring(colonIndex + 1).trim();
              // Render the key part in bold with the desired textColor
              doc.fillColor(textColor)
                 .font('Helvetica-Bold')
                 .fontSize(textFontSize)
                 .text(keyPart, x + padding, currentY, { continued: true, width: width - 2 * padding });
              // Render the value part in regular font with the same color
              doc.fillColor(textColor)
                 .font('Helvetica')
                 .fontSize(textFontSize)
                 .text(' ' + valuePart, { continued: false });
            } else {
              doc.fillColor(textColor)
                 .font('Helvetica')
                 .fontSize(textFontSize)
                 .text(line, x + padding, currentY, { width: width - 2 * padding });
            }
            
            // Draw a subtle underline for this line
            doc.save();
            doc.moveTo(x + padding, currentY + lineHeight)
               .lineTo(x + width - padding, currentY + lineHeight)
               .lineWidth(0.5)
               .strokeOpacity(0.3)
               .stroke();
            doc.restore();
            
            currentY += lineHeight + padding;
          });
          
          // Update the document's current y position to just below this section
          doc.y = startY + totalHeight + padding;
        }
  
        // ---------------------------
        // Passenger Details Section
        // ---------------------------
        drawSection(doc, 'Passenger Details', [
          `Name: ${details.student_name}`,
          `ID: ${details.student_id}`,
          `Email: ${details.student_email}`
        ]);
        
        // ---------------------------
        // Trip Details Section
        // ---------------------------
        drawSection(doc, 'Trip Details', [
          `Route: ${details.route_name}`,
          `Trip Type: ${details.trip_type}`,
          `Date: ${new Intl.DateTimeFormat('en-GB', { dateStyle: 'short' }).format(new Date(details.trip_date))}`,
          `Seats Booked: ${details.seats_booked}`,
          `Price per Seat: ${details.price_per_seat} EGP`,
          `Total Amount: ${details.total_amount} EGP`,
          `Ticket Number: ${details.order_id}`,
          `Driver Mobile: ${details.driver_mobile || 'N/A'}`
        ]);
        
        // ---------------------------
        // Footer Section
        // ---------------------------
        doc.moveDown(1);
        doc.fillColor(maroon)
           .fontSize(14)
           .text('Thank you for booking!', { align: 'center' });
        doc.moveDown(0.3);
        doc.fillColor('black')
           .fontSize(10)
           .text('For support, please contact us at Fleet@uofcanada.edu.eg', { align: 'center' });
        
        // Finalize the PDF
        doc.end();
        stream.on('finish', () => resolve(filePath));
        stream.on('error', error => reject(error));
      } catch (error) {
        reject(error);
      }
    });
  }
  
  
  
  


module.exports = router;
module.exports.generateTicket = generateTicket;