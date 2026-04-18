require('dotenv').config();
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const caseSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    title: String,
    complainant: Object,
    accused: Object,
    incident: Object,
    sections: [String],
    bnsCategories: [String],
    bnsPenalties: [String],
    officer: String,
    station: String,
    status: { type: String, enum: ['open', 'investigating', 'closed'], default: 'open' },
    bailStatus: { type: String, enum: ['Not Applicable', 'Eligible', 'Non-Bailable'], default: 'Not Applicable' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Case = mongoose.model('Case', caseSchema);

const seedCases = [
    {
        id: "FIR-2026-" + Math.floor(1000 + Math.random() * 9000),
        title: "Theft of Motor Vehicle from Connaught Place",
        complainant: { name: "Rahul Sharma", phone: "+91-9876543210", address: "Sector 14, Dwarka", aadhaar: "XXXX-XXXX-1234" },
        accused: { name: "Unknown", age: "", identification: "" },
        incident: { date: "2026-04-01", time: "14:30", location: "Inner Circle, Connaught Place", description: "Complainant parked his Honda City (DL-5C-XXXX) near Block B. Returned after 2 hours to find it missing. CCTV footage requested." },
        sections: ["BNS Section 303(2)"],
        bnsCategories: ["Theft"],
        bnsPenalties: ["Up to 3 years imprisonment or fine or both"],
        officer: "Rajesh Kumar",
        station: "cp",
        status: "investigating",
        bailStatus: "Eligible"
    },
    {
        id: "FIR-2026-" + Math.floor(1000 + Math.random() * 9000),
        title: "Cyber Fraud - Phishing Link",
        complainant: { name: "Priya Singh", phone: "+91-9988776655", address: "Karol Bagh", aadhaar: "XXXX-XXXX-5678" },
        accused: { name: "Unknown Phone Number (9876XXXXXX)", age: "", identification: "Bank Account Holder: Amit" },
        incident: { date: "2026-04-03", time: "18:45", location: "Online", description: "Received an SMS containing a link for KYC update. Clicked the link and entered OTP. Rs. 45,000 deducted from SBI account." },
        sections: ["BNS Section 318(4)"],
        bnsCategories: ["Cheating"],
        bnsPenalties: ["Up to 3 years imprisonment and fine"],
        officer: "Sunita Devi",
        station: "kb",
        status: "open",
        bailStatus: "Eligible"
    },
    {
        id: "FIR-2026-" + Math.floor(1000 + Math.random() * 9000),
        title: "Physical Assault and Grievous Hurt",
        complainant: { name: "Anil Desai", phone: "+91-9123456789", address: "Rohini Sector 7", aadhaar: "XXXX-XXXX-9999" },
        accused: { name: "Suresh Gupta", age: "35", identification: "Neighbor" },
        incident: { date: "2026-04-05", time: "22:15", location: "Outside complainan't residence", description: "Altercation over parking space escalated. Accused struck complainant with a blunt object causing head injury." },
        sections: ["BNS Section 115(2)"],
        bnsCategories: ["Voluntarily causing hurt"],
        bnsPenalties: ["Up to 1 year imprisonment or fine up to Rs. 10000 or both"],
        officer: "Vikram Yadav",
        station: "rh",
        status: "open",
        bailStatus: "Eligible"
    }
];

async function seed() {
    try {
        console.log('Connecting to MongoDB...', process.env.MONGODB_URI);
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');
        
        await Case.deleteMany({});
        console.log('Cleared existing cases.');

        await Case.insertMany(seedCases);
        console.log(`Successfully inserted ${seedCases.length} cases.`);
        
        process.exit(0);
    } catch (e) {
        console.error('Seeding failed:', e);
        process.exit(1);
    }
}

seed();
