import jsPDF from 'jspdf';
import autoTable, { autoTable as namedAutoTable } from 'jspdf-autotable';

console.log('jsPDF:', typeof jsPDF);
console.log('autoTable (default):', typeof autoTable);
console.log('autoTable (named):', typeof namedAutoTable);

const doc = new jsPDF();
console.log('doc.autoTable:', typeof doc.autoTable);
