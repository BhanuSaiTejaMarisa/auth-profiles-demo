import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read CSV
const csvPath = 'c:/Users/MaBh530/Downloads/AUTH_PROFILE_MATRIX_FULL(in).csv';
const csvContent = fs.readFileSync(csvPath, 'utf-8');
const lines = csvContent.trim().split('\n');

// Parse header
const header = lines[0].split(',').map(h => h.trim());

// Parse rows
const data = lines.slice(1).map((line, idx) => {
  const values = line.split(',').map(v => v.trim());
  return {
    id: `matrix-${idx + 1}`,
    authProfileCode: values[0],
    region: values[1],
    subRegion: values[2],
    country: values[3],
    businessModel: values[4],
    mcChargeCode: values[5],
    businessGroup: values[6],
    businessUnit: values[7],
    productLine: values[8],
    productFamily: values[9],
    dealType: parseInt(values[10]) || 1,
    maxApprovalPct: parseInt(values[11]) || 0,
    minMarginApprovalPct: parseInt(values[12]) || 0,
    authMarginFlag: values[13] || 'N',
    plSummaryAuthFlag: values[14] || 'N',
    maxLineUsdAmt: parseInt(values[15]) || 0,
    creationDate: values[16],
    updateDate: values[17],
    lastChangeEmpNr: values[18],
    effectiveDate: values[19],
    effectiveEndDate: values[20],
  };
});

const jsonOutput = {
  totalRecords: data.length,
  records: data,
};

const outputPath = path.join(__dirname, './src/data/mockMatrixData.json');
fs.writeFileSync(outputPath, JSON.stringify(jsonOutput, null, 2));
console.log(`✓ Converted ${data.length} matrix records to JSON`);
console.log(`✓ Saved to: ${outputPath}`);
